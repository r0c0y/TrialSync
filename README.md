<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/TrialSync-The%20Operating%20System%20for%20Clinical%20Trials-7c3aed?style=for-the-badge&logo=phoenix&logoColor=white&labelColor=1e1b4b">
    <img alt="TrialSync" src="https://img.shields.io/badge/TrialSync-The%20Operating%20System%20for%20Clinical%20Trials-7c3aed?style=for-the-badge&logo=phoenix&logoColor=white&labelColor=f5f3ff">
  </picture>

  <br />

  **Multi-Agent Clinical Trial Design Platform** — powered by AI orchestration

  <p align="center">
    <a href="https://trialsync.vercel.app">Live Demo</a>
    ·
    <a href="#architecture">Architecture</a>
    ·
    <a href="#agents">Agents</a>
    ·
    <a href="#quick-start">Quick Start</a>
    ·
    <a href="#pitch-deck">Pitch Deck</a>
  </p>

  <br />

  <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Band.ai-FF6B6B?style=flat-square&logo=phoenix&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini-4285F4?style=flat-square&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-FF6600?style=flat-square&logo=groq&logoColor=white" />
  <img src="https://img.shields.io/badge/FDA_Ready-00C853?style=flat-square&logo=health&logoColor=white" />

  <br />
  <br />

  <a href="https://trialsync.vercel.app">
    <img src="https://img.shields.io/badge/trialsync.vercel.app-7c3aed?style=for-the-badge&logo=vercel&logoColor=white" alt="Deployed on Vercel" />
  </a>
</div>

---

## Overview

