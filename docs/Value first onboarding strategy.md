# Value-First Onboarding Strategy (Delayed Registration)

**Priority:** HIGHEST  
**Rationale:** Value-first approach (inspired by Duolingo-style flows). Users experience value before being asked to commit. Registration is triggered only after an "aha moment."

---

## Onboarding Format

**Discovery → Profiling → Engagement → Sign Up**

What matters is the quality and style we bring to it. A light sprinkling of fun, wittiness and character will help.

---

# Style

| Aspect | Direction |
|--------|-----------|
| **Character** | Mascot to help guide users |
| **Visual** | Engaging, fun, gamified |
| **Tone** | Welcoming, helpful |
| **Page layout** | Full page |
| **Micro-interactions** | Bubbly |

### Mascot
- **Role:** Guide the user through the onboarding process (present on key steps, not decorative).
- **Visual / name:** _Still being worked on._

---

# Page-by-Page Breakdown

## Phase 1: Discovery

**Goal:** Welcome the user, then capture intent and attribution (how they want to use Proptii, how they found us). All steps happen **before** the value moment.

### Page 1.1 — Welcome to Proptii (first paint)
- **What user sees:** Hero with "Welcome to Proptii" + primary CTA that moves them into the flow (e.g. "Get started" or "Show me" — not "Sign up").
- **Behaviour:** Anonymous session starts on load (temporary user ID). No login required.
- **Mascot:** First appearance — guides user into the next step (e.g. "Let's get you to the good stuff").

### Page 1.2 — "How do you want to use Proptii?" (intro Discovery, beneath welcome)
- **What user sees:** Low-friction question under/below welcome: "How do you want to use Proptii?" (chips or options: e.g. Find a place to rent / Manage my property / Get referenced / Sign contracts / Search with AI / Other — options TBD).
- **Behaviour:** One tap; answer stored in anonymous session. Can complement or feed into Profiling (user group) for demo selection.
- **Rationale:** Captures intent early; helps tailor messaging and demo.

### Page 1.3 — "How did you find us?" (intro Discovery, before value)
- **What user sees:** Single, low-friction card or block: "How did you hear about Proptii?" (chips or dropdown: Google, friend, social, ad, other).
- **Behaviour:** One tap; answer stored in anonymous session. User then proceeds to Profiling → Engagement (value).
- **Rationale:** Attribution and insight without blocking; user has not yet seen product value.
- **Order:** Welcome → How do you want to use Proptii? → How did you find us? → Profiling → Engagement (value).

---

## Phase 2: Profiling

**Goal:** Identify **user group** with light, easy questions. This determines which demo we show in Engagement.

### Page 2.1 — User group (light, easy)
- **What user sees:** Short set of simple questions — primarily **"Who are you?"** or **"I'm a…"** with clear options:
  - **Tenant** / **Landlord** / **Agent** / **Homeowner**
- **Behaviour:** Choice(s) stored in anonymous session. **Drives which demo runs in Engagement:**
  - **Tenants** → demo: referencing, AI search, tenant features.
  - **Landlords** and **Agents** → **same demos**: add property, sign contracts, tenant management, documents.
  - **Homeowners** → demo: maintenance, documents, home value, vendor search, etc.
- **UX:** Light and easy — chips or cards, minimal taps. Mascot guides: "So we can show you the most useful bit first."
- **Skip:** Allow "Just show me around" with a sensible default demo if we have one.

---

## Phase 3: Engagement (Value-first core)

**Goal:** User gets real value via a **demo tailored to their user group** (no login). This is where "aha moments" happen.

### Page 3.1 — Demo by user group (no login)
- **What user sees:** Demo content is **determined by Profiling (user group)**:
  - **Tenants** → referencing, AI property search, tenant features.
  - **Landlords** and **Agents** → **same demos**: add property, publish listing, sign/send contracts, tenant management, document compliance.
  - **Homeowners** → maintenance management, documentation hub, home value, vendor search, projects.
- **Behaviour:** All interactions stored in anonymous session. User can use the demo without signing up.
- **Mascot:** Guides through the demo — short tips, encouragement, "Here’s what you can do with Proptii."

