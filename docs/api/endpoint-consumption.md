# Endpoint consumption

Base URL: `https://proptii-v2-backend.onrender.com/api`

Calls go through `apiService` unless a row names another client. `apiService` already appends `/api` and sends a Firebase bearer token. Paths below include that `/api` prefix so they match the live docs.

This file records what each consumed endpoint does. Existing screens keep their current calls. The only new consumption is the Property Insights fallback described first.

## Started in this change

Property Insights still requests `GET /api/analytics/property/{id}/market-insights` first. That route is not in the v2 API. When it fails, or when it returns no `data`, the screen falls back to the two documented insights routes and maps them onto the same fields the page already renders (median rent, year-on-year change, yield, days to rent, demand index). Portfolio analytics, tenants, contracts, search, and messaging are unchanged.

| Method | Path | Caller | What it does |
| --- | --- | --- | --- |
| GET | `/api/insights/price-trends` | `marketInsightService.getPriceTrends`, used by `usePropertyMarketData` | Returns price trends for a postcode taken from the property address: median rent, price per sq ft, year-on-year change, quarterly change, and rental yield. Median rent fills the average-price figure on Property Insights. |
| GET | `/api/insights/demand` | `marketInsightService.getDemand`, used by `usePropertyMarketData` | Returns demand for the property address: searches per property, average days to rent, competitiveness score, and demand trend. The score fills the 0–100 demand index (a 0–10 score is multiplied by 10). Days to rent fills average days on market. |

Demographic fields are not in these responses, so Property Insights hides the age and household rows instead of showing empty values. Income and renter rows on that tab are unchanged.

## Already consumed

### Auth, users, landlords

| Method | Path | Caller | What it does |
| --- | --- | --- | --- |
| GET | `/api/auth/me` | `roleService` | Returns the signed-in uid, email, and role. |
| POST | `/api/auth/role` | `roleService` | Assigns a role. Tenants cannot switch to landlord or agent. |
| GET | `/api/users` | `userService` | Lists user profiles. |
| GET | `/api/users/{id}` | `userService` | Reads one profile. |
| POST | `/api/users` | `userService` | Creates a profile. |
| PUT | `/api/users/{id}` | `userService` | Updates a profile. |
| DELETE | `/api/users/{id}` | `userService` | Deletes a profile. |
| PUT | `/api/user/company-profile` | `CompanyProfileSetup` | Saves the landlord or agent company profile. |
| GET | `/api/landlords` | `landlordUserService` | Lists landlord accounts. |
| GET | `/api/landlords/check` | `landlordUserService` | Checks whether an email is already registered. |
| POST | `/api/landlords/register` | `landlordUserService` | Registers a landlord or agent. |
| POST | `/api/clients/landlords` | `landlordService.createLandlord` | Creates a client record and unwraps the returned id. |
| GET | `/api/clients/landlords` | `landlordService.getLandlords` | Lists client-landlord records. |
| GET | `/api/clients/landlords/{id}` | `landlordService` | Reads one client record. |
| PUT | `/api/clients/landlords/{id}` | `landlordService` | Updates a client record. |
| DELETE | `/api/clients/landlords/{id}` | `landlordService` | Deletes a client record. |
| GET | `/api/health` | `keepAlive` | Liveness ping so the host does not spin down. Exempt from the rate limiter. |

### Properties, search, saved

