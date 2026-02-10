# Vendor Backend (Homeowner Dashboard)

Backend that powers the **vendor side** of the homeowner dashboard: vendor search (Google Places) and saved vendors list.

## Overview

- **Server:** Express app in `server.js`, mounted at `/api/vendors`.
- **Port:** `3001` (override with `VENDOR_BACKEND_PORT`).
- **Routes:** Implemented in `server/routes/vendors.mjs`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/vendors/search` | Search vendors by postcode and query/category. Body: `{ query, location, type?, page?, pageSize? }`. Returns `{ results, pagination }`. |
| GET | `/api/vendors/saved` | List saved vendors for the current user. User: header `X-User-Id` or query `?userId=` (default: `anonymous`). |
| POST | `/api/vendors/saved` | Save a vendor to the user's list. Body: vendor object with at least `placeId`, `name`. |
| DELETE | `/api/vendors/saved/:placeId` | Remove a vendor from the user's saved list. |

## Environment

In project root `.env` (or `.env.local`):

```env
GOOGLE_GEOCODING_API_KEY=your_geocoding_key
GOOGLE_PLACES_API_KEY=your_places_key
VENDOR_BACKEND_PORT=3001   # optional, default 3001
```

Get keys from [Google Cloud Console](https://console.cloud.google.com/); enable Geocoding API and Places API.

## Running

From repo root:

```bash
npm run start:vendor-backend
```

Or:

```bash
node server.js
```

The homeowner dashboard frontend calls `http://localhost:3001/api/vendors/search` by default. Run this server when using vendor search or saved vendors from the homeowner dashboard.

## Saved vendors

Saved vendors are stored **in memory** per user (keyed by `X-User-Id` or `?userId=`, or `anonymous`). Data is lost on server restart. To persist later, you can plug in Firebase, Cosmos DB, or a file store in `server/routes/vendors.mjs`.

## Health

- `GET /api/health` — returns `{ status: 'ok', timestamp }`.
