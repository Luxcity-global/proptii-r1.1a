## GA4 Analytics Overview

### 1. Global setup

- **Environment**
  - Uses `VITE_GA_MEASUREMENT_ID` (e.g. `G-88HC0TG6JJ`) defined in root `.env` / deployment env.

- **Root HTML**
  - `index.html`: Adds GA4 `gtag.js` script and config with `send_page_view: false` so SPA routing controls page views.

### 2. Core analytics plumbing

- **`src/utils/analytics.ts`**
  - `trackPageView(path, title?)`: Sends GA4 `page_view` with `page_path`, `page_title`, `page_location`.
  - `trackEvent(name, params?)`: Sends custom GA4 events with arbitrary parameters.
  - `setUserIdentity(userId, anonymousId)`: Bridges app identity to GA4:
    - Sets GA4 `user_id` when `userId` is present (authenticated users).
    - Sets GA4 user properties:
      - `proptii_anonymous_id` – stable anonymous session ID from onboarding utilities.
      - `auth_state` – `'authenticated'` or `'anonymous'`.
  - `isAnalyticsEnabled()`: Returns `true` only when running in browser and `VITE_GA_MEASUREMENT_ID` is a non-empty string.

- **`src/components/analytics/AnalyticsProvider.tsx`**
  - Listens to React Router location changes (`useLocation()`).
  - On each change, builds `path = pathname + search` and calls `trackPageView(path)`.

- **`src/components/analytics/AuthAnalyticsBridge.tsx`**
  - Uses `useAuth()` to read `user` and `isAuthenticated`.
  - Uses `getOrCreateAnonymousId()` from `onboardingSession.ts` to ensure an anonymous ID exists.
  - On changes to `isAuthenticated` or `user.id`, calls `setUserIdentity(user?.id, anonymousId)` so GA4 sees:
    - Anonymous visitors: `auth_state = 'anonymous'`, `proptii_anonymous_id` set, no `user_id`.
    - Authenticated users: `auth_state = 'authenticated'`, `proptii_anonymous_id` set, `user_id` set.
  - Renders `null` (no UI impact).

- **`src/config/routerConfig.tsx`**
  - Wraps the entire app:
    - Before: route element was `<App />`.
    - Now: route element is `<AnalyticsProvider><App /></AnalyticsProvider>`, so all routes share the same analytics context.

- **`src/App.tsx`**
  - Inside `AuthProvider` / `MSALProviderWrapper` / other providers, adds:
    - `<AuthAnalyticsBridge />` once, so GA4 identity is always in sync with auth state.

### 3. Key GA4 events by flow

All events use `trackEvent` and are **no-ops if GA is disabled**, so they do not affect behavior.

- **Onboarding (`src/components/onboarding/OnboardingFlow.tsx`)**
  - `onboarding_start`
    - Trigger: User clicks **Get started** on the welcome step.
  - `onboarding_how_use_selected`
    - Trigger: User clicks **Continue** on “How do you want to use Proptii?”.
    - Params:
      - `options`: array of selected option IDs.
      - `other_text`: free-text for “Other” (if provided).
  - `onboarding_how_find_selected`
    - Trigger: User answers “How did you hear about Proptii?”.
    - Params:
      - `value`: selected option or `other:<text>`.
  - `onboarding_completed`
    - Trigger: User selects persona and is navigated to the relevant onboarding path.
    - Params:
      - `user_group`: `'tenant' | 'landlord' | 'agent' | 'homeowner'`.
      - `how_use`: array of use-case IDs.
      - `how_find`: selected discovery value.

- **Authentication**
  - **Login (`src/pages/Login.tsx`)**
    - `login_started`
      - Trigger: User clicks **Sign In with Microsoft**.
      - Params:
        - `redirect_to`: resolved post-login destination.
        - `has_redirect_param`: whether a `redirect` query param is present.
    - `login_success`
      - Trigger: `isAuthenticated` becomes true and the redirect effect runs.
      - Params:
        - `redirect_to`: actual redirect target.
  - **Registration (`src/pages/Register.tsx`)**
    - `registration_submitted`
      - Trigger: User submits the sign-up form and basic password validation passes.
      - Params:
        - `has_redirect_param`: whether a `redirect` query param is present.
    - `registration_success`
      - Trigger: `isAuthenticated` becomes true and the redirect effect runs.
      - Params:
        - `redirect_to`: target page after successful registration.

- **Book Viewing Flow (`src/pages/BookViewing.tsx`)**
  - `book_viewing_cta_clicked`
    - Trigger: User clicks the main **Get Started / Start booking viewings** call-to-action.
    - Params:
      - `is_authenticated`: current auth state.
      - `has_prefilled_property`: whether there is prefilled property data from search.
  - `book_viewing_request_submitted`
    - Trigger: Viewing request completes and the review modal is opened.
    - Params:
      - `has_prefilled_property`: whether the request came from prefilled data.
      - `user_id_present`: whether `user.id` is available.

