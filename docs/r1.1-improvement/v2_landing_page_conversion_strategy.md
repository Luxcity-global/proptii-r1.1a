# Proptii v2.0 — Landing Page, Conversion & Retention Strategy

**Brutally honest audit of proptii.co and a concrete redesign blueprint**

*February 2026*

---

## Part 1: What proptii.co Actually Does Right Now (Honest Audit)

### 1.1 The Current Page Structure

The live site at `proptii.co` delivers exactly **four sections** to a first-time visitor:

1. **Hero** — Full-viewport background image of a woman and child. A Tenant/Agent toggle pill. The heading "Find Your Dream Home." A search bar with a placeholder prompt.
2. **Three feature cards** — Book Viewing, Referencing, Contract. Each has a stock image, two sentences of copy, and a "Learn More" button.
3. **FAQ accordion** — Five collapsed categories (General, Searching, Referencing, Book Viewings, Contracts).
4. **Footer** — Logo, nav links, social icons.

That is the entire landing experience. There is no pricing page (`/pricing` returns 404), no `/about` page (404), no `/contract` page (404), no testimonials, no social proof, no explainer video, no case study, no trust signals, no conversion funnel, no trial signup call-to-action.

### 1.2 What It Gets Right

- **The search bar works.** A first-time visitor can type a natural-language query and get real property results from OnTheMarket. This is genuinely differentiated — no other UK proptech lets you search in plain English across sources.
- **The visual quality is decent.** The hero image is warm and aspirational. The orange/blue brand palette is distinctive. Card layouts are clean.
- **The Tenant/Agent toggle** signals that the platform serves both sides. This is good positioning — it hints at a two-sided marketplace.

### 1.3 What It Gets Wrong (Blunt)

#### Problem 1: Nobody knows what Proptii actually is

The heading says "Find Your Dream Home." That is the tagline of every property portal ever built. Rightmove says it. Zoopla says it. OpenRent says it. There is nothing in the first viewport that tells a visitor why Proptii exists, what makes it different, or why they should care.

The subheading — "We make finding and securing your home easy, every step of the way" — is equally generic. It could describe any of 50 competitors.

**A first-time visitor has no idea this is a discovery-to-decision platform. They think it is another Rightmove.**

#### Problem 2: There is no value proposition visible above the fold

The three feature cards (Book Viewing, Referencing, Contract) are below the fold. A visitor who does not scroll never learns that Proptii does more than search. And even if they scroll, the cards describe features, not outcomes. "Our rigorous referencing process verifies renter or buyer identity" — that is a feature statement. The visitor is thinking: "So what? What does that save me?"

#### Problem 3: There is zero social proof

No testimonials. No "X properties searched." No "Y tenants verified." No logos of partners, data sources, or regulatory bodies. No press mentions. No user count. Nothing that says "other people trust this."

For a platform asking users to upload identity documents, financial details, and sign contracts, the absence of trust signals is a serious conversion barrier.

#### Problem 4: There is no conversion funnel

The page has no call-to-action beyond "Learn More" (which navigates to sub-pages) and a search bar. There is:
- No "Start Free Trial" button.
- No "Get Started" flow on the homepage.
- No pricing or plan information anywhere on the site.
- No email capture.
- No lead magnet.
- No "Book a Demo" for agents/landlords.

A visitor who is interested has nowhere to go except search for a property or click "Learn More" and land on a feature page. There is no mechanism to capture intent, convert interest, or begin a buying relationship.

#### Problem 5: The site only speaks to tenants

Despite the Tenant/Agent toggle, 95% of the page content is tenant-facing. There is no landlord value proposition. No agent value proposition. No explanation of what the supply side gets from Proptii. The toggle exists but the content behind it is not differentiated.

This matters because **agents and landlords are the paying customers** (tenants search for free, per the FAQ). Yet the site does almost nothing to sell to them.

#### Problem 6: "TenantAgent" label in the top-left is confusing

The live site shows "TenantAgent" next to the Proptii logo in the navbar. This is not explained anywhere. Is it a product name? A mode indicator? A sub-brand? It creates cognitive friction for new visitors who are trying to understand what Proptii is.

#### Problem 7: Broken routes erode trust

`/about`, `/pricing`, `/contract`, `/booking`, `/book-viewing` all return 404. The footer and various CTAs link to pages that do not exist. Every 404 tells the visitor: "This product is not finished." For a platform handling legal documents and financial verification, that is damaging.

#### Problem 8: The FAQ does the selling that the landing page should do

The best explanation of what Proptii does is buried inside collapsed FAQ accordions. "Put in your search criteria in plain English, like 'I want to rent a 3 bedroom house in St Albans'. Our platform utilises AI technology to search different real estate sites and brings results closest to your search criteria." That sentence is more compelling than anything visible above the fold. It is hidden behind two clicks.

#### Problem 9: No reason to come back

There is no saved search. No alerts. No dashboard preview. No portfolio tracker. No "your referencing status" nudge. Nothing that creates a return visit habit. The site is a one-shot interaction: search, maybe get results, leave.

---

