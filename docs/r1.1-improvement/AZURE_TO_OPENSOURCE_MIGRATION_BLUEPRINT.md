# Azure to Open-Source Migration Blueprint

**Proptii MVP r1.1 — Decoupling from Azure Cloud**

*Version 1.0 — February 2025*

---

## Executive Summary

This document provides a concrete migration blueprint for re-architecting Proptii to reduce Azure dependency in favor of open-source and cost-effective alternatives. The goal is to lower operating costs, improve performance, and increase vendor flexibility without compromising functionality.

**Current Azure Centrality:** Azure is important but not universally critical. Most components have fallbacks or can run with degraded functionality when Azure is unavailable. The primary exceptions are **authentication (Azure AD B2C)** and **Cosmos DB** where active users and data are stored.

---

## 1. Component-by-Component Migration Map

### 1.1 Database: Cosmos DB → PostgreSQL (Future Migration)

| Aspect | Details |
|--------|---------|
| **Current usage** | Cosmos DB stores: Properties, Agents, Viewings, Users, References, Contracts, Dashboard. Used by `proptii-backend` (BaseService, referencing, viewing-request) and `api` (Azure Functions). |
| **Recommended replacement** | **PostgreSQL** (self-hosted or managed: Supabase, Neon, Railway, or self-hosted) |
| **Compatibility layer** | Use **Prisma** (preferred for schema clarity and migrations). TypeORM was previously considered but has been removed from the project. |
| **Effort** | 4–6 weeks (1 developer) |
| **Risk** | Medium — schema redesign, migration scripts, and query adaptation required |
| **Cost impact** | Cosmos DB: ~$25+/month (basic tiers). PostgreSQL: $0–25/month (Supabase free tier, Neon free tier, or self-hosted). |

**Key files to change:**
- `proptii-backend/src/config/cosmos.config.ts` — replace with DB config
- `proptii-backend/src/services/base.service.ts` — switch from Cosmos operations to Prisma
- `proptii-backend/src/services/referencing.service.ts`, `viewing-request.service.ts`, `property.service.ts`, `agent.service.ts`
- `api/src/shared/services/BaseService.ts`, `PropertyService.ts`, `ViewingService.ts`, `UserService.ts`
- All Cosmos container names map to PostgreSQL tables

**Migration approach:**
1. Define Prisma schema for all entities (properties, agents, viewings, users, references, contracts, dashboard).
2. Implement data export from Cosmos (JSON export or custom script).
3. Build import scripts from JSON to PostgreSQL.
4. Introduce DB abstraction layer (repository pattern) so Cosmos and PostgreSQL can be swapped via config.
5. Run dual-write during transition, then cut over reads, then remove Cosmos.

---

### 1.2 AI/LLM: Azure OpenAI → Open-Source LLM (Ollama / LM Studio / vLLM)

| Aspect | Details |
|--------|---------|
| **Current usage** | `proptii-backend/src/search/search.service.ts` — property search and suggestions via Azure OpenAI chat completions API. Used when `/api/search` and `/api/search/suggestions` are called. |
| **Fallback today** | Mock results when Azure OpenAI is not configured. Primary search UI uses `search/backend` (scraping), not this service. |
| **Recommended replacement** | **Ollama** (local) or **OpenAI-compatible API** (e.g. vLLM, LM Studio, or LiteLLM proxy) |
| **Effort** | 1–2 weeks |
| **Risk** | Low — API is OpenAI-compatible; swap endpoint and key |
| **Cost impact** | Azure OpenAI: pay-per-token. Ollama/local: free (compute cost only). Managed alternatives (e.g. together.ai, Groq): often cheaper than Azure. |

**Key files to change:**
- `proptii-backend/src/search/search.service.ts` — change base URL and auth from Azure to generic OpenAI-compatible endpoint
- Environment: `AZURE_OPENAI_*` → `OPENAI_API_BASE`, `OPENAI_API_KEY` (or equivalent)

**Migration approach:**
1. Add support for `OPENAI_API_BASE` and `OPENAI_API_KEY` (OpenAI-compatible).
2. Keep Azure config as optional fallback during transition.
3. Point to Ollama (`http://localhost:11434/v1`) or any OpenAI-compatible endpoint.
4. Remove Azure-specific config once validated.

---

### 1.3 Object Storage: Azure Blob → MinIO / S3-Compatible (e.g. Cloudflare R2)

| Aspect | Details |
| **Current usage** | `proptii-backend/src/services/storage.service.ts` and `server/index.js` — property document uploads. Server has Firebase Storage fallback. |
| **Recommended replacement** | **MinIO** (self-hosted) or **S3-compatible** (Cloudflare R2, AWS S3, DigitalOcean Spaces) |
| **Effort** | 1–2 weeks |
| **Risk** | Low — S3 API is standard; AWS SDK or `@aws-sdk/client-s3` works with MinIO/R2 |
| **Cost impact** | Azure Blob: storage + egress. MinIO: free self-hosted. R2: free egress, low storage cost. |

