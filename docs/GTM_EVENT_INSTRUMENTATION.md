# GTM event instrumentation

Client: `src/lib/gtmEvents.ts`

| Event | Hook point |
| --- | --- |
| `account_created` | `AuthContext.login` (once per profile) |
| `referencing_started` | `ReferencingForm` submit success |
| `report_run` | `ProptiiReportModal` open ≥ 15 seconds |
| `report_shared` | Share link control in `ProptiiReportModal` |

Copy `.env.example` → `.env.local` and match `GATEWAY_SHARED_SECRET` from the GTM Compose stack.
