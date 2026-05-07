import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { fetchStations, fetchAllPriceStrategies, fetchCabinetPositions } from './api';
import type { Station, PriceStrategy, CabinetPosition } from './types';
import { t, getLang, setLang, onLangChange, LANG_LABELS, type Lang } from './i18n';
import cargamosLogo from './assets/cargamos-logo.png';
import prontoChargeLogo from './assets/ProntoCharge_white_h.jpg';
import './style.css';

const DEFAULT_CENTER = { lat: 38.3452, lng: -0.4815 }; // Alicante
const DEFAULT_ZOOM = 13;

let map: google.maps.Map;
let markers: google.maps.marker.AdvancedMarkerElement[] = [];
let subMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
let clusterer: MarkerClusterer;
let debounceTimer: ReturnType<typeof setTimeout>;
let priceMap: Map<string, PriceStrategy> = new Map();

async function initMap() {
  const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
  await google.maps.importLibrary('marker');

  map = new Map(document.getElementById('map')!, {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    mapId: 'cargamos-map',
    gestureHandling: 'greedy',
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: false,
    mapTypeControl: false,
    clickableIcons: false,
  });

  clusterer = new MarkerClusterer({
    map,
    markers: [],
    renderer: {
      render({ count, position }) {
        const el = document.createElement('div');
        el.className = 'cluster-marker';
        el.textContent = String(count);
        return new google.maps.marker.AdvancedMarkerElement({
          position,
          content: el,
        });
      },
    },
  });

  // Load stations on map idle
  map.addListener('idle', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadStations, 500);
  });

  // Try to get user's location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        map.setCenter(userPos);
      },
      () => {
        // Use default center (Madrid)
      }
    );
  }
}

async function loadStations() {
  const center = map.getCenter();
  if (!center) return;

  const zoom = map.getZoom() || DEFAULT_ZOOM;
  const apiZoom = zoom <= 8 ? 1 : zoom <= 11 ? 2 : zoom <= 14 ? 4 : 6;

  try {
    const data = await fetchStations(center.lat(), center.lng(), apiZoom);
    console.log(`Loaded ${data.list.length} stations`);
    updateMarkers(data.list);
  } catch (err) {
    console.error('Failed to load stations:', err);
  }
}

function updateMarkers(stations: Station[]) {
  clusterer.clearMarkers();
  markers.forEach((m) => (m.map = null));
  markers = [];

  stations.forEach((station) => {
    const lat = parseFloat(station.latitude);
    const lng = parseFloat(station.longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    const isOnline = station.infoStatus === '在线';
    const freeNum = parseInt(station.freeNum) || 0;
    const isProntoCharge = station.pSfid === '239652998875591';
    const logo = isProntoCharge ? prontoChargeLogo : cargamosLogo;

    const el = document.createElement('div');
    el.className = `station-marker ${isOnline ? 'online' : 'offline'}${isProntoCharge ? ' pronto-charge' : ''}`;
    el.innerHTML = `
      <div class="marker-icon">
        <img src="${logo}" alt="" class="marker-logo" />
        <span class="marker-badge">${freeNum}</span>
      </div>
    `;

    const marker = new google.maps.marker.AdvancedMarkerElement({
      position: { lat, lng },
      map,
      content: el,
      title: station.shopName,
    });

    marker.addListener('click', () => showStationInfo(station));
    markers.push(marker);
  });

  clusterer.addMarkers(markers);
}

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function showStationInfo(station: Station) {
  clearSubMarkers();

  const isOnline = station.infoStatus === '在线';
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
    <div class="card-stats">
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
    </div>
    <div class="card-pricing">
      <p>${t('station.freeMinutes', String(freeMinutes), currency, pricePerUnit, unitMinutes)}</p>
      <p>${t('station.maxPrice', currency, maxPrice)}</p>
    </div>
    <div class="card-positions" id="card-positions">
      <p class="positions-loading">${t('station.positionsLoading')}</p>
    </div>
    <a class="card-nav-btn" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(station.latitude + ',' + station.longitude)}" target="_blank" rel="noopener noreferrer">
      📍 ${t('station.navigate')}
    </a>
  `;

  // Set text content safely to prevent XSS
  content.querySelector('.card-name')!.textContent = shopName;
  content.querySelector('.card-address')!.textContent = address;

  panel.classList.remove('hidden');

  // Load cabinet positions asynchronously
  console.log('[positions] fetching for shopId:', station.newID);
  fetchCabinetPositions(station.newID).then((positions) => {
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

function renderPositions(container: HTMLElement, positions: CabinetPosition[]) {
  const totalCabinets = positions.reduce((s, p) => s + p.cabinets.length, 0);
  if (!totalCabinets) {
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
  positions.forEach((pos, posIdx) => {
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
      availEl.textContent = `\uD83D\uDD0B ${cab.borrow}`;
      availEl.title = t('station.available');

      const slotsEl = document.createElement('span');
      slotsEl.className = 'position-stat slots';
      slotsEl.textContent = `\uD83D\uDCE5 ${cab.also}`;
      slotsEl.title = t('station.freeSlots');

      const onlineEl = document.createElement('span');
      onlineEl.className = `position-stat ${cab.infoStatus === '\u5728\u7EBF' ? 'pos-online' : 'pos-offline'}`;
      onlineEl.textContent = cab.infoStatus === '\u5728\u7EBF' ? t('station.online') : t('station.offline');

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
    pos.cabinets.map((c) => ({
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

// Banner close
function initBanner() {
  const closeBtn = document.getElementById('banner-close');
  const banner = document.getElementById('app-banner');

  closeBtn?.addEventListener('click', () => {
    banner?.classList.add('hidden');
    document.getElementById('map')?.classList.add('no-banner');
  });

  // Detect platform for download link
  const link = document.getElementById('download-link') as HTMLAnchorElement;
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) {
    link.href = 'https://play.google.com/store/apps/details?id=com.cargamos.charge';
  }
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
          const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          map.setCenter(userPos);
          map.setZoom(15);
        },
        () => alert(t('geo.error')),
      );
    }
  });

  // FAQ button
  const faqModal = document.getElementById('faq-modal')!;
  document.getElementById('btn-faq')?.addEventListener('click', () => faqModal.classList.remove('hidden'));
  document.getElementById('faq-close')?.addEventListener('click', () => faqModal.classList.add('hidden'));
  document.getElementById('menu-faq')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeSideMenu();
    faqModal.classList.remove('hidden');
  });
  faqModal.addEventListener('click', (e) => {
    if (e.target === faqModal) faqModal.classList.add('hidden');
  });

  // Side menu
  const sideMenu = document.getElementById('side-menu')!;
  const menuOverlay = document.getElementById('menu-overlay')!;
  document.getElementById('btn-menu')?.addEventListener('click', () => {
    sideMenu.classList.remove('hidden');
    menuOverlay.classList.remove('hidden');
  });
  document.getElementById('menu-close')?.addEventListener('click', closeSideMenu);
  menuOverlay.addEventListener('click', closeSideMenu);

  // How it works
  document.getElementById('menu-how')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeSideMenu();
    faqModal.classList.remove('hidden');
  });

  // Pricing
  document.getElementById('menu-pricing')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeSideMenu();
    faqModal.classList.remove('hidden');
  });
}

function closeSideMenu() {
  document.getElementById('side-menu')?.classList.add('hidden');
  document.getElementById('menu-overlay')?.classList.add('hidden');
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
}

// Init
initBanner();
initControls();
initLangSwitcher();
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