| Method | Path | Caller | What it does |
| --- | --- | --- | --- |
| GET | `/api/native-properties` | `useProperties` → `propertyService` | Lists the signed-in landlord's properties. Refreshes on mount and after a write. |
| POST | `/api/native-properties` | `propertyService`, `api.ts` | Creates a listing. |
| GET | `/api/native-properties/{id}` | `propertyService` | Reads one listing. |
| PUT | `/api/native-properties/{id}` | `propertyService` | Updates a listing. Ownership also matches `ownerEmail`. |
| DELETE | `/api/native-properties/{id}` | `propertyService` | Deletes a listing. |
| GET | `/api/native-properties/search` | `proptiiPropertyService` | Public catalog search (`q`, `status=vacant`). |
| POST | `/api/properties/facts` | `govDataService` | Requests facts for a listing. |
| GET | `/api/properties/{listingId}/facts` | `govDataService` | Reads stored facts for one listing. |
| POST | `/api/properties/report` | `propertyReportStreamService` | Starts a property report. |
| GET | `/api/flags` | `govDataService` | Reads feature flags before search and facts calls. |
| POST | `/api/search/classify` | `govDataService` | Classifies a search query. |
| POST | `/api/v1/search` | `useSearchBackend` | Portal search on the separate feed service, not this OpenAPI file. |
| POST | `/api/property-selections` | `propertySelectionService` | Saves a shortlist selection. |
| GET | `/api/property-selections` | `propertySelectionService` | Lists selections, optionally by status. |
| PUT | `/api/property-selections/{id}/status` | `propertySelectionService` | Updates selection status and notes. |
| GET | `/api/property-selections/stats` | `propertySelectionService` | Selection counts. |
| DELETE | `/api/property-selections/{id}` | `propertySelectionService` | Removes a selection. |
| GET | `/api/users/me/saved-properties` | `SavedPropertiesContext`, `dashboardService` | Lists bookmarks. Same controller as `/api/saved-properties`. |
| POST | `/api/users/me/saved-properties` | `SavedPropertiesContext` | Bookmarks a property. |
| DELETE | `/api/users/me/saved-properties/{id}` | `SavedPropertiesContext` | Removes a bookmark. |

### Tenants, payments, alerts, insights

| Method | Path | Caller | What it does |
| --- | --- | --- | --- |
| POST | `/api/tenants` | `tenantService.createTenant` | Creates a tenant after Add Tenant confirms, and creates a pending tenant after an invite email. Requires the returned id. |
| GET | `/api/tenants` | `useTenants` → `tenantService.getTenants` | Lists tenants for `userId` and `ownedPropertyIds`. Loads once, then only after `invalidate()`. |
| GET | `/api/tenants/{id}` | `tenantService.getTenant` | Reads one tenant. |
| PUT | `/api/tenants/{id}` | `tenantService.updateTenant` | Saves Edit Tenant. Rent or date changes regenerate the payment schedule. |
| DELETE | `/api/tenants/{id}` | `tenantService.deleteTenant` | Deletes a tenant. |
| POST | `/api/payments/bulk` | `paymentScheduleService` | Writes rent periods after a tenant save. |
| GET | `/api/payments/tenant/{tenantId}` | `paymentScheduleService` | Lists periods for one tenant. |
| GET | `/api/payments/{id}` | `paymentScheduleService` | Reads one period. |
| PUT | `/api/payments/{id}/status` | `paymentScheduleService` | Marks a period paid or overdue. |
| POST | `/api/tenant-invitations` | `invitationService.createInvitation` | Stores an invite after the email succeeds. |
| GET | `/api/tenant-invitations` | `ClientsPage` | Pending invitations for `landlordId`. |
| PUT | `/api/tenant-invitations/{id}` | `invitationService` | Marks an invitation accepted. |
| GET | `/api/tenant-dashboard/summary` | `dashboardService` | Tenant home summary. |
| GET | `/api/insights` | `marketInsightService.getActiveInsights` | Market insight cards on the landlord portfolio market tab. |
| POST | `/api/alerts` | `alertService` | Creates an in-app alert. |
| GET | `/api/alerts` | `alertService` | Lists alerts. |
| GET | `/api/alerts/{id}` | `alertService` | Reads one alert. |
| DELETE | `/api/alerts/{id}` | `alertService` | Deletes an alert. |
| GET | `/api/alerts/events` | `sseService` | Live alert stream. Opens when a listener subscribes to an `alert_` event. |

### Contracts, email, storage

