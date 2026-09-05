import { fetchStations, fetchAllPriceStrategies, fetchCabinetPositions, fetchStationCard } from './api';
import type { Station, PriceStrategy, CabinetPosition, StationCard } from './types';
import { t, getLang, setLang, onLangChange, LANG_LABELS, type Lang } from './i18n';
import { CITIES, DEFAULT_CITY, BLOCKED_CABINET_IDS, getSavedCity, saveCity, isPublicStation, type City } from './config';
import cargamosLogo from './assets/cargamos-logo.png';
import prontoChargeLogo from './assets/ProntoCharge_white_h.jpg';
import './style.css';

const ONLINE = '在线';
const CHAT_URL = 'https://cargamos.eu/chat';

let map: google.maps.Map;
let markers: google.maps.marker.AdvancedMarkerElement[] = [];
let subMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
let debounceTimer: ReturnType<typeof setTimeout>;
let priceMap: Map<string, PriceStrategy> = new Map();

/** Bumped on every station card open so a slow fetch can't paint over a newer card. */
let cardToken = 0;

/**
 * The visitor's coordinates, cached the moment any part of the app (map
 * init, the geolocate button, the return assistant) successfully reads them.
 * Shared state so the return assistant never has to ask the browser twice.
 */
let userPosition: google.maps.LatLngLiteral | null = null;

function rememberPosition(pos: GeolocationPosition): google.maps.LatLngLiteral {
  userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude };
  return userPosition;
}

async function initMap() {
  const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
  await google.maps.importLibrary('marker');

  // Land on the city the visitor picked last time; geolocation overrides it
  // below once the browser answers.
  const start = getSavedCity() ?? DEFAULT_CITY;

  map = new Map(document.getElementById('map')!, {
    center: { lat: start.lat, lng: start.lng },
    zoom: start.zoom,
    mapId: 'cargamos-map',
    gestureHandling: 'greedy',
    disableDefaultUI: false,
    zoomControl: true,
    panControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    clickableIcons: false,
  });

  // Load stations on map idle
  map.addListener('idle', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadStations, 500);
  });

  locateOrAskForCity();
}

/**
 * Centre on the visitor if the browser will say where they are; otherwise ask
 * which city they are in — but only the first time, since a saved city is an
 * answer they already gave.
 */
function locateOrAskForCity() {
  const fallback = () => {
    if (!getSavedCity()) openCityPicker();
  };

  if (!navigator.geolocation) {
    fallback();
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => map.setCenter(rememberPosition(pos)),
    fallback,
    { timeout: 8000, maximumAge: 600000 },
  );
}

async function loadStations() {
  const center = map.getCenter();
  if (!center) return;

  const zoom = map.getZoom() || DEFAULT_CITY.zoom;
  const apiZoom = zoom <= 8 ? 1 : zoom <= 11 ? 2 : zoom <= 14 ? 4 : 6;

  try {
    const data = await fetchStations(center.lat(), center.lng(), apiZoom);
    console.log(`Loaded ${data.list.length} stations`);
    updateMarkers(data.list);
  } catch (err) {
    console.error('Failed to load stations:', err);
  }
}

/**
 * Publicly listed venues — what a customer may actually walk to. Offline
 * stations stay in: hiding them would thin out the map for no reason, since
 * the card and marker both mark them as unavailable instead.
 */
function visibleStations(stations: Station[]): Station[] {
  return stations.filter((station) => {
    const lat = parseFloat(station.latitude);
    const lng = parseFloat(station.longitude);
    if (isNaN(lat) || isNaN(lng)) return false;
    return isPublicStation(station.newID, station.shopName, lat, lng);
  });
}

type MarkerTier = 'dot' | 'mid' | 'full';

/** The logo pin always shows — only its size shrinks at low zoom, so the map still reads as one dense, branded network. */
function markerTier(zoom: number): MarkerTier {
  if (zoom < 13) return 'dot';
  if (zoom < 15) return 'mid';
  return 'full';
}

