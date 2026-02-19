# 01 — Landing Page Immediate Fixes — Implementation Plan

**Scope:** Immediate (this week / next few days)  
**Parent strategy:** [v2_landing_page_conversion_strategy.md](../v2_landing_page_conversion_strategy.md)  
**Folder:** `docs/r1.1-improvement/V201_landingpage-fixes/`

---

## 1. Objectives and Success Criteria

### 1.1 Goals

- **Eliminate 404s** so every linked URL resolves to a real page or a redirect.
- **Clarify value proposition** above the fold so a visitor understands what Proptii is in 3 seconds.
- **Introduce a conversion path** with a visible trial offer and clear CTAs (Tenant vs Landlord/Agent).
- **Add a trust bar** under the hero (data sources) so the product feels credible before signup.
- **Fix navigation and footer** so Pricing exists, broken links are removed or redirected, and "TenantAgent" confusion is resolved.

### 1.2 Success Criteria

- No visitor lands on a 404 from any in-app or footer link.
- Hero shows a differentiated headline and one-line value prop (not "Find Your Dream Home").
- One dedicated "trial" section with two CTAs: Join as Tenant/Buyer, Join as Landlord/Agent.
- A trust strip appears directly under the hero (text + optional logos).
- Navbar includes a working Pricing link; footer includes Pricing and working About/legal links.
- If "TenantAgent" appears anywhere (e.g. logo asset or copy), it is removed or replaced with "Proptii".

---

## 2. Task Overview

| # | Workstream | Tasks | Owner (suggested) | Deps |
|---|------------|--------|-------------------|------|
| 1 | Routes & 404s | Add redirects, new Pricing page, fix route alignment | Dev | — |
| 2 | Hero copy | Headline, subhead, optional CTA pills | Content + Dev | — |
| 3 | Trial CTA section | New section + two buttons linking to signup with role | Dev | — |
| 4 | Trust bar | Strip under hero (sources text + logos) | Dev + Design | — |
| 5 | Navbar | Add Pricing link; remove/replace TenantAgent | Dev | 1 |
| 6 | Footer | Add Pricing; fix/redirect About, Contract, Booking; keep legal | Dev | 1 |
| 7 | QA & deploy | Smoke test all links, hero, CTAs; deploy | QA / Dev | 1–6 |

---

## 3. Detailed Implementation Tasks

### 3.1 Workstream 1: Routes and 404s

**Context:** The app defines `/about-us`, `/bookviewing`, `/contracts`. External or legacy links may use `/about`, `/pricing`, `/contract`, `/booking`, `/book-viewing`. Those return 404 if not handled.

#### Task 1.1 — Add redirect routes for legacy/marketing URLs

- **File:** `src/App.tsx`
- **Action:** Add routes that render `<Navigate to="..." replace />` so:
  - `/about` → `/about-us`
  - `/contract` → `/contracts`
  - `/booking` → `/bookviewing`
  - `/book-viewing` → `/bookviewing`
  - `/pricing` → `/pricing` (after Task 1.2; until then redirect to `/#trial` or to new Pricing page)
- **Acceptance:** Visiting each legacy path in the browser shows the target page (no 404).

#### Task 1.2 — Create a simple Pricing page

- **New file:** `src/pages/Pricing.tsx`
- **Content (minimal):**
  - Reuse existing layout (Navbar + Footer).
  - Heading: e.g. "Simple, transparent pricing."
  - Body: "Everyone starts with **3 months free** — no credit card, no commitment. Tenants and buyers: core search is free forever. Landlords and agents: full access during your trial, then choose a plan. We’ll notify you before any charges. Plans from [price TBD]/month."
  - Optional: Two CTAs — "Join as Tenant / Buyer" and "Join as Landlord / Agent" (same as homepage trial section, linking to `/register?role=tenant` and `/register?role=agent`).
- **Route:** In `App.tsx`, add `<Route path="/pricing" element={<Pricing />} />`.
- **Acceptance:** `/pricing` loads without 404 and displays the above messaging.

