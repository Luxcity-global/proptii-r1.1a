# Environment Variable Consistency Documentation

This document explains the current state of environment variable naming across the Proptii codebase, specifically focusing on inconsistencies identified during the Sprint 4 audit (S4-T003).

## 1. API Base URL Inconsistency

### Identified Variables
- `VITE_API_URL`
- `VITE_API_BASE_URL`

### Current Usage
- **`VITE_API_URL`**: Used extensively across the primary frontend components and services (e.g., `apiEndpoints.ts`, `SecurityMiddleware.ts`, `SearchService.ts`, `referencingService.ts`, `userService.ts`, etc.). This typically points to the main NestJS backend.
- **`VITE_API_BASE_URL`**: Used in specific configuration files (`azure.ts`, `env.config.ts`) and older components (`ReferencingModal-old.tsx`).

### Rationale for Maintaining Both
These variables currently point to different backend services or legacy endpoints.
- `VITE_API_URL` is the primary endpoint for the modular NestJS backend.
- `VITE_API_BASE_URL` may be referenced by legacy Azure Functions or specific Azure AD/MSAL configurations that expect a certain naming convention.

**Recommendation:** Do not refactor these names without a full audit of the deployment configurations (Render, Azure) to ensure no routing or authentication breaks.

---

## 2. Azure OpenAI Naming Discrepancy

### Identified Variables
- `AZURE_OPENAI_DEPLOYMENT` (Source comments)
- `AZURE_OPENAI_DEPLOYMENT_NAME` (Actual environment variable)

### Current Usage
The code in `search.service.ts` correctly utilizes `process.env.AZURE_OPENAI_DEPLOYMENT_NAME` at runtime. However, developer comments within the file and some early documentation may refer to it as `AZURE_OPENAI_DEPLOYMENT`.

### Resolution
The implementation correctly uses the validated environment variable from the Zod schema. The discrepancy in comments is noted but does not affect application stability.

---

## 3. General Best Practices
- Always refer to `proptii-backend/src/config/env.validation.ts` for the ground truth on required environment variables.
- New features should prefer the standard names defined in the Zod schema to avoid further fragmentation.