| Method | Path | Caller | What it does |
| --- | --- | --- | --- |
| POST | `/api/contracts` | `signedContractsFirestoreService` | Creates a tenant-side contract. |
| GET | `/api/contracts` | contract list and tenant dashboard | Lists contracts. |
| GET | `/api/contracts/{id}` | `signedContractsFirestoreService` | Reads one contract. |
| PUT | `/api/contracts/{id}/status` | `signedContractsFirestoreService` | Updates contract status. |
| DELETE | `/api/contracts/{id}` | `signedContractsFirestoreService` | Deletes a contract. |
| POST | `/api/contracts/landlord` | landlord `contractService` | Uploads a landlord contract. |
| POST | `/api/contracts/landlord/base64` | landlord `contractService` | Same create with a base64 file. |
| GET | `/api/contracts/landlord` | landlord `contractService` | Lists landlord contracts. |
| GET | `/api/contracts/landlord/{id}` | landlord `contractService` | Reads one landlord contract. |
| PUT | `/api/contracts/landlord/{id}/status` | landlord `contractService` | Updates landlord contract status. |
| PUT | `/api/contracts/landlord/{id}/sign` | landlord `contractService` | Records who signed. |
| DELETE | `/api/contracts/landlord/{id}` | landlord `contractService` | Deletes a landlord contract. |
| GET | `/api/contracts/landlord/expiring` | landlord `contractService` | Contracts expiring within N days. |
| GET | `/api/contracts/landlord/exists` | `contractSyncService` | Duplicate check before sync. |
| POST | `/api/contracts/landlord/sync` | `contractSyncService` | Copies a landlord contract onto the tenant record. |
| POST | `/api/contracts/templates` | `contractService` | Creates a template. |
| GET | `/api/contracts/templates` | `contractService` | Lists templates by status. |
| PUT | `/api/contracts/templates/{id}/status` | `contractService` | Archives or restores a template. |
| DELETE | `/api/contracts/templates/{id}` | `contractService` | Deletes a template. |
| GET | `/api/contracts/stats/templates` | `contractService` | Template counts. |
| POST | `/api/contracts/send-signed-contract` | `contractEmailService` | Emails a signed contract. |
| POST | `/api/email/send` | `InviteTenant`, `ContractsPage`, `emailService` | Sends `{ to, subject, html }`. Invite Tenant treats HTTP 200 with `success: false` as failure. |
| POST | `/api/email/send-base64` | `ContractsPage` | Sends a contract attachment as base64. |
| POST | `/api/storage/upload` | `storageService`, `communicationService` | Uploads a file through the API. |
| DELETE | `/api/storage/file` | `storageService` | Deletes a stored file by path. |

### Referencing

| Method | Path | Caller | What it does |
| --- | --- | --- | --- |
| POST | `/api/referencing/identity` | `referencingService` | Saves the identity section. |
| POST | `/api/referencing/employment` | `referencingService` | Saves employment. |
| POST | `/api/referencing/residential` | `referencingService` | Saves residential history. |
| POST | `/api/referencing/financial` | `referencingService` | Saves financial details. |
| POST | `/api/referencing/guarantor` | `referencingService` | Saves the guarantor section. |
| POST | `/api/referencing/agentDetails` | `referencingService` | Saves agent details. |
| GET | `/api/referencing/{userId}` | `referencingService` | Loads an application. |
| POST | `/api/referencing/forms/{formId}` | `referencingService`, `firestoreService` | Creates or updates a form for a property. |
| GET | `/api/referencing/forms/all` | `dashboardService` | Lists forms for the tenant dashboard. |
| GET | `/api/referencing/status/{email}` | landlord `referencingService` | Referencing status for a tenant email. |
| GET | `/api/referencing/responses/{email}` | landlord `referencingService`, `firestoreService` | Referee and guarantor responses. |
| POST | `/api/referencing/files/save` | `firestoreService` | Saves a referencing file record. |
| GET | `/api/referencing/files/all` | `firestoreService`, `dashboardService` | Lists referencing files. |
| DELETE | `/api/referencing/files/{fileId}` | `firestoreService` | Deletes a referencing file. |
| POST | `/api/referencing/shares` | `referencingService`, `firestoreService` | Creates a passport share. |
| GET | `/api/referencing/shares` | `referencingService`, `firestoreService` | Lists shares. |
| DELETE | `/api/referencing/shares/{shareId}` | `referencingService`, `firestoreService` | Revokes a share. |
| POST | `/api/referencing/invite-guarantor` | `firestoreService` | Sends a guarantor invite. |
| GET | `/api/referencing/guarantor-invite` | `firestoreService` | Validates a guarantor invite token. |
| POST | `/api/referencing/send-email` | `emailService` | Authenticated referencing email. |
| POST | `/api/referencing/ai-extract` | `openRouterService` | Extracts fields from an uploaded document. |
| POST | `/api/referencing/request` | `ReferencingPage` | Asks a tenant to complete referencing. |
| GET | `/api/referencing/public/{viewToken}` | `ReferencingView` | Public read of a shared referencing passport. |
| POST | `/api/referee-guarantor-responses` | `RefereeGuarantorResponseModal`, `firestoreService` | Submits a referee or guarantor response. |
| PUT | `/api/applications/{id}/{section}` | `api.ts` | Alternate section update. Same controller as `/api/referencing/{section}`. |
| POST | `/api/applications/{id}/submit` | `api.ts` | Submits an application. |
| GET | `/api/applications/{id}` | `api.ts` | Reads an application. |
| DELETE | `/api/documents/{id}` | `api.ts` | Deletes an application document. |