function updateMarkers(stations: Station[]) {
  markers.forEach((m) => (m.map = null));
  markers = [];

  const tier = markerTier(map.getZoom() ?? DEFAULT_CITY.zoom);
  const sizeClass = tier === 'full' ? '' : ` marker-logo-${tier}`;

  visibleStations(stations).forEach((station) => {
    const lat = parseFloat(station.latitude);
    const lng = parseFloat(station.longitude);

    const isOnline = station.infoStatus === ONLINE;
    const isProntoCharge = station.pSfid === '239652998875591';
    const logo = isProntoCharge ? prontoChargeLogo : cargamosLogo;

    const el = document.createElement('div');
    el.className = `station-marker ${isOnline ? 'online' : 'offline'}${isProntoCharge ? ' pronto-charge' : ''}`;
    el.innerHTML = `<div class="marker-icon"><img src="${logo}" alt="" class="marker-logo${sizeClass}" /></div>`;

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: { lat, lng },
      map,
      content: el,
      title: station.shopName,
      collisionBehavior: google.maps.CollisionBehavior.REQUIRED,
    });

    marker.addListener('click', () => showStationInfo(station));
    markers.push(marker);
  });
}

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Spanish (and Russian) write the currency after the amount with a comma
 * decimal — "1,99 €" — while English keeps "€1.99". The API always hands us
 * a plain decimal string, so locale is applied here rather than trusted.
 */
function formatPrice(amount: string, currency: string): string {
  const value = parseFloat(amount);
  if (isNaN(value)) return `${currency}${amount}`;
  return getLang() === 'en'
    ? `${currency}${value.toFixed(2)}`
    : `${value.toFixed(2).replace('.', ',')} ${currency}`;
}

function showStationInfo(station: Station) {
  clearSubMarkers();
  const token = ++cardToken;

  const isOnline = station.infoStatus === ONLINE;
  const strategy = priceMap.get(String(station.pPriceid));
  const freeMinutes = strategy ? (parseInt(strategy.p_freeuse_minute) || parseInt(strategy.p_first_minutes) || 0) : (parseInt(station.pMian) || 0);
  const pricePerUnit = strategy ? strategy.p_price : station.pJifei;
  const unitMinutes = strategy ? strategy.p_price_minute : station.pJifeiDanwei;
  const maxPrice = strategy ? strategy.p_day_amount : station.pFengding;
  const currency = station.currencyName || '€';
  const shopName = decodeHtmlEntities(station.shopName);
  const address = decodeHtmlEntities(station.shopAddress1 || station.shopAddress);

  const panel = document.getElementById('station-panel')!;
  const content = document.getElementById('panel-content')!;

  // Use shopBanner if available, otherwise use logo
  const bannerSrc = station.shopBanner
    ? encodeURI(station.shopBanner)
    : (station.pSfid === '239652998875591' ? prontoChargeLogo : cargamosLogo);

  const statsHtml = isOnline
    ? `<div class="card-stats">
      <div class="card-stat available">
        <span class="card-stat-value">${station.freeNum}</span>
        <span class="card-stat-label">${t('station.available')}</span>
      </div>
      <div class="card-stat slots">
        <span class="card-stat-value">${station.canReturnNum}</span>
        <span class="card-stat-label">${t('station.freeSlots')}</span>
      </div>
      <div class="card-stat total">
        <span class="card-stat-value">${station.batteryNum}</span>
        <span class="card-stat-label">${t('station.total')}</span>
      </div>
    </div>`
    : `<div class="card-offline-notice">${t('station.offlineNotice')}</div>`;

  const navBtnHtml = isOnline
    ? `<a class="card-nav-btn" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(station.latitude + ',' + station.longitude)}" target="_blank" rel="noopener noreferrer">
      📍 ${t('station.navigate')}
    </a>`
    : '';

  content.innerHTML = `
    <div class="card-header">
      <div class="card-photo">
        <img src="${bannerSrc}" alt="" />
        <span class="card-status ${isOnline ? 'online' : 'offline'}">${isOnline ? t('station.online') : t('station.offline')}</span>
      </div>
      <div class="card-title">
        <h3 class="card-name"></h3>
        <p class="card-address"></p>
        ${station.shopTime ? `<p class="card-time">🕐 ${t('station.schedule')}: ${station.shopTime}</p>` : ''}
      </div>
    </div>
    ${statsHtml}
    <div class="card-pricing">
      <p>${t('station.freeMinutes', String(freeMinutes), formatPrice(pricePerUnit, currency), unitMinutes)}</p>
      <p>${t('station.maxPrice', formatPrice(maxPrice, currency))}</p>
    </div>
    <div class="card-notes" id="card-notes"></div>
    <div class="card-positions" id="card-positions">
      <p class="positions-loading">${t('station.positionsLoading')}</p>
    </div>
    ${navBtnHtml}
  `;

  // Set text content safely to prevent XSS
  content.querySelector('.card-name')!.textContent = shopName;
  content.querySelector('.card-address')!.textContent = address;

  panel.classList.remove('hidden');
  panel.scrollTop = 0;

  // Gallery and location text come from the report backend; the card above is
  // already usable without them.
  fetchStationCard(station.newID).then((card) => {
    if (token !== cardToken || !card) return;
    renderGallery(content, card, bannerSrc);
    renderNotes(content, card);
  }).catch((err) => {
    console.error('[card] failed:', err);
  });

  // Load cabinet positions asynchronously
  console.log('[positions] fetching for shopId:', station.newID);
  fetchCabinetPositions(station.newID).then((positions) => {
    if (token !== cardToken) return;
    console.log('[positions] received:', positions);
    const positionsEl = document.getElementById('card-positions');
    if (!positionsEl) return;
    renderPositions(positionsEl, positions);
    addPositionMarkers(positions);
  }).catch((err) => {
    console.error('[positions] failed:', err);
    const positionsEl = document.getElementById('card-positions');
    if (positionsEl) positionsEl.remove();
  });
}

