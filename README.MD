# ⚡ Autonomous Competitive Counter-Strike AI Platform ⚡

A premium, white-label autonomous competitive intelligence platform (default brand: **Gymshark**) that ingests open-web competitor signals, reasons over brand positioning USPs and Vadalog ontological rules, publishes structured tactical counter-campaign briefs directly to Notion databases, and logs transaction metadata under an x402 micropayments rail.

The entire application compiles with **zero errors** and runs **100% out-of-the-box offline** using an elegant multi-mode mock fallback layer (no API keys required!).

---

## 🎨 Premium Visual Dashboard Preview

The frontend is built using Next.js 15 App Router with custom dark-neon CSS and glassmorphism.

* **Real-time SSE Streams**: Server-Sent Events push new competitor moves instantly with blinking glow tags (Pricing, Launch, Comparison, etc.).
* **Metrics & Latency Bar**: High-fidelity telemetry display of ingested alert tallies, average execution latency (ms), and x402 revenue aggregates ($).
* **Pipeline Flow Animator**: Visual representation of the active multi-agent pipeline transitions: `Sentinel (Ingest)` $\rightarrow$ `Strategist (Reason)` $\rightarrow$ `Actor (Publish)`.
* **Slide-out Deep-Dive Trends**: Recharts trend visualizations and domain analyses slide in from the right when selecting a competitor (e.g., Lululemon, Nike).
* **Auditable Citation Table**: Displays the root `cited.md` GFM-parsed audit trails with direct, clickable links back to original sources and Notion pages.

---

## 🚀 Quick Start Guide

### 1. Prerequisite Installations
Ensure you have **Node.js v20+** installed. Clone the repository and run:
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
Check [.env.example](file:///Users/shawn/Projects/tokens_hack/.env.example) to see how to connect to real cloud endpoints (Notion, Gemini, ClickHouse, Tavily, Senso). 
* *If left blank, the platform automatically launches in local simulation fallback mode, loading pre-cached sweeps, local databases, and rule-based copywriters.*

### 3. Setup & Seed Falling Storage
Before running the server, execute the database creation and seeding scripts:
```bash
npx tsx scripts/setup-clickhouse.ts
npx tsx scripts/seed-demo-data.ts
npx tsx scripts/seed-senso.ts
```

### 4. Run the Development Server
Launch Next.js:
```bash
npm run dev
```
Open **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)** (or `http://localhost:3001/dashboard` if port 3000 is occupied).

---

## 🧪 Automated Testing & Validation

The platform includes a robust programmatic test suite in `scripts/run-tests.ts` verifying all 10 integration and agent layers. Run the tests with:

```bash
npx tsx scripts/run-tests.ts
```

### Programmatic Validation Outputs
```text
[ClickHouse] Using local file-backed JSON fallback.
[Senso.ai] Operating in JSON Local Fallback mode.
[Prometheux] Operating in local Vadalog reasoning simulation fallback mode.
[Notion] Operating in simulation fallback mode.

====================================================
🚀 STARTING AUTOMATED PLATFORM TEST SUITE 🚀
====================================================

👉 Running Check #1: Tenant Configuration Loader Engine...
✅ [PASS] Tenant ID must be "gymshark", got "gymshark"
✅ [PASS] Tenant display name must be 'Gymshark'
✅ [PASS] Tenant must have competitors configured
✅ [PASS] Tenant must have Tavily search profiles configured

👉 Running Check #2: ClickHouse Local File-backed DB Fallback Driver...
[ClickHouse] Fallback JSON storage verified.
✅ [PASS] Should be operating in fallback mode in test env without host credentials
✅ [PASS] Expected exactly 1 event, got 1
✅ [PASS] Event ID mismatch
✅ [PASS] Could not fetch event by ID
✅ [PASS] URL hash mismatch on retrieved item
✅ [PASS] Expected 1 competitor event in stats
✅ [PASS] Expected a 14-day trend array
✅ [PASS] Expected exactly 1 counter-action
✅ [PASS] Action ID mismatch
✅ [PASS] Expected trigger event to be marked as processed
✅ [PASS] Expected 1 revenue record
✅ [PASS] Expected total revenue of $0.49, got $0.49

👉 Running Check #3: Tavily Ingestion Cache & Offline Snapshot Loader...
[Tavily] Operating in CACHED mode for tenant "gymshark". Reading from snapshots...
[Tavily] Loaded 4 events from cached snapshot: 2026-06-26_sweep.json
✅ [PASS] Tavily search sweep should return cached snapshot items when offline
✅ [PASS] Tavily snapshot should contain standard seeded competitors
✅ [PASS] Expected raw events to contain a source URL

👉 Running Check #4: Gemini Classifier & Local Rules Fallback Engine...
✅ [PASS] Expected valid severity rating
✅ [PASS] Expected generated summary text

👉 Running Check #5: Senso.ai Semantic Brand Knowledge Base Fallback...
✅ [PASS] Expected retrieved positioning facts
✅ [PASS] Expected USP or positioning facts

👉 Running Check #6: Prometheux Vadalog Strategic Reasoning Module...
✅ [PASS] Expected derived strategy angle
✅ [PASS] Expected list of applied logical rules
✅ [PASS] Expected explanation lineages

👉 Running Check #7: Notion Campaign Brief Publisher Driver...
✅ [PASS] Expected published URL on Notion domain
✅ [PASS] Expected Notion page ID

👉 Running Check #8: Sentinel Agent End-to-End Sweep Orchestrator...
[Sentinel Agent] Starting sweep for brand: "Gymshark" (gymshark)
[Tavily] Operating in CACHED mode for tenant "gymshark". Reading from snapshots...
[Tavily] Loaded 4 events from cached snapshot: 2026-06-26_sweep.json
[Sentinel Agent] Processing new event: "Lululemon slashes Align leggings pricing by 15% across UK e-commerce"
[Sentinel Agent] Processing new event: "Lululemon launches bio-nylon premium clothing range in London flagship stores"
[Sentinel Agent] Processing new event: "Nike UK launches 48-hour flash sale with up to 40% off Training Gear"
[Sentinel Agent] Processing new event: "ASOS 4505 private-label activewear expanded with £18 budget gym leggings"
[Sentinel Agent] Sweep finished. Ingested total: 4. New stored: 4
✅ [PASS] Sweep tenant ID mismatch
✅ [PASS] Sweep should ingest elements
✅ [PASS] Sweep should store new unique events in the database
✅ [PASS] Stored events tally mismatch with sweep summary

👉 Running Check #9: Strategist Agent Multi-Agent Planner...
[Strategist Agent] Initiating tactical strategy analysis for Event: "evt_test_strategist_123"
[Strategist Agent] [Node 1] Loaded trigger event: "Nike UK slashes training gears"
[Strategist Agent] [Node 2] Ingested 2 relevant brand facts from Senso.
[Strategist Agent] [Node 3] Vadalog strategic angle derived: "Value-Driven Multi-Pack Bundle Campaign"
[Strategist Agent] [Node 4] Grounded copy draft written successfully.
✅ [PASS] Plan event ID mismatch
✅ [PASS] Plan tenant ID mismatch
✅ [PASS] Plan competitor mismatch
✅ [PASS] Expected formatted campaign copy in content draft

👉 Running Check #10: Actor Agent Publisher, Latency Telemetry & Citations Tracer...
[Actor Agent] Executing publication for Strategy: "Sustainable Highlight Campaign"
[Actor Agent] Appended citation trace to cited.md
[Actor Agent] Publication successful. Notion Page: https://notion.so/gymshark-workspace/sustainable-highlight-campaign-h7h294mm in 0ms.
✅ [PASS] Expected valid counter-action ID format
✅ [PASS] Expected mock Notion URL
✅ [PASS] Expected a non-negative execution latency
✅ [PASS] Expected root cited.md file to be created/appended to
✅ [PASS] Citations trace missing original event title
✅ [PASS] Citations trace missing derived strategy angle
✅ [PASS] Citations trace missing published brief link

====================================================
🎉 ALL 10/10 PLATFORM CHECKS COMPLETED SUCCESSFULLY! 🎉
====================================================
```