TrialSync is an **AI-powered clinical trial design platform** where four specialized AI agents collaborate in real time — from literature review through protocol drafting, statistical analysis, and regulatory compliance — all orchestrated via [Band.ai](https://band.ai) for human-in-the-loop oversight.

> Built for the **Band.ai × Google Gemini Hackathon 2026**.

---

## Features

| Feature | Description |
|---------|-------------|
| **Multi-Agent Pipeline** | Literature Scout → Protocol Designer → Statistical Analyst → Regulatory Auditor |
| **Band.ai Orchestration** | Real-time agent coordination with live WebSocket event streaming |
| **Conflict Detection** | Multi-layer LLM + rule-based + citation mapping engine |
| **Knowledge Graph** | Physics-based force-directed visualization of all trial artifacts |
| **Document Ingestion** | PDF, DOCX, XLSX, PPTX, and OCR via LiteParse/Gemini Vision |
| **Live Data Sources** | PubMed, ClinicalTrials.gov, openFDA API integration |
| **21 CFR Part 11 Audit Trail** | Immutable, searchable, exportable compliance logs |
| **Agent Reasoning Viewer** | Expandable Thought → Action → Observation → Decision paths |
| **Dark / Light Mode** | Persistent theme with smooth CSS transitions |
| **Inline Editing** | Edit protocol and SAP in place with downstream re-triggering |
| **Slash Commands** | `/sync`, `/fix alt`, `/fix renal`, `/fix endpoint`, `/fix all` |
| **Chat Assistants** | Context-aware workspace CoPilot + global platform chat |
| **Enterprise Adapters** | CDISC SDTM, eCTD, Veeva Vault, Benchling, SAS |

---

## Architecture

### System Architecture

```mermaid
graph TB
    subgraph Client["Browser"]
        LP[Landing Page]
        DASH[Dashboard]
        WS[Workspace Split-Pane]
        KG[Knowledge Graph]
        CHAT[Chat CoPilot]
    end

    subgraph NextJS["Next.js 16 Server"]
        API[API Routes<br/>/api/agents/* /api/band/* /api/trials/*]
        AUTH[Auth<br/>Session Cookie / GitHub OAuth]
        PROXY[Proxy Middleware<br/>Auth Guard]
    end

    subgraph Agents["Agent Pipeline"]
        SCOUT[Literature Scout<br/>Gemini 1.5 Pro]
        DESIGN[Protocol Designer<br/>Gemini 1.5 Pro]
        ANALYST[Statistical Analyst<br/>Gemini 1.5 Flash]
        AUDITOR[Regulatory Auditor<br/>Deterministic + LLM]
        ORCH[Decision Orchestrator]
    end

    subgraph External["External Services"]
        BAND[Band.ai<br/>WebSocket + REST]
        GEMINI[Google Gemini]
        GROQ[Groq LPU<br/>Fallback]
        PUBMED[PubMed / NCBI]
        CTGOV[ClinicalTrials.gov]
        FDA[openFDA]
        GH[GitHub OAuth]
    end

    subgraph Storage["Storage Layer"]
        DB[(PostgreSQL /<br/>In-Memory)]
        CACHE[(Valkey /<br/>BetterDB Cache)]
        FS[File Uploads]
    end

    LP --> PROXY
    DASH --> PROXY
    WS --> PROXY
    PROXY --> API
    API --> Agents
    API --> AUTH
    AUTH --> GH

    SCOUT --> ORCH
    DESIGN --> ORCH
    ANALYST --> ORCH
    AUDITOR --> ORCH

    Agents --> BAND
    Agents --> GEMINI
    Agents -.-> GROQ
    Agents --> Storage

    API --> PUBMED
    API --> CTGOV
    API --> FDA
    API --> BAND

    WS -.-> |WebSocket| BAND
    KG --> API
    CHAT --> API
```

### Agent Pipeline Flow

```mermaid
sequenceDiagram
    actor User
    participant App as TrialSync UI
    participant API as API Routes
    participant Scout as Literature Scout
    participant Designer as Protocol Designer
    participant Analyst as Statistical Analyst
    participant Auditor as Regulatory Auditor
    participant Band as Band.ai Room

    User->>App: Upload literature documents
    App->>API: POST /api/upload
    API->>API: Parse document (PDF/OCR)
    API-->>App: Document parsed ✓

    User->>App: Run Pipeline
    App->>API: POST /api/agents/scout
    API->>Scout: Extract safety signals & endpoints
    Scout->>Band: Publish reasoning events
    Scout-->>API: Structured evidence
    API-->>App: Evidence ready

    App->>API: POST /api/agents/designer
    API->>Designer: Draft protocol
    Designer->>Band: Publish protocol decisions
    Designer-->>API: Protocol draft
    API-->>App: Protocol drafted

    App->>API: POST /api/agents/statistical
    API->>Analyst: Calculate power & sample size
    Analyst->>Band: Publish calculations
    Analyst-->>API: SAP document
    API-->>App: SAP complete

    App->>API: POST /api/agents/reviewer
    API->>Auditor: Cross-reference evidence vs protocol
    Auditor->>Band: Publish conflict alerts
    Auditor-->>API: Conflict report
    API-->>App: Conflicts detected

    Note over User,Auditor: Human-in-the-loop review
    User->>App: Review & resolve conflicts
    App->>API: POST /api/conflicts/resolve
    API-->>App: Resolution recorded ✓
    Band->>App: Real-time event stream
```

### Data Flow

```mermaid
flowchart LR
    subgraph Input
        PDF[PDF / DOCX]
        IMG[Images]
        SEARCH[PubMed / CT.gov / FDA]
    end

    subgraph Processing
        PARSE[Enterprise Parser<br/>officeparser → pdf-parse → LiteParse → Gemini Vision]
        EXTRACT[Agent Extraction<br/>Safety Signals / Endpoints / Criteria]
        VALIDATE[Validation Engine<br/>LLM + Rules + Citations]
    end

    subgraph Output
        EVID[Structured Evidence]
        PROTO[Protocol Draft]
        SAP[Statistical Analysis Plan]
        CONFLICT[Conflict Report]
        AUDIT[Audit Trail]
    end

    subgraph Storage_
        DB_[(Database)]
        CACHE_[(Agent Cache)]
    end

    PDF --> PARSE
    IMG --> PARSE
    SEARCH --> EXTRACT

    PARSE --> EXTRACT
    EXTRACT --> VALIDATE
    VALIDATE --> |Enterprise Payload| EVID
    VALIDATE --> PROTO
    VALIDATE --> SAP
    VALIDATE --> CONFLICT

    EVID --> DB_
    PROTO --> DB_
    SAP --> DB_
    CONFLICT --> DB_
    AUDIT --> DB_

    EXTRACT -.-> CACHE_
    VALIDATE -.-> CACHE_
```

---

## Agents

Four specialized AI agents collaborate in sequence, each publishing its reasoning to Band.ai for real-time human visibility.

### Literature Scout
| | |
|---|---|
| **Model** | Gemini 1.5 Pro |
| **Role** | Extracts safety signals (ALT, eGFR, QTc), efficacy rates, population criteria |
| **Input** | Uploaded documents + PubMed search results |
| **Output** | Structured evidence brief with citations |
| **Fallback** | Groq Llama 3.1 70B |

### Protocol Designer
| | |
|---|---|
| **Model** | Gemini 1.5 Pro |
| **Role** | Drafts inclusion/exclusion criteria, primary/secondary endpoints, flagged assumptions |
| **Input** | Literature Scout evidence output |
| **Output** | Protocol document (editable, versioned) |
| **Fallback** | Groq Llama 3.1 70B |

### Statistical Analyst
| | |
|---|---|
| **Model** | Gemini 1.5 Flash (fast path) |
| **Role** | Calculates power analysis, sample size (chi-square), endpoint timing validation |
| **Input** | Protocol draft |
| **Output** | Statistical Analysis Plan (SAP) |
| **Fallback** | Groq Llama 3.1 8B |

### Regulatory Auditor
| | |
|---|---|
| **Model** | Custom deterministic + rule-based + LLM |
| **Role** | Cross-references protocol vs. evidence, detects conflicts (e.g., exclusion contradicts literature) |
| **Input** | Evidence + Protocol + SAP |
| **Output** | Conflict report with severity levels + recommended fixes |
| **Fallback** | N/A (deterministic core always works) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 + CSS custom properties |
| **AI / LLM** | Google Gemini 1.5 Pro/Flash, Groq LPU (fallback) |
| **Orchestration** | Band.ai (WebSocket + REST + Agent API) |
| **Database** | PostgreSQL (via `pg`) / In-memory (fallback, seeded with 6 landmark trials) |
| **Cache** | Valkey (Redis-compatible) / BetterDB in-memory (`cache_store.json`) |
| **Document Parsing** | officeparser, pdf-parse, mammoth, LiteParse (native OCR) |
| **Auth** | Session cookies + GitHub OAuth |
| **Icons** | Lucide React |
| **Animation** | Framer Motion |
| **Deployment** | Vercel |

---

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
│   │   ├── upload/           # File upload handler
│   │   ├── chat/             # General platform chat
│   │   └── auth/             # Demo + GitHub OAuth
│   ├── trial/[id]/           # Workspace pages
│   │   ├── evidence/         # Literature sources
│   │   ├── protocol/         # Protocol draft + inline editing
│   │   ├── sap/              # Statistical Analysis Plan
│   │   ├── conflicts/        # Conflict resolution hub
│   │   ├── coordination/     # Band.ai room management
│   │   ├── knowledge-graph/  # Force-directed graph visualization
│   │   ├── audit/            # 21 CFR Part 11 audit trail
│   │   └── agent-activity/   # Live agent reasoning feed
│   ├── dashboard/            # Mission Control dashboard
│   ├── login/                # Authentication page
│   ├── page.tsx              # Landing page (scroll-reveal hero)
│   └── layout.tsx            # Root layout
├── components/
│   ├── InteractiveAgentConsole.tsx   # Main agent pipeline UI
│   ├── BandOrchestrationPanel.tsx    # Band room live message panel
│   ├── KnowledgeGraph.tsx            # Physics-based graph canvas
│   ├── WorkspaceNav.tsx              # Topbar + sub-navigation
│   ├── WorkspaceSubnavTabs.tsx       # Right-side document tabs
│   ├── WorkspaceCoPilot.tsx          # Workspace AI assistant
│   ├── GlobalCoPilot.tsx             # Global AI chat assistant
│   ├── TrialDataPopup.tsx            # New-user trial seeding
│   ├── BandAgentSetup.tsx            # Band agent registration UI
│   ├── ThemeToggle.tsx / ThemeInit.tsx # Theme management
│   ├── UserMenu.tsx                  # User dropdown
│   └── AutoLoginClient.tsx           # Auto demo login
├── context/
│   ├── TrialContext.tsx       # Shared trial state & orchestration
│   └── AuthContext.tsx        # Authentication context
├── hooks/
│   └── useBandWebSocket.ts   # Phoenix Channels WebSocket hook
├── lib/
│   ├── agents.ts             # Agent orchestration + PDF generation
│   ├── models.ts             # LLM routing (Gemini → Groq)
│   ├── band.ts / band-client.ts # Band API clients
│   ├── db.ts                 # Database layer (PostgreSQL / in-memory)
│   ├── cache.ts              # Valkey + in-memory cache
│   ├── validationEngine.ts   # Rule-based conflict detection
│   ├── sounds.ts             # Web Audio API sound effects
│   ├── proxy.ts              # Auth middleware
│   ├── adapters/             # CDISC, eCTD, enterprise payload
│   └── integrations/         # SAS, Veeva, Benchling (mocked)
└── scripts/
    ├── verify.ts             # Integration test
    └── test_gemini.ts        # Gemini connectivity tester
```

---

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

Open [http://localhost:3000](http://localhost:3000) — you land on the hero page. Click **Enter Workspace** to log in as a demo user and explore.

### Required API Keys

| Service | Where to Get | Minimum |
|---------|-------------|---------|
| **Google Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | 1 key (all agents share) |
| **Groq** (fallback) | [console.groq.com/keys](https://console.groq.com/keys) | 1 key |
| **Band.ai** (orchestration) | [app.band.ai/settings/api-keys](https://app.band.ai/settings/api-keys) | 2 user tokens (free tier) |

> The app works without Band.ai keys — the pipeline runs locally without the live orchestration panel.

---

## Pitch Deck

<a href="https://github.com/r0c0y/TrialSync/raw/main/public/TrialSync%20-%20Hackathon%20Pitch%20Deck.pdf" download>
  <img src="https://img.shields.io/badge/Download_Pitch_Deck_PDF-7c3aed?style=for-the-badge" alt="Pitch Deck PDF" />
</a>

### Demo Videos

| | |
|---|---|
| **Pitch Deck Walkthrough** | [Watch on Google Drive](https://drive.google.com/file/d/1FdZ5QqzWz-qX3RmGhyZzIdtsFlL4iTIi/view?usp=sharing) |
| **Production Walkthrough** | [Download MP4](https://github.com/r0c0y/TrialSync/raw/main/public/TrialSync%20Production%20Walkthrough%20-Band%20of%20Agents%20Hackathon.mp4) |

---

## Links

- **Live App**: [trialsync.vercel.app](https://trialsync.vercel.app)
- **GitHub**: [github.com/r0c0y/TrialSync](https://github.com/r0c0y/TrialSync)
- **Band.ai**: [band.ai](https://band.ai)
- **Google Gemini**: [ai.google.dev](https://ai.google.dev)
- **Groq**: [groq.com](https://groq.com)

---

<div align="center">
  <sub>
    Built with care for the Band.ai x Google Gemini Hackathon 2026<br />
    Contact: <a href="mailto:ranchoguruji07@gmail.com">ranchoguruji07@gmail.com</a>
  </sub>
</div>
