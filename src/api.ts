import type { ApiResponse } from './types';

const API_URL = 'https://m.cargamos.eu/cdb-app-api/v1/app/cdb/shop/listnear';

export async function fetchStations(lat: number, lng: number, zoomLevel: number = 4): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append('coordType', 'WGS\uFF0D84');
    formData.append('mapType', 'WGS\uFF0D84');
    formData.append('lat', lat.toString());
    formData.append('lng', lng.toString());
    formData.append('zoomLevel', zoomLevel.toString());

    const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }

    const data: ApiResponse = await response.json();

    if (data.code !== 0) {
        throw new Error(data.msg || 'Unknown API error');
    }

    return data;
}