## Part 2: The Optimal Landing Page Experience

### 2.1 Design Principles

1. **Answer "what is this and why should I care" in 3 seconds.** Above the fold. No scrolling required.
2. **Show, don't describe.** Interactive demos beat feature lists. Numbers beat adjectives.
3. **Separate the audience paths early.** Tenants/buyers and landlords/agents have different motivations. Split them clearly.
4. **Build trust before asking for trust.** Social proof and credibility signals must appear before any request for personal data.
5. **Create a conversion mechanism that works today**, even before pricing tiers are live.

### 2.2 Proposed Page Structure (Top to Bottom)

#### Section 1: Hero (Above the Fold)

**What changes:**

- **Kill "Find Your Dream Home."** Replace with a headline that communicates the actual differentiator:

  > **Search. Verify. Move in. One platform, zero hassle.**

  Or, more specific:

  > **The AI-powered platform that takes you from property search to signed contract — in days, not weeks.**

- **Add a one-line value prop beneath:**

  > Search across all major UK property sites in plain English. Book viewings, complete referencing, and sign contracts — all in one place. Free for tenants. Try it now.

- **Keep the search bar** — it is the strongest conversion tool on the page. But add a subtle animated example beneath it cycling through real queries:
  - "2 bed flat in Manchester under 1200"
  - "Pet-friendly house near Leeds city centre"
  - "Studio apartment in Zone 2 London"

- **Replace the Tenant/Agent pill toggle** with two distinct CTA paths:
  - Primary (large): **"Search Properties Free"** (for tenants/buyers — drops focus into the search bar)
  - Secondary (outlined): **"List & Manage Properties"** (for landlords/agents — routes to a dedicated landing section or `/for-agents`)

- **Add a trust bar** directly beneath the hero — a single horizontal strip:
  - "Searching across OnTheMarket, Rightmove, OpenRent, Rentola & more"
  - Small logos of the data sources

#### Section 2: How It Works (The Journey)

**Replace the three feature cards** with a visual 4-step journey that maps to the user's actual experience:

| Step | Tenant/Buyer View | Landlord/Agent View |
|------|-------------------|---------------------|
| 1. **Discover** | Search in plain English across all major sites | List your property once, reach tenants everywhere |
| 2. **View** | Book viewings instantly with AI scheduling | Manage viewing requests in one dashboard |
| 3. **Verify** | Complete referencing once, reuse everywhere | Get pre-verified tenants — no chasing documents |
| 4. **Complete** | Review and sign contracts digitally | Generate compliant contracts in minutes |

Each step should have:
- A short outcome-focused sentence (not a feature description).
- A small illustration or screenshot.
- A "Try it" link that deep-links into the relevant flow.

#### Section 3: Social Proof & Trust

This section does not exist today. It must.

- **Numbers strip:** "X,000 properties searched | Y tenants verified | Z contracts signed" (use real numbers once available; use "Beta — join our early users" messaging until then).
- **Testimonial cards:** Even 2-3 quotes from beta users (tenants or agents) with name, photo, and context.
- **Data source logos:** OnTheMarket, Rightmove, OpenRent, Rentola — showing the breadth of search.
- **Security signals:** "Bank-grade encryption | GDPR compliant | UK-based data storage" with relevant icons.
- If available: "As seen in..." with any press or accelerator logos.

#### Section 4: The Offer (Trial CTA)

This is the conversion mechanism that does not exist today. It should be a visually distinct, high-contrast section.

**Headline:**

> **Start free. No credit card. No commitment.**

**Body:**

> Every new user gets **3 months of full access** to Proptii's complete platform — search, viewings, referencing, and contracts. Tenants and buyers: free forever for core search. Landlords and agents: experience the full toolkit before you decide.

**Two CTA buttons:**

- **"Join as a Tenant / Buyer"** — routes to signup with role pre-selected. Lowest friction (email + password or social login).
- **"Join as a Landlord / Agent"** — routes to signup with role pre-selected. Same flow, but after signup lands on the agent onboarding (add property, setup company profile).

**Below the buttons:**

> After your trial, plans start from [price TBD]/month. We will notify you before any charges apply.

This is honest, creates urgency (3 months is generous but finite), and removes the biggest objection ("what will it cost me?").

#### Section 5: Audience-Specific Value Blocks

Two side-by-side panels (or tabbed on mobile):

**For Tenants & Buyers:**
- Search every major UK property site from one search bar.
- Book viewings without phone tag — AI finds available slots.
- Complete referencing once — reuse your verified profile for every application.
- Sign contracts digitally — no printing, no posting.
- Track everything from your personal dashboard.

**For Landlords & Agents:**
- Receive pre-verified tenant applications — no document chasing.
- Manage viewings, references, and contracts from a single dashboard.
- Generate legally compliant tenancy agreements in minutes.
- Sync with your existing tools (Outlook, Google Calendar, Drive — per the MS/Google integration BRD).
- Portfolio-level visibility: arrears, pipeline, occupancy.

Each panel ends with a CTA: **"Start Your Free Trial"**

#### Section 6: FAQ (Streamlined)