### Page 3.2 — Deepen value (optional second screen)
- **What user sees:** Next step within the same demo (e.g. second screen of the flow, or a "Here’s what you’ve done" summary).
- **Behaviour:** Continue storing in session; build attachment to "their" data.

### Page 3.3 — Triggers at pivotal action points + demo-mode guides
- **Logic (no dedicated page):** Sign-up prompt is shown at **pivotal, demo-specific actions** — not generic. Examples:
  - **Landlord / Agent demo** → trigger on **"Publish property"** or **"Save and Preview Property"** / **"Save listing"**, or **"Send contract"**.
  - **Tenant demo** → trigger on **"Submit reference"** (referencing), or **"Save"** / **"Apply"** after AI search (e.g. save search / save property).
  - **Homeowner demo** → trigger on **"Save task"** (maintenance), **"Upload document"** (documentation hub), or **"Save project"**.
- **When triggered:** Show **Sign-up prompt** (Phase 4) as a modal matching the UI spec (see **Demo-mode guides and sign-up modal**).
- **Demo-mode guides:** When in demo mode, show the **general guide bubble** (one reusable component for all demos). Each demo supplies its own **message** and **target** (e.g. tenant search: "Click here to save property" → heart icon; landlord: "Click here to publish" → Publish button). Target has light circular outline and optional pulse. See **Demo-mode guides and sign-up modal (UI spec)** for design and per-demo config table.

---

## Phase 4: Sign Up (Delayed registration)

**Goal:** Convert anonymous session into an account only after value is felt. Make it fast and low-friction.

### Page 4.1 — Soft prompt (modal / slide-over)
- **What user sees:** In **demo mode**, the modal matches the **Demo-mode guides and sign-up modal (UI spec)** below: icon at top, title (e.g. "Want to save this property?"), **"Sign up in 10 seconds"** (blue, underlined), reassurance line, primary **"Sign up with email"** (orange), secondary **"Social Media sign up"** (white with grey border).
- **Behaviour:** No full-page form. Social OAuth (Google, Apple) + email as backup. On success, migrate anonymous session data (saved properties, analyses, preferences) to the new user account.
- **Dismissal:** User can close and keep exploring anonymously; prompt can reappear on next high-intent action (with optional "Don’t ask again for this session" if we want to avoid nagging).

### Page 4.2 — Post-registration confirmation (optional screen)
- **What user sees:** Short confirmation: "You’re in. We’ve saved your [property/analysis/portfolio]." + CTA to dashboard or next step.
- **Behaviour:** Session data already migrated; user is now logged in.

---

# Summary: Page flow at a glance

| # | Phase | Page / Step | Purpose |
|---|--------|-------------|---------|
| 1 | Discovery | 1.1 Welcome to Proptii | First paint; anonymous session starts |
| 2 | Discovery | 1.2 How do you want to use Proptii? | Intent; intro question beneath welcome |
| 3 | Discovery | 1.3 How did you find us? | Attribution; before value |
| 4 | Profiling | 2.1 User group (light questions) | **Tenant** / **Landlord** / **Agent** / **Homeowner** → determines which demo |
| 5 | Engagement | 3.1 Demo by user group | Tenant: referencing, AI search; Landlord & Agent: same demos; Homeowner: maintenance, docs, home value |
| 6 | Engagement | 3.2 Second value screen | Deepen engagement within demo |
| 7 | — | 3.3 Triggers | **Pivotal actions** (e.g. Publish property, Save listing) → show sign-up prompt |
| 8 | Sign up | 4.1 Soft prompt modal | "Want to save this? Sign up in 10 seconds" + OAuth |
| 9 | Sign up | 4.2 Confirmation | "We’ve saved your stuff" + next step |

---

# Features we can demo (from repo)

Below are features that exist in the codebase and can be used for each group’s onboarding demo.

---

## Tenant

