# Major Application Flows — Verification Checklist

**Purpose:** Manual QA reference for testing end-to-end user journeys across Proptii.  
**Audience:** QA, product, and engineering.  
**Last updated:** June 2026

---

## How to use this document

1. Work through each flow in order for the role you are testing (tenant/renter or landlord/agent).
2. Mark each step **Pass**, **Fail**, or **N/A** and note any blockers.
3. Use the **Prerequisites** section before starting a test session.
4. Cross-reference related docs where noted (contract flow, pricing, etc.).

**Architecture note:** Proptii has two frontends:

| App | Location | Users |
|-----|----------|-------|
| Main SPA | `src/` | Tenants, renters, buyers, marketing, auth, billing |
| Landlord/Agent dashboard | `src/landlord_agent/` (embedded at `/landlord`) | Landlords and estate agents |

Auth is shared via Azure AD B2C; the landlord app runs in an iframe and receives auth state from the parent SPA via `postMessage`.

---

## Prerequisites

| Item | Notes |
|------|-------|
| Local dev running | Main app + backend (`proptii-backend`) + search service if testing AI search |
| Test accounts | At least one tenant account and one landlord/agent account |
| Stripe test mode | For subscription / trial flows |
| DocuSign sandbox | For contract signing flows |
| Email access | Viewing and referencing flows send emails to agent/tenant |
| Firestore access | Optional — verify data persistence in `bookViewingRequests`, `referencingForms`, `contracts`, `properties`, `tenants` |

---

## Tenant / Renter flows

### 1. Discovery & onboarding

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 1.1 | Land on homepage | `/` | Search input and onboarding modal appear for new anonymous visitors | |
| 1.2 | Complete onboarding wizard | `/` modal | User selects tenant role and a goal (search, referencing, contracts) | |
| 1.3 | Tenant goal picker | `/tenant-onboarding` | Modal offers: find property, sign contract, begin referencing | |
| 1.4 | Getting Started hub | Overlay on `/` or dashboard | Progress tracker shows steps; links navigate correctly | |
| 1.5 | Resume dismissed onboarding | Close and revisit `/` | "Come back anytime" or progress resumes from saved state | |

**Key files:** `src/pages/HomeVariant.tsx`, `src/components/onboarding/OnboardingFlow.tsx`, `src/pages/TenantOnboardingOptions.tsx`

---

### 2. Property search

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 2.1 | Enter search query on home | `/` | Navigates to search results | |
| 2.2 | View search results | `/search?q=...` | Property cards load from backend (OnTheMarket or Proptii inventory) | |
| 2.3 | Switch search platform | `/search` toggle | Results refresh between `onthemarket` and `proptii` sources | |
| 2.4 | Filter / browse results | `/search` | Cards display address, price, images; detail view opens | |
| 2.5 | Save property (heart) | `/search` | Property saved to local storage; Explorer plan capped at 5 saves | |
| 2.6 | Book viewing from search | Property card CTA | Property prefilled in session; navigates to `/bookviewing` | |

**Key files:** `src/pages/SearchResults.tsx`, `src/hooks/useSearchBackend.ts`, `src/contexts/SavedPropertiesContext.tsx`

---

### 3. Saved properties

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 3.1 | View saved properties | `/dashboard/saved-searches` | All saved properties listed (auth required) | |
| 3.2 | Remove saved property | Dashboard saved searches | Property removed from list and local storage | |
| 3.3 | Explorer save limit | Save 6th property on Explorer | Limit enforced or upgrade prompt shown | |
| 3.4 | Renter Pro unlimited saves | Upgrade plan, save many | No save cap | |

**Key files:** `src/components/dashboard/sections/SavedProperties-new.tsx`, `src/config/plans.ts`

---