#### Task 1.3 — Ensure catch-all 404 still works

- **File:** `src/App.tsx`
- **Action:** Confirm `<Route path="*" element={<NotFoundPage />} />` remains last. No other route should catch `*` before it.
- **Acceptance:** Unknown paths (e.g. `/foo`) still show the 404 page.

---

### 3.2 Workstream 2: Hero Copy

**Context:** `src/pages/Home.tsx` contains the hero (lines ~128–181). Current headline: "Find Your Dream Home"; subhead: "We make finding and securing your home easy, every step of the way."

#### Task 2.1 — Replace hero headline

- **File:** `src/pages/Home.tsx`
- **Action:** Replace the main hero heading with one of the strategy-approved lines, e.g.:
  - **Primary option:** "The AI-powered platform that takes you from property search to signed contract — in days, not weeks."
  - **Shorter option:** "Search. Verify. Move in. One platform, zero hassle."
- **Acceptance:** Hero displays the new headline; typography and layout unchanged unless intentionally adjusted.

#### Task 2.2 — Replace hero subhead

- **File:** `src/pages/Home.tsx`
- **Action:** Replace the subheading with:
  - "Search across all major UK property sites in plain English. Book viewings, complete referencing, and sign contracts — all in one place. Free for tenants. Try it now."
- **Acceptance:** Subhead is visible and readable; line length/breakpoints acceptable on mobile and desktop.

#### Task 2.3 (Optional) — Reframe Tenant/Agent toggle as two CTAs

- **File:** `src/pages/Home.tsx`
- **Action:** Either keep the existing pill toggle and style it, or replace with two buttons:
  - Primary: "Search Properties Free" (focuses the search bar or scrolls to it).
  - Secondary: "List & Manage Properties" (navigate to `/agent` for logged-in users, or trigger login then redirect; for anonymous, consider `/register?role=agent` or a scroll to a future "For Landlords" section).
- **Acceptance:** Visitor can clearly choose tenant path (search) vs landlord/agent path (signup/list).

---

### 3.3 Workstream 3: Trial CTA Section

**Context:** The homepage has no signup/trial block. Strategy requires a distinct section with headline, body, and two role-based CTAs.

#### Task 3.1 — Add "Start free" section to Home

- **File:** `src/pages/Home.tsx`
- **Action:** Insert a new section (e.g. after the three feature cards, before FAQ). Content:
  - **Headline:** "Start free. No credit card. No commitment."
  - **Body:** "Every new user gets **3 months of full access** to Proptii — search, viewings, referencing, and contracts. Tenants and buyers: free forever for core search. Landlords and agents: try the full toolkit before you decide."
  - **Buttons:**
    - "Join as a Tenant / Buyer" → link to `/register?role=tenant` (or `/register` with tenant pre-selected when role support is added).
    - "Join as a Landlord / Agent" → link to `/register?role=agent` (or equivalent).
  - **Footer line:** "After your trial, plans start from [price TBD]/month. We’ll notify you before any charges."
- **Styling:** High contrast (e.g. dark or brand background) so the block stands out.
- **Acceptance:** Section is visible on desktop and mobile; both buttons navigate to register with correct query params (role can be read in Phase 2; for now links are sufficient).

#### Task 3.2 — Ensure Register page is linked from Navbar (optional)

- **File:** `src/components/Navbar.tsx`
- **Action:** If "Sign In" is present, consider adding "Sign Up" or ensuring the trial section is the primary signup entry. No 404 from trial CTAs.
- **Acceptance:** Clicking "Join as Tenant" or "Join as Landlord/Agent" does not 404.

---

### 3.4 Workstream 4: Trust Bar Under Hero

**Context:** Strategy calls for a horizontal strip under the hero: "Searching across OnTheMarket, Rightmove, OpenRent, Rentola & more" plus optional small logos.

#### Task 4.1 — Add trust strip (text)