**Key files to change:**
- `proptii-backend/src/services/storage.service.ts` — replace `@azure/storage-blob` with `@aws-sdk/client-s3`
- `server/index.js` — replace Azure Blob init with S3 client, keep Firebase fallback

**Migration approach:**
1. Add S3-compatible storage service (MinIO/R2) with same interface.
2. Migrate existing blobs via Azure export + S3 import scripts.
3. Switch upload path to S3; keep Firebase as fallback for redundancy.
4. Remove Azure Blob code.

---

### 1.4 Authentication: Azure AD B2C → Supabase Auth / Keycloak / Auth.js

| Aspect | Details |
|--------|---------|
| **Current usage** | Frontend: MSAL (`@azure/msal-browser`, `@azure/msal-react`) for login, token acquisition. Backend: `AzureUsersService` for user listing via Microsoft Graph. Server: `azureGraphService` for user fetch. |
| **Recommended replacement** | **Supabase Auth** (simplest) or **Keycloak** (more control) or **Auth.js** (NextAuth-style, flexible) |
| **Effort** | 4–6 weeks |
| **Risk** | High — auth touches almost every protected route; user migration is sensitive |
| **Cost impact** | Azure AD B2C: free tier limited; paid tiers add cost. Supabase Auth: free tier generous. Keycloak: free self-hosted. |

**Key files to change:**
- `src/contexts/AuthContext.tsx` — replace MSAL with new auth provider
- `src/config/authConfig.ts`, `src/config/azure.ts`
- `src/services/api.ts`, `userService.ts` — token handling
- `src/services/SecurityPolicyService.ts`, `SessionManager.ts`, `AccountRecoveryService.ts` — MSAL calls
- `proptii-backend/src/services/azure-users.service.ts` — replace with user service backed by new auth DB
- `server/services/azureGraphService.js` — replace with user service from new auth provider
- `api/src/shared/middleware/auth.ts` — JWT validation for new issuer

**Migration approach:**
1. Add Supabase/Keycloak/Auth.js alongside Azure AD B2C.
2. Support both auth providers during transition (dual issuer validation).
3. Migrate users: export from Azure AD B2C, import into new system (hash passwords if migrating local accounts).
4. Add “migrate account” flow for social logins if needed.
5. Switch default auth to new provider; deprecate Azure AD B2C.
6. Remove MSAL and Azure Graph code.

---

### 1.5 API Runtime: Azure Functions → NestJS Consolidation

| Aspect | Details |
|--------|---------|
| **Current usage** | `api/` folder — Azure Functions for properties, viewings, users, health, support-email, docusign, auth-test. Uses Cosmos DB, Azure AD B2C, Application Insights. |
| **Recommended replacement** | **Consolidate into `proptii-backend` (NestJS)** — already the main API. Move Azure Functions logic into NestJS controllers/services. |
| **Effort** | 2–3 weeks |
| **Risk** | Medium — requires careful route and middleware mapping |
| **Cost impact** | Azure Functions: consumption-based. NestJS on Render: fixed cost (e.g. free tier or low cost). |

**Key files to change:**
- `api/src/functions/*/index.ts` — port each function to NestJS controller
- `api/src/shared/services/*` — merge into proptii-backend services
- `api/src/shared/middleware/auth.ts` — port JWT validation to NestJS guards
- Update frontend `VITE_API_URL` to point only to NestJS backend
- Remove `api/` deployment (Azure Functions)

**Migration approach:**
1. List all Azure Function endpoints and their behavior.
2. Create corresponding NestJS controllers and services.
3. Deploy NestJS with new routes; use feature flags to route traffic.
4. Switch frontend to NestJS API; decommission Azure Functions.

---

### 1.6 Monitoring: Application Insights → OpenTelemetry + Grafana / Sentry

| Aspect | Details |
|--------|---------|
| **Current usage** | `@microsoft/applicationinsights-web` in frontend (SessionManager, SecurityPolicyService, AccountRecoveryService). `api` uses `APPINSIGHTS_INSTRUMENTATIONKEY`. |
| **Recommended replacement** | **OpenTelemetry** + **Grafana** (or **Sentry** for errors) — open-source, vendor-neutral |
| **Effort** | 1–2 weeks |
| **Risk** | Low |
| **Cost impact** | Application Insights: pay-per-GB. Sentry: free tier. Grafana Cloud: free tier. Self-hosted: free. |

**Key files to change:**
- `src/services/SessionManager.ts`, `SecurityPolicyService.ts`, `AccountRecoveryService.ts` — replace Application Insights with OpenTelemetry or Sentry
- `api/src/shared/utils/logging.ts` — replace with OTLP exporter

**Migration approach:**
1. Add OpenTelemetry SDK; configure OTLP exporter to Grafana or equivalent.
2. Add Sentry for error tracking (already referenced in project).
3. Run both during transition; remove Application Insights once validated.

---

### 1.7 Search Backend (No Azure)

| Aspect | Details |
|--------|---------|
| **Current usage** | `search/backend` — Puppeteer, Playwright, Brave API. No Azure dependency. |
| **Action** | No migration needed. Keep as-is. |