### 4. Book a viewing

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 4.1 | Open book viewing page | `/bookviewing` | Booking modal or page loads | |
| 4.2 | Auth gate | `/bookviewing` (logged out) | Login prompt before full submission | |
| 4.3 | Select property | Step 1 of modal | Manual entry or prefilled from search | |
| 4.4 | Schedule viewing | Step 2 | Date, time, and preferences captured | |
| 4.5 | Review & confirm | Step 3 | Summary shown; submit succeeds | |
| 4.6 | Persistence | After submit | Request saved to Firestore `bookViewingRequests` | |
| 4.7 | Email notifications | After submit | Agent and tenant receive viewing request emails | |
| 4.8 | Manage in dashboard | `/dashboard/viewings` | Request appears in upcoming/past tabs | |
| 4.9 | Reschedule viewing | Dashboard viewings | New date/time saved; notification sent | |
| 4.10 | Cancel viewing | Dashboard viewings | Status updated; cancellation message sent | |

**Key files:** `src/pages/BookViewing.tsx`, `src/components/viewings/BookViewingModal.tsx`, `src/services/bookViewingRequestService.ts`

---

### 5. Tenant referencing (rental application)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 5.1 | Open referencing landing | `/referencing` | Marketing page with "Get Started" CTA | |
| 5.2 | Auth required | Click Get Started | Login if not authenticated | |
| 5.3 | Document checklist | First open | Checklist modal shown (skippable via local storage flag) | |
| 5.4 | Identity section | Referencing modal | Personal details, ID upload | |
| 5.5 | Employment section | Referencing modal | Employer details, income proof upload | |
| 5.6 | Residential section | Referencing modal | Address history captured | |
| 5.7 | Financial section | Referencing modal | Bank/income details captured | |
| 5.8 | Guarantor section | Referencing modal | Guarantor details; invitation sent if applicable | |
| 5.9 | Agent details section | Referencing modal | Letting agent / property details captured | |
| 5.10 | Submit application | Final step | Data saved to backend/Firestore; confirmation email sent | |
| 5.11 | Resume from dashboard | `/dashboard/tenant-referencing` | Progress restored; can edit and resubmit | |
| 5.12 | Plan gating | Explorer user | Upgrade wall shown for referencing section (Renter Pro required) | |

**Key files:** `src/pages/Referencing.tsx`, `src/components/referencing/`, `src/services/referencingService.ts`

---

### 6. Referee / guarantor response (external party)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 6.1 | Open invitation link | `/?responseType=referee&applicant=...&email=...` | Response modal opens on homepage | |
| 6.2 | Submit referee response | Modal form | Name, email, consent, reason saved | |
| 6.3 | Open guarantor link | `/?responseType=guarantor&...` | Guarantor response modal opens and submits | |
| 6.4 | Tenant sees response | `/dashboard/tenant-referencing` | Referee/guarantor response visible in tenant view | |

**Key files:** `src/components/referencing/RefereeGuarantorResponseModal.tsx`, `docs/features/REFEREE_RESPONSES_TENANT_VIEW_IMPLEMENTATION.md`

---

### 7. Digital contracts (tenant)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 7.1 | Open contracts landing | `/contracts` | Hero page with sign-contract CTA | |
| 7.2 | Upload / select template | Contract modal | Template loaded into editor | |
| 7.3 | Customize fields | Customize step | Fields editable before signing | |
| 7.4 | DocuSign signing | Sign step | DocuSign envelope created; user can sign | |
| 7.5 | Store signed contract | After signing | Contract saved to Firestore / local state | |
| 7.6 | View in dashboard | `/dashboard/tenant-contracts` | Signed contracts listed with preview/download | |
| 7.7 | Received contracts tab | Contract modal | Contracts sent by landlord appear (filtered by tenant email) | |
| 7.8 | Plan gating | Explorer user | Upgrade wall for contracts section (Renter Pro required) | |

**Key files:** `src/pages/Contracts.tsx`, `src/components/contract/ContractModal.tsx`, `src/services/docusignService.ts`  
**Related:** `docs/features/CONTRACT_FLOW_LANDLORD_TO_TENANT.md`, `docs/features/TESTING_CONTRACT_FLOW.md`

---

