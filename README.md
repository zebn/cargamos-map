# Cargamos Map

Public station map for [cargamos.eu](https://cargamos.eu) — Vite + TypeScript, no framework,
deployed on Vercel.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc && vite build
```

## Data sources

| What | Where |
| --- | --- |
| Venues, availability, free slots | `m.cargamos.eu/cdb-app-api/v1/app/cdb/shop/listnear` (public) |
| Price strategies | `cargamos-report` `/api/price-strategies` (public) |
| Cabinets per venue | `cargamos-report` `/api/cabinets/lisnearnew` (public) |
| Photo gallery, location text | `cargamos-report` `/api/shops/{id}` — key-protected, reached through [api/station-card.ts](api/station-card.ts) |

`listnear` ignores its `zoomLevel` and returns every venue on every call, so the
distance sort in the return assistant runs over the full list, not a viewport slice.

### Station card photos and descriptions

The gallery and the location text come from `cdb_shop_banner`, `cdb_shop.p_content`
and `cdb_shop.device_placement`, entered in Backend 1's admin. The map never writes
them.

That endpoint requires an API key, so the browser cannot call it directly. The
edge function at `/api/station-card` holds the key and returns only the
customer-facing fields (the internal `extended_json.remark` note is dropped).
Set these on the Vercel project:

| Variable | Default | Notes |
| --- | --- | --- |
| `REPORT_API_KEY` | — | Required. Without it the function answers 501 and cards fall back to the single `listnear` banner. |
| `REPORT_API_URL` | `https://cargamos-report.duckdns.org` | |
| `REPORT_OPEN_ID` | `BJCD000001` | Scope header. |

`GET /api/shops/{id}` must be deployed on the report backend for this to return
data — as of this writing `cargamos-report` has it committed but not released.

Under `vite dev` nothing serves `/api/station-card`, so cards render without a
gallery locally. That is the same path the card takes when a venue has no photos.

## Hidden venues

[src/config.ts](src/config.ts) keeps everything internal off the public map:

- `7df07e291f` ("Test Stripe Storage Pavel"), the home test venue holding cabinet
  `DTA26313`, and the cabinet id itself so the unit stays hidden if it is ever
  moved to a real venue;
- anything parked at 0,0 — the feed carries about fifteen `Test Stripe Storage …`
  rows with unset geo, which Google Maps would otherwise plot in the Gulf of Guinea;
- venues whose name starts with `Test`.

Offline venues are hidden separately, in `visibleStations`.

## FAQ copy

The Spanish answers in [src/i18n.ts](src/i18n.ts) are the agreed wording and the
English and Russian ones are translations of it. `index.html` repeats the Spanish
inline so the first paint is right before the i18n pass runs — change both.
The same answers are meant to appear on cargamos.eu; that site is a separate
codebase.