Keep the FAQ but restructure:
- Move the best answers to the top (especially the plain-English search explanation).
- Add pricing/trial questions:
  - "Is Proptii free?" → "Core search is free for tenants forever. Landlords and agents get 3 months free, then choose a plan."
  - "What happens after the trial?" → "We will email you 2 weeks before your trial ends. You can upgrade, downgrade, or cancel — no surprises."
- Remove or compress sections that duplicate content already shown above.

#### Section 7: Footer

Fix the broken links. Add:
- `/pricing` (even if it is a simple "Coming soon — all users start with 3 months free" page).
- `/about` (the AboutUs.tsx page exists in code but returns 404 on the live site — deploy it).
- Legal links (Privacy Policy, Terms of Service — these exist and work).
- "Contact us" with a real email or form.

---

## Part 3: Why Should They Come Back? (Retention Architecture)

The current site gives users zero reason to return. Here is what changes that:

### 3.1 For Tenants / Buyers

| Retention Hook | What It Does | Why It Works |
|----------------|-------------|--------------|
| **Saved searches with alerts** | Save a search query; get notified when new matching properties appear | Creates a daily/weekly return habit without effort |
| **Property shortlist** | Save and compare properties side-by-side | Gives users a reason to log in repeatedly during their search |
| **Application tracker** | Visual pipeline: Applied → Viewing Booked → Referencing → Contract → Moved In | Users check status obsessively (like tracking a parcel) |
| **Portable verified profile** | Complete referencing once; reuse across all future applications | Massive time saving that locks users into the platform |
| **Move-in checklist** | Post-contract: utilities, council tax, change of address, inventory | Extends the relationship beyond the transaction |

### 3.2 For Landlords / Agents

| Retention Hook | What It Does | Why It Works |
|----------------|-------------|--------------|
| **Tenant pipeline dashboard** | See all applicants, their verification status, and stage at a glance | Replaces spreadsheets and email threads |
| **Portfolio overview** | All properties, occupancy, rent status, upcoming lease renewals | Daily operational tool — not a one-off |
| **Automated viewing management** | Calendar sync, reminders, no-show tracking | Saves hours per week for active agents |
| **Contract template library** | Reusable, compliant templates with version history | Reduces legal risk and admin time |
| **Referencing status tracking** | Know exactly where each tenant's verification stands | Eliminates "chasing the reference" — the most hated admin task |

### 3.3 For Future Audiences

| Audience | Return Driver |
|----------|--------------|
| **Lawyers / Solicitors** | Contract review queue, compliance alerts, clause library |
| **Housing Associations** | Bulk tenant verification, portfolio compliance dashboards |
| **Banks / Insurers** | Verified tenant data feeds for mortgage/insurance decisioning |
| **Service Providers** (handymen, decorators, etc.) | Job marketplace: tenants and landlords post service requests |

These are future-phase but the platform architecture should anticipate them from day one.

---

## Part 4: The Trial-to-Paid Conversion Path

### 4.1 Immediate State (No Pricing Page Yet)

Since pricing tiers are not defined yet, the conversion path should be:

1. **Everyone signs up free.** No credit card required.
2. **Trial badge visible in the UI:** "Free Trial — 89 days remaining" (creates gentle urgency without pressure).
3. **Full feature access** during trial — do not gate features. Let users experience the complete platform.
4. **Email nurture sequence:**
   - Day 1: Welcome + "here is how to get the most from Proptii."
   - Day 7: "You have searched for X properties — did you know you can save searches?"
   - Day 30: "Your referencing profile is Y% complete — finish it to apply faster."
   - Day 60: "Your trial ends in 30 days — here is what you have accomplished."
   - Day 75: "Choose your plan — here is what each tier includes."
   - Day 90: "Your trial has ended. Upgrade to keep your data and access."

### 4.2 Tiered Pricing Framework (Suggested)

| Tier | Who It Is For | Indicative Price | What They Get |
|------|--------------|-----------------|---------------|
| **Free** | Tenants / Buyers | Free forever | Property search, save listings, basic alerts |
| **Tenant Pro** | Serious renters / buyers | Low monthly (or per-application) | Portable verified profile, unlimited referencing reuse, priority viewing slots, application tracker |
| **Agent Starter** | Individual landlords, small agents | Mid monthly | Dashboard for up to N properties, viewing management, contract templates, referencing requests |
| **Agent Pro** | Agencies, portfolio landlords | Higher monthly (or per-seat) | Unlimited properties, team collaboration, MS/Google integrations, portfolio analytics, API access |
| **Enterprise** | Housing associations, large agencies | Custom | Volume pricing, custom integrations, SLA, dedicated support |

**Key principle:** Tenants' core search is always free. This maximises demand-side volume, which is what makes the platform valuable to the supply side (who pay).

---

## Part 5: Viral Mechanics — How to Grow Without Paying for Every User

### 5.1 Built-In Viral Loops