| Feature | Location / notes | Pivotal trigger (sign-up prompt) |
|--------|------------------|-----------------------------------|
| **Referencing** | `TenantReferencing.tsx`, `ReferencingModal`, referee/guarantor flows; Firestore `referencingForms`, `referee_guarantor_responses` | **Submit reference** (referencing form) |
| **AI property search** | `SearchService.ts`, `OpenAISearchService`, backend `search.service.ts` / `searchRoutes.js`; natural-language search → property results | **Save search** / **Save property** / **Apply** (after viewing results) |
| **Reference responses view** | Tenant sees referee/guarantor responses on referencing page | Optional: "Save my referencing progress" |
| **Rental documents** | `RentalDocuments.tsx` — How to Rent, Right to Rent, deposit templates, Legionella (info) | Optional: "Download" / "Save for later" |
| **Contracts (tenant side)** | `ContractModal`, DocuSign, signed contracts → sync to landlord | **Sign and send contract** |

---

# AI property search demo — how it will be done

This section describes how we will build the **tenant onboarding demo** for AI property search (value-first, no login until pivotal action).

---

## Current state (what we reuse)

- **Search UI:** `SearchInput` (homepage or standalone) → user types query → navigates to `/search?q=...&type=onthemarket|internet`.
- **Results:** `SearchResults` page uses `useSearchBackend()` — calls search backend (e.g. `VITE_SEARCH_BACKEND_URL`, default localhost:3001) for `onthemarket` (scrape) or `internet` (scrape-internet-real); results cached in `sessionStorage` under `searchResults`.
- **Save:** `SearchResults` uses `useSavedProperties()` — `toggleSaveProperty(property)`; saved list lives in **localStorage** (`savedProperties`). No auth required today.
- **Route:** `/search` is **public** (no login). So the existing flow already gives value without sign-up; we only need to intercept the pivotal action and add sign-up prompt + session migration.

---

## Approach: demo mode on existing search flow

We do **not** need a separate “fake” demo app. We treat the existing `/search` flow as the demo when the user is in **onboarding (anonymous) session** and intercept **Save property** to show the sign-up modal.

| Step | What we do |
|------|------------|
| **1. Anonymous session** | When user lands in onboarding (e.g. after Profiling as Tenant), ensure an **anonymous session** exists: generate a temporary ID, store in `sessionStorage` (e.g. `onboardingAnonymousId`, `onboardingUserGroup: tenant`). Optionally persist “last search query” and “results viewed” there too. |
| **2. Entry to demo** | After Profiling → Tenant, redirect user to the **same** search experience: e.g. `/search?q=2+bed+flats+in+Leeds&type=internet` or just `/search` with a pre-filled example. Optional: use a query param like `?onboarding=tenant` so the app knows to treat this as demo (show mascot, trigger sign-up on save). |
| **3. Search experience** | Reuse **existing** `SearchInput` + `SearchResults` + `useSearchBackend()`. No duplicate UI. If search backend is down, we can add a **demo fallback** (e.g. mock results from `useSearchBackend` when `onboarding=tenant` and backend fails) so the demo always shows something. |
| **4. Pivotal trigger** | When user clicks **Save property** (heart / “Save” on a card): if in **demo mode** (anonymous session / `onboarding=tenant`) and **not logged in**, **do not** save to localStorage yet; instead **open the sign-up modal**: “Want to save this? Sign up in 10 seconds” (Google / Apple / email). If user dismisses, they can keep browsing; modal can reappear on next Save. |
| **5. After sign-up** | On successful OAuth/registration: (1) **Migrate** anonymous session data to the user: copy `localStorage.savedProperties` (and any session-stored search/demo state) to the user account (e.g. Firestore or backend “saved_properties” for that user). (2) **Then** add the current property to saved list so it appears in their account. (3) Redirect or show confirmation: “You’re in. We’ve saved your property.” |

---

## Technical implementation outline

1. **Onboarding session (sessionStorage)**  
   - Keys: e.g. `onboardingAnonymousId`, `onboardingUserGroup`, optionally `onboardingSearchQuery`, `onboardingSearchResultsViewed`.  
   - Set when user completes Profiling (or on first visit if we start onboarding from homepage).  
   - Cleared or marked “converted” after sign-up.

