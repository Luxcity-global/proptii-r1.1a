### Proptii – Value-First Onboarding: Implementation Summary

This document summarizes the **current implementation** of the value-first / delayed-registration onboarding, so another agent can continue from here without re-reading our whole chat.

---

## 1. Overall onboarding strategy

**Goal:** Show value **before** asking users to sign up, and only trigger registration after an “aha” moment, with a soft, fast sign-up experience.

**High-level flow:**

> **Discovery → Profiling → Engagement (demo) → Sign Up**

### Discovery (Phase 1)

- **1.1 Welcome to Proptii**
  - First paint; hero “Welcome to Proptii” + CTA like “Get started”.
  - Starts anonymous session (no login).

- **1.2 “How do you want to use Proptii?”**
  - Intent question (chips):  
    `Find a place to rent / Manage my property / Get referenced / Sign contracts / Search with AI / Other`
  - Answer stored in onboarding session for analytics.

- **1.3 “How did you hear about Proptii?”**
  - Attribution question (chips):  
    `Google / Friend or referral / Social media / Ad / Other`
  - Stored for analytics.

### Profiling (Phase 2)

**Goal:** Decide which demo to show.

- **2.1 “Who are you?”**
  - Options: **Tenant / Landlord / Agent / Homeowner**.
  - This determines which demo (Engagement) we send them to.

### Engagement (Phase 3)

**Goal:** Give real value **without login**.

- **Tenant demo (implemented):** AI property search on `/search`.
  - Natural language search (via search backend) → property cards.
  - Guide bubble points at **Save property** (heart icon).
  - Clicking Save triggers sign-up modal (for users not signed in).

- **Planned but not yet built:**
  - **Landlord/Agent:** Add property, preview & publish listing, send contracts, manage tenants, docs.
  - **Homeowner:** Maintenance tasks, documentation hub, home value, vendor search.

### Sign Up (Phase 4)

**Goal:** Convert after value, with **soft** registration.

- Triggered at **pivotal actions**:
  - Tenant: Save property / Apply / Save search.
  - Landlord/Agent: Publish property / Save listing / Send contract.
  - Homeowner: Save task / Upload document.
- Shows a modal:  
  - **Title** – e.g. “Want to save this property?”  
  - **Highlight** – “Sign up in 10 seconds” (blue, underlined)  
  - **Reassurance** – “Don’t worry — you won’t have to go through the entire search process again.”  
  - **Primary CTA** – “Sign up with email” (orange)  
  - **Secondary CTA** – “Social Media sign up” (white with grey border)

After sign-up we **migrate** the anonymous/demo data (e.g. properties they tried to save) into their account.

---

## 2. Onboarding session utilities

**File:** `src/utils/onboardingSession.ts`

Manages anonymous onboarding/demo session in `sessionStorage`:

- Keys:
  - `onboarding_anonymousId` – temporary anonymous ID.
  - `onboarding_userGroup` – `'tenant' | 'landlord' | 'agent' | 'homeowner'`.
  - `onboarding_pendingProperty` – property to save after sign-up.
  - `onboarding_guideDismissed` – whether guide bubble is dismissed.
  - `onboarding_completed` – Discovery + Profiling completed on homepage.
  - `onboarding_discovery_<key>` – e.g. `howDoYouWantToUse`, `howDidYouFindUs`.

- Key functions:
  - `getOrCreateAnonymousId()`
  - `setOnboardingUserGroup(group)` / `getOnboardingUserGroup()`
  - `setPendingProperty(property)` / `consumePendingProperty()`
  - `setGuideDismissed()` / `isGuideDismissed()`
  - `setOnboardingCompleted()` / `hasOnboardingCompleted()`
  - `setDiscoveryAnswer(key, value)` / `getDiscoveryAnswer(key)`
  - `clearOnboardingSession()`

These are used by the homepage onboarding flow and the search demo.

---

## 3. Homepage as onboarding (Discovery + Profiling)

