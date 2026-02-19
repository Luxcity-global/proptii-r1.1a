# Proptii v2.0 — Strategic Vision for 10X

**Blunt Assessment and Forward Architecture**

*February 2025 — Updated with Mascot & Unified Communications*

---

## Preamble: Where r1.1 Actually Stands (Honest Assessment)

Before discussing where to go, we need to be ruthlessly honest about where we are.

**What r1.1 does well:**
- Multi-source property search (OnTheMarket, Rightmove, OpenRent, Rentola, Brave) is a genuine differentiator
- The tenant journey from search → viewing → referencing → contract is conceptually complete
- Landlord agent dashboard has a broad feature surface

**What r1.1 does poorly (blunt):**

1. **Search is a scraping layer, not intelligence.** There is zero AI in the primary search flow. The Azure OpenAI integration exists but is not wired to the main UI. The prompt tells the LLM to "invent" properties. This is not a product — it is a prototype pretending to be one.

2. **The app is a collection of forms, not an experience.** Referencing is 6 steps. Contract signing is multi-tab. Booking a viewing requires manual property/date/time entry. Every feature adds friction instead of removing it.

3. **There are two apps bolted together.** The landlord agent runs in an iframe with `postMessage` bridges. This is not integration — it is cohabitation. State, auth, and navigation leak across the boundary.

4. **There is no data moat.** The app scrapes other people's listings. It doesn't own inventory, tenant profiles, or transaction data at scale. Without a data moat, there is no defensible infrastructure.

5. **"Chat" and "Call" buttons do nothing.** These are placeholders that signal promise but deliver nothing. Users who click them learn the product is unfinished.

6. **Communications are broken.** The landlord TenantInbox has hardcoded mock messages. Email is one-directional. There is no in-app messaging, no WhatsApp, no voice calling, no push notifications. Every communication feature visible in the UI is non-functional.

7. **No brand personality.** The app has no character, no emotional hook, no reason to remember it. Property portals are commoditised. Without personality, Proptii is just another blue-and-white form-filling tool.

8. **Duplicate code everywhere.** `ReferencingModal.OLD` alongside `ReferencingModal`. `SavedProperties-new` next to `SavedProperties`. This signals an app in mid-renovation with scaffolding still up.

9. **No feedback loops.** No analytics on what users search for, what they save, what they abandon. No learning. The app is stateless in the worst sense — it forgets everything about every user the moment they leave.

This is not a criticism of the team's effort. This is r1.1 doing its job: proving the concept works. But r1.1 is a demo. v2.0 needs to be infrastructure.

---

## Part 1: Becoming an Infrastructural Layer for Property and Real Estate

### The Core Insight

Proptii should not be "another property portal." Rightmove, Zoopla, and OnTheMarket already exist. Competing with them on listings is a losing game — they have supply-side lock-in.

Instead, Proptii should become **the intelligence and transaction layer that sits between all parties in a property transaction**: tenants, landlords, agents, referencing providers, solicitors, local authorities, and financial services.

Think of it this way: Stripe did not become a bank. It became the infrastructure that makes payments work for everyone. Proptii should not become a portal. It should become the infrastructure that makes renting work for everyone.

### What "Infrastructure" Means Concretely

#### 1.1 The Proptii Property Graph

Build a unified, normalised property data graph that ingests from multiple sources and becomes the single source of truth:

- **Ingest** listings from OnTheMarket, Rightmove, OpenRent, Zoopla, Rentola, Facebook, Gumtree, direct landlord submissions, agent CRM feeds
- **Normalise** into a canonical property schema with provenance tracking (where the listing came from, when it was last verified, confidence score)
- **Enrich** with: EPC ratings (gov.uk API, free), council tax bands, flood risk, crime stats, transport links, school ratings, broadband speed, planning applications
- **Deduplicate** — the same property appears on 3 portals; Proptii knows it is one property
- **Version** — track price changes, availability changes, listing modifications over time
- **Score** — proprietary "Proptii Score" combining value, location quality, landlord reputation, condition

This graph is the moat. Once it exists, every other feature (search, matching, referencing, contracts) becomes dramatically better because it operates on enriched, deduplicated, verified data instead of raw scrapes.

**Why this wins:** Agents and landlords will want to list on Proptii directly because the data enrichment makes their listings look better. Tenants will prefer Proptii because every listing has context no other portal provides. This creates a flywheel.

#### 1.2 Tenant Identity and Portable Profile

Today, every time a tenant applies for a property, they start from zero. Fill in referencing forms. Upload documents. Prove income. Again and again.

Build a **portable tenant identity**:

- Verified identity (passport/ID scan with liveness check)
- Employment verification (linked bank account or payslip OCR)
- Rental history (previous landlord references, stored and reusable)
- Credit snapshot (with tenant's permission, refreshed periodically)
- Guarantor details (pre-verified, reusable)
- Preferences profile (location, budget, property type, move-in date, deal-breakers)

The tenant creates this profile once. When they apply for a property, they share it with one click. The landlord/agent gets a complete, verified application instantly.

**Why this wins:** Tenants adopt because it eliminates the most painful part of renting. Landlords adopt because they get better-qualified applicants faster. This is genuine infrastructure — it becomes harder to leave the more you use it.

#### 1.3 Transaction Rails

Every property rental involves the same steps: search → apply → reference → contract → payment → move-in → ongoing management. Today these are disconnected systems.

Build transaction rails that orchestrate the entire flow:

- **Viewing orchestration** — automated scheduling, reminders, feedback collection, no-show tracking
- **Application pipeline** — landlord sees ranked applicants with verified profiles, can accept/reject/waitlist
- **Referencing-as-a-service** — API that agents and landlords can call, not just a form tenants fill in
- **Contract generation** — template library with clause recommendations, e-signature, regulatory compliance checking
- **Deposit management** — integration with deposit protection schemes
- **Rent collection** — standing order setup, payment tracking, arrears alerting

Each of these is a revenue opportunity and a lock-in mechanism.

#### 1.4 Agent and Landlord API

Expose Proptii's capabilities as an API:

- Agents can push listings from their CRM
- Landlords can manage properties from their existing tools
- Third-party apps can use Proptii's referencing, contract, and payment rails
- Local authorities can query the property graph for licensing compliance

This transforms Proptii from a consumer app into a B2B platform. Consumer apps compete on features. Platforms compete on ecosystem.

---

## Part 2: Radical UI Transformation for 10X Adoption

### The Problem in One Sentence

The current UI asks users to learn the app. v2.0's UI should understand the user.

### 2.1 Kill the Portal Paradigm

**Current:** Home page → search bar → results grid → click property → modal → navigate to separate feature (viewing, referencing, contract).

**v2.0:** A single, conversational interface where Scout (the Proptii mascot — see Part 4) understands intent and executes multi-step workflows in one flow.

Example of what this looks like:

> **User:** "I'm looking for a 2 bed flat in Hackney under £1800, pet-friendly, available from March"
>
> **Scout:** Shows 7 matches ranked by Proptii Score. "I found 7 properties! 3 have verified availability. Want me to book viewings for your top choices this weekend?" 🐕
>
> **User:** "Yes, the first two"
>
> **Scout:** "Done! Saturday 11am at 42 Mare Street, Saturday 2pm at 15 Dalston Lane. I've sent calendar invites to your inbox. After viewing, I can start your application — your profile is 80% complete, just need an updated payslip."

This is not science fiction. This is a well-designed conversational UI backed by the agentic architecture described in Part 3, with Scout as its face (Part 4) and delivered through the Unified Communications Hub (Part 5).

### 2.2 The Three Interfaces

Build three distinct but connected interfaces, each optimised for its user:

#### Tenant Interface — "Find and Move"
- **Primary interaction:** Conversational search with Scout (text and voice)
- **Design language:** Clean, mobile-first, content-rich cards, minimal forms. Scout's personality woven throughout.
- **Key screens:**
  - **Home:** Single search input (no toggles, no tabs) with Scout greeting and smart suggestions based on history
  - **Results:** Full-bleed property cards with Proptii Score, price context ("12% below area average"), and one-tap actions
  - **Property:** Immersive gallery, neighbourhood context, agent response time, similar properties
  - **Journey tracker:** Visual pipeline showing where the user is (searching → viewing → applying → referencing → contract → moving in), with Scout animations at each stage
  - **Profile:** Passport-style tenant identity with completion percentage and sharing controls
  - **Scout Inbox:** Unified messaging centre (see Part 5) — all conversations across all channels in one place
- **Kill list:** Remove the OnTheMarket/Proptii toggle. Remove the 6-step referencing wizard. Remove the 3-tab contract modal. These should be automated flows, not manual processes.

#### Landlord/Agent Interface — "Manage and Earn"
- **Primary interaction:** Dashboard with AI-powered unified inbox
- **Design language:** Professional, data-dense, action-oriented. Scout present but restrained.
- **Key screens:**
  - **Portfolio overview:** Properties, occupancy, income, maintenance, compliance — all on one screen
  - **Applicant pipeline:** Kanban board of applicants per property, ranked by match quality
  - **Unified inbox:** All tenant and agent communications across email, WhatsApp, in-app, and voice in one place (see Part 5), with AI-drafted responses
  - **Analytics:** Yield analysis, market comparisons, price recommendations, vacancy prediction
- **Kill list:** Remove the iframe architecture. This must be a first-class part of the app with shared state.

#### Agent CRM Interface — "Grow Your Business"
- **Primary interaction:** Pipeline management
- **Design language:** CRM-style with property focus
- **Key screens:**
  - **Listings manager:** Bulk upload, cross-portal syndication, performance metrics per listing
  - **Client management:** Landlord relationships, tenant interactions, commission tracking
  - **Market intelligence:** Area trends, demand signals, pricing recommendations

### 2.3 Design Principles for 10X Adoption

1. **Zero forms.** Every piece of information should be collected through conversation with Scout or automation, not form fields. If the user must fill in a form, the product has failed.

2. **One-tap actions.** Book a viewing: one tap. Apply for a property: one tap (profile is pre-built). Sign a contract: one tap (biometric). Pay a deposit: one tap.

3. **Progressive disclosure.** Show the minimum needed. Reveal complexity only when asked. The first interaction with Proptii should take less than 10 seconds to demonstrate value.

4. **Mobile-native.** 80% of property searches start on mobile. The current desktop-first layout with sidebars and modals does not work on mobile. v2.0 should be designed mobile-first, desktop-enhanced.

5. **Offline-capable.** Saved properties, viewing details, and application status should work offline. Users browse properties on the tube. If the app needs a connection to show saved results, it loses.

6. **Real-time.** When a landlord accepts an application, the tenant knows instantly — Scout tells them via their preferred channel. When a new property matches a saved search, the user gets a push notification. No polling. No "refresh to see updates."

7. **Personality-driven.** Every interaction has warmth. Empty states, loading states, errors, and celebrations are all moments for Scout to connect emotionally. The app should feel like a companion, not a tool.

### 2.4 Onboarding That Converts

Current onboarding: land on home page → figure out what to do → click search → get results → realise you need to sign up to do anything useful → sign up → figure out the dashboard.

v2.0 onboarding:

1. **First 5 seconds:** Scout greets the user. "Hey! I'm Scout. What kind of place are you looking for?" (single input, text or voice)
2. **Next 10 seconds:** Show results immediately, no signup required. Scout comments on the results: "I found 12 places. This one is 15% below average for the area."
3. **First value moment:** User saves a property or gets a notification — Scout says "Want me to remember this? Sign up and I'll keep sniffing for you." Now they sign up to keep their data.
4. **Progressive profile:** Scout builds the tenant identity piece by piece through natural conversation, not an upfront form. "By the way, if you share your income range, I can tell you which of these you'd be approved for instantly."
5. **Network effect:** "Share your search with a friend" — Scout makes referral feel personal, not transactional.

---

## Part 3: Agentic AI, MCP, Voice, and Predictive Analytics

### 3.1 Agentic Architecture — The Brain of v2.0

The current app is a set of tools. v2.0 should be an agent that uses tools. That agent's public face is Scout.

#### What "Agentic" Means for Proptii

An AI agent (embodied as Scout) that can:
- **Understand** natural language queries about properties, tenancy, and transactions
- **Plan** multi-step workflows (search → filter → book viewings → prepare application → submit)
- **Execute** each step by calling appropriate services (search API, viewing scheduler, referencing service, contract generator)
- **Communicate** results and updates across any channel the user prefers (in-app, email, WhatsApp, voice)
- **Learn** from user feedback, market data, and transaction outcomes
- **Proact** — reach out to users before they ask ("A new property matching your search just listed at 8% below market rate. Shall I book a viewing?")

#### Agent Architecture

```
┌─────────────────────────────────────────────────────────────┐
│               Scout — Proptii Orchestrator Agent             │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │
│  │ Planner  │  │ Memory   │  │ Evaluator│  │ Personality│ │
│  │ (ReAct)  │  │ (Vector) │  │ (Reward) │  │ (Scout)    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬───────┘ │
│       │              │             │              │         │
│       └──────────────┼─────────────┼──────────────┘         │
│                      │             │                         │
└──────────────────────┼─────────────┼─────────────────────────┘
                       │             │
    ┌──────────────────┼─────────────┼──────────────────────┐
    │              Tool Layer (MCP Servers)                  │
    │                                                       │
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
    │  │ Property │ │ Viewing  │ │Reference │ │ Contract ││
    │  │ Search   │ │ Booking  │ │ Check    │ │ Engine   ││
    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
    │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
    │  │ Payment  │ │ Comms    │ │ Market   │ │ Profile  ││
    │  │ Rails    │ │ Hub      │ │ Data     │ │ Manager  ││
    │  │          │ │ (Part 5) │ │          │ │          ││
    │  └──────────┘ └──────────┘ └──────────┘ └──────────┘│
    └───────────────────────────────────────────────────────┘
```

The Orchestrator Agent (Scout) receives user intent (text, voice, or action), plans the steps, calls tools via MCP, wraps results in Scout's personality, and delivers them through the user's preferred communication channel.

### 3.2 Model Context Protocol (MCP) — Why It Matters

MCP is the standard for giving AI agents access to tools and data sources in a structured way. For Proptii, MCP is not a nice-to-have — it is the architecture that makes Scout work.

#### Proptii MCP Servers to Build

| MCP Server | Tools Exposed | Data Sources |
|------------|---------------|--------------|
| **proptii-property** | `search_properties`, `get_property_details`, `get_property_score`, `compare_properties`, `get_market_data` | Property Graph (PostgreSQL), external APIs |
| **proptii-viewing** | `check_availability`, `book_viewing`, `cancel_viewing`, `reschedule_viewing`, `get_viewing_feedback` | Calendar service, notification service |
| **proptii-referencing** | `start_referencing`, `check_status`, `get_report`, `verify_document` | Identity verification API, credit check API, employer verification |
| **proptii-contract** | `generate_contract`, `send_for_signing`, `check_signing_status`, `get_signed_copy` | Template engine, e-signature service |
| **proptii-profile** | `get_tenant_profile`, `update_profile`, `share_profile`, `get_completion_status` | User database, document store |
| **proptii-market** | `get_area_stats`, `get_price_trends`, `get_demand_signals`, `get_yield_analysis` | Property Graph, ONS data, Land Registry |
| **proptii-comms** | `send_message`, `send_email`, `send_whatsapp`, `send_push`, `initiate_call`, `schedule_reminder`, `get_conversation`, `set_channel_preference` | Unified Comms Hub (see Part 5) |

#### Why MCP Instead of Just REST APIs

- **Discoverability:** Scout can inspect what tools are available and what parameters they accept at runtime
- **Composability:** New capabilities (e.g., deposit protection) are added as new MCP servers without changing Scout
- **Standardisation:** Third parties can build MCP servers that plug into Scout (e.g., a solicitor's MCP server for conveyancing)
- **Context management:** MCP handles passing the right context to the right tool, including user identity, permissions, and conversation history
- **Channel awareness:** The proptii-comms MCP server lets Scout decide how and where to deliver every message based on user preference and context

### 3.3 Voice — The Hands-Free Interface

Property search is often done while commuting, cooking, or lying in bed. Voice is not a gimmick — it is the natural interface for these moments.

#### Implementation

1. **Voice input:** Web Speech API (browser-native, free) for speech-to-text. Falls back to Whisper API for accuracy.
2. **Voice output:** Text-to-speech for search results, property descriptions, viewing confirmations. Scout's voice should be warm, friendly, and slightly playful — consistent with the mascot personality. Use ElevenLabs (custom voice) or browser TTS.
3. **Conversational flow:** Scout already handles natural language. Voice is just another input/output channel routed through the Unified Communications Hub (Part 5).
4. **VoIP calling:** WebRTC or Twilio Voice for tenant-to-agent calls. Scout handles the connection ("Connecting you to the agent for 42 Mare Street...") and offers to transcribe the call for the unified inbox.

#### Voice Scenarios

- "Hey Scout, show me what's new in my search since yesterday"
- "Book a viewing for the Hackney flat this Saturday afternoon"
- "What's the average rent for a 2-bed in Brixton?"
- "Read me the tenancy agreement summary"
- "Call the agent about the Dalston property"

#### Voice Architecture

```
Microphone → Web Speech API → Text → Scout Agent → Response Text → TTS (Scout's voice) → Speaker
                                                 ↘ Tool calls → MCP Servers
                                                 ↘ Comms Hub → WhatsApp / Email / Push
```

### 3.4 Predictive Analytics — Turning Data Into Advantage

This is where the Property Graph and user behaviour data create compounding value.

#### For Tenants

| Prediction | How | Value |
|------------|-----|-------|
| **Price direction** | Historical price data + area trends + seasonal patterns | Scout says: "This property is likely to drop £100/month if you wait 2 weeks" |
| **Listing speed** | How fast similar properties get taken | Scout says: "Properties like this rent within 3 days — act fast!" |
| **Match quality** | User preferences vs property attributes + outcome data | "93% match based on your history" — like Spotify's Daily Mix for properties |
| **Move-in readiness** | Referencing status + document completeness + landlord response patterns | Scout says: "You're 2 days from being ready to move in" |
| **Neighbourhood fit** | Transport patterns + workplace location + lifestyle preferences | Scout says: "Your commute would be 23 minutes. 4 coffee shops within 5 min walk." |

#### For Landlords

| Prediction | How | Value |
|------------|-----|-------|
| **Vacancy risk** | Lease end dates + tenant satisfaction signals + market conditions | Scout alerts: "Tenant at 42 Mare Street is 68% likely to leave in March — start marketing now" |
| **Optimal pricing** | Market comps + demand signals + seasonal adjustment + property condition | "Increase rent by £50 or keep stable to reduce vacancy risk by 30%" |
| **Tenant quality score** | Application history + referencing data + payment history | "This applicant has a 94/100 reliability score from 3 verified tenancies" |
| **Maintenance prediction** | Property age + type + historical maintenance + weather patterns | Scout messages: "Boiler service recommended within 6 weeks based on usage patterns" |
| **Portfolio optimisation** | Yield analysis + capital appreciation + risk distribution | "Selling Property A and reinvesting in Area B would increase yield by 1.2%" |

#### For the Business (Proptii Internal)

| Prediction | How | Value |
|------------|-----|-------|
| **Demand forecasting** | Search volume + seasonal patterns + economic indicators | Know which areas to focus acquisition efforts |
| **Conversion prediction** | User journey analytics + feature usage + engagement patterns | Know which users will convert and when to intervene |
| **Churn prediction** | Usage patterns + satisfaction signals + competitive alternatives | Retain users before they leave |
| **Market timing** | Macroeconomic data + regulatory changes + supply pipeline | Time feature launches and marketing spend |
| **Comms effectiveness** | Open rates, response rates, channel preferences per user segment | Optimise which channel Scout uses for each message type |

#### Technical Stack for Predictive Analytics

- **Feature store:** PostgreSQL + pgvector for embeddings, or dedicated feature store (Feast, open-source)
- **Model serving:** Ollama for LLM inference, scikit-learn/XGBoost for tabular predictions, all self-hosted
- **Pipeline:** Apache Airflow or Dagster for data pipelines, dbt for transformations
- **Real-time:** Redis Streams or Apache Kafka for event processing
- **Visualisation:** Tremor (React) or Recharts for landlord/agent dashboards

---

## Part 4: Scout — The Proptii Mascot

### 4.1 Why a Mascot Changes Everything

Property rental is stressful, impersonal, and transactional. Every portal looks the same. No one has emotional loyalty to Rightmove.

A mascot transforms Proptii from a tool into a companion. Duolingo proved this at scale: their owl drives organic social content, increases retention, and creates brand recall that no amount of advertising can buy. Scout can do the same for property.

### 4.2 Scout's Identity

**Name:** Scout

**Why Scout:** It directly describes what the product does (scouts properties for you), works as a natural dog name, has no negative connotations in any market, and is easy to say, spell, and remember. "Let Scout find your next home" writes its own tagline.

**Breed direction:** A friendly, approachable dog — think Corgi, Shiba Inu, or Golden Retriever puppy. The design should be stylised and minimal, not photorealistic. Expressive vector art that works at 16px (favicon) and 1600px (hero illustration). Think Duolingo's owl: simple geometry, big eyes, strong silhouette.

**Colour palette:** Scout's primary colour should be the Proptii brand orange (`#F15A22`), with the navy (`#002B49`) as accent. Scout should be immediately recognisable as part of the Proptii brand.

**Voice and personality:**
- Warm, encouraging, slightly playful
- Knowledgeable but never condescending
- Celebrates the user's progress
- Honest about limitations ("I couldn't find pet-friendly places in that area, but here are 3 nearby options")
- Adapts formality by context — casual in chat, professional in contract-related communications

### 4.3 Scout's Mood and Context System

Scout is not static clip art. Scout is a living character that responds to context:

| Context | Scout's State | Expression |
|---------|---------------|------------|
| Searching for properties | Running/sniffing | Excited, determined |
| Results found | Sitting proudly with results | Tail wagging |
| Great match (90%+ score) | Jumping/barking | Thrilled, stars in eyes |
| No results found | Looking around, sniffing | Curious, slightly puzzled |
| Loading data | Digging | Focused, playful |
| Error occurred | Tilted head | Confused, apologetic |
| Profile incomplete | Nudging user | Encouraging, gentle |
| Viewing booked | Carrying a calendar | Happy, helpful |
| Contract signed | Celebrating | Ecstatic, confetti, party hat |
| New notification | Ears perked up | Alert, attentive |
| User idle | Sleeping/resting | Peaceful, cute |
| Payment confirmed | Holding a key | Proud, accomplished |
| New message received | Carrying an envelope | Eager, running |

### 4.4 Where Scout Should Appear

**High-impact placements (mandatory):**

1. **Conversational AI interface** — Scout IS the agent. When users interact with Proptii's AI, they are talking to Scout. Speech bubbles, contextual expressions, and personality make AI interactions feel warm instead of clinical.

2. **Onboarding** — Scout guides first-time users. "Hey! I'm Scout. I find homes for people. What are you looking for?" This replaces the current cold landing page with an emotional connection in the first 5 seconds.

3. **Empty states** — Every empty screen (no saved properties, no viewings, no search results) features Scout. "No saved properties yet. Want me to search for you?" with Scout sniffing around. These moments convert passive users into active ones.

4. **Loading states** — Replace all spinners and skeleton screens with Scout micro-animations. Scout running = searching. Scout digging = loading. Scout carrying a letter = sending. These turn waiting from frustration into delight.

5. **Notifications and push** — "Scout found 3 new properties matching your search!" with Scout's face. Push notifications with Scout's avatar get higher open rates than generic app icons.

6. **Error states** — "Scout got a bit lost. Try again?" with a confused Scout illustration is better than a red error banner. Errors become moments of empathy, not frustration.

7. **Achievement moments** — Completing referencing, booking a viewing, signing a contract: Scout celebrates with the user. Confetti. Wagging tail. "You're one step closer to home!" These dopamine hits drive completion and retention.

8. **Email and WhatsApp** — Emails come "from Scout at Proptii." WhatsApp messages use Scout's avatar. This builds brand recognition across all communication channels.

9. **Favicon and app icon** — Scout's face is the favicon and PWA icon. Instant recognition in browser tabs and home screens.

**Where to restrain Scout:**

- **Property listings and search results** — Focus should be on properties. Scout appears in the search bar and loading states but does not compete with property images and data.
- **Legal documents and contracts** — Contract content is serious. Scout celebrates after signing, not during.
- **Landlord/Agent professional dashboard** — Scout appears subtly (notification avatar, empty states) but does not dominate. The dashboard must feel like a serious business tool.
- **Preferences** — Users should be able to reduce Scout's visibility. A "Scout mode: full / minimal / off" toggle in settings respects different user preferences.

### 4.5 Scout Across Channels

Scout's personality adapts by channel while remaining recognisably Scout:

| Channel | Scout's Style | Example |
|---------|---------------|---------|
| **In-app chat** | Verbose, rich media, interactive buttons, animations | Full personality with property cards, action buttons, and celebration animations |
| **WhatsApp** | Concise, emoji-rich, action-oriented | "Hey! Found a 2-bed in Hackney, £1800/mo, pet-friendly 🐕 Tap to view: [link]" |
| **Email** | Professional but warm, visual Scout illustrations in header | "Scout's Weekly Update: 12 new properties, 2 price drops in your area" |
| **Push notification** | Ultra-brief, Scout avatar | "Scout: New match! 2-bed Hackney, £1750 🏠" |
| **Voice** | Friendly TTS persona, warm tone | "I found something exciting — a 2 bedroom flat in Hackney just listed at eighteen hundred a month. It's pet-friendly too. Shall I book a viewing?" |

### 4.6 Scout as Growth Engine

Scout is not just UX polish — Scout is a growth mechanism:

- **Social sharing:** Scout's reactions to properties are inherently shareable. "Scout's top pick this week" as a social card format.
- **Referral programme:** "Scout wants to help your friends too! Share your link and you both get premium for a month."
- **Seasonal campaigns:** Scout wearing a Santa hat at Christmas, Scout with an umbrella in rainy season, Scout with sunglasses in summer. These create organic social moments.
- **Merch potential:** Once Scout has recognition, physical merch (stickers, plush toys) becomes a brand-building channel.
- **Community:** "Scout's Renters" as a community brand for content, social media, and events.

---

## Part 5: Unified Communications Hub

### 5.1 The Problem

Communication in r1.1 is fragmented and mostly fake:

- "Chat Now" and "Call Agent" in `ListingDetailsModal.tsx` — placeholder buttons with no handlers
- `TenantInbox` in landlord agent — mock data, hardcoded messages, no real-time
- Email via Nodemailer/Resend — one-directional, transactional only
- No in-app messaging, no WhatsApp, no voice calling, no push notifications

Every "communication" feature visible in the UI is non-functional. v2.0 must make all of these real and coordinate them through a single backbone.

### 5.2 Architecture: The Proptii Comms Orchestrator

Every message, regardless of channel, flows through one system. The user sees one inbox. Scout decides which channel to use based on context and preference.

```
                    ┌──────────────────────────────────────┐
                    │     Proptii Comms Orchestrator        │
                    │                                      │
                    │  ┌───────────┐  ┌─────────────────┐  │
                    │  │ Router    │  │ Preference       │  │
                    │  │ Engine    │  │ Engine           │  │
                    │  └─────┬─────┘  └───────┬─────────┘  │
                    │        │                │            │
                    │  ┌─────┴────────────────┴──────────┐ │
                    │  │    Unified Message Store         │ │
                    │  │    (PostgreSQL + Redis)          │ │
                    │  └─────────────────────────────────┘ │
                    └────────┬───────┬───────┬───────┬─────┘
                             │       │       │       │
                    ┌────────┼───────┼───────┼───────┼─────┐
                    │        ▼       ▼       ▼       ▼     │
                    │   ┌────────┐┌──────┐┌──────┐┌──────┐ │
                    │   │In-App  ││Email ││WhatsA││Voice │ │
                    │   │WebSock.││2-way ││pp API││WebRTC│ │
                    │   └────────┘└──────┘└──────┘└──────┘ │
                    │        Channel Adapters               │
                    └───────────────────────────────────────┘
                                     │
                                     ▼
                           ┌──────────────────┐
                           │  Scout Inbox     │
                           │  (Unified UI)    │
                           └──────────────────┘
```

**Core principle:** One data model, one inbox, multiple channels. The channel is a delivery mechanism, not a destination.

### 5.3 Channel Specifications

#### In-App Messaging (Priority: Highest)

The foundation. All other channels are extensions.

- **Real-time, WebSocket-based** — Socket.io or native WebSockets. Messages appear instantly.
- **Threaded by context** — Conversations attach to a property, a viewing, a contract, or a referencing request. "Message about 42 Mare Street" is useful. "New message" is not.
- **Participant types:**
  - Tenant ↔ Agent
  - Tenant ↔ Landlord
  - Tenant ↔ Scout (AI assistant)
  - Landlord ↔ Scout (AI assistant)
  - Agent ↔ Scout (AI assistant)
- **Rich messages** — Images, documents, property cards (tap to view), action buttons ("Confirm viewing", "Sign contract"), location pins, payment links
- **Read receipts and typing indicators** — Standard modern messaging expectations
- **Scout as participant** — Scout injects helpful context into conversations: "This property is 15% below market rate for the area" or "Your referencing is 90% complete"

**Tech:** Socket.io for real-time, PostgreSQL for persistence, Redis for presence and typing indicators.

#### Email (Priority: High)

Upgrade from one-directional to intelligent two-way.

- **Inbound parsing** — Users reply to Proptii emails; replies appear in the unified inbox. Use Resend webhooks, SendGrid Inbound Parse, or Mailgun Routes.
- **Scout-branded templates** — Every email features Scout's avatar and personality. "Scout's Weekly Update: 12 new properties, 2 price drops."
- **Digest mode** — Aggregate notifications into configurable daily or weekly digests. Don't spam.
- **Transactional vs marketing** — Viewing confirmations always get through. Market updates respect unsubscribe. Separate domains for deliverability.

#### WhatsApp (Priority: High)

The dominant messaging platform for UK renters, especially younger demographics and immigrant communities. Non-negotiable for 10X adoption.

- **WhatsApp Business API** — Via Twilio, MessageBird, or 360dialog. Cost: ~£0.03–0.06 per conversation (first 1,000/month free).
- **Pre-approved templates** — Design templates for: new property alerts, viewing reminders, referencing status, contract notifications, payment reminders.
- **Two-way conversations** — Users reply on WhatsApp; replies appear in the unified inbox and Scout can respond.
- **Scout on WhatsApp** — Scout's avatar as profile picture. Messages in Scout's voice. "Hey! I found a 2-bed in Hackney, pet-friendly, £1800/mo. Tap to view."
- **Onboarding channel** — "Text START to Scout on WhatsApp to begin your search." Captures users who don't want to install an app.

#### Voice (Priority: Medium)

Two distinct use cases:

**Speech (conversational):**
- Already covered in Part 3 — user speaks, Scout responds
- Web Speech API / Whisper for input, ElevenLabs / browser TTS for output

**Calls (VoIP):**
- WebRTC or Twilio Voice for tenant ↔ agent calls
- **Click-to-call** — User taps "Call Agent," Scout connects them (masking the agent's number)
- **Transcription** — With consent, calls are recorded and transcribed. Transcript appears in the unified inbox.
- **Scout as IVR** — If the agent doesn't answer: "The agent isn't available right now. I can take a message or help you book a viewing instead."

#### Push Notifications (Priority: High)

- PWA service worker for web push
- Scout's avatar as notification icon
- Smart batching — don't fire 5 notifications in 10 minutes; aggregate and deliver at optimal times
- Deep links — every notification opens directly to the relevant context (property, conversation, viewing)

### 5.4 The Scout Inbox (UI)

One screen. Every channel. Every conversation.

```
┌──────────────────────────────────────────────────────────┐
│  🐕 Scout Inbox                        [Filter] [Search] │
├──────────────────┬───────────────────────────────────────┤
│                  │                                       │
│  Conversations   │  Current Conversation                │
│                  │                                       │
│  ┌────────────┐  │  42 Mare Street, Hackney             │
│  │🏠 42 Mare  │◄─│  with James Property Agents          │
│  │ St viewing │  │                                       │
│  │ 2 min ago  │  │  ┌─────────────────────────────┐     │
│  └────────────┘  │  │ Agent: Viewing confirmed for │     │
│                  │  │ Sat 15 Feb, 11am             │     │
│  ┌────────────┐  │  │ 📧 via Email                 │     │
│  │🔑 15 Dalst │  │  └─────────────────────────────┘     │
│  │ on contract│  │                                       │
│  │ 1 hour ago │  │  ┌─────────────────────────────┐     │
│  └────────────┘  │  │ You: Can I bring my dog to   │     │
│                  │  │ the viewing?                  │     │
│  ┌────────────┐  │  │ 💬 via WhatsApp              │     │
│  │🐕 Scout   │  │  └─────────────────────────────┘     │
│  │ 3 new      │  │                                       │
│  │ matches    │  │  ┌─────────────────────────────┐     │
│  │ 3 hrs ago  │  │  │ 🐕 Scout: Of course! The    │     │
│  └────────────┘  │  │ listing says pets welcome.   │     │
│                  │  │ I checked — no deposit       │     │
│                  │  │ surcharge for pets either.    │     │
│                  │  └─────────────────────────────┘     │
│                  │                                       │
│                  │  [Type a message...] [📎] [🎤] [Send]│
│                  │  Reply via: [In-App ▼]               │
└──────────────────┴───────────────────────────────────────┘
```

**Key features:**

1. **Channel badges** — Every message shows which channel it arrived on (📧 email, 💬 WhatsApp, 💻 in-app, 📞 phone). The user sees the full conversation regardless of channel.

2. **Context grouping** — Conversations are grouped by property or transaction, not by person. Multiple discussions about different properties with the same agent are separate threads.

3. **Scout thread** — Scout has its own conversation thread for proactive updates: new matches, reminders, tips, market insights. This is the always-on engagement channel.

4. **Inline actions** — Action buttons within conversations: "Book viewing", "Share profile", "Sign contract", "Make payment". The inbox is where things happen, not just where things are read.

5. **Channel preference** — Users set preferred channels per message type. "Property alerts on WhatsApp, viewing reminders by email, contract updates in-app." The Comms Orchestrator respects this.

6. **Smart deduplication** — If the user read the in-app message, don't also send WhatsApp. If they haven't opened the app in 24 hours, escalate to WhatsApp. If no response in 48 hours, send email. Scout learns each user's responsiveness pattern.

7. **Landlord/Agent view** — The same inbox, filtered for their role. Agents see messages from all tenants across all properties. Smart prioritisation: urgent maintenance > lease queries > general inquiries. AI-drafted reply suggestions powered by Scout.

### 5.5 Smart Notification Routing

The Comms Orchestrator decides how and when to reach each user:

```
Event occurs (e.g., new property match)
  │
  ▼
Preference Engine: What channel does this user prefer for this type?
  │
  ├─ User set "WhatsApp for property alerts"  → Send WhatsApp
  ├─ No preference set                        → Default cascade:
  │                                              1. In-app (if active)
  │                                              2. Push notification
  │                                              3. WhatsApp (if opted in)
  │                                              4. Email (always)
  │
  ▼
Timing Engine: When is this user most responsive?
  │
  ├─ User typically opens app at 8am and 9pm → Schedule for next window
  ├─ Urgent (viewing in 2 hours)             → Send immediately on all opted channels
  │
  ▼
Deduplication: Has the user already seen this?
  │
  ├─ Read in-app → Cancel pending WhatsApp/email
  ├─ Not read after 4 hours → Escalate to next channel
```

### 5.6 Comms as Revenue and Retention

The Unified Communications Hub is not just a feature — it is a retention and revenue mechanism:

- **Engagement metric:** Users who receive Scout messages via 2+ channels retain at 3–5x the rate of single-channel users (industry benchmark from Twilio/Braze data).
- **Revenue triggers:** Scout can suggest premium features at natural moments: "I found 8 properties but can only show you 3 on the free tier. Upgrade to see all of Scout's picks."
- **Agent response time** — Track and display how fast agents respond. Agents with faster response times get featured. This creates competitive pressure to be responsive, improving the tenant experience.
- **Conversation data** — Anonymised conversation patterns reveal what tenants care about most, informing property scoring and predictive models.

---

## Part 6: Revenue Model Evolution

v2.0 is not just a better product — it is a better business.

| Revenue Stream | Model | Target |
|----------------|-------|--------|
| **Tenant freemium** | Free search + basic profile. Premium: priority applications, unlimited saved searches, Scout market alerts, full Proptii Score insights | £4.99/month or £39.99/year |
| **Landlord SaaS** | Free for 1 property. Pro (5 properties): £19.99/month. Business (unlimited): £49.99/month. Includes unified inbox and Scout analytics. | Recurring |
| **Agent platform** | Per-seat pricing for CRM features + listing syndication + unified comms | £29.99/seat/month |
| **Referencing fees** | Per-reference charge (industry standard: £15–50) | Pay-per-use |
| **API access** | Developer tier for third-party integrations | Usage-based |
| **Data insights** | Market reports, area analytics, investment signals | B2B subscriptions |
| **Featured listings** | Landlords/agents pay for priority in Scout's recommendations | Pay-per-listing |
| **WhatsApp Business** | Sponsored property alerts via WhatsApp (agents pay to have Scout recommend their listings) | Pay-per-send |

---

## Part 7: What to Build First (v2.0 Roadmap)

### Quarter 1: Foundation (Weeks 1–12)

1. **Property Graph** — PostgreSQL schema, ingestion pipeline for 3 sources (OnTheMarket, OpenRent, Rightmove), deduplication, enrichment (EPC, council tax)
2. **Scout agent skeleton** — LLM orchestrator with MCP protocol, Scout personality layer, connected to property search tool
3. **Scout mascot design** — Commission vector art: full character sheet, mood states, all sizes (favicon to hero). Establish style guide.
4. **New UI shell** — Mobile-first layout, conversational search with Scout, property cards with Proptii Score, Scout in empty/loading/error states
5. **Auth migration** — Supabase Auth replacing Azure AD B2C
6. **Kill the iframe** — Merge landlord agent into main app with role-based routing
7. **In-app messaging foundation** — WebSocket infrastructure, message data model, basic Scout Inbox UI

### Quarter 2: Intelligence + Comms (Weeks 13–24)

8. **Tenant profile** — Portable identity with document upload, verification, and one-click sharing
9. **Voice interface** — Speech-to-text input, Scout TTS responses
10. **Viewing automation** — Scout books viewings, sends calendar invites, collects feedback
11. **MCP servers** — Property, viewing, profile, and comms servers operational
12. **Email upgrade** — Two-way email with inbound parsing, Scout-branded templates, digest mode
13. **WhatsApp integration** — Business API, template messages, two-way conversations, Scout on WhatsApp
14. **Push notifications** — PWA service worker, Scout avatar, smart batching
15. **Predictive v1** — Price trends, listing speed, basic match scoring

### Quarter 3: Transaction + Maturity (Weeks 25–36)

16. **Application pipeline** — Landlord sees ranked applicants, one-click accept/reject
17. **Referencing automation** — Scout orchestrates identity, employment, credit checks
18. **Contract engine** — Template generation, e-signature, compliance checking
19. **Landlord analytics** — Portfolio dashboard with vacancy prediction, pricing recommendations
20. **Voice calling (VoIP)** — WebRTC tenant-to-agent calls, transcription, Scout IVR fallback
21. **Smart notification routing** — Preference engine, timing engine, deduplication across channels
22. **Predictive v2** — Tenant quality scoring, vacancy risk, neighbourhood fit
23. **Scout personality refinement** — A/B test Scout's tone, expand mood states, seasonal variants

### Quarter 4: Platform (Weeks 37–48)

24. **Agent API** — External developers can build on Proptii's rails
25. **Agent CRM** — Full listing management, client tracking, commission calculation
26. **Marketplace** — Third-party services (insurance, moving, cleaning) integrated via MCP
27. **Predictive v3** — Portfolio optimisation, market timing, churn prediction, comms effectiveness
28. **Scout social** — Shareable Scout cards, referral programme, community features
29. **Scale** — Performance optimisation, caching, CDN, monitoring

---

## Part 8: Non-Negotiable Technical Decisions for v2.0

1. **Single app, role-based routing.** No more iframe. One React app. Roles (tenant, landlord, agent, admin) determine what you see.

2. **PostgreSQL as the primary database.** Cosmos DB and Firestore dual-write ends. One source of truth. Prisma for type safety and migrations.

3. **Event-driven architecture.** Every significant action (property listed, viewing booked, application submitted, message sent) emits an event. Services subscribe to events. This enables real-time updates, analytics, predictive models, and the Comms Orchestrator.

4. **OpenAI-compatible LLM, self-hosted option.** Use Ollama locally, vLLM or LiteLLM in production. Never lock into a single LLM provider again. Scout's personality is a system prompt layer on top of any compatible model.

5. **MCP for all tool integrations.** Every service Scout can call is an MCP server. This is how the system scales without the orchestrator becoming a monolith.

6. **Unified Comms Hub from day one.** Every message goes through the orchestrator, even in v2.0's earliest version. This ensures the data model is right before adding channels. Start with in-app, then add email, WhatsApp, voice incrementally.

7. **Scout is a design system, not an afterthought.** Scout's visual assets, personality guidelines, and mood states are documented in a design system that every contributor uses. Inconsistent Scout is worse than no Scout.

8. **Mobile-first, offline-capable.** PWA with service worker. Core flows work without connectivity.

9. **Feature flags everywhere.** Every new capability ships behind a flag. Roll out to 1%, then 10%, then 100%. Rollback in seconds.

10. **Observability from day one.** OpenTelemetry traces on every request. Sentry for errors. PostHog or Plausible for product analytics. Comms Hub analytics (open rates, response rates, channel effectiveness). No more flying blind.

---

## The 10X Thesis

r1.1 is a **property search tool** with placeholder communication buttons and no personality.

v2.0 is a **property intelligence platform** where Scout — a trusted, personality-rich AI companion — helps tenants find and secure homes, helps landlords manage and optimise portfolios, and helps agents grow their business. Scout reaches users wherever they are — in the app, on WhatsApp, via email, or by voice — through a unified communications backbone that ensures no message is lost and every interaction drives the user forward.

The 10X does not come from making each feature 10% better. It comes from:

- **Personality and emotional connection** (Scout makes the experience memorable and shareable)
- **Eliminating friction** (one-tap everything, zero forms, conversational interface)
- **Omnichannel presence** (reach users on WhatsApp, email, voice, and in-app — wherever they are)
- **Creating a data moat** (Property Graph, tenant profiles, conversation data, transaction history)
- **Compounding intelligence** (every search, viewing, message, and transaction makes Scout smarter)
- **Platform economics** (API access, third-party integrations, marketplace)

The question is not whether this is feasible. Every piece of technology described here exists today and is accessible. The question is whether the team can execute with focus and discipline, shipping one capability at a time without trying to build everything at once.

r1.1 proves the concept. v2.0 proves the business. Scout makes it unforgettable.

---

*Document prepared for Proptii v2.0 strategic planning. This is a living document — update as decisions are made and priorities shift.*
