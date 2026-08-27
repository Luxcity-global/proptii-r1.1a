# Ingest Runbook — Proptii R1.4 Government Data Layer

> Sprint 1.1 Deliverable. Keep this runbook updated whenever ingest configuration changes.

---

## Overview

This runbook covers the three data sources that feed the `propertyFacts` Firestore collection.
All ingest jobs run off the request path as NestJS `@nestjs/schedule` cron jobs in `v2-backend`.

**Zero live external calls** are made during request handling. All external data is pre-ingested.

---

## Data Sources

### 1. HMLR — HM Land Registry Title/Covenants Register

| Field | Value |
|---|---|
| **Status** | ⚠️ STUBBED — licensed product not yet in hand |
| **Licensed product name** | HMLR Title Register (restrictive covenants dataset) |
| **Licence reference** | _TBD — must be recorded here before removing STUBBED guard_ |
| **Ingest cadence** | Monthly (once licensed product confirmed) |
| **Stale threshold** | 35 days |
| **Cron schedule** | `0 3 * * *` (03:00 UTC daily — inert until unstubbed) |
| **Service** | `v2-backend/src/gov-data/services/hmlr-ingest.service.ts` |
| **Failure alert path** | App Insights alert → Slack `#infra-alerts` |

#### ⚠️ Critical: What the Sample XLSX IS and IS NOT

The file `01 Sample PP HMLR Data (1).xlsx` in the repo root contains **HMLR Price Paid data**, NOT the title/covenants dataset. It must NOT be used to derive covenant flags.

**Price Paid is useful for:**
- Building the address normalisation pipeline (PAON + SAON + Street → canonical form)
- Testing the address parser before the licensed product arrives
- Populating `priceHistory[]` as an optional enrichment (future)

**Price Paid must NOT be used for:**
- Covenant restriction flags (the field simply does not exist in this dataset)
- Title number lookups

#### To remove the STUBBED guard:
1. Receive the licensed HMLR title/covenants product
2. Record the licence reference in this table
3. Validate the schema against the actual title register format (not Price Paid)
4. Remove the STUBBED guard block in `hmlr-ingest.service.ts`
5. Get backend lead sign-off in PR review
6. Update ingest cadence in this runbook

---

### 2. OS NGD — Ordnance Survey National Geographic Database Buildings

| Field | Value |
|---|---|
| **Status** | 🟡 Skeleton — API pagination TODO |
| **Licensed product name** | OS NGD Buildings collection |
| **Licence reference** | _TBD — record here before enabling_ |
| **API endpoint** | `https://api.os.uk/features/ngd/ofa/v1` |
| **Auth** | API key — env var `OS_NGD_API_KEY` |
| **Ingest cadence** | Quarterly (Jan, Apr, Jul, Oct) |
| **Stale threshold** | 95 days |
| **Cron schedule** | `0 4 1 1,4,7,10 *` (04:00 UTC, 1st of Jan/Apr/Jul/Oct) |
| **Service** | `v2-backend/src/gov-data/services/os-ngd-ingest.service.ts` |
| **Failure alert path** | App Insights alert → Slack `#infra-alerts` |

#### Purpose

OS NGD Buildings provides:
- **UPRN** (Unique Property Reference Number) — primary key for all property facts
- Building footprint and address data (PAON, SAON, Street, Postcode)
- Written to `uprn_index` Firestore collection (keyed by normalised postcode)

#### To enable full ingest:
1. Obtain OS NGD API key from OS Data Hub (`https://osdatahub.os.uk`)
2. Set `OS_NGD_API_KEY` in `v2-backend/.env` and Render environment
3. Implement the pagination TODO in `os-ngd-ingest.service.ts`
4. Test with a known postcode and verify `uprn_index` document is written

---

### 3. EPC Register — DLUHC Domestic Energy Performance Certificates

| Field | Value |
|---|---|
| **Status** | 🔴 DISABLED — pending scope confirmation |
| **Enable env var** | `EPC_INGEST_ENABLED=true` |
| **Licensed product name** | Domestic EPC Register (DLUHC / Open Data Communities) |
| **Licence reference** | _TBD — record here when confirmed_ |
| **API endpoint** | `https://epc.opendatacommunities.org/api/v1` |
| **Auth** | Basic auth — env var `EPC_API_KEY` (base64 of `email:key`) |
| **Ingest cadence** | Quarterly (Jan, Apr, Jul, Oct) |
| **Stale threshold** | 185 days |
| **Cron schedule** | `0 5 1 1,4,7,10 *` (05:00 UTC, 1st of Jan/Apr/Jul/Oct) |
| **Service** | `v2-backend/src/gov-data/services/epc-ingest.service.ts` |
| **Failure alert path** | App Insights alert → Slack `#infra-alerts` |

#### To enable:
1. Confirm with Head of Engineering that EPC register is in scope
2. Register at `https://epc.opendatacommunities.org` to obtain API credentials
3. Set `EPC_INGEST_ENABLED=true` and `EPC_API_KEY` in environment
4. Implement the pagination TODO in `epc-ingest.service.ts`

---

## Firestore Collections Written by Ingest

| Collection | Written by | Key format |
|---|---|---|
| `propertyFacts` | All ingest services + ComplianceTransformService | UPRN (preferred) or `listing_id` |
| `uprn_index` | OsNgdIngestService | Normalised postcode (e.g. `MK159HP`) |
| `ingestMeta` | IngestMetaService.recordRun() | Source name (`hmlr`, `os_ngd`, `epc`) |
| `runtimeFlags` | Manual / admin tooling | `gov_data_layer` |

---

## Compliance Transform (NestJS inline, no Cloud Functions)

Compliance documents (gas certs, EPC certificates, etc.) are handled by `ComplianceTransformService.deriveAndUpsert()`, which is called inline from `ReferencingService.saveUserFile()` on every document upload.

This avoids Firebase Cloud Functions billing while keeping compliance flags up-to-date in real time.

**Supported document types and derived flags:**

| Document type | Flag ID | Severity |
|---|---|---|
| `gas_safety_certificate` | `gas_cert_valid` | high |
| `epc_certificate` | `epc_rating` | medium |
| `electrical_certificate` | `electrical_cert_valid` | high |
| `pat_test` | `pat_cert_valid` | low |
| `insurance` | `insurance_valid` | medium |
| _(all others)_ | `compliance_document_received` | info |

---

## Runtime Rollback Switch

The `runtimeFlags/gov_data_layer` Firestore document controls the entire gov-data layer without a deployment:

```json
{
  "enabled": true,
  "updatedAt": "2026-08-25T00:00:00Z",
  "updatedBy": "admin"
}
```

Setting `enabled: false` causes `GET /api/flags` to return `{ gov_data_layer: false }`, which the frontend uses to suppress all gov-data UI. No code change or redeployment required.

**To flip in staging:**
1. Open Firestore console → `runtimeFlags` → `gov_data_layer`
2. Set `enabled` to `false`
3. Verify search reverts to pre-R1.4 behaviour within 60s (Redis TTL)
4. Set `enabled` back to `true` to re-enable

---

## Sprint 1.1 Definition of Done

- [ ] A known `listing_id` or `uprn` resolves a populated `Flag[]` from Firestore `propertyFacts`
- [ ] Zero live external calls to HMLR, OS NGD, or EPC APIs during request handling
- [ ] HMLR flags ship `stubbed: true`; `state` is `unresolved` (not fabricated `clear`)
- [ ] `runtimeFlags/gov_data_layer` seed document exists in Firestore
- [ ] This runbook reviewed by backend lead before first ingest job runs
