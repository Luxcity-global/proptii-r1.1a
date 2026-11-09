# GTM event instrumentation

Client: `src/lib/gtmEvents.ts`

| Event | Hook point | Notes |
| --- | --- | --- |
| `account_created` | `AuthContext.login` | Once per profile (B2C `newUser` / localStorage) |
| `referencing_started` | `ReferencingForm` submit success | Subject type `tenancy` |
| `report_run` | Report modal open ≥ 15s | Lives on the 1.4-test report UI until that UI lands on this branch |
| `report_shared` | Report share control | Same as above |

Copy `.env.example` → `.env.local` and match `GATEWAY_SHARED_SECRET` from the GTM Compose stack.

Gateway must allow the Vite origin via `CORS_ORIGINS` (defaults include `http://localhost:5173`).