### 8. Tenant dashboard

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 8.1 | Access dashboard | `/dashboard` | Protected route; redirects to login if unauthenticated | |
| 8.2 | Dashboard home | `/dashboard` | Stats/widgets for saved properties, viewings, referencing, files | |
| 8.3 | Saved searches nav | Sidebar | `/dashboard/saved-searches` loads | |
| 8.4 | Viewings nav | Sidebar | `/dashboard/viewings` loads | |
| 8.5 | Contracts nav | Sidebar | `/dashboard/tenant-contracts` loads (plan-gated) | |
| 8.6 | Referencing nav | Sidebar | `/dashboard/tenant-referencing` loads (plan-gated) | |
| 8.7 | Your files nav | Sidebar | `/dashboard/your-files` loads | |
| 8.8 | Settings nav | Sidebar | `/dashboard/settings` — plan badge, billing portal, logout | |

**Key files:** `src/components/dashboard/Dashboard.tsx`

---

### 9. File management (tenant)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 9.1 | View aggregated files | `/dashboard/your-files` | Referencing uploads, contract files, manual uploads shown | |
| 9.2 | Filter by category | Your files | Filter works correctly | |
| 9.3 | Upload new file | Upload modal | File uploaded and appears in list | |
| 9.4 | Preview file | File row action | Preview modal opens | |
| 9.5 | Download / delete | File row actions | File downloaded or removed | |

**Key files:** `src/components/dashboard/sections/YourFiles-new.tsx`, `src/services/fileService.ts`

---

### 10. Registration, pricing & billing (tenant)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 10.1 | View renter pricing | `/pricing?segment=renters` | Explorer, Renter Pro, Buyer Pro cards shown | |
| 10.2 | Explorer signup (free) | "Get started free" | Account created; lands on consumer dashboard | |
| 10.3 | Renter Pro trial | "Start free trial" | Signup → welcome → Stripe checkout (trial) → `/billing/confirmed` | |
| 10.4 | Pay now (skip trial) | `/signup/pay-now` | Immediate Stripe payment; active subscription | |
| 10.5 | Trial expiry guard | Expired trial user | Redirected to `/billing/activate` | |
| 10.6 | Activate or downgrade | `/billing/activate` | Can pay to continue or downgrade to Explorer | |
| 10.7 | Billing portal | `/dashboard/settings` | Stripe customer portal opens for payment method / invoices | |

**Key files:** `src/pages/pricing/index.tsx`, `src/services/billingService.ts`, `src/utils/planAccess.ts`  
**Related:** `docs/features/pricing-onboarding-user-flows.md`

---

### 11. Authentication (tenant)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 11.1 | Login | `/login` or protected route | Azure AD B2C popup/redirect completes | |
| 11.2 | Post-login redirect | Any protected route | Returns to intended path via `redirectAfterLogin` | |
| 11.3 | Unauthorized role | `/listings/new` without role | Redirect to `/unauthorized` if role check fails | |
| 11.4 | Logout | Dashboard settings | Session cleared; redirected appropriately | |

**Key files:** `src/contexts/AuthContext.tsx`, `src/components/common/ProtectedRoute.tsx`

---

### 12. Free rental tools (tenant)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 12.1 | Tools hub | `/tools` | All tools listed; no auth required | |
| 12.2 | Readiness checker | `/tools/readiness-checker` | Interactive checklist works | |
| 12.3 | Document tracker | `/tools/document-tracker` | Tracker functional | |
| 12.4 | Viewing tracker | `/tools/viewing-tracker` | Tracker functional | |
| 12.5 | Process simulator | `/tools/process-simulator` | Simulator runs | |
| 12.6 | Timeline generator | `/tools/timeline-generator` | Timeline generated | |
| 12.7 | Know your rights | `/tools/know-your-rights` | Content loads | |
| 12.8 | Rental documents | Tools → Documents tab | UK rental PDFs downloadable | |

**Key files:** `src/pages/Tools.tsx`, `src/pages/tools/`

---

## Landlord / Agent flows