2. **Demo flag on /search**  
   - Either: `sessionStorage.onboardingUserGroup === 'tenant'` and not logged in, or URL `?onboarding=tenant`.  
   - When true: show optional onboarding UI (e.g. mascot, one-line hint) and enable “intercept Save → show sign-up modal”.

3. **Intercept Save property**  
   - In `SearchResults`, where `toggleSaveProperty(property)` is called: if demo mode and not authenticated, **prevent** default behaviour, open **SignUpModal** (soft prompt: “Want to save this? Sign up in 10 seconds”).  
   - Optionally: add the property to a “pending save” in sessionStorage; after sign-up, merge into user’s saved list and persist to backend/Firestore.

4. **Sign-up modal**  
   - New or existing component: social OAuth (Google, Apple) + email. On success: call **migration** (copy session + localStorage saved properties to user account), then close modal and refresh or redirect.

5. **Migration**  
   - Backend or client: read `localStorage.savedProperties` and session keys, associate with the new user ID, write to Firestore/API. Clear or rename session keys so we don’t double-migrate.

6. **Optional: demo fallback results**  
   - If we want the demo to work without the search backend: when `onboarding=tenant` and backend fails (or always in demo), `useSearchBackend` could return a small set of **mock properties** so the user always sees results and can click Save.

---

## Data flow summary

```
User (anonymous) → Profiling: Tenant → Redirect to /search?onboarding=tenant
       → Search (existing UI + useSearchBackend)
       → Sees results (real or mock fallback)
       → Clicks "Save property"
       → Intercept: show SignUpModal ("Want to save this? Sign up in 10 seconds")
       → User signs up (Google / Apple / email)
       → Migrate session + localStorage savedProperties to user account
       → Add current property to saved list
       → Confirm: "You're in. We've saved your property."
```

---

## Files to touch (implementation phase)

| Area | Files / layers |
|------|----------------|
| Anonymous session | New small util or context: e.g. `src/contexts/OnboardingSessionContext.tsx` or `src/utils/onboardingSession.ts` (create/read anonymous ID, userGroup, clear after sign-up). |
| **General guide bubble** | **One shared component** for all demos: e.g. `DemoGuideBubble.tsx` or `OnboardingGuideBubble.tsx`. Props: `message`, `targetRef` or `targetSelector`, optional `placement`. Each demo uses it with its own message + target (see per-demo config table in UI spec). |
| Demo flag / intercept | Per-demo: e.g. `SearchResults.tsx` for tenant search; landlord/agent and homeowner demos each check demo mode + auth before pivotal action; open SignUpModal instead when needed. |
| Sign-up modal | One shared component (accepts demo-specific copy): e.g. `SignUpPromptModal.tsx` (copy: “Want to save this? Sign up in 10 seconds”, OAuth + email). |
| Migration | New small service or API: e.g. `migrateOnboardingSessionToUser(userId, anonymousId)` reading sessionStorage + localStorage and writing to Firestore/backend. |
| Optional mock | `useSearchBackend.ts`: when `onboarding=tenant` and backend fails, return mock array of properties so demo always has results. |

---

## Demo-mode guides and sign-up modal (UI spec)

When in **demo mode**, show **guides** that point the user to the pivotal action. When they perform that action, show the **sign-up modal**. The same **general guide bubble** and **general sign-up modal** are used for **every demo**; each demo only supplies its own message, target element, and modal copy.

---

### 1. General demo guide bubble (reusable for any demo)

**Purpose:** A **single, reusable** component used across all demos (tenant, landlord/agent, homeowner). It draws attention to whichever pivotal element that demo uses (Save property, Publish, Send contract, Save task, etc.).

**Design (match reference):**

- **Component:** One **speech-bubble style guide** used everywhere. It is **generic**: it accepts a **message** (string) and a **target** (element ref or selector). Each demo page passes its own message and target.
- **Appearance (same for all demos):**
  - Light-grey, rounded rectangular speech bubble.
  - Black text inside = the **message** for this demo (e.g. "Click here to save property", "Click here to publish", "Click here to send contract").
  - A **pointer** (rounded rectangle or curved shape) extending from the bubble toward the **target** element.