/**
 * The venue's photos.
 *
 * One photo stays in the small header thumbnail the card has always used; a
 * real gallery takes over the top of the card and the thumbnail steps aside,
 * so the same image is never shown twice.
 */
function renderGallery(content: HTMLElement, card: StationCard, currentThumb: string) {
  if (card.photos.length === 0) return;

  const thumb = content.querySelector<HTMLImageElement>('.card-photo img');

  if (card.photos.length === 1) {
    // Only swap in the gallery photo when the card is showing the placeholder
    // logo — the listnear banner is the same picture in practice.
    if (thumb && !currentThumb.startsWith('http')) thumb.src = card.photos[0];
    return;
  }

  const photoBox = content.querySelector<HTMLElement>('.card-photo');
  const status = photoBox?.querySelector<HTMLElement>('.card-status');
  const header = content.querySelector('.card-header');

  const gallery = document.createElement('div');
  gallery.className = 'card-gallery';

  const track = document.createElement('div');
  track.className = 'card-gallery-track';

  const dots = document.createElement('div');
  dots.className = 'card-gallery-dots';

  const counter = document.createElement('span');
  counter.className = 'card-gallery-counter';
  counter.textContent = t('station.photoCounter', '1', String(card.photos.length));

  card.photos.forEach((url, i) => {
    const slide = document.createElement('div');
    slide.className = 'card-gallery-slide';
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.loading = i === 0 ? 'eager' : 'lazy';
    // A dead URL would otherwise leave a broken-image slide in the strip.
    img.addEventListener('error', () => slide.remove());
    slide.appendChild(img);
    track.appendChild(slide);

    const dot = document.createElement('span');
    dot.className = `card-gallery-dot${i === 0 ? ' active' : ''}`;
    dots.appendChild(dot);
  });

  track.addEventListener('scroll', () => {
    const width = track.clientWidth || 1;
    const index = Math.min(card.photos.length - 1, Math.round(track.scrollLeft / width));
    counter.textContent = t('station.photoCounter', String(index + 1), String(card.photos.length));
    dots.querySelectorAll('.card-gallery-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }, { passive: true });

  gallery.append(track, dots, counter);
  content.insertBefore(gallery, content.firstChild);

  // The thumbnail is now redundant, but the online badge it carried is not.
  photoBox?.remove();
  if (status && header) {
    status.classList.add('card-status-inline');
    content.querySelector('.card-title')?.prepend(status);
  }
}

/** The free-text venue description and the "where exactly it stands" note. */
function renderNotes(content: HTMLElement, card: StationCard) {
  const container = content.querySelector<HTMLElement>('#card-notes');
  if (!container) return;

  const notes: Array<{ title: string; text: string; kind: string }> = [];
  if (card.devicePlacement) {
    notes.push({ title: t('station.placement'), text: card.devicePlacement, kind: 'placement' });
  }
  if (card.description) {
    notes.push({ title: t('station.about'), text: card.description, kind: 'about' });
  }

  if (notes.length === 0) {
    container.remove();
    return;
  }

  notes.forEach((note) => {
    const box = document.createElement('div');
    box.className = `card-note ${note.kind}`;

    const title = document.createElement('div');
    title.className = 'card-note-title';
    title.textContent = note.title;

    const text = document.createElement('div');
    text.className = 'card-note-text';
    text.textContent = note.text;

    box.append(title, text);
    container.appendChild(box);
  });
}

function renderPositions(container: HTMLElement, positions: CabinetPosition[]) {
  // Internal units never appear in the public zone list either.
  const publicPositions = positions.map((pos) => ({
    ...pos,
    cabinets: pos.cabinets.filter((cab) => !BLOCKED_CABINET_IDS.has(cab.cabinetId)),
  }));

  const totalCabinets = publicPositions.reduce((s, p) => s + p.cabinets.length, 0);
  // Only show the zones list when there's more than one cabinet
  if (totalCabinets <= 1) {
    container.remove();
    return;
  }

  const title = document.createElement('p');
  title.className = 'positions-title';
  title.textContent = t('station.positions');

  const list = document.createElement('div');
  list.className = 'positions-list';

  // Render each cabinet as a row; store positionIndex so clicking can highlight the sub-marker
  let globalIdx = 0;
  publicPositions.forEach((pos, posIdx) => {
    pos.cabinets.forEach((cab) => {
      const rowIdx = globalIdx++;
      const item = document.createElement('div');
      item.className = 'position-item';
      item.dataset.posIdx = String(posIdx);
      item.dataset.rowIdx = String(rowIdx);
      item.style.cursor = 'pointer';

      const nameEl = document.createElement('div');
      nameEl.className = 'position-name';
      nameEl.textContent = cab.cabinetId;

      const stats = document.createElement('div');
      stats.className = 'position-stats';

      const availEl = document.createElement('span');
      availEl.className = 'position-stat avail';
      availEl.textContent = `🔋 ${cab.borrow}`;
      availEl.title = t('station.available');

      const slotsEl = document.createElement('span');
      slotsEl.className = 'position-stat slots';
      slotsEl.textContent = `📥 ${cab.also}`;
      slotsEl.title = t('station.freeSlots');

      const onlineEl = document.createElement('span');
      onlineEl.className = `position-stat ${cab.infoStatus === ONLINE ? 'pos-online' : 'pos-offline'}`;
      onlineEl.textContent = cab.infoStatus === ONLINE ? t('station.online') : t('station.offline');

      stats.append(availEl, slotsEl, onlineEl);
      item.append(nameEl, stats);

      item.addEventListener('click', () => {
        // Pan to this cabinet's own coordinates and pulse its sub-marker
        const lat = parseFloat(cab.weidu || pos.weidu);
        const lng = parseFloat(cab.jingdu || pos.jingdu);
        if (!isNaN(lat) && !isNaN(lng)) map.panTo({ lat, lng });
        pulseSubMarker(rowIdx);
      });

      list.appendChild(item);
    });
  });

  container.innerHTML = '';
  container.append(title, list);
}

function pulseSubMarker(posIdx: number) {
  const marker = subMarkers[posIdx];
  if (!marker) return;
  const el = marker.content as HTMLElement;
  el.classList.add('cabinet-marker-pulse');
  setTimeout(() => el.classList.remove('cabinet-marker-pulse'), 1000);
}

function clearSubMarkers() {
  subMarkers.forEach((m) => (m.map = null));
  subMarkers = [];
}

function addPositionMarkers(positions: CabinetPosition[]) {
  clearSubMarkers();

  // Flatten all cabinets, one sub-marker per cabinet using its own coordinates
  const allCabinets = positions.flatMap((pos) =>
    pos.cabinets
      .filter((c) => !BLOCKED_CABINET_IDS.has(c.cabinetId))
      .map((c) => ({
        ...c,
        jingdu: c.jingdu || pos.jingdu,
        weidu: c.weidu || pos.weidu,
      }))
  );

  if (allCabinets.length <= 1) return;

  allCabinets.forEach((cab, rowIdx) => {
    const lat = parseFloat(cab.weidu);
    const lng = parseFloat(cab.jingdu);
    if (isNaN(lat) || isNaN(lng)) return;

    const el = document.createElement('div');
    el.className = 'cabinet-marker';
    el.innerHTML = `<span class="cabinet-marker-count">${cab.borrow}</span>`;

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: { lat, lng },
      map,
      content: el,
      title: cab.cabinetId,
    });

    marker.addListener('click', () => {
      const item = document.querySelector<HTMLElement>(`.position-item[data-row-idx="${rowIdx}"]`);
      if (item) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        item.classList.add('position-highlight');
        setTimeout(() => item.classList.remove('position-highlight'), 1500);
      }
    });

    subMarkers.push(marker);
  });
}

