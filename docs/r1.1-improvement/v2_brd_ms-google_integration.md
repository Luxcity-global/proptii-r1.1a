## Proptii v2.0 — BRD for Microsoft 365 & Google Workspace Integration

**Objective:** Turn Proptii into a first-class citizen inside both Microsoft 365 and Google Workspace, using deep integrations to 1) materially improve tenant/landlord outcomes and 2) unlock new distribution and monetisation routes via the Microsoft and Google ecosystems.

**Scope:** This BRD covers the functional and non-functional requirements for:
- Integrating with **Microsoft 365** (Azure AD B2C, Microsoft Graph, Outlook, Teams, OneDrive/SharePoint, Excel).
- Integrating with **Google Workspace** (Google identity, Gmail, Calendar, Drive, Sheets).
- Packaging Proptii to be “marketplace-ready” in both ecosystems over time.

It does **not** cover full marketplace listing checklists or legal/compliance processes in detail; those will be captured in separate operational runbooks.

---

## 1. Brutally Honest Baseline

- **Today, Proptii is already biased to Microsoft:**
  - Frontend uses **Azure AD B2C** and **MSAL** for auth (`msalConfig`, `AuthContext`, `SecurityPolicyService`).
  - Backend has an **AzureUsersService** that calls **Microsoft Graph** to pull users from Azure AD B2C.
  - Landlord UI already calls `/api/azure-users` to search/select existing B2C users and map them to tenants.
- **Google integration is present but thin:**
  - Backend has a **SheetsService** that appends rows to a single Google Sheet using `googleapis`.
  - No first-class “workspace app” experience inside Gmail, Drive, or Calendar.
- **Marketplace presence:** zero. There are no Office/Teams/Outlook add-in manifests or Google Workspace add-on manifests. Distribution is currently “direct web app only”.

Conclusion: we have credible **integration plumbing**, but **no coherent cross-suite product experience** and **no marketplace-ready wrapper** yet.

---

## 2. Product Vision for MS + Google Integration

### 2.1 North Star

Proptii should feel like a **native extension of the tools landlords and agents already live in**:

- In **Outlook / Gmail**: view, respond to, and track Proptii viewing requests, referencing steps, and contracts without leaving the inbox.
- In **Teams / Google Chat (later)**: discuss tenants, properties, and deals with Proptii entities and actions inline.
- In **Calendar (both)**: automatically maintain accurate viewing schedules, deadlines, and key tenancy dates.
- In **OneDrive/SharePoint / Drive**: auto-organise contracts and referencing documents under the right property/tenant.
- In **Excel / Sheets**: export, slice, and refresh operational views of portfolios, arrears, and pipeline with one click.

The integrations must:
- **Reduce cognitive load** (fewer manual copy/paste workflows).
- **Shorten cycle times** (search → viewing → reference → contract).
- **Increase data quality** (fewer manual errors, single source of truth).

---

## 3. Functional Requirements — Cross-Cutting

### 3.1 Identity & Authorisation

- **FR-1: Support per-tenant connection to Microsoft 365 and/or Google Workspace**
  - Each landlord/agency account can:
    - Connect **Microsoft 365 tenant** (admin consent) for organisation-wide use.
    - Connect **Google Workspace domain** (admin consent) for organisation-wide use.
  - Proptii must support:
    - “Org-connected” mode (all users of that org inherit the integration).
    - “Individual-connected” mode (single user authorises their own mailbox/Drive/Calendar).

- **FR-2: Clear permissions and scopes**
  - For each ecosystem we must define minimal scopes:
    - Microsoft:
      - `User.Read`, `User.ReadBasic.All`, `User.Read.All` (depending on B2C vs Entra setup).
      - Mail read/send for specific folders or labels (where possible).
      - Calendar read/write for events tagged as Proptii (viewings, deadlines).
      - Files read/write for a dedicated Proptii library/folder.
    - Google:
      - Gmail read/send for specific labels.
      - Calendar read/write for events with Proptii metadata.
      - Drive read/write for a dedicated Proptii folder.
      - Sheets read/write for specific spreadsheets.
  - Scopes must be **transparent in UI** with plain-English explanations (what we read, what we write, why).

- **FR-3: Token lifecycle and revocation**
  - Store refresh tokens securely and handle expiry gracefully:
    - On token failure, prompt reconnect with a clear message.
  - Detect when admin revokes app in Azure/Google and:
    - Stop background jobs.
    - Display clear status in Proptii (“Integration disconnected by your admin”).

### 3.2 Auditability & Governance

- **FR-4: Integration activity log**
  - For each organisation and user, record:
    - When a connector was authorised/revoked.
    - Key actions performed via integration (e.g. “Created viewing event in Outlook for Tenant X / Property Y”).
  - Provide a basic audit view in the landlord/agent dashboard.

- **FR-5: Granular on/off toggles**
  - Per-organisation, allow enabling/disabling:
    - Inbox sync.
    - Calendar sync.
    - Document sync.
    - User directory sync.