| Loop | Mechanism | Viral Coefficient |
|------|-----------|-------------------|
| **Referencing invites** | When a tenant completes referencing, their employer and guarantor receive Proptii-branded verification emails. Those people discover Proptii. | Each tenant application exposes 2-4 new people to the brand |
| **Viewing coordination** | When a viewing is booked, the landlord/agent receives a branded notification. If they are not on Proptii, they are invited to join to manage viewings. | Every viewing potentially onboards a supply-side user |
| **Contract sharing** | Signed contracts are delivered as Proptii-branded PDFs with a footer: "Generated and signed on Proptii — the property platform that handles everything." | Every contract is a marketing touchpoint |
| **"Verified by Proptii" badge** | Tenants who complete referencing can add a "Proptii Verified" badge to their profiles/applications elsewhere. | Turns tenants into walking advertisements |
| **Agent referral programme** | Agents who refer other agents get extended trial or reduced pricing. | B2B word-of-mouth in a relationship-driven industry |

### 5.2 Content & SEO

- **Property market insights:** Use aggregated search data to publish "Most searched areas," "Average rents by postcode," "Market trends." This creates organic search traffic.
- **Referencing guides:** "How to pass a tenant reference check" — high-intent SEO content that naturally funnels into the referencing product.
- **Landlord guides:** "How to find reliable tenants," "Tenancy agreement templates" — content that ranks and converts supply-side users.

### 5.3 What Is Missing for Viral to Work

Be honest: viral loops only work if the core product experience is strong enough that people want to share it. Right now:

- The referencing email flow exists but is basic (plain SMTP, not branded/templatised for viral impact).
- There is no "share this property" or "share my verified profile" feature.
- There is no agent referral mechanism.
- There is no post-transaction "rate your experience" flow that could generate testimonials.

These are not hard to build, but they need to be deliberate design decisions, not afterthoughts.

---

## Part 6: Gap Summary and Priority Matrix

| Gap | Impact | Effort | Priority |
|-----|--------|--------|----------|
| No clear value proposition above the fold | Critical — visitors bounce before understanding the product | Low (copywriting + layout change) | **P0** |
| No pricing/offer/trial CTA | Critical — interested visitors have no conversion path | Low-Medium (page + signup flow tweak) | **P0** |
| No social proof or trust signals | High — blocks conversion for referencing/contract features | Low (can start with data source logos + placeholder stats) | **P0** |
| Broken routes (/about, /pricing, /contract, /booking) | High — erodes trust immediately | Low (deploy existing pages, add redirects) | **P0** |
| No supply-side (landlord/agent) landing content | High — the paying customers are not being sold to | Medium (dedicated section or page) | **P1** |
| No saved searches or alerts | High — no return visit driver for tenants | Medium (requires backend + notification infra) | **P1** |
| No application/referencing status tracker | High — no return visit driver during active process | Medium (dashboard enhancement) | **P1** |
| No email nurture / lifecycle messaging | High — trial users will churn silently | Medium (email service integration) | **P1** |
| No viral referencing emails (branded, with CTA) | Medium — missing organic growth channel | Low-Medium (email template redesign) | **P2** |
| No content/SEO strategy | Medium — missing organic acquisition channel | Medium-High (content creation + publishing) | **P2** |
| "TenantAgent" branding confusion | Low-Medium — confuses first-time visitors | Low (remove or explain) | **P2** |
| No agent referral programme | Medium — missing B2B growth lever | Medium (requires tracking + incentive logic) | **P3** |
| Service provider marketplace | Low (future) — large addressable market but not core yet | High | **P3** |

---

## Part 7: What the Landing Page Should Feel Like

### First 3 seconds
"Oh, this searches across all UK property sites at once using AI. And it handles viewings, referencing, and contracts too. Interesting."

### First 10 seconds
"It is free for me as a tenant. Landlords and agents get a free trial. There are real property sources behind this. Let me try a search."

### First 30 seconds
"The search actually works. I typed in natural language and got real results from OnTheMarket. This is different from Rightmove."

### First 2 minutes
"I can save these results. I can book a viewing from here. I can do my referencing on the same platform. Let me create an account."

### First visit for an agent
"This shows me pre-verified tenants and handles the paperwork I hate. Free trial, no card needed. Let me add a property and see."

That is the journey. Everything on the page exists to move the visitor through those mental states as fast as possible. Anything that does not serve that journey is noise.

---

## Timeline and Delivery Cadence

The following gives a high-level sense of **when** to deliver **what**, so the strategy has a clear timing and cadence. Detailed task breakdown for the immediate phase is in `docs/r1.1-improvement/V201_landingpage-fixes/01-landingpage-immediate-fixes.md`.

### Immediate (this week / next few days)

- **Fix 404s** — Redirects or routes so `/about`, `/pricing`, `/contract`, `/booking`, `/book-viewing` all resolve.
- **Hero** — One clear value-prop headline and one-line subhead (replace "Find Your Dream Home").
- **Trial CTA** — One visible "Start free / 3 months free" block with two buttons (Tenant vs Landlord/Agent).
- **Trust bar** — Under the hero: "Searching across OnTheMarket, Rightmove, OpenRent…" (and logos if available).
- **Nav + footer** — Add Pricing link, fix broken links, point Pricing to a simple "3 months free, plans TBD" page.
- **TenantAgent** — Remove or replace with a single clear label (e.g. "Proptii").