**Files:**
- `src/components/onboarding/OnboardingFlow.tsx`
- `src/pages/Home.tsx`

### Trigger

In `Home.tsx`:

- We use `useAuth()` from `src/context/AuthContext.tsx`.
- Compute:
  - `const isAuthenticated = !!user;`
  - `const showOnboarding = !isAuthenticated && !hasOnboardingCompleted();`
- If `showOnboarding` is `true`, `Home` returns `<OnboardingFlow />` (no Navbar/Footer).  
  Otherwise it returns the existing homepage (hero + search + services, etc.).

### OnboardingFlow steps

`OnboardingFlow` is a 4-step flow:

1. **Welcome**  
   - “Welcome to Proptii” + short description.  
   - Button: **Get started** → `getOrCreateAnonymousId()` and move to step 2.

2. **Discovery 1 – “How do you want to use Proptii?”**  
   - Options:
     - Find a place to rent
     - Manage my property
     - Get referenced
     - Sign contracts
     - Search with AI
     - Other
   - On click:
     - `setDiscoveryAnswer('howDoYouWantToUse', optionId)`  
     - Step → **How did you hear about Proptii?**

3. **Discovery 2 – “How did you hear about Proptii?”**  
   - Options:
     - Google / Friend or referral / Social media / Ad / Other
   - On click:
     - `setDiscoveryAnswer('howDidYouFindUs', optionId)`  
     - Step → **Who are you?**

4. **Profiling – “Who are you?”**  
   - Options (chips/cards):
     - Tenant
     - Landlord
     - Agent
     - Homeowner
   - On click:
     - `setOnboardingUserGroup(group)`
     - `setOnboardingCompleted()`
     - Navigate to the appropriate **demo URL**:
       - Tenant → `/search?q=2+bed+flats+in+Leeds`
       - Landlord → `/landlord-demo`
       - Agent → `/landlord-demo`
       - Homeowner → `/homeowner`
   - Also includes:
     - **“Just show me around”** – sets group to `tenant`, marks completed, navigates to `/search`.

Once onboarding is completed for the session, future visits to `/` show the **normal homepage** rather than the OnboardingFlow.

---

## 4. Tenant AI search demo (Engagement)

**Main idea:**  
For unauthenticated users on `/search`, show:

- Real or sample property results.  
- A guide bubble pointing to **Save property**.  
- On Save, show **sign-up prompt** instead of saving silently.

### Search backend

**File:** `src/hooks/useSearchBackend.ts`

- Talks to search backend (`VITE_SEARCH_BACKEND_URL`, default `http://localhost:3001`).
- If OnTheMarket scrape fails, falls back to “internet” scrape.
- On network or server error, sets a user-friendly `error` string and clears `results`.

### Saved properties

**File:** `src/contexts/SavedPropertiesContext.tsx`

- Loads and persists `savedProperties` in **localStorage**.
- On mount:
  - Calls `consumePendingProperty()`:
    - If there is a pending property (set before sign-up), merges it into the saved list.

### Demo guide bubble

**File:** `src/components/onboarding/DemoGuideBubble.tsx`

- Props:
  - `message: string`
  - `targetSelector: string`
  - `highlightTarget?: boolean`
  - `onDismiss?: () => void`
  - `hidden?: boolean`
- Behaviour:
  - Positions itself near the target (found via `querySelector` + `getBoundingClientRect`).
  - Highlights the target with an outline + pulse via a CSS class.

We mark the **first Save button** on the first property card with:

- `data-demo-save-target="first"`

and the guide bubble uses:

- `targetSelector="[data-demo-save-target='first']"`.

### Sign-up modal

**File:** `src/components/onboarding/SignUpPromptModal.tsx`

The modal that appears when the user tries to Save while not signed in:

- Icon at top (house icon).
- Title (configurable) – e.g. **“Want to save this property?”**.
- Highlighted line – **“Sign up in 10 seconds”** (blue, underlined).
- Reassurance line – default:  
  “Don’t worry — you won’t have to go through the entire search process again.”
