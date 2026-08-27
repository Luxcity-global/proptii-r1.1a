# 📑 Frontend Developer Handover: Proptii Renter Report Streaming Architecture

**Document Version:** 2.0  
**Target Audience:** Frontend Engineers / UI Designers  
**Author:** Backend Engineering Team  
**Release Date:** August 28, 2026  
**Status:** Staging Deployed  

---

## 1. Executive Summary

We have completed the **Proptii Renter Report** backend architecture. 

### What Changed?
1. **No Client-Side Geocoding:** The frontend no longer needs to use Google Maps Geocoding to convert addresses into postcodes.
2. **Portals Provide Native Coordinates:** Scrapers (`proptii-search`) extract GPS `{ lat, lng }` directly from Rightmove and OnTheMarket.
3. **Backend-Driven JIT Resolution:** The backend converts coordinates into postcodes using `postcodes.io` with fallback layers.
4. **Chunked NDJSON Streaming:** The report endpoint does **not** block for 15 seconds waiting for all government APIs. It streams live modules (`flood`, `crime`, `epc`, `heritage`) down an HTTP connection as they resolve.

---

## 2. API Endpoint Specification

### `POST /api/properties/report`

* **Backend Staging Base URL:** `https://proptii-r1-1a-1-hcw6.onrender.com`
* **Search Service Staging Base URL:** `https://proptii-r1-1a-q95f.onrender.com`
* **Full Report Endpoint:** `https://proptii-r1-1a-1-hcw6.onrender.com/api/properties/report`
* **Request Content-Type:** `application/json`
* **Response Content-Type:** `application/x-ndjson` (Newline-Delimited JSON)
* **Transfer Protocol:** `Transfer-Encoding: chunked`

---

## 3. Request Payload Contract

When a user clicks "Generate Renter Report" or opens a listing modal, send this JSON payload:

```json
{
  "listingId": "https://www.onthemarket.com/details/20223142/",
  "address": {
    "display": "Lindsay Road, Bristol BS7",
    "street": "Lindsay Road",
    "postcode": "BS7 9NP",
    "coordinates": {
      "lat": 51.4804826,
      "lng": -2.5698842
    }
  }
}
```

### Field Definitions & Rules

| Field | Type | Required? | Description |
| :--- | :--- | :--- | :--- |
| `listingId` | `string` | **Yes** | Unique identifier or portal URL of the listing (e.g. `https://www.onthemarket.com/...`). |
| `address.display` | `string` | **Yes** | Raw address text string from the listing (e.g. `"Lindsay Road, Bristol BS7"`). |
| `address.postcode` | `string` | Optional | Postcode if already known (e.g. `"BS7 9NP"`). Leave empty string `""` or `null` if unknown. |
| `address.coordinates` | `object` | Optional | Object with `lat: number` and `lng: number`. Scraped directly from search results. |

> [!NOTE]
> **Priority Fallback Logic on Backend:**
> 1. If `address.postcode` is present $\to$ Uses fast path immediately.
> 2. If `address.postcode` is missing $\to$ Resolves via `address.coordinates` using `postcodes.io`.
> 3. If both are missing $\to$ Falls back to Google Geocoding on `address.display`.

---

## 4. Response Protocol: How NDJSON Streaming Works

The server responds with **Newline-Delimited JSON (NDJSON)**. Each line is an independent, parseable JSON object followed by `\n`.

### Stream Lifecycle Example

#### Frame 1: Initial Skeleton (Arrives in ~50ms)
```json
{
  "type": "initial",
  "data": {
    "generatedAt": "2026-08-28T00:00:00.000Z",
    "audience": "tenant",
    "match": { "status": "postcode", "lat": 51.48, "lng": -2.56 },
    "sources": [
      { "id": "postcodes", "label": "Postcode location", "state": "clear" },
      { "id": "epc", "label": "EPC register", "state": "loading" },
      { "id": "flood", "label": "EA flood risk", "state": "loading" },
      { "id": "crime", "label": "police.uk", "state": "loading" },
      { "id": "heritage", "label": "Listed / conservation", "state": "loading" }
    ],
    "partA": { "listingPrice": "from listing" },
    "partB": { "epcBand": null, "floorAreaM2": 0, "lodged": "", "winterNote": "" },
    "partC": { "status": "pending_nps", "message": "To come in next release" },
    "local": {
      "flood": { "headline": "Loading...", "groundwater": "Loading...", "caveat": "loading" },
      "crime": { "month": "Loading...", "count": 0, "topCategories": [] },
      "heritage": { "listed": false, "grade": null, "conservationArea": false, "name": null, "caveat": "loading" }
    },
    "map": { "embedQuery": "Lindsay%20Road%2C%20Bristol%20BS7" },
    "steps": []
  }
}
```