### 1 month

- **Social proof** — Data-source logos, 1–2 stats (or "Join our beta" if no numbers yet), optional 1–2 testimonials.
- **"For Landlords & Agents"** — Dedicated block: 4–5 outcome bullets + CTA.
- **FAQ** — Add pricing/trial answers; move the "plain English search" explanation higher.
- **Signup wiring** — "Join as Tenant" and "Join as Landlord/Agent" pass role (e.g. `?role=`) and send users to the right place after signup.
- **Trial badge in app** — "Free trial — X days left" (or "Beta") so the offer is visible in-product.
- **Basic instrumentation** — Hero impressions, CTA clicks, signup start/complete, source (which CTA).

### 3 months

- **Saved searches + alerts** — Save query, "email me new matches," backend job + digest emails.
- **Single "Your applications" pipeline** — One place for tenants to see viewings, referencing, and contracts per property.
- **Supply-side prominence** — "Applications" and "Viewing requests" front and centre on landlord/agent dashboard; optional email digest for new applications.
- **Viral layer** — Branded referencing/contract emails with a short Proptii CTA; optional "Verified by Proptii" badge for tenants.
- **Agent referral (optional)** — Track referrer, simple incentive (e.g. extended trial or discount).
- **Refine with data** — Use funnel and retention metrics to prioritise the next copy and layout changes (e.g. headline A/B test, CTA wording).

---

## Appendix: Codebase Notes for Implementation

- **Home.tsx** (`src/pages/Home.tsx`) — 275 lines. The entire landing page. Will need significant restructuring to accommodate the new sections.
- **Navbar.tsx** (`src/components/Navbar.tsx`) — Needs a "Pricing" or "Plans" link added.
- **Footer.tsx** (`src/components/Footer.tsx`) — Needs broken links fixed and new pages added.
- **AboutUs.tsx** (`src/pages/AboutUs.tsx`) — Exists in code but 404s on live site. Needs deployment/routing fix.
- **No pricing page exists.** Will need to be created from scratch.
- **Register.tsx** (`src/pages/Register.tsx`) — Exists but is not prominently linked from the landing page. Trial signup should route here with role pre-selection.
- **ReviewModal.tsx** (`src/components/ReviewModal.tsx`) — Post-action feedback collection exists but is not used to generate testimonials. Opportunity to repurpose.
- **SearchInput.tsx** (`src/components/SearchInput.tsx`) — The strongest conversion tool. Should remain prominently featured but with better framing.
- **FAQSection.tsx** (`src/components/FAQSection.tsx`) — Reusable component. Content needs restructuring per Section 2.2.

---

## Part 8: Persona-by-Persona Journey Mapping

### 8.1 Tenant (Renter)

| Stage | Ideal journey | Current reality | Gap |
|-------|----------------|-----------------|-----|
| **Awareness** | Lands on proptii.co, sees "search all UK sites in plain English" + trial offer | Sees "Find Your Dream Home" and a search bar; no offer | No value prop, no CTA |
| **First action** | Types a query, gets results, saves 2–3 properties | Can search and get results; can save via heart icon (SavedPropertiesContext + localStorage) | Saved list exists but is not surfaced on homepage; no "create account to save" nudge |
| **Return trigger** | Email: "3 new properties match your saved search" | No saved-search alerts; dashboard has `/dashboard/saved-searches` but no backend alerting | No saved-search alerts (backend + email/push needed) |
| **Activation** | Books a viewing from a result; gets confirmation and reminder | Book Viewing page exists (`/bookviewing`); flow is manual (property, date, time) | Flow works but is not tightly coupled to search result (no "Book viewing" from card) |
| **Deep use** | Starts referencing for one application; sees pipeline (Applied → Referencing → Contract) | Referencing exists; dashboard has TenantReferencing section and contract counts | No single "application pipeline" view; status is spread across dashboard sections |
| **Habit** | Checks dashboard for "your applications" and "new matches" | Dashboard home shows requested/signed contracts and files | Pipeline is understated; no "new matches" for saved search |

**Critical path to fix:** Surface "Save search" and "Get alerts" from search results; add a clear "Your applications" pipeline view; add post-search CTA "Book viewing" / "Start referencing" from listing cards.

### 8.2 Home Buyer

| Stage | Ideal journey | Current reality | Gap |
|-------|----------------|-----------------|-----|
| **Awareness** | Same as tenant; copy should mention "rent or buy" where relevant | Copy is 100% rental ("Find Your Dream Home", referencing for "renter") | No buy-side messaging; search may support buy in backend but positioning is rent-only |
| **First action** | Searches "2 bed house to buy in Bristol" | Search type can be toggled (OnTheMarket etc.); buy listings may appear depending on data source | Unclear if buy is first-class; no "For buyers" value block on landing |
| **Activation** | Saves properties, requests viewings, gets verification for mortgage/offer | Same referencing/contract stack could apply (identity, finances) | Product can support; positioning and flows are rent-first |
| **Habit** | Tracks saved properties, viewings, and "offer status" | No offer pipeline; contracts are tenancy-focused | Future: offer tracker, mortgage verification, conveyancing handoff |

