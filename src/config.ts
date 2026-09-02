/**
 * Cities offered when the browser gives us no position — either geolocation is
 * unavailable or the visitor declined the prompt. Zoom is per city because the
 * Madrid stations spread across the whole comunidad while Benidorm fits in a
 * few blocks.
 */
export interface City {
    id: string;
    name: string;
    lat: number;
    lng: number;
    zoom: number;
}

export const CITIES: City[] = [
    { id: 'alicante', name: 'Alicante', lat: 38.3452, lng: -0.4815, zoom: 13 },
    { id: 'madrid', name: 'Madrid', lat: 40.4168, lng: -3.7038, zoom: 12 },
    { id: 'valencia', name: 'Valencia', lat: 39.4699, lng: -0.3763, zoom: 13 },
    { id: 'benidorm', name: 'Benidorm', lat: 38.5342, lng: -0.131, zoom: 14 },
];

/** Where the map lands if the visitor closes the picker without choosing. */
export const DEFAULT_CITY = CITIES[0];

const CITY_KEY = 'cargamos-city';

export function getSavedCity(): City | null {
    const id = localStorage.getItem(CITY_KEY);
    return CITIES.find((c) => c.id === id) ?? null;
}

export function saveCity(city: City) {
    localStorage.setItem(CITY_KEY, city.id);
}

/**
 * Internal venues that must never reach the public map.
 *
 * `7df07e291f` ("Test Stripe Storage Pavel") is the home test station that
 * holds cabinet DTA26313. The cabinet id is blocked as well so the unit stays
 * hidden if it is ever re-registered under a real venue.
 */
const BLOCKED_SHOP_IDS = new Set(['7df07e291f']);
export const BLOCKED_CABINET_IDS = new Set(['DTA26313']);

/**
 * The listnear feed carries a dozen "Test Stripe Storage …" rows parked at
 * 0,0 — which Google Maps happily plots in the Gulf of Guinea. Anything that
 * close to Null Island is unset geo, not a venue.
 */
function hasRealCoordinates(lat: number, lng: number): boolean {
    return Math.abs(lat) > 0.01 || Math.abs(lng) > 0.01;
}

export function isPublicStation(shopId: string, name: string, lat: number, lng: number): boolean {
    if (BLOCKED_SHOP_IDS.has(shopId)) return false;
    if (!hasRealCoordinates(lat, lng)) return false;
    if (/^test[\s\-_]/i.test(name.trim())) return false;
    return true;
}
