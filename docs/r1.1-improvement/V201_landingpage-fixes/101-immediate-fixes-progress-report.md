# V201 Immediate Fixes – Progress Report

**Date:** 2026-02-17  
**Scope:** `01-landingpage-immediate-fixes.md` (Routes & 404s, Hero copy, and related landing changes)  
**Parent plan:** `01-landingpage-immediate-fixes.md`

---

## 1. Summary

- **Home page variant created**: `HomeVariant` in `src/pages/HomeVariant.tsx` is a functional clone of `Home`, wired for A/B testing via `/home-v2` and `/?variant=v2`.
- **Legacy routes fixed**: `/about`, `/contract`, `/booking`, `/book-viewing` now redirect to their canonical routes; unknown paths still hit the 404 page.
- **Pricing page added**: `src/pages/Pricing.tsx` exists and is routed at `/pricing`, with 3‑month free trial messaging and role‑based CTAs.
- **Router updated for A/B**: `HomeEntry` in `src/App.tsx` chooses between `Home` and `HomeVariant` based on a `variant=v2` query param.
- **Hero copy now live on variant**: `HomeVariant` uses the succinct headline and concise subtext while `Home` remains unchanged as the control.
- **Task 2.3 CTA reframing now live on variant**: Tenant/Agent pills are now explicit CTAs: “Search Properties Free” and “List & Manage Properties”.
- **Task 2.3 visual uplift complete**: CTA pills now use a glassmorphic row module with darker 3D audience mini-tags (“Tenants”, “Agents”).

---

## 2. Workstream Status (from Immediate Fixes Plan)

### 2.1 Workstream 1 – Routes & 404s

- **Task 1.1 – Add redirect routes for legacy/marketing URLs**
  - **File:** `src/App.tsx`
  - **Status:** **Done**
  - **Details:**
    - `/about` → `/about-us`
    - `/contract` → `/contracts`
    - `/booking` → `/bookviewing`
    - `/book-viewing` → `/bookviewing`
    - `/pricing` → `/pricing` (now that a Pricing page exists)

- **Task 1.2 – Create a simple Pricing page**
  - **File:** `src/pages/Pricing.tsx`
  - **Route:** `/pricing`
  - **Status:** **Done**
  - **Details:**
    - Reuses standard layout (`Navbar`, `Footer`).
    - Headline: “Simple, transparent pricing.”
    - Body explains: 3 months free, no card, tenants’ core search free forever; landlords/agents get full access during trial.
    - CTAs:
      - **Join as a Tenant / Buyer** → `/register?role=tenant`
      - **Join as a Landlord / Agent** → `/register?role=agent`

- **Task 1.3 – Ensure catch-all 404 still works**
  - **File:** `src/App.tsx`
  - **Status:** **Done**
  - **Details:**
    - `<Route path="*" element={<NotFoundPage />} />` remains the last route in the tree.
    - Because the legacy redirect routes are defined above this, they are matched first; unknown paths still display the 404 page.

### 2.2 Workstream 2 – Hero Copy (Home / HomeVariant)

- **Task 2.1 – Replace hero headline**
  - **Target for experimentation:** `src/pages/HomeVariant.tsx` (A/B variant, not the original `Home` yet).
  - **Status:** **Done (variant-first)**
  - **Implemented copy:**
    - “Search. Verify. Move in.”
    - “One platform, zero hassle.”

- **Task 2.2 – Replace hero subhead**
  - **Target for experimentation:** `HomeVariant` only.
  - **Status:** **Done (variant-first)**
  - **Implemented copy (succinct, <=20 words):**
    - “Search properties, book viewings, complete referencing and sign contracts in one place. Free for tenants.”