### 13. Discovery & entry

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 13.1 | Homepage landlord mode | `/` dropdown | "List properties" actions link to landlord routes | |
| 13.2 | Agent landing | `/agent` | Role selection and quick actions (auth required) | |
| 13.3 | Choose landlord vs agent role | Role selection popup | `userRole` stored in localStorage; Firestore `landlordUsers` record created | |
| 13.4 | Landlord onboarding modal | `/landlord-onboarding` | Options: add property, add tenant, send contracts | |
| 13.5 | Open landlord dashboard | `/landlord` or `/landlord/index.html` | Iframe loads landlord app | |
| 13.6 | View landlord pricing | `/pricing?segment=landlords` or `?segment=agents` | Correct plan cards for segment | |

**Key files:** `src/pages/AgentHome.tsx`, `src/pages/LandlordOnboardingOptions.tsx`, `src/components/LandlordAppBridge.tsx`

---

### 14. Landlord app — first-time onboarding

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 14.1 | Welcome screen | New user in landlord app | Welcome → Get Started | |
| 14.2 | Role selection | Onboarding | Choose landlord or property agent | |
| 14.3 | Profile setup | Onboarding | Name, email, logo (skippable) | |
| 14.4 | Onboarding options | Onboarding | Dashboard / Add Property / Company Profile | |
| 14.5 | Company profile (agents) | `?start=company-profile-setup` | Agent company details captured | |
| 14.6 | Land on main dashboard | After onboarding | `main-app` with dashboard as default screen | |

**Key files:** `src/landlord_agent/src/App.tsx`, `WelcomeScreen.tsx`, `ProfileSetup.tsx`

---

### 15. Add property (wizard)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 15.1 | Start wizard | `/landlord?start=property-setup-step1` or Dashboard CTA | Property setup step 1 opens | |
| 15.2 | Select property type | Wizard step | Type selected | |
| 15.3 | Enter property details | Wizard step | Address, bedrooms, rent, etc. captured | |
| 15.4 | Select amenities | Wizard step | Amenities saved | |
| 15.5 | Upload images & notes | Wizard step | Images attached | |
| 15.6 | Preview property | Preview screen | All details reviewable; optional pending tenants | |
| 15.7 | Publish (authenticated) | Preview → Publish | Property saved to Firestore `properties` | |
| 15.8 | Publish (guest) | Preview → Publish | `REQUIRE_AUTH` postMessage; parent shows signup modal | |
| 15.9 | Post-publish navigation | After publish | Property details or dashboard shown | |

**Key files:** `PropertySetupStep1.tsx` through `PropertyPreview.tsx`, `propertyService.ts`

---

### 16. Property portfolio management

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 16.1 | Open properties page | `/landlord/properties` | All properties listed | |
| 16.2 | Search / filter | Properties page | Filter by status, type, lease expiry, overdue rent | |
| 16.3 | View property details | Click property row | Property details screen opens | |
| 16.4 | Edit property | Property details | Changes saved to Firestore | |
| 16.5 | Manage documents | Property details | Per-property document management works | |
| 16.6 | Manage photos | Property details | Photo upload/reorder/delete works | |
| 16.7 | Duplicate / archive / delete | Property actions | Correct state change in Firestore | |
| 16.8 | Import properties | Import dialog | JSON/CSV import succeeds | |
| 16.9 | Export properties | Bulk export | JSON/CSV/Excel/PDF export downloads | |

**Key files:** `PropertiesPage.tsx`, `PropertyDetails.tsx`, `ImportPropertiesDialog.tsx`

---

### 17. Tenant management (landlord/agent)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 17.1 | Open clients page | `/landlord/clients` | Tenants tab shows all tenants | |
| 17.2 | Add tenant wizard | Add Tenant CTA or `?start=add-tenant` | Multi-step form: contact, property, rent, lease dates | |
| 17.3 | Tenant created | After submit | Record in Firestore `tenants`; rent schedule auto-generated | |
| 17.4 | Invite tenant | Invite tenant screen | Invitation email sent via backend | |
| 17.5 | View tenant details | Click tenant | Overview, referencing, payments, documents tabs | |
| 17.6 | Referencing status | Tenant details | Status reflects Firestore `referencingForms` (not-started → in-progress → complete) | |
| 17.7 | Payment history | Tenant details payments tab | Rent periods from `rentPaymentPeriods` shown | |
| 17.8 | Agents — landlords tab | Clients page (agent role only) | Landlord clients listed and manageable | |
| 17.9 | Add landlord client | Add Landlord wizard | Landlord saved to Firestore `landlords` | |

