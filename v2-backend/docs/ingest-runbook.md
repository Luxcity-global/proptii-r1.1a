# Ingest Runbook — Proptii R1.4 Government Data Intelligence Layer

> **Sprint 1.1 deliverable.** This document must be kept up to date whenever a
> licensed product changes, a cadence shifts, or a stale threshold is revised.
> Last updated: 2026-08-26

---

## Purpose

Records the authoritative details for every batch data source that writes into
the `propertyFacts` Firestore collection. It answers four questions for each
source:

1. Exactly which licensed product is being used?
2. How often does the ingest job run?
3. What happens when the job fails?
4. At what age is the data considered stale and in need of review?

---

## Sources

### 1. HMLR — HM Land Registry Title/Covenants

| Field | Value |
|---|---|
| **Status** | ⚠️ STUBBED — licensed product not yet received |
| **Licensed product name** | _To be confirmed once licence is granted_ |
| **Licence reference** | _To be confirmed — required before stub is removed_ |
| **Data type** | Restrictive covenants and title register entries |
| **What it provides** | `covenant_restriction` flag per property title number |
| **Ingest cadence** | Monthly (when live) |
| **Cron schedule** | `0 3 * * *` — 03:00 UTC daily; guard exits unless licensed data path is set |
| **Stale threshold** | **35 days** — any property with an HMLR flag older than 35 days is flagged for review |
| **Service file** | `src/gov-data/services/hmlr-ingest.service.ts` |
| **Env var required** | `HMLR_LICENSED_DATA_PATH` — set to the ingested dataset file path |

#### Failure alerting

Until the licensed product is received, the cron logs a `WARN` on every run:
`[HMLR] Ingest is STUBBED — licensed product not yet in hand.`

When live, ingest failures will be surfaced as:
- `ERROR` log line in the NestJS logger (picked up by Render log drain / App Insights)
- The `ingestMeta.hmlr.lastIngestAt` Firestore field will not advance — a monitoring
  check against `IngestMetaService.isStale('hmlr')` will return `true` after 35 days

**Alert action:** On stale detection, the on-call engineer must:
1. Check Render logs for the `hmlr-ingest` cron job output
2. Confirm `HMLR_LICENSED_DATA_PATH` is still valid and the file is present
3. Trigger a manual run if required (call `HmlrIngestService.runIngest()` via
   admin endpoint or Render shell)

#### ⚠️ Critical constraint

> **Do NOT use Price Paid data for covenant flags.**
> Price Paid (`01 Sample PP HMLR Data (1).xlsx` in the project root) is a
> transaction-price dataset. It contains no restrictive covenant information.
> Using it would produce fabricated `clear` or `flagged` states — a material
> misrepresentation. The licensed HMLR title/covenants product must be received
> and its licence reference recorded in this document before the stub is removed.

#### Removing the stub (when licensed product arrives)

1. Record the licence reference and product name in this document
2. Remove the STUBBED guard block in `hmlr-ingest.service.ts` (marked with
   `// ── STUBBED GUARD ───`)
3. Implement the parse-and-upsert logic against the actual title register format
   (not Price Paid schema)
4. Set `HMLR_LICENSED_DATA_PATH` in Render env vars
5. Update cadence in `IngestMetaService` from `'STUBBED'` to `'monthly'`
6. Get backend lead sign-off in the PR

---

### 2. OS NGD — Ordnance Survey National Geographic Database Buildings

| Field | Value |
|---|---|
| **Status** | ⚠️ SKELETON — API pagination not yet implemented |
| **Licensed product name** | OS NGD Buildings (Features API) |
| **Licence reference** | OS Data Hub subscription — confirm specific licence tier with procurement |
| **Data type** | Building footprints with UPRN, PAON, SAON, street, postcode |
| **What it provides** | Populates `uprn_index` Firestore collection; writes `os_ngd_building_match` flag per property |
| **Ingest cadence** | Quarterly |
| **Cron schedule** | `0 4 1 1,4,7,10 *` — 04:00 UTC on the 1st of Jan, Apr, Jul, Oct |
| **Stale threshold** | **95 days** — any property with an OS NGD flag older than 95 days is flagged for review |
| **Service file** | `src/gov-data/services/os-ngd-ingest.service.ts` |
| **Env vars required** | `OS_NGD_API_KEY` — OS Data Hub API key |
| **API endpoint** | `https://api.os.uk/features/ngd/ofa/v1/collections/bld-fts-buildingpart/items` |

#### Failure alerting

Failures surface as:
- `ERROR` log line: `[OS NGD] Ingest failed: {message}`
- `ingestMeta.os_ngd.lastIngestAt` will not advance — `isStale('os_ngd')` returns `true` after 95 days
- Ingest is abort-safe: a module shutdown during a run logs `[OS NGD] Ingest aborted`
  and sets `running = false` so the next scheduled run is not skipped

**Alert action:** On stale detection:
1. Check Render logs for `os-ngd-ingest` cron output
2. Confirm `OS_NGD_API_KEY` is valid and the OS Data Hub subscription is active
3. Check OS NGD API status at `https://status.os.uk`
4. Trigger manual re-run if required

#### What "stale" means for OS NGD

OS NGD Buildings is updated quarterly. A flag older than 95 days means one
quarterly cycle has been missed. Consequence: the `uprn_index` lookup table
may be missing newly built properties or properties with updated addresses.
Missing UPRNs cause `matchStatus: 'none'` on affected listings — government
data cannot be associated to those properties until the next successful ingest.

---