/**
 * The banner is two rows tall on mobile and one on desktop, and it reflows
 * again when the font loads or the phone rotates. Publishing its real height
 * is what keeps the map and the round controls clear of it.
 */
function initBannerHeight() {
  const banner = document.getElementById('app-banner');
  if (!banner) return;

  const sync = () => {
    const height = banner.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--banner-h', `${Math.round(height)}px`);
  };

  new ResizeObserver(sync).observe(banner);
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', sync);
  document.fonts?.ready.then(sync);
  sync();
}

/** The support banner is permanent — it has no close control, so both its rows always stay reachable. */
function initBanner() {
  // Detect platform for download link
  const link = document.getElementById('download-link') as HTMLAnchorElement;
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) {
    link.href = 'https://play.google.com/store/apps/details?id=com.cargamos.charge';
  }

  initBannerHeight();
}

function openChat() {
  window.open(CHAT_URL, '_blank', 'noopener');
}

// ---------------------------------------------------------------------------
// City picker
// ---------------------------------------------------------------------------

function goToCity(city: City) {
  saveCity(city);
  map?.setCenter({ lat: city.lat, lng: city.lng });
  map?.setZoom(city.zoom);
}

function openCityPicker() {
  const modal = document.getElementById('city-modal');
  if (!modal) return;
  const saved = getSavedCity();
  modal.querySelectorAll<HTMLElement>('.city-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.city === saved?.id);
  });
  modal.classList.remove('hidden');
}