- **Target (demo-specific):**
  - The pointer **points directly to the pivotal element** for this demo (heart icon, Publish button, Send contract button, Save task button, etc.).
  - The **target element** is visually highlighted: e.g. light circular outline around it; optional subtle **pulse** or glow so it reads as the active target.
- **When to show:** In demo mode, once the relevant screen is visible. Show the guide so the user sees it without blocking the whole page; they can click the target (or dismiss the guide) to proceed.
- **When to hide:** After the user clicks the target or after a short delay / dismiss. Optionally show again on next visit to the same screen in the same session.

**Implementation:** One shared component (e.g. `DemoGuideBubble` or `OnboardingGuideBubble`) used by every demo. Props: `message: string`, `targetRef` or `targetSelector`, optional `placement`. Each demo screen renders it with its own message and target. No demo-specific guide component — only demo-specific **config** (message + target).

**Per-demo config (message + target):**

| Demo | Guide message | Target element |
|------|----------------|----------------|
| **Tenant — AI search** | Click here to save property | Heart/save icon on first property card |
| **Tenant — Referencing** | Click here to submit your reference | Submit button on referencing form |
| **Landlord / Agent — Add property** | Click here to publish your listing | Publish property / Save listing button |
| **Landlord / Agent — Contracts** | Click here to send the contract | Send contract button |
| **Homeowner — Maintenance** | Click here to save this task | Save task / Create task button |
| **Homeowner — Documents** | Click here to upload your document | Upload document button |
| *(New demos)* | *(e.g. "Click here to…")* | *(Pivotal button/element for that flow)* |

---

### 2. Sign-up modal (after they click the trigger)

**Purpose:** Soft prompt to sign up when the user has just tried to perform the pivotal action (e.g. save a property). Reassure them and offer fast sign-up.

**Design (match reference):**

- **Layout:**
  - Centered **modal** over a slightly darkened background.
  - White background, softly rounded corners, subtle shadow.
- **Content (top to bottom):**
  1. **Icon (top centre):** A grey icon that fits the action (e.g. house/property or save icon). Reference uses a house-with-window inside a square/camera-style outline — use the same or your product icon.
  2. **Title/question:** Bold black text, e.g. **"Want to save this property?"** (for AI search demo). For other demos: "Want to book a viewing for this apartment?", "Want to publish this listing?", etc.
  3. **Highlighted line:** **"Sign up in 10 seconds"** — styled in **blue**, **underlined**, to emphasise speed and low friction.
  4. **Reassurance (smaller, lighter grey):** e.g. **"Don’t worry — you won’t have to go through the entire search process again."** (Adjust per demo: e.g. "We’ll save this property to your account.")
  5. **Primary CTA:** Orange button — **"Sign up with email"** (or "Continue with email").
  6. **Secondary CTA:** White button with thin grey border — **"Social Media sign up"** (or "Continue with Google / Apple" if you prefer explicit labels). Leads to OAuth.
- **Behaviour:** Clicking primary or secondary completes sign-up (or opens the appropriate auth flow). On success, run migration and show confirmation. User can close the modal (X or backdrop) to keep browsing anonymously; prompt can reappear on next pivotal action.

**Copy summary for AI property search demo:**

| Element | Copy |
|--------|------|
| Title | Want to save this property? |
| Highlight | Sign up in 10 seconds |
| Reassurance | Don’t worry — you won’t have to go through the entire search process again. |
| Primary button | Sign up with email |
| Secondary button | Social Media sign up |

---

### 3. Flow in demo mode (same for every demo)

1. User is in **any** demo (tenant search, landlord add property, homeowner maintenance, etc.).
2. **Guide appears:** The **general guide bubble** is shown with that demo’s **message** and **target** (e.g. "Click here to save property" → heart icon; "Click here to publish" → Publish button). Target has circular outline and optional pulse.
3. User **clicks the target** (or dismisses the guide).
4. **Modal appears:** Sign-up modal with that demo’s copy (e.g. "Want to save this property?" / "Want to publish this listing?" etc.) + "Sign up in 10 seconds" + reassurance + Sign up with email / Social Media sign up.
5. User signs up or dismisses; if they sign up, migrate and confirm.