---

## 4. Microsoft 365 — Functional Requirements

### 4.1 User Directory & Identity

- **FR-M1: Azure AD / B2C user sync**
  - Use existing **AzureUsersService** to:
    - Fetch and search users from Azure AD B2C / Entra ID.
    - Map them to Proptii tenant/landlord records.
  - In UI:
    - Allow “Select from directory” flows for:
      - Assigning tenants to properties.
      - Inviting agents/landlords from the same org.

- **FR-M2: Unified identity mapping**
  - For each Proptii user/tenant:
    - Store:
      - Azure object ID.
      - Primary UPN.
      - Primary email / alternate emails.
  - Resolve conflicts where the same person appears with multiple identities (B2C local vs AAD vs social).

### 4.2 Outlook Integration (Email)

- **FR-M3: Email threading for deals**
  - When Proptii sends viewing/referencing/contract emails:
    - Use message IDs/references so replies stay in consistent threads.
  - Optionally apply a **“Proptii” category/label** in Outlook to those conversations.

- **FR-M4: Light-weight Outlook add-in (phase 2)**
  - In Outlook (web/desktop), provide a Proptii add-in pane that:
    - Recognises Proptii-generated emails and shows related entity context:
      - Property, tenant, agent, current stage (viewing, referencing, contract).
    - Allows quick actions:
      - Mark viewing as confirmed/cancelled.
      - Trigger “send reminder” or “reschedule suggestion”.

### 4.3 Teams Integration (optional later phase)

- **FR-M5: Teams notifications**
  - Publish teams messages to a chosen channel when:
    - A high-value tenant application is received.
    - A contract is signed.
    - A viewing is cancelled/no-showed.

- **FR-M6: Adaptive cards for key events (stretch)**
  - For selected events, post Teams adaptive cards with:
    - Core context (tenant, property, date/time, status).
    - Buttons for simple actions (confirm viewing, request more info).

### 4.4 Calendar Integration

- **FR-M7: Viewing and deadline sync**
  - For each landlord/agent:
    - Optionally choose a primary **Outlook calendar**.
    - Proptii will:
      - Create events for property viewings.
      - Update/cancel those events when schedules change in Proptii.
      - Create key “milestone” events (reference deadlines, contract-signing deadlines, move-in dates).
  - Events should:
    - Include deep links back to the relevant Proptii entities.
    - Be clearly labelled (e.g. `[Proptii] Viewing — 123 High Street, Tenant: Jane Doe`).

### 4.5 OneDrive/SharePoint & Excel

- **FR-M8: Contract and document storage**
  - Provide an option per org:
    - Store Proptii-generated contracts and reference packs in **SharePoint/OneDrive** instead of (or in addition to) Proptii’s own storage.
  - Use a consistent folder convention (e.g. `/Proptii/{LandlordName or Org}/{PropertyAddress}/{TenancyId}/`).

- **FR-M9: Excel operational exports**
  - Allow exporting key datasets (portfolio overview, arrears, pipeline, referencing queue) as:
    - Downloadable `.xlsx` files.
    - Or, in later phase, a “live refresh” Excel connector using Microsoft Graph to query Proptii APIs.

---

## 5. Google Workspace — Functional Requirements

### 5.1 Identity & Directory

- **FR-G1: Google identity support**
  - Allow landlords/agents to:
    - Sign in with Google (where this doesn’t conflict with existing Azure B2C strategy).
    - Or at least **connect** their Google account for workspace features (even if primary auth remains Azure B2C).

- **FR-G2: Basic Google Directory sync (optional)**
  - Where permitted, read the Workspace directory to:
    - Suggest collaborators/agents when inviting team members.

### 5.2 Gmail Integration

- **FR-G3: Threaded communications**
  - Same behaviour as Outlook:
    - Thread Proptii-generated emails cleanly.
    - Apply a `Proptii` label for discoverability.

- **FR-G4: Gmail add-on (phase 2)**
  - Provide a Gmail add-on that:
    - Shows Proptii context for recognised emails.
    - Offers simple actions:
      - Mark viewing as confirmed/cancelled.
      - Log notes back to the Proptii timeline.

### 5.3 Calendar Integration

- **FR-G5: Google Calendar sync**
  - Mirror **FR-M7** but for Google Calendar:
    - Create/update/cancel viewing events.
    - Add key tenancy milestones.
  - Respect multiple calendar selection and timezone handling.

### 5.4 Drive & Docs

- **FR-G6: Document storage in Drive**
  - Allow organisations or individuals to connect a **Google Drive folder**:
    - Store generated contracts, reference docs, and evidence in that folder structure.
  - Mirror the same semantic folder organisation as for OneDrive/SharePoint.

### 5.5 Sheets