- **File:** `src/pages/Home.tsx`
- **Action:** Directly below the hero section (below the search bar container), add a narrow full-width strip with:
  - Text: "Searching across OnTheMarket, Rightmove, OpenRent, Rentola & more"
  - Style: readable on the hero background (e.g. white or light text, or a semi-opaque bar). Font size small but legible.
- **Acceptance:** Strip appears on all viewport sizes; text is not truncated on mobile.

#### Task 4.2 (Optional) — Add data source logos

- **Assets:** Obtain or create small logos for OnTheMarket, Rightmove, OpenRent, Rentola (or use text only if logos are not approved).
- **File:** `src/pages/Home.tsx`
- **Action:** Place logos in the trust strip next to the text, with appropriate alt text.
- **Acceptance:** Logos display without breaking layout; link to sources only if legally/permissibly allowed.

---

### 3.5 Workstream 5: Navbar

**Context:** `src/components/Navbar.tsx` — logo, Book Viewing, Referencing, Contracts, Sign In / user menu.

#### Task 5.1 — Add Pricing link

- **File:** `src/components/Navbar.tsx`
- **Action:** Add a nav item "Pricing" linking to `/pricing`. Place it with other main links (e.g. after Contracts) or in a logical position.
- **Acceptance:** "Pricing" appears in desktop nav and in mobile menu; click goes to `/pricing` (no 404).

#### Task 5.2 — Remove or replace "TenantAgent"

- **Files:** `src/components/Navbar.tsx`; check any logo asset or text that renders "TenantAgent" (e.g. `public/images/` or inline text).
- **Action:** If "TenantAgent" appears next to the logo or elsewhere, remove it or replace with "Proptii" (or leave logo-only with no wordmark if that’s the standard).
- **Acceptance:** No confusing "TenantAgent" label remains on the landing experience.

#### Task 5.3 — Fix Contracts link for non-agents

- **File:** `src/components/Navbar.tsx`
- **Action:** Ensure the Contracts link uses a single path for the public site (e.g. `/contracts`) so unauthenticated and tenant users don’t hit a broken or agent-only route. Currently `to={isAgent ? "/agent-contracts" : "/contracts"}` — confirm `/agent-contracts` exists or point agents to a valid route.
- **Acceptance:** Contracts link never 404s for any user type.

---

### 3.6 Workstream 6: Footer

**Context:** `src/components/Footer.tsx` — Home (Book Viewings, Referencing, Contracts), Company (About Us, FAQ, Privacy, Terms), Contact.

#### Task 6.1 — Add Pricing to footer

- **File:** `src/components/Footer.tsx`
- **Action:** Under "Company" (or a suitable group), add "Pricing" linking to `/pricing`. Ensure it appears in both mobile (collapsible) and desktop layouts.
- **Acceptance:** Pricing link works from footer on all breakpoints.

#### Task 6.2 — Align footer links with app routes

- **File:** `src/components/Footer.tsx`
- **Action:** Verify every `to=` or `href=`:
  - Book Viewings → `/bookviewing`
  - Referencing → `/referencing`
  - Contracts → `/contracts`
  - About Us → `/about-us` (already correct in codebase; if live site had "About" elsewhere, redirect is in Workstream 1)
  - FAQ, Privacy Policy, Terms of Service → existing routes
- **Acceptance:** No footer link results in 404.

#### Task 6.3 — Add /about redirect if external links use "About"

- **Handled in Task 1.1:** `/about` → `/about-us`. No separate footer change needed if footer already uses `/about-us`.

---

### 3.7 Workstream 7: QA and Deploy

#### Task 7.1 — Smoke test checklist