### Messages, viewings, guest

| Method | Path | Caller | What it does |
| --- | --- | --- | --- |
| GET | `/api/communication/conversations` | `communicationService` | Lists conversations. |
| POST | `/api/communication/conversations` | `communicationService` | Opens a conversation. |
| GET | `/api/communication/conversations/{id}/messages` | `communicationService` | Loads a thread. |
| POST | `/api/communication/conversations/{id}/messages` | `communicationService` | Sends a message. |
| PATCH | `/api/communication/messages/{id}/read` | `communicationService` | Marks a message read. |
| GET | `/api/communication/conversations/unread-count` | `communicationService` | Unread badge count. |
| POST | `/api/communication/attachments` | `communicationService` | Attaches a file uploaded via `/api/storage/upload`. |
| GET | `/api/communication/attachments/{id}` | `communicationService` | Reads an attachment. |
| GET | `/api/viewing-requests` | `viewingService`, `dashboardService` | Lists viewing bookings. |
| POST | `/api/viewing-requests` | `viewingService`, `bookViewingRequestService` | Books a viewing. |
| PUT | `/api/viewing-requests/{id}` | `viewingService` | Confirms or reschedules a booking. |
| DELETE | `/api/viewing-requests/{id}` | `viewingService`, `bookViewingRequestService` | Cancels a booking. |
| POST | `/api/guest/enquiry` | `quickRequestService` | Public guest enquiry before login. |
| GET | `/api/guest/thread/{token}` | `quickRequestService` | Loads a guest thread. |
| POST | `/api/guest/thread/{token}/reply` | `quickRequestService` | Guest reply. |
| POST | `/api/guest/claim/validate` | `quickRequestService` | Validates a claim token. |
| POST | `/api/guest/claim/resend` | `quickRequestService` | Resends the claim email. |
| POST | `/api/guest/claim/confirm` | `quickRequestService` | Confirms the claim. |
| POST | `/api/guest/claim/auto-merge` | `quickRequestService` | Merges guest threads onto the new account. |

### Billing, admin, leads, reviews, homeowner