**Critical path:** Explicitly support "buy" in hero and audience blocks; ensure search and dashboard accommodate saved buy listings and a buyer-specific pipeline later.

### 8.3 Landlord (Individual)

| Stage | Ideal journey | Current reality | Gap |
|-------|----------------|-----------------|-----|
| **Awareness** | Clicks "List & Manage Properties"; lands on section or `/for-agents` with landlord benefits | Tenant/Agent toggle goes to Agent (login); no landlord-specific landing content | No landlord landing; agent and landlord may be same flow but not communicated |
| **First action** | Signs up (no card), adds first property, sees "You're live" | Landlord flow is via `/landlord` or `/Agent`; LandlordDemo and landlord_agent app exist | Onboarding exists inside app; no pre-signup "what you get" page |
| **Activation** | Receives first viewing request from a tenant (from Proptii search); accepts/declines in dashboard | Viewing requests can be created; landlord dashboard has tenants, viewings, alerts | Flow exists but demand-side must use Proptii to send request; chicken-and-egg |
| **Habit** | Daily check: new applications, referencing status, lease renewals, arrears | Dashboard has vacancy/arrears alerts, tenants, properties; alertService generates alerts | Good; missing is "applications from Proptii tenants" and clear pipeline from application → tenant |

**Critical path:** Add a dedicated "For Landlords" landing (or section) with outcome-focused copy; make it clear that "tenants find you on Proptii and apply here"; surface "Applications" and "Viewing requests" prominently.

### 8.4 Agent / Broker

| Stage | Ideal journey | Current reality | Gap |
|-------|----------------|-----------------|-----|
| **Awareness** | Same as landlord but with "Agency" angle: portfolio, team, compliance | AgentHome exists; same as landlord entry (toggle to Agent) | No agency-specific value prop (multi-user, branding, compliance) |
| **First action** | Signs up, adds company profile, adds first listing(s) | OnboardingOptions: Add Property, Setup Company Profile; listings and landlord app support this | Company profile and listings exist; not advertised on landing |
| **Activation** | Listings appear in Proptii search; tenants apply; agent manages in one place | Listings can be added; search pulls from OnTheMarket etc. (not necessarily Proptii listings yet) | Need clarity: do Proptii-native listings appear in the main search? If not, agent value is "manage viewings/references/contracts" for tenants who found elsewhere |
| **Habit** | Pipeline view, team visibility, document library, contract templates | Landlord/agent dashboard has pipeline-like views and alerts | Strong; missing agent referral programme and "invite your agency" |

**Critical path:** Landing copy for "List & Manage" should spell out: "Tenants find properties on Proptii and apply to you. Manage viewings, referencing, and contracts in one dashboard." Add agent referral later.

### 8.5 Elderly Homeowner (Planned)

| Stage | Note |
|-------|------|
| **Positioning** | Future segment: equity release, downsizing, care-related moves, or staying put with support. |
| **Journey** | Likely a dedicated entry ("I'm a homeowner") with simplified flows, trusted third-party signals (family, solicitor), and optional hand-holding (checklists, reminders). |
| **Retention** | Fewer logins; value = peace of mind (documents in one place, progress visible to family/solicitor with consent). |

No implementation today; keep in roadmap and avoid rent-only language that excludes this segment long term.

---

## Part 9: Competitive Positioning (Where Proptii Fits)

### 9.1 Landscape

| Player | What they do | Monetisation | Proptii differentiator |
|--------|--------------|--------------|-------------------------|
| **Rightmove / Zoopla / OnTheMarket** | Listing aggregators; search by filters; agents pay to list | Agent subscriptions, premium listings | Proptii: one search bar, plain English, multi-source + viewings/referencing/contracts in one place |
| **OpenRent** | Direct landlord–tenant; listings, referencing, contracts | Landlord fees, referencing fees | Proptii: aggregates OpenRent + others; single search; same stack (reference + contract) |
| **Rentola / other aggregators** | Niche or international aggregation | Varies | Proptii: UK-focused, full journey to contract |
| **Goodlord / Vouch** | Referencing and tenancy management for agents | Per reference / per tenancy | Proptii: bundling search + viewing + referencing + contract; tenant-facing and agent-facing |
| **DocuSign / HelloSign** | E-sign only | Per envelope / subscription | Proptii: property-specific templates and workflow, not generic e-sign |

### 9.2 Positioning Statement (Suggested)

**For tenants/buyers:**  
"Proptii is the only place where you search every major UK property site in plain English, then book viewings, complete your referencing once, and sign your contract — without switching sites or repeating yourself."

**For landlords/agents:**  
"Proptii brings you tenants who are already searching in one place. You get pre-verified applications, viewing management, and compliant contracts in one dashboard — no spreadsheets, no chasing documents."

### 9.3 Risk: Two-Sided Chicken-and-Egg