- Run through the following and tick off:
  - [ ] Homepage loads; new hero headline and subhead visible.
  - [ ] Trust bar visible under hero.
  - [ ] Trial section visible; "Join as Tenant" and "Join as Landlord/Agent" clickable; both go to register (with or without query params).
  - [ ] Navbar: Pricing link goes to `/pricing`; Book Viewing, Referencing, Contracts work.
  - [ ] Footer: all links tested (Pricing, About Us, FAQ, Privacy, Terms, Book Viewings, Referencing, Contracts, Contact).
  - [ ] Legacy URLs: `/about`, `/contract`, `/booking`, `/book-viewing`, `/pricing` all resolve (no 404).
  - [ ] No "TenantAgent" (or replaced) on landing.
  - [ ] Mobile: hero, trust bar, trial section, nav, footer usable and readable.

#### Task 7.2 — Deploy and verify on live domain

- **Action:** Deploy to staging first; then to production (e.g. proptii.co). Re-run smoke tests on live URL.
- **Acceptance:** Live site reflects all immediate fixes; no new 404s from in-app or footer links.

---

## 4. File and Route Reference

| Item | Location / Route |
|------|-------------------|
| Homepage | `src/pages/Home.tsx`, `/` |
| Pricing page (new) | `src/pages/Pricing.tsx`, `/pricing` |
| About | `src/pages/AboutUs.tsx`, `/about-us` (redirect `/about` → here) |
| Book Viewing | `/bookviewing` (redirect `/booking`, `/book-viewing` → here) |
| Contracts | `src/pages/Contracts.tsx`, `/contracts` (redirect `/contract` → here) |
| Register | `src/pages/Register.tsx`, `/register` |
| Navbar | `src/components/Navbar.tsx` |
| Footer | `src/components/Footer.tsx` |
| App routes | `src/App.tsx` |

---

## 5. Copy Summary (Quick Reference)

- **Hero headline (pick one):**  
  - "The AI-powered platform that takes you from property search to signed contract — in days, not weeks."  
  - Or: "Search. Verify. Move in. One platform, zero hassle."
- **Hero subhead:**  
  - "Search across all major UK property sites in plain English. Book viewings, complete referencing, and sign contracts — all in one place. Free for tenants. Try it now."
- **Trust bar:**  
  - "Searching across OnTheMarket, Rightmove, OpenRent, Rentola & more"
- **Trial section headline:**  
  - "Start free. No credit card. No commitment."
- **Trial section body:**  
  - "Every new user gets **3 months of full access** to Proptii — search, viewings, referencing, and contracts. Tenants and buyers: free forever for core search. Landlords and agents: try the full toolkit before you decide."
- **Trial CTAs:**  
  - "Join as a Tenant / Buyer" | "Join as a Landlord / Agent"
- **Trial footer line:**  
  - "After your trial, plans start from [price TBD]/month. We’ll notify you before any charges."
- **Pricing page (minimal):**  
  - Heading: "Simple, transparent pricing."  
  - Body: 3 months free, tenants free for search, landlords/agents trial then plan; notify before charges; plans from [TBD]/month.

---

## 6. Out of Scope (Immediate Phase)

- Role-based signup handling (e.g. reading `?role=tenant` in Register and redirecting after signup). Planned for 1-month phase.
- Saved-search alerts, application pipeline view, email nurture. Planned for later phases.
- Social proof section (testimonials, numbers strip). Planned for 1-month phase.
- "For Landlords & Agents" dedicated section or page. Planned for 1-month phase.
- Animated example queries under the search bar. Nice-to-have; can follow in a quick iteration.

---

## 7. Dependencies and Ordering

1. **Task 1.2 (Pricing page)** should be done before **Task 1.1** redirect for `/pricing` (so `/pricing` has a destination). Alternatively, redirect `/pricing` to `/#trial` until the Pricing page exists.
2. **Task 5.1 (Pricing in Navbar)** and **Task 6.1 (Pricing in Footer)** depend on `/pricing` existing (Task 1.2).
3. All other tasks can be parallelised once routes and Pricing are in place.
4. **Workstream 7** runs after 1–6 are complete.

---

*End of implementation plan. For 1-month and 3-month horizons, see the parent strategy document and the phased roadmap (Part 13).*