- **FR-G7: First-class Google Sheets exports**
  - Expand current **SheetsService** usage:
    - Support templated spreadsheets for:
      - Portfolio dashboards.
      - Viewing schedule boards.
      - Referencing and pipeline tracking.
    - Allow users to choose:
      - Target sheet (by ID).
      - Update mode (append vs overwrite range).

- **FR-G8: Optional Sheets-powered workflows (later)**
  - Enable “control from Sheets” workflows:
    - Changes in certain ranges (e.g. status columns) can push updates back to Proptii via webhooks.

---

## 6. Marketplace & Distribution Requirements

### 6.1 Microsoft AppSource / Teams Store Readiness

- **FR-D1: App registration and branding**
  - Create a canonical Azure app registration for Proptii marketplace presence with:
    - Marketplace-approved name, description, and icons.
    - Clear permission descriptions matching FR-2 scopes.

- **FR-D2: Office/Outlook/Teams manifest**
  - Define one or more manifests that:
    - Declare the Proptii add-in / app.
    - Target Outlook web/desktop and/or Teams with the minimal initial surface (pane showing context + actions).

- **FR-D3: Listing positioning**
  - Describe Proptii clearly for Microsoft marketplaces:
    - Primary value props for agents/landlords.
    - Screenshots or flows showing Outlook/Teams integration.

### 6.2 Google Workspace Marketplace Readiness

- **FR-D4: Google Cloud project and OAuth consent**
  - Configure:
    - External app verification.
    - Workspace Marketplace listing linkage.
    - Explicit scopes with justifications in the consent screen.

- **FR-D5: Workspace add-on manifest**
  - Define a GWA add-on manifest that:
    - Targets Gmail (initially), later Calendar or Drive.
    - Provides a context card with Proptii entity info and simple actions.

### 6.3 Commercial & GTM

- **FR-D6: Licensing model alignment**
  - Define how marketplace-installed Proptii instances map to Proptii pricing:
    - Per-seat vs per-organisation vs usage-based.
    - Free tier constraints for marketplace installs (if any).

- **FR-D7: Telemetry for marketplace attribution**
  - Track which orgs/users originate from:
    - Microsoft marketplace.
    - Google Workspace marketplace.
  - Allow separate measurement of:
    - Lead volume.
    - Conversion.
    - Retention for marketplace-sourced customers.

---

## 7. Non-Functional Requirements

### 7.1 Reliability & Performance

- **NFR-1:** Integration failures (API rate limits, auth errors, outages) must:
  - Not block core Proptii flows (search, referencing, contracts).
  - Surface as non-disruptive warnings and retry background jobs where safe.

- **NFR-2:** All cross-suite calls must be:
  - Logged with correlation IDs.
  - Measurable in latency/error dashboards.

### 7.2 Security & Compliance

- **NFR-3:** Tokens and secrets must be stored in secure key vaults (Azure Key Vault or equivalent).
- **NFR-4:** Provide documentation for:
  - What data flows into/out of Microsoft 365 and Google Workspace.
  - How long data is retained.
  - How revocation works.

### 7.3 UX & Change Management

- **NFR-5:** Provide **clear, non-technical copy** explaining:
  - What happens when you click “Connect Microsoft 365” or “Connect Google Workspace”.
  - How to disconnect and what that means for data already synced.

- **NFR-6:** Provide in-app “quick start” recipes:
  - “Sync viewings to my calendar.”
  - “Store all contracts in my organisation’s Drive/SharePoint.”
  - “Pick tenants from my corporate directory.”

---

## 8. Phasing and Trade-offs (High-Level)

### Phase 1 — Deepen Existing Foundations (Low Risk, High Value)

- Harden:
  - Azure AD B2C / MSAL flows and Azure user search.
  - Google Sheets integration (reliability, configurability).
- Ship:
  - Calendar sync (Microsoft + Google) for viewings and key tenancy milestones.
  - Directory-based tenant selection flows.

### Phase 2 — Inbox & Document Workflows (Medium Risk, High UX Impact)

- Add:
  - Basic Outlook and Gmail add-ins (context panel + simple actions).
  - Drive / OneDrive document routing with predictable folder structures.

### Phase 3 — Marketplace Wrappers (Higher Overhead, Distribution Play)

- Package:
  - Microsoft AppSource / Teams Store app with limited but polished feature set.
  - Google Workspace add-on with tight Gmail + Calendar integration.
- Align:
  - Pricing and onboarding for marketplace buyers.

---

## 9. Success Criteria

- **Product usage:**
  - X% of active landlords/agents have at least one integration (MS or Google) connected.
  - Y% of viewings are scheduled via synced calendars.
  - Z% of contracts/reference docs are auto-stored in external storage (Drive/SharePoint/OneDrive).

- **Operational outcomes:**
  - Measurable reduction in:
    - No-show rate for viewings.
    - Time from application to signed contract.
  - Reduced manual duplicate data entry across tools.

- **Distribution:**
  - At least N qualified leads and M paying customers attributable to:
    - Microsoft marketplace.
    - Google Workspace marketplace.