**Key files:** `ClientsPage.tsx`, `AddTenant.tsx`, `TenantDetails.tsx`, `tenantService.ts`, `paymentScheduleService.ts`

---

### 18. Viewings management (landlord/agent)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 18.1 | Open viewings page | `/landlord/viewings` | Requests, Upcoming, Completed, Past tabs load | |
| 18.2 | Receive tenant request | After tenant books viewing | Request appears in Requests tab | |
| 18.3 | Accept / decline request | Request row actions | Status updated; email sent | |
| 18.4 | Schedule viewing | Schedule action | Date/time set; confirmation email to tenant | |
| 18.5 | Reschedule viewing | Upcoming tab | New schedule saved; reschedule email sent | |
| 18.6 | Cancel viewing | Any active viewing | Cancelled; notification email sent | |
| 18.7 | Mark completed | Past tab | Viewing marked complete | |

**Key files:** `ViewingsPage.tsx`, `viewingService.ts`, `bookViewingRequestService.ts`  
**Related:** `docs/viewings-page-landlord.md`, `docs/integrations/VIEWING_FIRESTORE_INTEGRATION.md`

---

### 19. Contracts (landlord/agent)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 19.1 | Open contracts page | `/landlord/contracts` or `?start=contracts` | Sent / Unsigned / Signed tabs load | |
| 19.2 | Send contract | Send Contract modal | Pick tenant, upload file, select type (tenancy, deposit, right-to-rent) | |
| 19.3 | Contract persisted | After send | Saved to Firestore `contracts` + Firebase Storage; email to tenant | |
| 19.4 | Track unsigned | Unsigned tab | Unsigned contracts listed; reminder actions work | |
| 19.5 | Track signed | Signed tab | Signed contracts listed with download | |
| 19.6 | Tenant receives contract | Tenant app | Appears in Received Contracts tab (see flow 7.7) | |
| 19.7 | Unsigned contract alert | Dashboard | Alert shown for overdue unsigned contracts | |

**Key files:** `ContractsPage.tsx`, `SendContractModal.tsx`, `contractService.ts`  
**Related:** `docs/features/CONTRACT_FLOW_LANDLORD_TO_TENANT.md`, `docs/features/TESTING_CONTRACT_FLOW.md`

---

### 20. Documents hub (landlord/agent)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 20.1 | Open documents page | `/landlord/documents` | Portfolio-wide document list | |
| 20.2 | Filter by type / status | Documents page | Valid / expired / pending filters work | |
| 20.3 | Bulk download | Select multiple | Files download | |
| 20.4 | Archive / delete | Document actions | Status updated in Firestore | |
| 20.5 | Per-property documents | Properties → Manage Documents | Scoped document management works | |

**Key files:** `DocumentsPage.tsx`, `DocumentManagement.tsx`, `DocumentUploadModal.tsx`

---

### 21. Referencing monitoring (landlord/agent)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 21.1 | New tenant default status | After add tenant | Referencing status = `not-started` | |
| 21.2 | Status in clients list | Clients page | Badge reflects current referencing status | |
| 21.3 | Full referencing data | Tenant details | All sections visible when tenant completes form | |
| 21.4 | Referee responses | Tenant details | Referee/guarantor responses displayed | |
| 21.5 | End-to-end with tenant | Tenant completes `/referencing` | Landlord view updates to `complete` | |

**Key files:** `referencingService.ts`, `TenantDetails.tsx`, `ClientsPage.tsx`  
**Related:** `src/landlord_agent/TESTING_GUIDE.md`

---

