# ⚡ Brand Compete — Autonomous Competitive Counter-Strike AI Platform ⚡

Brand Compete is a collaborative hackathon project that turns competitor signals into evidence-backed campaign briefs. Its pipeline ingests signals, combines them with brand context and reasoning rules, and prepares campaign responses with source citations. The demo uses Gymshark as an example brand.

The project includes an offline demonstration mode using cached signals and simulated integrations. Live integrations require their corresponding credentials.

---

## 🎨 Premium Visual Dashboard Preview

The frontend is built using Next.js 15 App Router with custom dark-neon CSS and glassmorphism.

- **Real-time SSE Streams**: Server-Sent Events push new competitor moves instantly with blinking glow tags (Pricing, Launch, Comparison, etc.).
- **Metrics & Latency Bar**: High-fidelity telemetry display of ingested alert tallies, average execution latency (ms), and x402 revenue aggregates ($).
- **Pipeline Flow Animator**: Visual representation of the active multi-agent pipeline transitions: `Sentinel (Ingest)` $\rightarrow$ `Strategist (Reason)` $\rightarrow$ `Actor (Publish)`.
- **Slide-out Deep-Dive Trends**: Recharts trend visualizations and domain analyses slide in from the right when selecting a competitor (e.g., Lululemon, Nike).
- **Auditable Citation Table**: Displays the root `cited.md` GFM-parsed audit trails with direct, clickable links back to original sources and Notion pages.

---

## 🚀 Quick Start Guide

### 1. Prerequisite Installations

Ensure you have **Node.js v20+** installed. Clone the repository and run:

```bash
npm install
```

### 2. Configure Environment Variables (Optional)

Configure credentials for live integrations in a local `.env.local` file. The project includes local fallback implementations for demonstrating the pipeline without configured cloud credentials.

- _If left blank, the platform automatically launches in local simulation fallback mode, loading pre-cached sweeps, local databases, and rule-based copywriters._

### 3. Set Up and Seed Demo Storage

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

- **Backgrounds**: Deep, tech-focused blue-grey slate (`#0d0f12` and `#0f1319`).
- **Neon Accents**: Cyber cyan (`#22d3ee`), emerald green (`#10b981`), high-alert rose (`#f43f5e`), and amber warning (`#f59e0b`).
- **Glassmorphism**: Elegant translucent panels (`backdrop-blur-md bg-slate-950/40 border border-white/5 shadow-2xl`).
- **Interactive Micro-Animations**: Smooth scale transitions on hover, custom keyframe glow effects on active indicator pulses, and clean, customized styled scrollbars.