function closeCityPicker() {
  document.getElementById('city-modal')?.classList.add('hidden');
}

function initCityPicker() {
  const modal = document.getElementById('city-modal')!;
  const list = document.getElementById('city-list')!;

  CITIES.forEach((city) => {
    const btn = document.createElement('button');
    btn.className = 'city-btn';
    btn.dataset.city = city.id;
    btn.textContent = city.name;
    btn.addEventListener('click', () => {
      goToCity(city);
      closeCityPicker();
    });
    list.appendChild(btn);
  });

  const locateBtn = document.getElementById('city-locate') as HTMLButtonElement | null;
  locateBtn?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert(t('geo.error'));
      return;
    }
    locateBtn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        locateBtn.disabled = false;
        map?.setCenter(rememberPosition(pos));
        map?.setZoom(15);
        closeCityPicker();
      },
      () => {
        locateBtn.disabled = false;
        alert(t('geo.error'));
      },
    );
  });

  document.getElementById('city-close')?.addEventListener('click', closeCityPicker);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeCityPicker();
  });
}

// ---------------------------------------------------------------------------
// Return assistant — "¿Dónde puedo devolver el powerbank?"
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6371000;

function distanceMeters(from: google.maps.LatLngLiteral, to: google.maps.LatLngLiteral): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

function botThread(): HTMLElement {
  return document.getElementById('bot-thread')!;
}

function botSay(text: string, from: 'bot' | 'user' = 'bot'): HTMLElement {
  const msg = document.createElement('div');
  msg.className = `bot-msg from-${from}`;
  msg.textContent = text;
  const thread = botThread();
  thread.appendChild(msg);
  thread.scrollTop = thread.scrollHeight;
  return msg;
}

function botChoices(options: Array<{ label: string; onPick: () => void }>): HTMLElement {
  const row = document.createElement('div');
  row.className = 'bot-choices';
  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.className = 'bot-choice';
    btn.textContent = option.label;
    btn.addEventListener('click', () => {
      row.remove();
      botSay(option.label, 'user');
      option.onPick();
    });
    row.appendChild(btn);
  });
  const thread = botThread();
  thread.appendChild(row);
  thread.scrollTop = thread.scrollHeight;
  return row;
}