- **Demand-heavy, supply-light:** Tenants search and see mostly OnTheMarket/Rightmove stock; few "Proptii-only" listings. Value to landlords is then "manage the tenants who apply via Proptii" — but if most tenants don’t apply via Proptii, landlords see little volume.
- **Supply-heavy, demand-light:** If you onboard many landlords with Proptii-only listings, tenants must come to Proptii to find them. That requires strong SEO, virality, or paid acquisition.

**Mitigation:** Lead with demand (free search, great UX, alerts, portable referencing). Use that traffic to attract supply: "Thousands of tenants search here every month; list here to get applications in one place." Then add supply-side features (listing once, syndication) so Proptii becomes a source of inventory as well.

---

## Part 10: Metrics and Instrumentation

### 10.1 North Star (Suggested)

**Demand-side:** Weekly active searchers who perform at least one meaningful action (save property, book viewing, start referencing, or sign contract).  
**Supply-side:** Weekly active landlords/agents who receive or act on at least one application, viewing, or contract.

A single North Star can be: **Weekly active users (WAU) who complete at least one "transactional" action** (search → save/view/book/reference/sign).

### 10.2 Funnel Metrics (Landing → Paid)

| Step | Metric | Current | Target (example) |
|------|--------|---------|------------------|
| Visit | Unique visitors (homepage) | — | Track |
| Engage | % who use search | — | Track |
| Signup | % who create account (from visit) | — | 2–5% |
| Activate (tenant) | % signups who save a property or book a viewing within 7 days | — | 40%+ |
| Activate (supply) | % signups who add a property or complete company profile within 7 days | — | 50%+ |
| Retain | % WAU (week N) still WAU (week N+4) | — | 30%+ (early) |
| Convert (supply) | % trial signups who become paying after trial | — | 10–20% (when pricing live) |

### 10.3 What to Instrument on the New Landing Page

- **Hero:** Impressions; clicks on "Search Properties Free" vs "List & Manage Properties"; focus/use of search bar.
- **Scroll:** % reaching each section (How it works, Social proof, Offer, FAQ).
- **Offer section:** Clicks on "Join as Tenant/Buyer" vs "Join as Landlord/Agent"; scroll-to-CTA time.
- **Signup:** Source (which CTA, which section); role selected; completion.
- **Post-signup:** First action (save property, add property, start referencing, etc.) and time to first action.

Implementation: add a small analytics layer (e.g. event hooks or tag manager) for these events; avoid PII in event names. Use existing Application Insights or add product analytics (Mixpanel, Amplitude, PostHog) if not already present.

### 10.4 Retention Metrics

- **Tenant:** Saved searches created; alert signups; properties saved; viewings booked; referencing started/sent; contracts signed. Cohort by signup week; plot "still active" by week.
- **Landlord/agent:** Properties added; viewing requests received; referencing requests sent; contracts sent/signed. Same cohort view.

---

## Part 11: UX and Codebase Deep-Dive (Where the Gaps Are)

### 11.1 Routing and 404s

- **Live site** uses paths like `/about`, `/pricing`, `/contract`, `/booking`, `/book-viewing` and gets 404.
- **App.tsx** defines: `/about-us`, `/bookviewing`, `/contracts`, `/referencing`, etc. So the **live site’s links don’t match the app’s routes**.
- **Fix:** Either (a) add redirects from `/about` → `/about-us`, `/pricing` → new pricing page, `/contract` → `/contracts`, `/booking` and `/book-viewing` → `/bookviewing`, or (b) change the app routes to match the marketing URLs. Prefer (a) plus a canonical `/pricing` page.

### 11.2 Saved Properties vs Saved Searches

- **Saved properties:** Implemented. `SavedPropertiesContext` (localStorage); dashboard route `saved-searches` shows `SavedProperties-new`. Users can save from search results (heart icon).
- **Saved searches (queries) with alerts:** Not implemented. No stored "search query" entity; no cron or job to re-run searches and send "new matches" emails. This is the single biggest retention gap for tenants.
- **Implementation hint:** Add a `saved_search` table or Firestore collection (userId, query, filters, lastRunAt, notifyEmail); backend job or serverless function to run search periodically and send digest emails.

### 11.3 Application / Pipeline View (Tenant)

- **Dashboard** has: DashboardHome (summary cards: viewings, requested/signed contracts, documents, referencing); separate sections for Viewings, TenantContracts, TenantReferencing, YourFiles.
- **Gap:** No single "Application pipeline" view: e.g. "Property A: Viewing booked → Referencing in progress → Contract sent." Users must piece this together from Viewings + Referencing + Contracts. A unified "Your applications" view (one row per property, columns = stage) would improve retention and clarity.
- **Implementation hint:** New dashboard section or page that joins viewings, referencing status, and contract status by property/listing.

### 11.4 Landing → Signup → Role

- **Register.tsx** exists; no role selection on the form. **AuthContext** and backend may infer role from flow or profile.
- **Gap:** "Join as Tenant" vs "Join as Landlord/Agent" should pass a role (e.g. query param `?role=tenant` or `?role=agent`) and pre-fill or show the right post-signup destination (dashboard home vs landlord onboarding).
- **Implementation hint:** Signup links from landing: `/register?role=tenant`, `/register?role=agent`. Register page reads `role` and stores in profile or sends to backend; redirect after signup to `/dashboard` (tenant) or `/agent` / `/landlord` (supply).