---

## 🛠️ Project & Directory Map

```text
tokens_hack/
├── config/
│   ├── tenants/
│   │   ├── _template.yaml           # Tenant config schema template
│   │   └── gymshark.yaml            # Gymshark configuration parameters
│   └── tavily_profiles.yaml         # Web-signal search categories
├── data/
│   ├── db_fallback.json             # File-backed ClickHouse database fallback
│   ├── senso_kb.json                # Seeded brand facts for vector fallbacks
│   └── snapshots/
│       └── gymshark/
│           ├── 2026-06-26_sweep.json# Local Tavily cached web alerts
│           └── manifest.json        # Snapshot cache manifest descriptor
├── scripts/
│   ├── cache-tavily-snapshot.ts     # Caches a live web crawl to static snapshots
│   ├── run-tests.ts                 # Programmatic test suite (10 test cases)
│   ├── seed-demo-data.ts            # Seeds events and mock briefs
│   ├── seed-senso.ts                # Seeds Senso KB with Gymshark brand facts
│   ├── setup-clickhouse.ts          # Verifies tables or fallback state
│   └── sweep.ts                     # Cron sweep loop (every 15 min daemon)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agents/              # Asynchronous agent trigger routes
│   │   │   ├── dashboard/           # UI state feeds, real-time SSE routes
│   │   │   └── intelligence/        # Gated payment endpoints
│   │   ├── dashboard/
│   │   │   ├── components/          # Premium dark-neon glassmorphism panels
│   │   │   └── page.tsx             # Interactive dashboard grid layout
│   │   ├── globals.css              # Custom keyframes, glow fonts, scrollbars
│   │   └── layout.tsx               # Plus Jakarta Sans and Outfit font hydration
│   └── lib/
│       ├── agents/                  # Sentinel, Strategist, and Actor definitions
│       ├── integrations/            # Tavily, ClickHouse, Senso, Prometheux, Notion, x402
│       └── tenant.ts                # Tenant loader with zero client-leak protection
├── AGENTS.md                        # Prompt and multi-agent logical designs
├── cited.md                         # GFM markdown table of citations and lineage
└── next.config.ts                   # Next.js optimization parameters
```

---

## 💎 Design System & Aesthetics

Built from the ground up for maximum visual engagement:
* **Backgrounds**: Deep, tech-focused blue-grey slate (`#0d0f12` and `#0f1319`).
* **Neon Accents**: Cyber cyan (`#22d3ee`), emerald green (`#10b981`), high-alert rose (`#f43f5e`), and amber warning (`#f59e0b`).
* **Glassmorphism**: Elegant translucent panels (`backdrop-blur-md bg-slate-950/40 border border-white/5 shadow-2xl`).
* **Interactive Micro-Animations**: Smooth scale transitions on hover, custom keyframe glow effects on active indicator pulses, and clean, customized styled scrollbars.