### 22. Payments & arrears (landlord/agent)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 22.1 | Auto rent schedule | On tenant create | `rentPaymentPeriods` generated in Firestore | |
| 22.2 | Overdue detection | Simulate overdue period | Arrears alert appears on dashboard | |
| 22.3 | Arrears management | Click arrears alert | Arrears screen opens | |
| 22.4 | Send reminder | Arrears workflow | Reminder action updates status | |
| 22.5 | Payment plan | Arrears workflow | Payment plan option works | |
| 22.6 | Legal action flag | Arrears workflow | Legal action workflow initiates | |
| 22.7 | Payment history | Tenant details | All periods shown with correct status | |

**Key files:** `paymentScheduleService.ts`, `ArrearsManagement.tsx`, `alertService.ts`

---

### 23. Vacancy prevention (landlord/agent)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 23.1 | Vacancy risk alert | Dashboard | Alert shown when lease expiry risk detected | |
| 23.2 | Open vacancy prevention | Click alert | Risk score, comparables, AI copy shown | |
| 23.3 | Initiate pre-marketing | Vacancy screen | Alert status updated | |

**Key files:** `VacancyPrevention.tsx`, `alertService.ts`, `marketInsightService.ts`

---

### 24. Analytics / insights (landlord/agent)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 24.1 | Open analytics | `/landlord/insights` | Portfolio insights page loads | |
| 24.2 | Market data | Insights page | Demand trends and regulatory alerts shown | |
| 24.3 | Per-property insights | Property details | Property-level analytics accessible | |
| 24.4 | Dashboard charts | `/landlord/dashboard` | Occupancy, revenue charts render | |

**Key files:** `PropertyInsights.tsx`, `Dashboard.tsx`, `marketInsightService.ts`

---

### 25. Landlord dashboard

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 25.1 | Dashboard loads | `/landlord` or `/landlord/dashboard` | KPIs, property table, alerts visible | |
| 25.2 | Priority alerts | Dashboard | Lease expiry, arrears, unsigned contracts, vacancy alerts | |
| 25.3 | Quick actions | Dashboard CTAs | Add property, manage docs/photos, jump to insights | |
| 25.4 | Guest empty state | Unauthenticated visit | Empty state with sign-in prompt | |
| 25.5 | Sidebar navigation | All sidebar items | Dashboard, Properties, Documents, Viewings, Contracts, Clients, Analytics, Settings | |

**Key files:** `Dashboard.tsx`, `MainLayout.tsx`

---

### 26. Settings & billing (landlord/agent)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 26.1 | Open settings | `/landlord/settings` | Profile and plan info shown | |
| 26.2 | View current plan | Settings | Correct plan badge (Starter, Landlord Pro, Elite, etc.) | |
| 26.3 | Stripe billing portal | Manage billing | Portal session opens | |
| 26.4 | Compare / upgrade plans | Plan compare modal | Navigates to `/pricing?segment=landlords` or `agents` | |
| 26.5 | Logout | Settings | `AUTH_ACTION` postMessage to parent; session cleared | |
| 26.6 | Supply-side trial | New landlord signup | 1-month trial then paid (see pricing doc) | |

**Key files:** `LandlordAgentSettingsPage.tsx`, `billingService.ts`, `useLandlordBillingStatus.ts`

---

### 27. Auth bridge (iframe ↔ parent)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 27.1 | Auth state sync | Login in parent SPA | Iframe receives `AUTH_STATE` postMessage | |
| 27.2 | Guest action gate | Publish property while logged out | `REQUIRE_AUTH` message; parent shows signup modal | |
| 27.3 | Post-login resume | After auth from gate | Original action (e.g. publish) can complete | |
| 27.4 | Direct sign-in link | `/landlord/index.html?signin=1` | Delegates auth to parent window | |

**Key files:** `LandlordAppBridge.tsx`, `LandlordDemo.tsx`, `MainLayout.tsx`

---

### 28. Public listings submission (agent)