### 11.5 Mobile and Performance

- Dashboard and main pages use responsive classes (`isMobile`, `md:`, etc.). No dedicated audit here; recommend a pass for tap targets, font size, and hero CTA visibility on small screens.
- Hero image is large; ensure lazy-loading or priority loading and CLS handling so LCP doesn’t suffer.

### 11.6 Trust and Compliance (Copy)

- No "GDPR compliant" or "UK data" on the landing page. Add a short trust line (e.g. in footer or near signup): "Your data is stored in the UK and we are GDPR compliant." Link to Privacy Policy.

---

## Part 12: Copy Recommendations and A/B Test Ideas

### 12.1 Hero Headlines (Alternatives for Testing)

- **A:** "Search. Verify. Move in. One platform, zero hassle."
- **B:** "The AI-powered platform that takes you from property search to signed contract — in days, not weeks."
- **C:** "One search bar. Every major UK property site. Then view, verify, and sign — all here."
- **D:** "Stop juggling property sites. Search everywhere in plain English, then book viewings and sign contracts in one place."

Recommend starting with **B** or **C** for clarity; **A** for brevity. Test **B** vs **C** on bounce rate and search use.

### 12.2 Subhead (Under Hero)

- "Search across OnTheMarket, Rightmove, OpenRent and more in plain English. Book viewings, complete referencing once, and sign contracts — all in one place. Free for tenants. Try it now."

### 12.3 Trial CTA Section (Exact Copy)

- **Headline:** "Start free. No credit card. No commitment."
- **Body:** "Every new user gets **3 months of full access** — search, viewings, referencing, and contracts. Tenants and buyers: core search is free forever. Landlords and agents: try the full toolkit before you choose a plan."
- **Buttons:** "Join as a Tenant / Buyer" | "Join as a Landlord / Agent"
- **Footer line:** "After your trial, plans start from [X]/month. We’ll email you before any charge."

### 12.4 FAQ Additions (Pricing / Trial)

- **"Is Proptii free?"** — "Yes for searching and saving properties. Landlords and agents get 3 months free, then choose a plan. We’ll tell you before anything is charged."
- **"What happens after my trial?"** — "We email you 2 weeks before the end. You can upgrade, pause, or leave. No surprise charges."
- **"Who pays?"** — "Tenants and buyers don’t pay for search. Landlords and agents pay for the tools that help them find and manage tenants (viewings, referencing, contracts)."

### 12.5 For-Agents / For-Landlords Section (Short Copy)

- **Headline:** "For Landlords & Agents"
- **Bullets:** "Get applications from tenants who search on Proptii • Manage viewings and referencing in one dashboard • Generate compliant contracts in minutes • Free trial, no card required."
- **CTA:** "Start your free trial"

### 12.6 A/B Tests to Run Later

- Hero: Headline B vs C (bounce rate, time to first search).
- CTA: "Start free trial" vs "Get 3 months free" (signup rate).
- Offer section: One CTA vs two (Tenant vs Landlord/Agent) (signup rate and role mix).
- Social proof: With vs without numbers strip (conversion and trust survey).

---

## Part 13: Implementation Roadmap (Phased)

| Phase | Scope | Outcome |
|-------|--------|---------|
| **Phase 1 (Quick wins)** | Fix 404s (redirects or new pages). Update hero headline and subhead. Add trial CTA section with two buttons. Add trust line (data sources + "Free for tenants"). | Landing page converts; no broken links. |
| **Phase 2 (Trust and clarity)** | Add social proof section (logos, placeholder stats, optional 1–2 testimonials). Add "For Landlords & Agents" block. Add FAQ entries for pricing/trial. Deploy `/about-us` as `/about` or redirect. Add `/pricing` (e.g. "3 months free, then plans from X"). | Trust and supply-side messaging clear. |
| **Phase 3 (Signup and role)** | Signup links with `?role=tenant|agent`. Post-signup redirect by role. Trial badge in UI ("Free trial — X days left"). | Clean funnel from landing to activated user. |
| **Phase 4 (Retention – tenant)** | Saved searches (save query + alert preference). Backend job + email for "new matches". Optional: single "Your applications" pipeline view. | Tenants return for alerts and status. |
| **Phase 5 (Retention – supply)** | Ensure "Applications" and "Viewing requests" are prominent on landlord/agent dashboard. Optional: email digest for new applications. | Supply-side sees value from demand. |
| **Phase 6 (Viral and growth)** | Branded referencing/contract emails with Proptii CTA. Optional: "Verified by Proptii" badge. Agent referral programme (tracking + incentive). | Organic growth and word-of-mouth. |

Together, Parts 8–13 turn the strategy into an actionable plan: who to design for, how you sit versus competitors, what to measure, where the product gaps are in the codebase, what to say on the page, and in what order to ship.