function openFaq() {
  document.getElementById('faq-modal')?.classList.remove('hidden');
}

function closeFaq() {
  document.getElementById('faq-modal')?.classList.add('hidden');
}

function openBot() {
  const modal = document.getElementById('bot-modal');
  if (!modal) return;
  botThread().innerHTML = '';
  modal.classList.remove('hidden');

  botSay(t('bot.question'), 'user');
  startReturnLookup();
}

function closeBot() {
  document.getElementById('bot-modal')?.classList.add('hidden');
}

/**
 * Locate the visitor if we can, otherwise fall back to picking a city.
 *
 * The map already asks for this permission on load, so by the time someone
 * opens the assistant the position is usually cached — reuse it instead of
 * prompting the browser a second time, which is what made the bot answer
 * "couldn't locate you" even after the visitor had already granted access.
 */
function startReturnLookup() {
  if (userPosition) {
    showReturnPoints(userPosition, null);
    return;
  }

  if (!navigator.geolocation) {
    askBotCity();
    return;
  }

  const status = botSay(t('bot.locating'));
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      status.remove();
      showReturnPoints(rememberPosition(pos), null);
    },
    () => {
      status.remove();
      askBotCity();
    },
    { timeout: 8000, maximumAge: 600000 },
  );
}

function askBotCity() {
  botSay(t('bot.askCity'));
  botChoices(CITIES.map((city) => ({
    label: city.name,
    onPick: () => showReturnPoints({ lat: city.lat, lng: city.lng }, city),
  })));
}

/**
 * The nearest venues that can physically take a powerbank back: online, public
 * and with at least one empty slot, straight from the same live feed the map
 * markers are drawn from.
 */
async function showReturnPoints(origin: google.maps.LatLngLiteral, city: City | null) {
  const typing = document.createElement('div');
  typing.className = 'bot-typing';
  typing.textContent = t('bot.searching');
  botThread().appendChild(typing);

  let stations: Station[] = [];
  try {
    const data = await fetchStations(origin.lat, origin.lng, 4);
    stations = visibleStations(data.list);
  } catch (err) {
    console.error('[bot] station lookup failed:', err);
  }
  typing.remove();

  const nearest = stations
    .filter((station) => station.infoStatus === ONLINE && Number(station.canReturnNum) > 0)
    .map((station) => ({
      station,
      distance: distanceMeters(origin, {
        lat: parseFloat(station.latitude),
        lng: parseFloat(station.longitude),
      }),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5);

  if (nearest.length === 0) {
    botSay(t('bot.noResults'));
    offerAnotherSearch();
    return;
  }

  botSay(city ? t('bot.nearCity', city.name) : t('bot.nearYou'));

  const results = document.createElement('div');
  results.className = 'bot-results';

  nearest.forEach(({ station, distance }) => {
    const row = document.createElement('button');
    row.className = 'bot-result';

    const main = document.createElement('div');
    main.className = 'bot-result-main';

    const name = document.createElement('div');
    name.className = 'bot-result-name';
    name.textContent = decodeHtmlEntities(station.shopName);

    const meta = document.createElement('div');
    meta.className = 'bot-result-meta';
    meta.textContent = [formatDistance(distance), decodeHtmlEntities(station.shopAddress1 || station.shopAddress)]
      .filter(Boolean)
      .join(' · ');

    main.append(name, meta);

    const slots = document.createElement('div');
    slots.className = 'bot-result-slots';
    const count = document.createElement('strong');
    count.textContent = String(station.canReturnNum);
    const label = document.createElement('span');
    label.textContent = t('bot.slots');
    slots.append(count, label);

    row.append(main, slots);
    row.addEventListener('click', () => {
      closeBot();
      map?.setCenter({ lat: parseFloat(station.latitude), lng: parseFloat(station.longitude) });
      map?.setZoom(16);
      showStationInfo(station);
    });

    results.appendChild(row);
  });

  botThread().appendChild(results);
  offerAnotherSearch();
}

function offerAnotherSearch() {
  const options = [{ label: t('bot.otherCity'), onPick: askBotCity }];
  if (navigator.geolocation) {
    options.unshift({ label: t('bot.useLocation'), onPick: startReturnLookup });
  }
  botChoices(options);
}

function initBot() {
  const modal = document.getElementById('bot-modal')!;
  document.getElementById('bot-close')?.addEventListener('click', closeBot);
  document.getElementById('bot-human')?.addEventListener('click', openChat);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeBot();
  });
}