| # | Step | Route / entry | Expected result | ☐ |
|---|------|---------------|-----------------|---|
| 28.1 | Browse listings | `/listings` | Listings page loads | |
| 28.2 | Create listing | `/listings/new` | Protected: requires `agent` or `tenant` role | |
| 28.3 | Submit form | Submission form | Property details, images, preview | |
| 28.4 | Success redirect | After submit | `/listings/success` shown | |

**Key files:** `src/pages/Listings.tsx`, `src/pages/listings/new.tsx`, `SubmissionForm.tsx`

---

## Cross-cutting flows

### 29. End-to-end tenant → landlord journeys

These flows span both apps and are the highest-value integration tests.

| # | Journey | Steps to verify | ☐ |
|---|---------|-----------------|---|
| 29.1 | Search → viewing → landlord accepts | Tenant searches → books viewing → landlord sees request → schedules → both receive emails | |
| 29.2 | Referencing end-to-end | Landlord adds tenant → tenant completes referencing → landlord sees complete status + referee responses | |
| 29.3 | Contract send → tenant receives | Landlord sends contract → tenant sees in Received Contracts → tenant signs/previews | |
| 29.4 | Add tenant → rent schedule → arrears | Landlord adds tenant → schedule generated → overdue triggers alert → arrears workflow | |
| 29.5 | Property publish → search visibility | Landlord publishes Proptii property → tenant finds it in `/search?type=proptii` | |

---

## Known gaps & limitations

Use this section to avoid false failures during QA.

| Feature | Status | Notes |
|---------|--------|-------|
| In-app messaging / chat | Not implemented | Chat buttons in saved properties are UI placeholders only |
| Dedicated applications page | N/A | Referencing flow serves as the rental application |
| Rent collection payments | Not implemented | Stripe billing is for Proptii subscriptions, not rent to landlords |
| Tenant inbox (landlord app) | Commented out | `TenantInbox` screen exists but is not in sidebar navigation |
| `/agent-contracts` route | Commented out | Navbar may still link; route disabled in `App.tsx` |
| `/listings` browse | Partial | May use mock data; submission form is early-stage |
| Analytics data | Partial | Some insights use mock or placeholder data |

---

## Route quick reference

### Tenant / renter (main SPA)

```
/                          Home + search
/search                    Search results
/tenant-onboarding         Tenant goal picker
/bookviewing               Book viewing
/referencing               Referencing
/contracts                 Contracts
/tools/*                   Free rental tools
/pricing, /signup/*        Registration & plans
/billing/*                 Stripe checkout lifecycle
/login                     Authentication
/dashboard                 Tenant portal
  ├─ saved-searches
  ├─ viewings
  ├─ tenant-contracts      (Renter Pro+)
  ├─ tenant-referencing    (Renter Pro+)
  ├─ your-files
  └─ settings
```

### Landlord / agent

```
/agent                     Agent landing (auth required)
/landlord-onboarding       Landlord goal picker
/landlord, /landlord/*     Landlord dashboard (iframe)
/pricing?segment=landlords|agents

Landlord app screens (hash-routed when embedded):
  /dashboard
  /properties
  /documents
  /viewings
  /contracts
  /clients
  /insights
  /settings
```

---

## Related documentation

| Document | Topic |
|----------|-------|
| `docs/features/pricing-onboarding-user-flows.md` | Pricing, signup, and plan gating rules |
| `docs/features/CONTRACT_FLOW_LANDLORD_TO_TENANT.md` | Contract data flow and schema |
| `docs/features/TESTING_CONTRACT_FLOW.md` | Step-by-step contract testing |
| `docs/integrations/VIEWING_FIRESTORE_INTEGRATION.md` | Viewing request Firestore integration |
| `docs/viewings-page-landlord.md` | Landlord viewings page |
| `src/landlord_agent/TESTING_GUIDE.md` | Referencing integration testing |
| `src/landlord_agent/docs/MISSING_CRITICAL_FEATURES.md` | Planned but not yet built features |

---

## Test session log

| Date | Tester | Role tested | Environment | Pass | Fail | Notes |
|------|--------|-------------|-------------|------|------|-------|
| | | | | | | |
| | | | | | | |
