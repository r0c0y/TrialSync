# TrialSync

**Multi-agent clinical trial design platform** powered by Band.ai. Four AI specialists collaborate in real time to synthesize evidence, draft protocols, detect conflicts, and enforce 21 CFR Part 11 compliance.

---

## How It Works

```
User uploads literature  →  Scout extracts safety signals & efficacy endpoints
                          →  Designer drafts protocol (inclusion/exclusion, endpoints)
                            →  Analyst calculates sample size & statistical power
                              →  Auditor cross-references evidence vs. protocol → flags conflicts
                                →  Human reviews & resolves conflicts in the Conflicts Hub
```

Each agent posts its reasoning (`thought`, `tool_call`, `tool_result`, `message`) to a **Band.ai room** — the Orchestration Panel in the app shows the live event stream.

## Agents

| Agent | Role | Tech |
|-------|------|------|
| **Literature Scout** | Extracts safety signals (ALT, eGFR, QTc), efficacy rates, population criteria from uploaded docs / PubMed | Gemini 1.5 Pro |
| **Protocol Designer** | Drafts inclusion/exclusion criteria, primary endpoints, flagged assumptions | Gemini 1.5 Pro |
| **Statistical Analyst** | Calculates power, sample size (chi-square), validates endpoint timing | Gemini 1.5 Flash |
| **Regulatory Auditor** | Cross-references protocol vs. evidence, detects conflicts, recommends fixes | Custom deterministic + rule-based |

## Features

- **Band.ai orchestration** — real-time agent coordination via WebSocket (Phoenix Channels)
- **Conflict detection engine** — multi-layer LLM + rule-based + citation mapping
- **Knowledge Graph** — physics-based force-directed visualization of evidence, protocol, SAP, conflicts
- **Dark mode** — persistent theme with smooth CSS transitions
- **Live data ingestion** — PubMed, ClinicalTrials.gov, openFDA
- **Audit trail** — immutable 21 CFR Part 11 compliant logs
- **Agent reasoning viewer** — expand Thought → Action → Observation → Decision for every agent step
- **Maximized chat overlay** — full-screen agent collaboration channel
- **Slash commands** — `/sync`, `/fix alt`, `/fix renal`, `/fix endpoint`, `/fix all`
- **Manual editing** — edit protocol and SAP inline, save new versions

## Quick Start

```bash
# Prerequisites: Node.js 20+
git clone https://github.com/r0c0y/TrialSync.git
cd TrialSync

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys (see below)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be auto-logged in as a demo user.

## Required API Keys

You need **at least one Gemini or Groq key** to run agents:

| Service | Where to get | Minimum |
|---------|-------------|---------|
| **Google Gemini** | https://aistudio.google.com/apikey | 1 key (all agents share) |
| **Groq** (optional fallback) | https://console.groq.com/keys | 1 key |
| **Band.ai** (for orchestration) | https://app.band.ai/settings/api-keys | 2 user tokens (free) |

Copy `.env.example` to `.env` and fill in your keys. The app works without Band.ai keys — pipeline runs locally, minus the live orchestration panel.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── agents/           # Agent endpoints (scout, designer, reviewer, statistical, chat)
│   │   ├── auth/             # Demo login & GitHub OAuth
│   │   ├── band/             # Band.ai integration (rooms, link, register, pipeline-event)
│   │   ├── clinicaltrials/   # ClinicalTrials.gov proxy
│   │   ├── conflicts/        # Conflict resolution
│   │   ├── openfda/          # openFDA safety labels proxy
│   │   ├── pubmed/           # PubMed search proxy
│   │   ├── trials/           # Trial CRUD + update
│   │   └── upload/           # File upload handler
│   ├── trial/[id]/           # Trial workspace (evidence, protocol, sap, conflicts, coordination, graph, audit)
│   ├── dashboard/            # Mission Control dashboard
│   └── login/                # Authentication page
├── components/
│   ├── BandOrchestrationPanel.tsx   # Live Band feed + topic channels
│   ├── BandAgentSetup.tsx           # One-click agent registration
│   ├── InteractiveAgentConsole.tsx  # Chat console + agent grid + activity feed
│   ├── KnowledgeGraph.tsx           # Physics-based knowledge graph
│   ├── WorkspaceNav.tsx             # Topbar + sub-navigation
│   ├── WorkspaceSubnavTabs.tsx      # Right-side document tabs
│   ├── ThemeToggle.tsx / ThemeInit.tsx  # Dark mode
│   └── UserMenu.tsx                # User dropdown
├── context/
│   ├── TrialContext.tsx      # Shared trial state (pipeline, chat, search, editing)
│   └── AuthContext.tsx       # Authentication context
├── hooks/
│   └── useBandWebSocket.ts   # Phoenix Channels WebSocket hook
└── lib/
    ├── agents.ts             # Agent orchestration logic
    ├── band.ts / band-client.ts  # Band API clients (Human + Agent APIs)
    ├── models.ts             # LLM routing (Gemini, Groq, cache)
    ├── cache.ts              # BetterDB agent cache
    ├── db.ts                 # Database abstraction (PostgreSQL / in-memory)
    ├── validationEngine.ts   # Rule-based conflict detection
    └── adapters/             # CDISC, eCTD, Veeva, Benchling adapters
```

## Architecture

```
┌─────────────┐     Band.ai WebSocket      ┌──────────────┐
│  User       │◄──────────────────────────►│  Band Room   │
│  (Browser)  │     (live events)           │  (topics)    │
└──────┬──────┘                             └──────┬───────┘
       │ REST API                                   │ Agent API
       ▼                                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                         │
│  /api/agents/*  /api/band/*  /api/trials/*  /api/pubmed ... │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    Agent Pipeline                              │
│  Scout ──► Designer ──► Analyst ──► Auditor                   │
│  (pub to Band topics on each step)                            │
└──────────────────────────────────────────────────────────────┘
```

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Built With

- [Next.js 16](https://nextjs.org/) — App Router, Turbopack
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Band.ai](https://band.ai) — Agent coordination & messaging
- [Google Gemini](https://ai.google.dev/) — LLM inference
- [Groq](https://groq.com/) — LPU inference (fallback)
- [Lucide](https://lucide.dev/) — Icons
- [BetterDB](https://github.com/iuioiua/better-db) — Agent cache