---

## 2. Effort Summary

| Component | Effort (weeks) | Risk | Priority |
|-----------|----------------|------|----------|
| Cosmos DB → PostgreSQL | 4–6 | Medium | High |
| Azure OpenAI → Ollama/OpenAI-compatible | 1–2 | Low | Medium |
| Azure Blob → MinIO/S3 | 1–2 | Low | Medium |
| Azure AD B2C → Supabase/Keycloak | 4–6 | High | High |
| Azure Functions → NestJS | 2–3 | Medium | High |
| Application Insights → OpenTelemetry/Sentry | 1–2 | Low | Low |

**Total estimated effort:** 13–21 weeks (single developer), or 6–10 weeks with 2 developers working in parallel.

---

## 3. Recommended Migration Order

1. **Phase 1 — Low risk, quick wins (4–6 weeks)**  
   - Azure OpenAI → Ollama/OpenAI-compatible  
   - Azure Blob → MinIO/S3  
   - Application Insights → OpenTelemetry/Sentry  

2. **Phase 2 — Database and API consolidation (6–9 weeks)**  
   - Cosmos DB → PostgreSQL  
   - Azure Functions → NestJS  

3. **Phase 3 — Authentication (4–6 weeks)**  
   - Azure AD B2C → Supabase Auth (or Keycloak)

---

## 4. Cutover Plan and Rollback Checkpoints

### Checkpoint 1: Post Phase 1
- **Validation:** AI search, document uploads, monitoring all work with new providers.
- **Rollback:** Revert env vars to Azure endpoints; no data migration involved.
- **Data impact:** None.

### Checkpoint 2: Post Phase 2
- **Validation:** All API routes served by NestJS; PostgreSQL holds all data; read/write tests pass.
- **Rollback:** Switch `VITE_API_URL` back to Azure Functions; ensure Cosmos DB still has recent data (if dual-write used).
- **Data impact:** Requires PostgreSQL ↔ Cosmos sync if rollback needed.

### Checkpoint 3: Post Phase 3
- **Validation:** Users can sign in with new auth; JWT validation works; user listing works.
- **Rollback:** Revert auth provider in frontend; restore MSAL. Backend user service must support both.
- **Data impact:** User records in new auth system; may need to re-sync from Azure AD if rollback.

### Rollback Strategy
- Keep Azure resources active (in read-only or standby) for 30–60 days post-cutover.
- Maintain feature flags for each migrated component.
- Document exact env vars and config for both old and new setups.

---

## 5. Target Architecture (Post-Migration)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (Vite + React)                       │
│  Auth: Supabase Auth / Keycloak  │  Monitoring: Sentry / OpenTelemetry  │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    proptii-backend (NestJS)                          │
│  - Properties, Viewings, Contracts, Referencing, Users               │
│  - API consolidates former Azure Functions                          │
└───────┬─────────────────────┬─────────────────────┬────────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  PostgreSQL   │    │  Ollama / vLLM  │    │  MinIO / R2 / S3 │
│  (Prisma)     │    │  (AI Search)    │    │  (Document Store) │
└───────────────┘    └─────────────────┘    └──────────────────┘
        │
        │  (optional sync)
        ▼
┌───────────────┐
│   Firestore   │  (existing, for specific features)
└───────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│              search/backend (Express) — unchanged                     │
│  Puppeteer, Playwright, Brave API                                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Environment Variables Mapping

| Current (Azure) | Post-Migration |
|-----------------|----------------|
| `COSMOS_DB_*` | `DATABASE_URL` (PostgreSQL) |
| `AZURE_OPENAI_*` | `OPENAI_API_BASE`, `OPENAI_API_KEY` |
| `AZURE_STORAGE_*` | `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` |
| `VITE_AZURE_AD_*`, `AZURE_AD_B2C_*` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (or Keycloak equivalents) |
| `APPINSIGHTS_INSTRUMENTATIONKEY` | `OTEL_EXPORTER_OTLP_ENDPOINT`, `SENTRY_DSN` |

---

## 7. Appendix: Key File References

| Component | Files |
|-----------|-------|
| Cosmos DB | `proptii-backend/src/config/cosmos.config.ts`, `base.service.ts`, `referencing.service.ts`, `viewing-request.service.ts`, `api/src/shared/services/BaseService.ts` |
| Azure OpenAI | `proptii-backend/src/search/search.service.ts` |
| Azure Blob | `proptii-backend/src/services/storage.service.ts`, `server/index.js` |
| Azure AD B2C | `src/contexts/AuthContext.tsx`, `src/config/authConfig.ts`, `proptii-backend/src/services/azure-users.service.ts`, `server/services/azureGraphService.js` |
| Azure Functions | `api/` folder |
| Application Insights | `src/services/SessionManager.ts`, `SecurityPolicyService.ts`, `AccountRecoveryService.ts`, `api/src/shared/config/environment.ts` |

---

*Document prepared for Proptii r1.1 improvement planning. Update this blueprint as migration progresses.*
