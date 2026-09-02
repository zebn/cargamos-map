/**
 * Public read-only view of a venue card.
 *
 * The report backend's `/api/shops/{id}` holds the photo gallery and the
 * location text, but it is key-protected and scope-filtered, so the browser
 * cannot call it directly. This proxy holds the key server-side and hands back
 * only what the card renders — the internal `remark` note and the raw
 * `cdb_shop` columns never leave the edge.
 *
 * Configure on the Vercel project:
 *   REPORT_API_URL   default https://cargamos-report.duckdns.org
 *   REPORT_API_KEY   the report backend's API_KEY
 *   REPORT_OPEN_ID   default BJCD000001
 */
export const config = { runtime: 'edge' };

const DEFAULT_API_URL = 'https://cargamos-report.duckdns.org';
const DEFAULT_OPEN_ID = 'BJCD000001';

interface ReportPhoto {
    url?: unknown;
}

interface ReportPosition {
    name?: unknown;
    lat?: unknown;
    lng?: unknown;
}

interface ReportLocation {
    address?: unknown;
    description?: unknown;
    device_placement?: unknown;
    positions?: unknown;
}

interface ReportShop {
    photos?: unknown;
    location?: unknown;
    hours_text?: unknown;
    hours?: unknown;
}

function text(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
}

function num(value: unknown): number | null {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : null;
}

/** Photo URLs arrive absolute today, but tolerate a bare upload path. */
function photoUrl(value: unknown): string | null {
    const url = text(value);
    if (!url) return null;
    if (/^https?:\/\//i.test(url)) return url;
    return `https://m.cargamos.eu/${url.replace(/^\/+/, '')}`;
}

function json(body: unknown, status: number, cache: string) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'content-type': 'application/json; charset=utf-8',
            'cache-control': cache,
        },
    });
}

export default async function handler(request: Request): Promise<Response> {
    const id = new URL(request.url).searchParams.get('id')?.trim();
    if (!id || !/^[A-Za-z0-9]{1,32}$/.test(id)) {
        return json({ error: 'Missing or invalid id' }, 400, 'no-store');
    }

    const apiKey = process.env.REPORT_API_KEY;
    if (!apiKey) {
        // Not configured yet — the card falls back to the listnear banner.
        return json({ error: 'Card source not configured' }, 501, 'no-store');
    }

    const base = process.env.REPORT_API_URL || DEFAULT_API_URL;
    let upstream: Response;
    try {
        upstream = await fetch(`${base}/api/shops/${encodeURIComponent(id)}`, {
            headers: {
                'x-api-key': apiKey,
                'p-open-id': process.env.REPORT_OPEN_ID || DEFAULT_OPEN_ID,
            },
        });
    } catch {
        return json({ error: 'Card source unreachable' }, 502, 'no-store');
    }

    if (!upstream.ok) {
        return json({ error: 'Card not available' }, upstream.status === 404 ? 404 : 502, 'no-store');
    }

    let shop: ReportShop;
    try {
        shop = ((await upstream.json()) as { data?: ReportShop }).data ?? {};
    } catch {
        return json({ error: 'Card source returned malformed data' }, 502, 'no-store');
    }

    const location = (shop.location ?? {}) as ReportLocation;
    const rawPhotos = Array.isArray(shop.photos) ? (shop.photos as ReportPhoto[]) : [];
    const rawPositions = Array.isArray(location.positions) ? (location.positions as ReportPosition[]) : [];

    const photos: string[] = [];
    for (const photo of rawPhotos) {
        const url = photoUrl(photo?.url);
        if (url && !photos.includes(url)) photos.push(url);
    }

    return json(
        {
            id,
            photos,
            description: text(location.description),
            devicePlacement: text(location.device_placement),
            address: text(location.address),
            hoursText: text(shop.hours_text),
            hours: Array.isArray(shop.hours) ? shop.hours : [],
            positions: rawPositions
                .map((p) => ({ name: text(p?.name), lat: num(p?.lat), lng: num(p?.lng) }))
                .filter((p) => p.name !== null),
        },
        200,
        // Photos and descriptions change when an admin edits them, not per view.
        'public, s-maxage=300, stale-while-revalidate=3600',
    );
}