- Buttons:
  - Primary – **“Sign up with email”** → default navigates to `/register` with `{ state: { from: 'demo' } }`.
  - Secondary – **“Social Media sign up”** → `/register` with `{ state: { from: 'demo', tab: 'social' } }`.
  - “Maybe later” – closes the modal.

### SearchResults behaviour

**File:** `src/pages/SearchResults.tsx`

- Gets auth state via `useAuth()`:
  - `const showDemoForNewUsers = !isAuthenticated;`
- **Results & error flow:**
  - When the backend works: show **actual search results**.
  - When the backend fails:
    - If the user **is not signed in**, we show **demo fallback results**:
      - `MOCK_SEARCH_RESULTS_FOR_DEMO` – a small array of 2–3 sample Leeds properties.
      - Banner: “Sample results. The search service is temporarily unavailable. You can still try saving a property below to get started.”
    - If the user **is signed in**, we show the error view (“Search Error”, Try Again / New Search).
  - A computed `displayResults` is used for UI:
    - `displayResults = useDemoFallbackResults ? MOCK_SEARCH_RESULTS_FOR_DEMO : results`.

- **Save intercept:**
  - `handleSaveProperty(property)`:
    - If `showDemoForNewUsers` (`!isAuthenticated`):
      - `setPendingProperty(property);`
      - `setShowSignUpModal(true);`
    - Else: normal `toggleSaveProperty(property)` with toast.

- **Guide bubble visibility:**
  - Rendered when:
    - `showDemoForNewUsers && displayResults.length > 0 && !isGuideDismissed()`.

- **Sign-up modal:**
  - `<SignUpPromptModal isOpen={showSignUpModal} ... />`.
  - After navigating to `/register` and completing registration, `SavedPropertiesProvider` will merge the pending property (via `consumePendingProperty()`).

---

## 5. Current status by phase

- **Discovery (Welcome + 2 questions)** – **Built**
  - Implemented as `OnboardingFlow` on the homepage for unauthenticated users.
- **Profiling (user group)** – **Built**
  - Part of `OnboardingFlow` step 4; sets userGroup and redirects to appropriate demo.
- **Engagement (Tenant AI search demo)** – **Built**
  - `/search` for unauthenticated users:
    - Real or sample property results.
    - Guide bubble pointing at Save.
    - Save intercept → sign-up modal.
- **Sign Up (soft prompt modal)** – **Built**
  - `SignUpPromptModal` + pending property migration when SavedPropertiesContext mounts.
- **Other demos (Landlord/Agent/Homeowner)** – **Not built yet**
  - Only the table + guides in `Value first onboarding strategy.md` describe what to demo and where to trigger.
- **Backend persistence of saved properties by user ID** – **Not built yet**
  - Currently only localStorage + in-memory context.

---

## 6. Next steps for a new agent

If you’re picking this up:

1. **Extend Engagement demos**:
   - Landlord/Agent demo: use `landlord_agent` dashboard components to create a value-first flow (add property → preview/publish → send contract).
   - Homeowner demo: use homeowner dashboard (maintenance, documents, home value) for a similar guided demo.
   - For each demo: use `DemoGuideBubble` and the same `SignUpPromptModal` for unauthenticated users at pivotal actions.

2. **Persist saved data server-side**:
   - Introduce a backend model for saved properties tied to authenticated users.
   - On migration after sign-up, write pending and local saved properties to that store.

3. **Refine copy & mascot**:
   - Polish wording on all onboarding steps and modals.
   - Integrate mascot visuals, if/when available, into `OnboardingFlow` and demo UIs.

4. **Analytics**:
   - Wire `setDiscoveryAnswer` and onboarding events into whatever analytics stack you use (e.g. Segment, GA, custom).

This document, plus the existing `docs/Value first onboarding strategy.md`, should give you full context to continue the value-first onboarding work without revisiting the original chat.