---

## Pivotal trigger (recap)

- **Primary:** User clicks **Save property** (add to saved list) on `SearchResults` → show sign-up prompt.  
- **Optional:** After N results viewed (e.g. 2+), or “Save this search”, we could show the same modal on next Save or as a soft prompt.

---

*Once this approach is agreed, implementation can start with anonymous session + demo flag, then intercept Save + modal, then migration.*

---

## How to test the AI property search demo (when built)

Use this checklist to manually test the demo end-to-end and catch edge cases.

### Prerequisites

- **Search backend:** If the demo uses the real search backend, ensure it’s running (e.g. `VITE_SEARCH_BACKEND_URL` pointing at a running instance). If you added a mock fallback for demo mode, you can test with the backend off.
- **Auth:** Have at least one sign-up method working (e.g. Google OAuth or email) so you can complete the flow after the modal.
- **Clean state:** Use an incognito/private window (or clear `sessionStorage` and `localStorage` for the site) so you start as an anonymous user.

---

### Happy path (anonymous → Save → sign-up → migration)

1. **Start anonymous**
   - Open the app in incognito (or clear site data).
   - Go through onboarding: Welcome → “How do you want to use Proptii?” → “How did you find us?” → Profiling.
   - In Profiling, choose **Tenant**.
   - **Check:** You are redirected to the search demo (e.g. `/search` or `/search?onboarding=tenant`).

2. **Anonymous session**
   - Open DevTools → Application (Chrome) → Session Storage / Local Storage.
   - **Check:** There is an anonymous session (e.g. `onboardingAnonymousId`, `onboardingUserGroup: tenant`).

3. **Search**
   - Enter a query (e.g. “2 bed flats in Leeds”) and run the search.
   - **Check:** Results load (from backend or mock). No login required.

4. **Pivotal action — Save property**
   - Click **Save** (heart / “Save property”) on one of the results.
   - **Check:** The **sign-up modal** appears (“Want to save this? Sign up in 10 seconds”) instead of the property being saved silently.
   - **Check:** The property is **not** yet in `localStorage.savedProperties` (or it’s in a “pending” state until sign-up).

5. **Dismiss modal (optional)**
   - Close the modal without signing up.
   - **Check:** You can keep browsing. Click Save on another property (or the same one) again.
   - **Check:** The sign-up modal appears again.

6. **Sign up**
   - Click Save again to open the modal, then complete sign-up (Google / Apple / email).
   - **Check:** After success, you see a confirmation (e.g. “You’re in. We’ve saved your property”) or are redirected to a logged-in view.

7. **Migration**
   - **Check:** The property you clicked Save on is now in your saved list (visible in UI or in the backend/Firestore for your user).
   - If you had other items in `localStorage.savedProperties` before sign-up, **check:** They are migrated to your account (e.g. visible in “Saved” or in the backend).

8. **Session cleanup**
   - **Check:** Onboarding session keys in `sessionStorage` are cleared or marked converted (so a refresh doesn’t treat you as anonymous again).

---

### Edge cases to test

| Scenario | What to do | What to check |
|----------|------------|----------------|
| **Already logged in** | Log in first, then go through Profiling → Tenant → Search. Click Save. | No sign-up modal; property saves normally to your account. |
| **Search backend down** | Turn off the search backend (or use a URL that fails). Enter demo as Tenant and run a search. | If mock fallback is implemented: results still appear (mock). If not: graceful error and no crash. |
| **Direct URL to /search** | Open `/search?onboarding=tenant` (or equivalent) in incognito without going through Profiling. Click Save. | Anonymous session may be created on first interaction; Save still shows sign-up modal when not logged in. |
| **Modal dismissed multiple times** | Open modal → dismiss → Save again → dismiss again. | Modal can reappear each time; no broken state. |
| **Sign-up fails (e.g. network error)** | Trigger sign-up but cause a failure (e.g. disconnect network). | User sees an error; they can retry or dismiss; pending save is not lost (e.g. still in session or re-triggered on next Save). |