- **Tenant dashboard (main shell & sections)**
  - **Main dashboard shell (`src/components/dashboard/Dashboard.tsx`)**
    - `tenant_dashboard_section_view`
      - Trigger: When the router path maps to a known dashboard section.
      - Params:
        - `section_id`: one of `dashboard`, `saved-searches`, `viewings`, `tenant-contracts`, `tenant-referencing`, `your-files`.
        - `path`: current `location.pathname`.
    - `tenant_dashboard_view`
      - Trigger: Fallback when no section match is found.
      - Params:
        - `path`: current `location.pathname`.
    - `tenant_dashboard_section_selected`
      - Trigger: User selects a section via sidebar / navigation.
      - Params:
        - `section_id`: selected section id.

  - **Dashboard home (`src/components/dashboard/sections/DashboardHome.tsx`)**
    - `tenant_dashboard_home_view`
      - Trigger: Dashboard home section mounts.
      - Params:
        - `user_id_present`: whether a user ID was resolved.
    - `tenant_dashboard_referencing_step_opened`
      - Trigger: User opens any referencing step card from “Tenant Insights”.
      - Params:
        - `step`: numeric step index.

  - **Saved properties (`src/components/dashboard/sections/SavedProperties-new.tsx`)**
    - `tenant_dashboard_saved_property_view`
      - Trigger: User opens saved property details modal.
      - Params:
        - `property_id`: saved property id.
        - `location`: property location string.
        - `source`: listing source (e.g. portal name).
    - `tenant_dashboard_saved_property_book_viewing`
      - Trigger: User clicks the “book viewing” button from a saved property card.
      - Params:
        - `property_id`: saved property id.
        - `has_agent_email`: whether an agent email is present.
    - `tenant_dashboard_saved_property_removed`
      - Trigger: User confirms removing a saved property.
      - Params:
        - `property_id`: removed property id.

- **Landlord / agent dashboard (`src/landlord_agent/src/components/Dashboard.tsx`)**
  - `landlord_dashboard_view`
    - Trigger: Landlord/agent dashboard mounts.
    - Params:
      - `total_properties`: number of properties in the current view.
      - `total_tenants`: number of tenants passed into the dashboard.

- **Landlord app – screen navigation and button clicks (`src/landlord_agent/`)**
  - `landlord_screen_navigation` – Trigger: User navigates to a screen. Params: `screen`, `from_screen`.
  - `landlord_nav_click` – Trigger: User clicks sidebar nav. Params: `section` (dashboard, properties, viewings, etc.).
  - `landlord_add_property_clicked` – Trigger: User clicks Add Property.
  - `landlord_add_tenant_clicked` – Trigger: User clicks Add Tenant. Params: `source` (clients_page, property_details, property_preview).
  - `landlord_property_viewed` – Trigger: User opens a property. Params: `property_address`.
  - `landlord_property_saved` – Trigger: PropertySetup form submitted. Params: `is_edit`.
  - `landlord_tenant_added` – Trigger: AddTenant form completed successfully.
  - `landlord_tenant_assigned` – Trigger: SelectExistingTenant assigns tenant. Params: `property_address`.
  - `landlord_invite_tenant_sent` – Trigger: Invite tenant email sent. Params: `property_address`.
  - `landlord_viewing_scheduled` – Trigger: Viewing request scheduled.
  - `landlord_viewing_declined` – Trigger: Viewing request declined.
  - `landlord_viewing_confirmed` – Trigger: Viewing confirmed.
  - `landlord_viewing_rescheduled` – Trigger: Viewing rescheduled.
  - `landlord_viewing_cancelled` – Trigger: Viewing cancelled.
  - `landlord_contract_sent` – Trigger: Contract sent. Params: `has_file`.
  - `landlord_properties_imported` – Trigger: Properties imported. Params: `count`.
  - `landlord_role_selected` – Trigger: Role selection (Landlord/Agent). Params: `role`.
  - `landlord_welcome_get_started` – Trigger: Welcome screen Get Started.
  - `landlord_onboarding_add_property` – Trigger: Onboarding Add Property.
  - `landlord_onboarding_go_to_dashboard` – Trigger: Onboarding Go to Dashboard.
  - `landlord_onboarding_setup_company` – Trigger: Onboarding Setup Company.
  - `landlord_vacancy_pre_marketing_approved` – Trigger: Vacancy pre-marketing approved. Params: `property_address`.

### 4. Behavior and safety guarantees

- If `VITE_GA_MEASUREMENT_ID` is **missing or empty**:
  - GA4 helpers (`trackPageView`, `trackEvent`, `setUserIdentity`) become safe no-ops.
  - The GA `<script>` still loads, but no events are sent from the app code.
  - Application behavior, routing, and UI are unchanged.

- If `VITE_GA_MEASUREMENT_ID` is **set**:
  - SPA page views and key flow events are sent to GA4.
  - Both anonymous session identity and authenticated `user_id` are exposed in GA4 for richer analysis.