- **Task 2.3 – Optional Tenant/Agent CTA reframing**
  - **Status:** **Done (variant-first)**
  - **Implemented behavior in `HomeVariant`:**
    - CTA 1: **Search Properties Free** → smoothly scrolls to the `SearchInput` area and focuses the search textarea.
    - CTA 2: **List & Manage Properties**:
      - If authenticated: navigates to `/Agent`.
      - If unauthenticated: navigates to `/register?role=agent&redirect=%2FAgent`.
  - **Why this solution (viable + desirable):**
    - Reduces ambiguity versus the old Tenant/Agent mode toggle by making each action explicit.
    - Keeps tenant path low-friction and immediate (focuses core search action).
    - Supports agent intent without forcing login popups first, while still preserving destination via `redirect`.
    - Keeps changes isolated to `HomeVariant` for safe A/B experimentation.
  - **Styling implementation notes:**
    - CTA is now a two-row module with row-level click targets for larger touch area.
    - Left audience chips (“Tenants”, “Agents”) use darker gradients + subtle inset highlights + shadow for a soft 3D effect.
    - Right action segments use glassmorphic styling (`bg-white/12`, blur, light border, inset highlight).
    - Added keyboard-visible focus rings and subtle hover/active motion for accessibility and responsiveness.
  - **Pillbox redesign – full HeroToggle integration:**
    - The two-row stacked CTA has been replaced by a **horizontal pill toggle** faithfully adapted from `01-23-pillbox-redesign/components/hero-toggle.tsx`.
    - **Toggle pill:** Two side-by-side buttons inside a glass container (`backdrop-filter: blur(24px) saturate(180%)`), with an outer glow that shifts color by active mode. Search mode uses Proptii orange gradient (`#E8713A → #C45520`); List mode uses warm beige gradient (`#F5E6CC → #DBC8A0` with dark text). Chevron rotates when dropdown is open; inactive button shows dimmed text. Shine overlay on active button.
    - **Contextual dropdown:** Glassmorphic dark panel (`rgba(15, 15, 20, 0.75)`, `blur(40px) saturate(200%)`), positioned centrally below the pill. Includes:
      - Top accent bar with mode-colored gradient.
      - Section header ("For Renters & Buyers" / "For Landlords & Agents") with Sparkles icon.
      - 4 menu items per mode with icons, labels, descriptions, hover highlights, and arrow indicators. Icons: Search, CalendarCheck, FileCheck, FileSignature (search mode); Building2, Users, BarChart3, Shield (list mode).
      - Footer CTA button ("Get Started Free" / "Start Listing Today") with hover effect.
    - **Menu item actions:** Search Properties → scrolls to SearchInput; Book Viewings → `/bookviewing`; Referencing → `/referencing`; Sign Contracts → `/contracts`. List items → auth-aware navigation to `/Agent` or agent registration.
    - **Preserved:** Hero background, heading, subtext, and SearchInput are unchanged. Click-outside closes dropdown. Keyboard focus rings on pill buttons.
    - **Responsive:** Pill buttons use `text-xs sm:text-sm` and tighter padding on mobile; dropdown uses `w-[calc(100vw-2rem)] sm:w-[420px]` for mobile compatibility.
    - **Follow-up (optional):** Individual menu item routes could be deepened (e.g. direct link to analytics dashboard when available).
  - **Pillbox positioning and naming:**
    - The hero CTA is now referred to as the **pillbox toggle** (horizontal pill with two segments and contextual dropdown).
    - **Fixed vertical position:** The pillbox no longer reflows with viewport; it is absolutely positioned within the hero content area: `top` is `5rem` (mobile) and `6rem` (desktop); vertical offset is `-translate-y-[192px]` so the pillbox sits higher relative to the hero text (cumulative adjustments: 96px + 48px + 36px + 60px). A spacer div (`h-36 md:h-40`) reserves space so the heading, subtext, and search bar start below the pillbox and do not move when the pillbox position is tuned.
    - Headline, subtext, and AI search bar layout/position are unchanged.
  - **Navbar – service links hidden on home-v2:**
    - When the variant is shown (`/home-v2` or `/?variant=v2`), the top navigation no longer shows **Book Viewing**, **Referencing**, or **Contracts** (these actions are available in the pillbox dropdown instead).
    - **Implementation:** `Navbar` accepts an optional prop `hideServiceLinks`. `HomeVariant` renders `<Navbar hideServiceLinks />`; all other pages use `<Navbar />` (default `hideServiceLinks={false}`). Both desktop and mobile menus hide the three links when the prop is true. Logo, Sign In / user dropdown, and any other nav items remain unchanged.

### 2.3 Workstreams 3–6 – Not Yet Started

- **Workstream 3 – Trial CTA section**
  - Status: **Done (variant-first)**.
  - Added on `HomeVariant` only: new section after the three feature cards and before FAQ. Headline "Start free. No credit card. No commitment."; body copy with 3 months free and tenant/landlord value prop; two CTAs (Join as Tenant / Buyer → `/register?role=tenant`, Join as Landlord / Agent → `/register?role=agent`); footer line with [price TBD]. High-contrast block using Proptii secondary `#002B49` and primary orange for the primary button.

- **Workstream 4 – Trust bar under hero**
  - Status: **Done (variant-first)**.
  - Added on `HomeVariant` only: narrow full-width strip directly below the hero section (above the services section). Text: "Searching across OnTheMarket, Rightmove, OpenRent, Rentola & more". Text only (no logos). Styled as semi-opaque dark bar (`bg-black/50`) with white text for readability.

- **Workstream 5 – Navbar**
  - Status: **Partially covered, pending Navbar updates.**
  - Pricing route exists (`/pricing`), but Navbar has not yet been updated to include a “Pricing” link or to address any “TenantAgent” labelling.

- **Workstream 6 – Footer**
  - Status: **Not started (planned).**
  - Footer currently has About, FAQ, Privacy, Terms, and Home links; Pricing has not yet been added and link alignment still needs a full audit against the plan.

---

## 3. A/B Testing Setup (Home vs HomeVariant)

- **Control:** `Home` in `src/pages/Home.tsx`
  - Bound to `/` via `HomeEntry` when **no** `variant` query param is present.
  - Currently retains the original hero copy (“Find Your Dream Home” + existing subhead).

- **Variant:** `HomeVariant` in `src/pages/HomeVariant.tsx`
  - Accessible directly at `/home-v2`.
  - Also rendered at `/` when `?variant=v2` is present, through the `HomeEntry` wrapper in `src/App.tsx`.
  - Currently differs from `Home` in hero messaging and CTA framing for A/B testing:
    - Succinct headline + concise subtext.
    - Reframed glass CTA module with audience mini-tags and clearer tenant/agent action hierarchy.

- **Routing logic (summary):**
  - `/` → `HomeEntry` → `Home` (default) or `HomeVariant` (when `variant=v2`).
  - `/home-v2` → `HomeVariant` explicitly.

---

## 4. Next Steps

1. **Navbar and footer alignment**
   - Add a “Pricing” link in `Navbar` and `Footer` pointing to `/pricing`.
   - Confirm all footer links resolve (Book Viewings, Referencing, Contracts, About, FAQ, Privacy, Terms, Contact, Pricing).

2. **Roll-out and A/B decision**
   - Use `HomeVariant` as the experimentation surface for hero/trust/trial changes.
   - Once metrics or qualitative feedback confirm the direction, consider promoting the variant to become the default `Home` implementation and updating the plan/report accordingly.