function initControls() {
  // Station panel close
  document.getElementById('panel-close')?.addEventListener('click', () => {
    document.getElementById('station-panel')?.classList.add('hidden');
    clearSubMarkers();
  });

  // Geolocation button
  document.getElementById('btn-geolocate')?.addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          map.setCenter(rememberPosition(pos));
          map.setZoom(15);
        },
        () => alert(t('geo.error')),
      );
    }
  });

  // FAQ modal
  const faqModal = document.getElementById('faq-modal')!;
  document.getElementById('faq-close')?.addEventListener('click', closeFaq);
  document.getElementById('menu-faq')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeSideMenu();
    openFaq();
  });
  faqModal.addEventListener('click', (e) => {
    if (e.target === faqModal) closeFaq();
  });

  // Return assistant, from the FAQ answer and from the menu
  document.getElementById('faq-find-return')?.addEventListener('click', () => {
    closeFaq();
    openBot();
  });
  document.getElementById('menu-return')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeSideMenu();
    openBot();
  });

  // Chat <-> FAQ cross-links, so landing in the wrong one is a single tap away
  document.getElementById('bot-faq-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeBot();
    openFaq();
  });
  document.getElementById('faq-open-chat')?.addEventListener('click', () => {
    closeFaq();
    openBot();
  });

  // City picker, from the menu
  document.getElementById('menu-city')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeSideMenu();
    openCityPicker();
  });

  // Chat — open the standalone support chat page (round button on desktop, banner row on mobile)
  document.getElementById('btn-chat')?.addEventListener('click', openChat);
  document.getElementById('banner-chat')?.addEventListener('click', openChat);

  // Side menu
  const sideMenu = document.getElementById('side-menu')!;
  document.getElementById('btn-menu')?.addEventListener('click', () => {
    sideMenu.classList.remove('hidden');
  });
  document.getElementById('menu-close')?.addEventListener('click', closeSideMenu);
}

function closeSideMenu() {
  document.getElementById('side-menu')?.classList.add('hidden');
}

const COOKIE_CONSENT_KEY = 'cargamos-cookie-consent';

/** LSSI notice for the geolocation prompt and Google Maps' own cookies — shown once, remembered locally. */
function initCookieBar() {
  const bar = document.getElementById('cookie-bar');
  if (!bar || localStorage.getItem(COOKIE_CONSENT_KEY) === '1') return;

  bar.classList.remove('hidden');
  document.getElementById('cookie-accept')?.addEventListener('click', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, '1');
    bar.classList.add('hidden');
  });
}

// Language switcher
function initLangSwitcher() {
  const langBtn = document.getElementById('btn-lang');
  const langLabel = document.getElementById('lang-label');
  if (!langBtn || !langLabel) return;

  const langs: Lang[] = ['es', 'en', 'ru'];
  langLabel.textContent = LANG_LABELS[getLang()];

  langBtn.addEventListener('click', () => {
    const idx = langs.indexOf(getLang());
    const next = langs[(idx + 1) % langs.length];
    setLang(next);
  });

  onLangChange((lang) => {
    langLabel.textContent = LANG_LABELS[lang];
    applyTranslations();
  });
}

function applyTranslations() {
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n')!;
    el.textContent = t(key);
  });
  // Close station panel so it refreshes on next click
  document.getElementById('station-panel')?.classList.add('hidden');
  // The assistant thread is already-rendered text; start it over in the new language.
  const botModal = document.getElementById('bot-modal');
  if (botModal && !botModal.classList.contains('hidden')) openBot();
}

// Init
initBanner();
initCityPicker();
initBot();
initControls();
initLangSwitcher();
initCookieBar();
applyTranslations();
initMap().then(() => {
  console.log('Map initialized successfully');
}).catch((err) => {
  console.error('Map failed to initialize:', err);
});

fetchAllPriceStrategies().then((strategies) => {
  strategies.forEach((s) => priceMap.set(String(s.p_id), s));
  console.log(`Loaded ${strategies.length} price strategies`);
}).catch((err) => {
  console.error('Failed to load price strategies:', err);
});