| Method | Path | Caller | What it does |
| --- | --- | --- | --- |
| GET | `/api/billing/plans` | `billingService` | Lists subscription plans. |
| GET | `/api/billing/status` | `billingService` | Current subscription. |
| POST | `/api/billing/checkout` | `billingService` | Starts Stripe checkout. |
| POST | `/api/billing/confirm-checkout` | `billingService` | Confirms checkout after Stripe returns. |
| POST | `/api/billing/portal` | `billingService` | Opens the Stripe customer portal. |
| POST | `/api/billing/pending-plan` | `billingService` | Stores a plan choice before checkout finishes. |
| POST | `/api/billing/downgrade` | `billingService` | Schedules a downgrade. |
| GET | `/api/admin/me` | `adminDashboardService` | Checks the caller is an admin. |
| GET | `/api/admin/customers` | `adminDashboardService` | Admin customer list. |
| GET | `/api/admin/customers/{id}` | `adminDashboardService` | Admin customer detail. |
| POST | `/api/admin/customers/{id}/notes` | `adminDashboardService` | Adds an internal note. |
| GET | `/api/admin/overview` | `adminDashboardService` | Admin overview metrics. |
| GET | `/api/admin/alerts` | `adminDashboardService` | Admin alert queue. |
| GET | `/api/admin/partners` | `adminDashboardService` | Partner accounts. |
| GET | `/api/leads` | `CampaignLeadsAdmin` | Campaign leads. |
| GET | `/api/leads/auth/check` | `CampaignLeadsAdmin` | Checks the admin can read leads. |
| GET | `/api/leads/export` | `CampaignLeadsAdmin` | Exports leads. |
| POST | `/api/reviews` | `reviewService` | Submits a review. |
| GET | `/api/reviews` | `reviewService` | Lists reviews. |
| GET | `/api/reviews/stats` | `reviewService` | Review aggregates. |
| GET | `/api/homeowner-maintenance` | `homeownerMaintenanceFirestoreService` | Lists maintenance tasks. |
| POST | `/api/homeowner-maintenance` | `homeownerMaintenanceFirestoreService` | Creates a task. |
| PUT | `/api/homeowner-maintenance/{id}` | `homeownerMaintenanceFirestoreService` | Updates a task. |
| DELETE | `/api/homeowner-maintenance/{id}` | `homeownerMaintenanceFirestoreService` | Deletes a task. |
| GET | `/api/homeowner-projects` | `homeownerProjectsFirestoreService` | Lists projects. |
| POST | `/api/homeowner-projects` | `homeownerProjectsFirestoreService` | Creates a project. |
| PUT | `/api/homeowner-projects/{id}` | `homeownerProjectsFirestoreService` | Updates a project. |
| DELETE | `/api/homeowner-projects/{id}` | `homeownerProjectsFirestoreService` | Deletes a project. |

## Documented, not newly wired

These exist in `v2-backend/docs/api-reference.yaml` and were left on their current callers so other screens keep working.

| Path | Why it was left |
| --- | --- |
| `GET /api/docs`, `/api/docs-yaml`, `/api/docs-full` | Viewer import only. No screen calls them. |
| `GET /api/ping` | Alias of `/api/health`, which keep-alive already calls. |
| `PATCH /api/alerts/{id}/read` | The alert client still has `PUT /api/alerts/{id}/status`, and nothing in the UI calls that method today. |
| `GET /api/sheets`, `POST /api/sheets`, `GET/POST /api/sheets/{sheetId}` | Admin spreadsheet access. No product screen posts waitlist rows through these routes yet. |
| `GET /api/leads/session`, `POST /api/leads` | Lead capture session. The admin page already reads `GET /api/leads`. |
| `GET /api/users/profile` | Profiles are read and written through `/api/users` and `/api/users/{id}`. |

## Called, but not in the v2 spec

These stay as they are. Replacing them would change screens that already depend on their response shape.

| Method | Path | Caller | What the screen expects |
| --- | --- | --- | --- |
| GET | `/api/analytics/portfolio` | `useAnalytics` | Portfolio revenue, occupancy, and tenant blocks. The page still calculates those from the landlord's properties when this call fails. |
| GET | `/api/analytics/property/{id}/market-insights` | `usePropertyMarketData` | Full property market payload. Still tried first. Documented insights are used only when this call does not return data. |
| GET | `/api/azure-users/tenant/{id}` | `useTenantDetails` | Azure tenant profile. |
| PUT | `/api/alerts/{id}/status` | `alertService.updateAlertStatus` | Status update. No UI calls this method. |
| PUT | `/api/insights/{id}/dismiss` | `marketInsightService.dismissInsight` | Dismiss. No UI calls this method. |
| POST | `/api/insights/bulk-create` | `marketInsightService.fetchGOVUKRegulatoryChanges` | Saves GOV.UK items. The controller has no create route; a failure is already ignored. |
| GET | `/api/properties/{id}/lens` | `govDataService` | Listing lens. |
| GET | `/api/address/lookup` | `useAddressLookup` | Viewing address lookup. |
| GET | `/api/properties/{id}/requirements` | `bookingService` | Viewing requirements. |
| GET | `/api/properties/{id}/similar` | `bookingService` | Similar properties. |