#### Frame 2: Flood Risk Chunk (Arrives in ~200ms)
```json
{
  "type": "chunk",
  "module": "flood",
  "data": {
    "headline": "Low",
    "groundwater": "Unlikely",
    "caveat": "area not footprint"
  }
}
```

#### Frame 3: EPC Chunk (Arrives in ~300ms)
```json
{
  "type": "chunk",
  "module": "epc",
  "data": {
    "epcBand": "C",
    "floorAreaM2": 75,
    "lodged": "2024-03-12",
    "winterNote": "Expected lower winter bills"
  }
}
```

#### Frame 4: Police Crime Chunk (Arrives in ~1.5s – 8s)
```json
{
  "type": "chunk",
  "module": "crime",
  "data": {
    "month": "2026-06",
    "count": 184,
    "topCategories": ["violent-crime", "other-crime", "anti-social-behaviour"]
  }
}
```

#### Final Step:
The server closes the connection (`res.end()`).

---

## 5. Frontend Implementation Guide

### A. API Service Function (`src/services/api.ts`)

Use the native `fetch()` Streams API to decode NDJSON lines and call an `onProgress` callback:

```typescript
export async function getPropertyReport(
  listingId: string,
  address: {
    display: string;
    street?: string | null;
    postcode?: string | null;
    coordinates?: { lat: number; lng: number };
  },
  onProgress?: (updatedReportData: any) => void
): Promise<{ success: boolean; data: any; error?: string }> {
  try {
    const baseUrl = process.env.VITE_API_URL || 'https://proptii-r1-1a-1-hcw6.onrender.com';
    const response = await fetch(`${baseUrl}/api/properties/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('auth_token')
          ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
          : {})
      },
      body: JSON.stringify({ listingId, address })
    });

    if (!response.ok) {
      throw new Error(`Report service returned ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No readable stream available in response.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let finalData: any = null;

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunkString = decoder.decode(value, { stream: true });
        const lines = chunkString.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk = JSON.parse(line);
              
              if (chunk.type === 'initial') {
                finalData = chunk.data;
                if (onProgress) onProgress(finalData);
              } else if (chunk.type === 'chunk' && finalData) {
                // Merge module updates into the state tree
                if (chunk.module === 'flood') {
                  finalData.sources = finalData.sources.map((s: any) => 
                    s.id === 'flood' ? { ...s, state: chunk.data ? 'clear' : 'unresolved' } : s
                  );
                  if (chunk.data) finalData.local.flood = chunk.data;
                } else if (chunk.module === 'epc') {
                  finalData.sources = finalData.sources.map((s: any) => 
                    s.id === 'epc' ? { ...s, state: chunk.data ? 'clear' : 'unresolved' } : s
                  );
                  if (chunk.data) finalData.partB = { ...finalData.partB, ...chunk.data };
                } else if (chunk.module === 'crime') {
                  finalData.sources = finalData.sources.map((s: any) => 
                    s.id === 'crime' ? { ...s, state: (chunk.data && chunk.data.month && chunk.data.month !== 'Unknown') ? 'clear' : 'unresolved' } : s
                  );
                  if (chunk.data) finalData.local.crime = chunk.data;
                } else if (chunk.module === 'heritage') {
                  finalData.sources = finalData.sources.map((s: any) => 
                    s.id === 'heritage' ? { ...s, state: chunk.data ? 'clear' : 'unresolved' } : s
                  );
                  if (chunk.data) finalData.local.heritage = chunk.data;
                }

                if (onProgress) onProgress({ ...finalData });
              }
            } catch (err) {
              console.error('Error parsing NDJSON chunk:', line, err);
            }
          }
        }
      }
    }

    return { success: true, data: finalData };
  } catch (error: any) {
    console.error('Failed to fetch streaming property report:', error);
    return { success: false, data: null, error: error.message };
  }
}
```

---

## 6. PRD Rule: "Absence = Unresolved"

Ensure UI designers and frontend developers follow this strict rule:
* When `state === 'unresolved'`, render **"Data unresolved"** with an info tooltip.
* **Never fabricate data** (e.g. do not show `0 incidents` or `Rating: C` if the API returned null or was unconfigured).
* Unresolved modules still allow the rest of the report to render without breaking the page.
