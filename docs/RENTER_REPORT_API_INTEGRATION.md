# Renter Report — Frontend API Integration

This document records how the frontend consumes the backend endpoints described in **Proptii-Renter-Report-Frontend-Handover.docx** (Aug 2026).

## Staging URLs (handover)

| Service | Base URL |
|---------|----------|
| Report backend (NDJSON) | `https://proptii-r1-1a-1-hcw6.onrender.com` |
| Search scraper (SSE) | `https://proptii-r1-1a-q95f.onrender.com` |

CORS is temporarily open on staging. Share your frontend staging origin with the backend team so they can tighten CORS when ready.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | Report backend origin or `/api` base (defaults to staging `hcw6` when unset) |
| `VITE_SEARCH_BACKEND_URL` | Search scraper base URL (overrides localhost default) |
| `VITE_USE_STAGING_SEARCH=true` | Use search staging `q95f` when not on localhost |

## 1. Search — scraped listings with coordinates

**Endpoint:** `POST {SEARCH_BASE}/api/v1/search`  
**Response:** Server-Sent Events (`text/event-stream`)

**Consumed in:** `src/hooks/useSearchBackend.ts`

Each property in `initial` / `results` events may include:

- `url` — portal listing URL (preferred `listingId` for the report API)
- `latitude` / `longitude` — GPS from Rightmove / OnTheMarket JSON
- `location`, `price`, `title`, etc.

The hook normalises `coordinates: { lat, lng }` when lat/lng are present and passes them through to search results cards and the property details modal.

## 2. Renter report — NDJSON streaming

**Endpoint:** `POST {REPORT_BASE}/api/properties/report`  
**Content-Type request:** `application/json`  
**Content-Type response:** `application/x-ndjson` (chunked)

**Implemented in:**

- `src/services/propertyReportStreamService.ts` — fetch + NDJSON parser
- `src/services/govDataService.ts` — `fetchPropertyReport()` wrapper + dev mock fallback
- `src/utils/streamingReportMapper.ts` — maps backend tree → `PropertyReportResponse`
- `src/utils/reportAddress.ts` — builds address payload from listing fields

### Request payload

```json
{
  "listingId": "https://www.onthemarket.com/details/20223142/",
  "address": {
    "display": "Lindsay Road, Bristol BS7",
    "street": "Lindsay Road",
    "postcode": "BS7 9NP",
    "coordinates": { "lat": 51.4804826, "lng": -2.5698842 }
  }
}
```

**Priority (backend):** postcode → coordinates (postcodes.io) → Google Geocoding on `display`.

**Frontend rules:**

- `listingId` = portal `url` when available, else stable hash id
- `coordinates` from search scrape — no client-side geocoding for report generation
- Optional `Authorization: Bearer {auth_token}` when present in `localStorage`

### Response frames

| Frame | When | Frontend action |
|-------|------|-----------------|
| `{ type: "initial", data: {...} }` | ~50ms | Render skeleton; show map, Part A, loading local modules |
| `{ type: "chunk", module: "flood"\|"epc"\|"crime"\|"heritage", data }` | async | Merge into state; update one card |
| Stream end | connection close | Treat as complete (no explicit `done` frame) |

Chunk merge logic: `mergeStreamingReportChunk()` in `propertyReportStreamService.ts` (matches handover §4).

### UI wiring

| Component | Role |
|-----------|------|
| `ProptiiModule` | Starts stream on “Unlock Full Proptii Intelligence Report”; passes `onProgress` to update diagnostic + prefetched report |
| `ReportDiagnostic` | Shows `sources[]` from initial frame while stream runs |
| `ProptiiReportModal` | `streamingReport` prop — applies live `initialReport` updates without re-fetching |

**PRD — “Absence = Unresolved”:** modules with `state: "unresolved"` or missing data render **“Data unresolved”** in local area cards (`streamingReportMapper.ts`). We do not fabricate EPC bands, crime counts, or flood levels.

## 3. Endpoints still on Nest API (unchanged)

These continue to use `fetchWithApiFallback` against `VITE_API_URL` / local Nest:

| Method | Path | Service function |
|--------|------|------------------|
| GET | `/flags` | `fetchRuntimeFlags()` |
| POST | `/search/classify` | `classifySearchQuery()` |
| POST | `/properties/facts` | `fetchBatchedPropertyFacts()` |
| GET | `/properties/:id/facts` | `fetchPropertyFacts()` |
| GET | `/properties/:id/lens` | `fetchPropertyLens()` |

The legacy **GET** `/properties/:id/report` is **replaced** by the streaming **POST** `/api/properties/report` for renter reports.

## 4. Local development

1. **Search:** run `proptii-search` on `:3001` or set `VITE_SEARCH_BACKEND_URL=https://proptii-r1-1a-q95f.onrender.com`
2. **Report:** set `VITE_API_URL=https://proptii-r1-1a-1-hcw6.onrender.com/api` or rely on default staging origin
3. **Offline mock:** `VITE_GOV_DATA_LAYER=true` or dev mode falls back to `mockPropertyReport()` if the stream fails

## 5. Files touched (integration)

- `src/services/propertyReportStreamService.ts` (new)
- `src/utils/streamingReportMapper.ts` (new)
- `src/utils/reportAddress.ts` (new)
- `src/types/streamingReport.ts` (new)
- `src/services/govDataService.ts` — `fetchPropertyReport` uses stream
- `src/components/property/ProptiiModule.tsx` — address + coordinates + progress
- `src/components/property/ProptiiReportModal.tsx` — streaming sync
- `src/hooks/useSearchBackend.ts` — lat/lng from SSE
- `src/pages/SearchResults.tsx` — passes url/coordinates to module
- `src/utils/apiEndpoints.ts` — staging report API fallback
- `src/utils/searchBackendUrl.ts` — staging search URL constant

## 6. Testing

- `src/services/__tests__/propertyReportStreamService.test.ts`
- `src/utils/__tests__/streamingReportMapper.test.ts`
- `src/utils/__tests__/reportAddress.test.ts`

Run: `npx vitest run src/services/__tests__/propertyReportStreamService.test.ts src/utils/__tests__/streamingReportMapper.test.ts src/utils/__tests__/reportAddress.test.ts`