### 3. EPC Register — DLUHC Domestic EPC Register

| Field | Value |
|---|---|
| **Status** | 🔴 DISABLED — pending scope confirmation |
| **Licensed product name** | DLUHC Domestic EPC Register (OpenData Communities) |
| **Licence reference** | Open Government Licence v3.0 (OGL) — free to use with attribution |
| **Data type** | Energy Performance Certificates — rating (A–G), lodgement date, UPRN |
| **What it provides** | `epc_rating` flag per property |
| **Ingest cadence** | Quarterly (when enabled) |
| **Cron schedule** | `0 5 1 1,4,7,10 *` — 05:00 UTC on the 1st of Jan, Apr, Jul, Oct |
| **Stale threshold** | **185 days** (6 months) — EPC certificates are valid for 10 years; 6-month data age is a review trigger, not an expiry |
| **Service file** | `src/gov-data/services/epc-ingest.service.ts` |
| **Env vars required** | `EPC_INGEST_ENABLED=true` to enable; `EPC_API_KEY` — DLUHC API credentials |
| **API endpoint** | `https://epc.opendatacommunities.org/api/v1/domestic/search` |

#### Current state

`EPC_INGEST_ENABLED` is not set in any environment. The cron is registered
but exits immediately on every run. All `epc_rating` flags remain `unresolved`.

#### Scope decision required

Before enabling:
1. Head of Engineering must confirm EPC is in scope for R1.4
2. Set `EPC_INGEST_ENABLED=true` in Render env vars
3. Set `EPC_API_KEY` (DLUHC credentials — register at `epc.opendatacommunities.org`)
4. Implement the pagination TODO in `epc-ingest.service.ts`
5. Update this document with the decision date and approver

**If EPC remains out of scope:** document the decision here and ensure frontend
renders honest copy: _"EPC data not yet available"_ rather than implying a
compliance problem.

#### Flag derivation logic (when implemented)

| EPC Rating | Flag state | Severity | Reason |
|---|---|---|---|
| A, B, C | `clear` | `info` | Meets or exceeds minimum lettings standard |
| D | `flagged` | `medium` | Below minimum E required to let legally in England |
| E, F, G | `flagged` | `high` | Unlettable under MEES regulations |

#### Failure alerting (when enabled)

- `ERROR` log: `[EPC] Ingest failed: {message}`
- `ingestMeta.epc.lastIngestAt` will not advance — `isStale('epc')` returns `true` after 185 days

**Alert action:** On failure, check `EPC_API_KEY` validity and DLUHC API
status. EPC API returns HTTP 401 on expired credentials.

---

### 4. Compliance Uploads — Landlord Document Uploads (Live)

| Field | Value |
|---|---|
| **Status** | ✅ LIVE — wired via `ComplianceTransformService` |
| **Licensed product name** | N/A — landlord-uploaded documents |
| **Data type** | Gas safety certificates, EPC certificates (upload), EICR, PAT tests, insurance |
| **What it provides** | `gas_cert_valid`, `epc_rating`, `electrical_cert_valid`, `pat_cert_valid`, `insurance_valid` flags |
| **Ingest cadence** | Live — triggered on every successful `POST /api/property/upload-document` |
| **Stale threshold** | N/A — timestamp of upload is the evidence; freshness rendering is the frontend's responsibility |
| **Service file** | `src/gov-data/services/compliance-transform.service.ts` |
| **Integration point** | `ReferencingService.saveUserFile()` — lines 322–329 |

#### How it works

1. Landlord/agent uploads document via `POST /api/property/upload-document`
2. `ReferencingService.saveUserFile()` saves file to Firebase Storage + writes
   metadata to `referencing_files` Firestore collection
3. Immediately after (fire-and-forget, non-fatal): `ComplianceTransformService
   .deriveAndUpsert()` is called
4. The service inspects the document type (from `section`, `field`, or filename
   heuristics) and writes the corresponding flag into `propertyFacts/{listing_id}`

#### Failure alerting

Compliance transform failures are non-fatal by design — the file upload always
succeeds even if the flag write fails. Failures log as `WARN`:
`[ComplianceTransform] upsertFlag failed for key={key}: {message}`

On persistent failures, check:
1. Firestore connectivity (the `propertyFacts` collection must be accessible)
2. The `listingId` or `propertyId` field is present on the uploaded file metadata

---

## Staleness Summary

| Source | Cadence | Stale After |
|---|---|---|
| HMLR | Monthly | 35 days |
| OS NGD | Quarterly | 95 days |
| EPC Register | Quarterly | 185 days |
| Compliance Uploads | Live | N/A |

Staleness is checked via `IngestMetaService.isStale(source)`. Stale sources
should surface in any observability dashboard wired to `GET /api/health`.

---

## Firestore Collections Written By Ingest Jobs

| Collection | Written by | Key |
|---|---|---|
| `propertyFacts` | All ingest services + ComplianceTransform | UPRN (preferred) or `listing_id` |
| `uprn_index` | `OsNgdIngestService` | Normalised postcode |
| `ingestMeta` | All ingest services via `IngestMetaService.recordRun()` | Source name (`hmlr`, `os_ngd`, `epc`) |
| `runtimeFlags` | Manual (Firestore console) | `gov_data_layer` |

---

## Approvals & Change Log

| Date | Change | Author |
|---|---|---|
| 2026-08-26 | Initial runbook created (Sprint 1.1 deliverable) | Engineering |
| — | EPC scope decision | _Pending — Head of Engineering_ |
| — | HMLR licensed product received | _Pending — Procurement_ |