---

### Quick smoke test (minimal path)

If you only have a few minutes:

1. Incognito → Profiling: Tenant → Search.
2. Run any search → see results.
3. Click Save on one result → sign-up modal appears.
4. Complete sign-up → confirmation and property in saved list.

---

### Optional: automated tests

Once the intercept and modal are in place, you can add:

- **Unit:** “When in demo mode and not authenticated, clicking Save opens SignUpModal and does not call toggleSaveProperty.”
- **Integration:** “When user completes OAuth after opening modal from Save, migration runs and the property appears in the user’s saved list.”

Use your existing stack (e.g. Jest + React Testing Library) and mock auth + onboarding session.

---

## Landlord & Agent (same demos)

| Feature | Location / notes | Pivotal trigger (sign-up prompt) |
|--------|------------------|-----------------------------------|
| **Add property** | `PropertySetup` (steps) → `PropertyPreview`; `propertyService.createProperty`; Firebase Storage for photos/documents | **Publish property** / **Save and Preview Property** |
| **Publish / save listing** | `PropertyPreview` → `onPublishProperty`; images/documents upload then create property | **Publish Property** / **Save listing** |
| **Contracts** | `ContractsPage.tsx`, `SendContractModal`, `contractService` (Firestore `contracts`); DocuSign; contract sync to tenant app | **Send contract** |
| **Tenant management** | `TenantDetails`, add tenant, invite tenant, referencing status, referee/guarantor responses tab | **Add tenant** / **Invite tenant** (optional) |
| **Document compliance** | `DocumentManagement.tsx` — Gas Safety, EPC, Insurance, Tenancy Agreement; compliance reminders | **Upload document** / **Save compliance** (optional) |
| **Property details & photos** | `PropertyDetails`, `ImagesAndNotesSelection`, document management per property | Part of add-property flow |

---

## Homeowner

| Feature | Location / notes | Pivotal trigger (sign-up prompt) |
|--------|------------------|-----------------------------------|
| **Maintenance management** | `MaintenanceManagement.tsx`, `MaintenanceTaskFormModal`, `MaintenanceTemplatesBrowser`; tasks, categories, due dates, vendors | **Save task** / **Create maintenance task** |
| **Documentation hub** | `DocumentationHub.tsx`, `DocumentUploadFormModal`; warranties, manuals, receipts, permits, insurance, improvements | **Upload document** |
| **Home value** | `HomeValue.tsx` — estimated value, equity, appreciation (mock data; can hook to API later) | **Save estimate** / **Track my home** (optional) |
| **Vendor search** | `VendorSearch.tsx` — search by category (e.g. plumber, electrician), postcode, place results | **Save vendor** / **Add to my list** (optional) |
| **Projects** | `Projects.tsx` — home improvement projects | **Save project** (optional) |
| **Communication hub** | `CommunicationHub.tsx` — messages (e.g. with contractors) | Optional |
| **DIY guides** | `DIYGuideViewer.tsx`, `diyGuides` — guides by category | Optional: "Save guide" |

---

# Open decisions (to flesh out together)

1. **Profiling:** Final wording for the four options (Tenant / Landlord / Agent / Homeowner).
2. **Engagement:** Which exact screens to include in each demo (e.g. tenant: one referencing step + one AI search; landlord/agent: property setup → preview → publish; homeowner: maintenance list + one "add task" or documentation upload).
3. **Triggers:** Confirm pivotal action per demo (table above is the proposed set from repo).
4. **Mascot:** Name, visual, and exact placement on each page (guide through process; still being worked on).
5. **Copy:** Final headline and CTA for welcome, soft prompt, and confirmation.

---

*Next step: Review this page-by-page breakdown and the "Features we can demo" table, adjust order or scope, then lock open decisions. Implementation can follow once the flow is agreed.*