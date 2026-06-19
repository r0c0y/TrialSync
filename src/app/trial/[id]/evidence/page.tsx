'use client';

import { useState, useRef } from 'react';
import { useTrial } from '@/context/TrialContext';
import { Upload, BookOpen, ExternalLink, Cpu, Database, ShieldAlert, Terminal, Eye } from 'lucide-react';

export default function EvidencePage() {
  const {
    data,
    uploading,
    handleUpload,
    pubMedQuery,
    setPubMedQuery,
    pubMedSearching,
    handlePubMedSearch,
    ctCondition,
    setCtCondition,
    ctSearching,
    handleClinicalTrialsSearch,
    fdaDrugName,
    setFdaDrugName,
    fdaSearching,
    handleFDASearch,
  } = useTrial();

  const [selectedDocForModal, setSelectedDocForModal] = useState<any>(null);
  const [selectedPayloadModal, setSelectedPayloadModal] = useState<{
    title: string;
    agentName: string;
    apiName: string;
    query: string;
    payload: string;
  } | null>(null);
  const [showDevOverrides, setShowDevOverrides] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!data) return null;
  const { documents = [], evidenceBrief, trial } = data;

  const currentIndication = trial?.indication || "Crohn's Disease";
  const currentDrug = trial?.name || "Zylastin-B";

  // Mocked/Genuine clinical data retrieved by agents to show in payload popups
  const pubMedPayload = `[
  {
    "pmid": "37482910",
    "title": "Hepatotoxicity and safety boundaries of novel small molecules in IBD",
    "authors": "Smith A, et al. (2023)",
    "journal": "Journal of Clinical Gastroenterology",
    "abstract": "Clinical studies of novel IBD therapeutics have shown significant liver safety signals. Our review of 420 patients indicates a 3-fold increase in hepatotoxicity incidence when baseline alanine aminotransferase (ALT) exceeds 40 U/L. We recommend strict trial exclusion criteria of ALT > 40 U/L to prevent drug-induced liver injury."
  },
  {
    "pmid": "39102844",
    "title": "Renal safety boundaries in moderate-to-severe Crohn's disease patients",
    "authors": "Johnson R, et al. (2025)",
    "journal": "Gastroenterology Research",
    "abstract": "Crohn's disease patients presenting with structural renal impairment show high levels of active drug accumulation. In patients with eGFR < 60 mL/min/1.73m2, systemic clearance was reduced by 42%. Safety margins require patient exclusion or strict dose titration in populations with eGFR below 60."
  },
  {
    "pmid": "39551028",
    "title": "QTc prolongation parameters and cardiac markers in clinical trials",
    "authors": "Lee T, et al. (2025)",
    "journal": "Cardiology & Clinical Trials Journal",
    "abstract": "Drug-induced QT prolongation poses severe risk. Baseline screening metrics indicate patients presenting with QTc > 450 ms are highly vulnerable to arrhythmias. Strong recommendations are issued for clinical exclusion rules to lock exclusion at QTc > 450 ms."
  }
]`;

  const ctPayload = `{
  "studyType": "Interventional",
  "phase": "Phase II",
  "allocation": "Randomized",
  "interventionModel": "Parallel Assignment",
  "primaryOutcome": {
    "measure": "Clinical Remission at Week 12",
    "timeFrame": "12 weeks",
    "description": "Remission defined as Crohn's Disease Activity Index (CDAI) score < 150."
  },
  "eligibilityCriteria": {
    "inclusion": [
      "Ages 18 to 65 years",
      "Diagnosed with moderate-to-severe active Crohn's Disease",
      "CDAI score between 220 and 450 at screening"
    ],
    "exclusion": [
      "Baseline ALT > 40 U/L",
      "eGFR < 60 mL/min/1.73m2",
      "QTc interval > 450 ms",
      "Prior exposure to anti-TNF therapy within 8 weeks"
    ]
  }
}`;

  const fdaPayload = `{
  "drug_name": "${currentDrug}",
  "manufacturer": "BioPhase Solutions",
  "boxed_warning": "WARNING: HEPATOTOXICITY & ACUTE RENAL IMPAIRMENT. Severe, drug-induced liver injury (DILI) has been reported, sometimes fatal. Measure baseline ALT and monitor throughout therapy. Contraindicated in patients with moderate-to-severe renal impairment (eGFR < 60 mL/min). Risk of sudden cardiac prolongation is elevated when co-administered with CYP3A4 inhibitors.",
  "indications_and_usage": "Indicated for the treatment of moderate-to-severe active Crohn's disease in adult patients.",
  "adverse_reactions": {
    "liver_injury": "ALT elevation > 3x ULN observed in 4.2% of patients.",
    "renal_impairment": "eGFR reduction seen in patients with pre-existing mild renal insufficiency."
  }
}`;

  const agentTools = [
    {
      id: 'pubmed',
      name: 'NCBI PubMed API (Entrez)',
      status: 'Connected / Cached',
      agent: 'Literature Scout Agent',
      query: `"${currentIndication} safety boundaries ALT eGFR"`,
      description: 'Fetches peer-reviewed clinical trial publications, abstracts, and metadata on drug efficacy and toxicity limits.',
      stats: '3 articles ingested',
      payload: pubMedPayload,
      color: 'border-blue-500/20 text-blue-500 bg-blue-500/5',
      icon: BookOpen
    },
    {
      id: 'clinicaltrials',
      name: 'ClinicalTrials.gov REST API',
      status: 'Connected',
      agent: 'Protocol Designer Agent',
      query: `"${currentIndication} phase II protocol templates"`,
      description: 'Pulls existing study designs, inclusion/exclusion matrices, and endpoint timings from verified clinical registrations.',
      stats: '1 template schema loaded',
      payload: ctPayload,
      color: 'border-purple-500/20 text-purple-500 bg-purple-500/5',
      icon: Database
    },
    {
      id: 'openfda',
      name: 'openFDA Drug Label Warning API',
      status: 'Active / Gate Protected',
      agent: 'Regulatory Compliance Agent',
      query: `"${currentDrug} black-box warning ALT eGFR"`,
      description: 'Queries official FDA registrations for drug labels, contraindications, adverse reactions, and safety alerts.',
      stats: '1 black-box warning verified',
      payload: fdaPayload,
      color: 'border-red-500/20 text-red-500 bg-red-500/5',
      icon: ShieldAlert
    }
  ];

  return (
    <div className="space-y-6">
      {/* Upper header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Literature Sources & Evidence</h2>
          <p className="text-xs text-muted">Ingest clinical reference papers and audit agent API executions.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUpload}
            accept=".pdf,.txt,.docx,.doc,.xlsx,.xls,.pptx,.csv,.tsv,.rtf,.md,.xml,.json,.html,.htm"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm border border-border bg-background hover:bg-surface transition-colors text-xs font-semibold text-foreground cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? 'Uploading...' : 'Upload Reference Paper'}
          </button>
        </div>
      </div>

      {/* 🤖 Agent API Integrations & Tools Registry */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted flex items-center gap-1.5 font-bold">
            <Cpu className="w-3.5 h-3.5" /> Agent API Integrations & External Tool Calls
          </h3>
          <span className="text-[9px] font-mono text-muted bg-surface/50 border border-border px-2 py-0.5 rounded">
            Live Monitoring
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {agentTools.map((tool) => {
            const ToolIcon = tool.icon;
            return (
              <div key={tool.id} className="p-4 rounded-xl border border-border bg-surface/10 hover:bg-surface/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${tool.color}`}>
                    <ToolIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-xs text-foreground">{tool.name}</h4>
                      <span className="text-[8px] font-mono text-muted border border-border px-1.5 py-0.2 rounded uppercase">
                        {tool.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted max-w-xl leading-relaxed">{tool.description}</p>
                    <div className="flex items-center gap-2 text-[9px] font-mono text-muted flex-wrap">
                      <span className="text-foreground font-semibold flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-accent" /> {tool.agent}
                      </span>
                      <span>·</span>
                      <span>Query: <code className="text-foreground bg-surface border border-border px-1 py-0.2 rounded">{tool.query}</code></span>
                      <span>·</span>
                      <span className="text-emerald-500 font-bold">{tool.stats}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3 self-end md:self-center">
                  <button
                    onClick={() => setSelectedPayloadModal({
                      title: tool.name,
                      agentName: tool.agent,
                      apiName: tool.id,
                      query: tool.query,
                      payload: tool.payload
                    })}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-background hover:bg-surface border border-border text-[10px] font-mono font-bold text-foreground cursor-pointer transition-all group-hover:border-accent/40"
                  >
                    <Eye className="w-3.5 h-3.5 text-accent" /> View Payload
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Collapsible Developer overrides */}
      <div className="border border-border rounded-xl bg-surface/5 overflow-hidden">
        <button
          onClick={() => setShowDevOverrides(!showDevOverrides)}
          className="w-full p-3 bg-surface/20 flex items-center justify-between text-[9px] font-mono uppercase tracking-[0.12em] text-muted hover:text-foreground transition-colors font-bold"
        >
          <span>🛠️ Manual API Overrides / Developer Testing</span>
          <span>{showDevOverrides ? 'Hide Overrides' : 'Show Overrides'}</span>
        </button>

        {showDevOverrides && (
          <div className="p-4 border-t border-border space-y-4 animate-fade-in">
            {/* PubMed Search Ingestion Box */}
            <div className="p-4 rounded-md border border-border bg-background space-y-3">
              <div>
                <h4 className="text-xs font-bold text-foreground">Force Manual PubMed Import</h4>
                <p className="text-[10px] text-muted">Bypass agent caching to run a manual query against NCBI Entrez.</p>
              </div>
              <form onSubmit={handlePubMedSearch} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Query..."
                  value={pubMedQuery}
                  onChange={(e) => setPubMedQuery(e.target.value)}
                  disabled={pubMedSearching}
                  className="flex-1 bg-background border border-border rounded-sm px-3 py-1.5 text-xs font-mono text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={pubMedSearching || !pubMedQuery.trim()}
                  className="px-4 py-1.5 rounded-sm bg-foreground hover:bg-accent text-background hover:text-accent-foreground text-xs font-semibold font-mono uppercase"
                >
                  {pubMedSearching ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>

            {/* ClinicalTrials + FDA grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ClinicalTrials */}
              <div className="p-4 rounded-md border border-border bg-background space-y-3">
                <h4 className="text-xs font-bold text-foreground">Force Protocol Import</h4>
                <form onSubmit={handleClinicalTrialsSearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Condition..."
                    value={ctCondition}
                    onChange={(e) => setCtCondition(e.target.value)}
                    disabled={ctSearching}
                    className="flex-1 bg-background border border-border rounded-sm px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={ctSearching || !ctCondition.trim()}
                    className="px-3 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold font-mono uppercase"
                  >
                    Import
                  </button>
                </form>
              </div>

              {/* FDA */}
              <div className="p-4 rounded-md border border-border bg-background space-y-3">
                <h4 className="text-xs font-bold text-foreground">Force FDA Warning Check</h4>
                <form onSubmit={handleFDASearch} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Drug..."
                    value={fdaDrugName}
                    onChange={(e) => setFdaDrugName(e.target.value)}
                    disabled={fdaSearching}
                    className="flex-1 bg-background border border-border rounded-sm px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={fdaSearching || !fdaDrugName.trim()}
                    className="px-3 py-1.5 rounded-sm bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold font-mono uppercase"
                  >
                    Check
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ingested Literature list */}
      <div>
        <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-4 font-bold">Ingested reference papers</h3>
        {documents.filter((d: any) => d.type === 'LITERATURE').length === 0 ? (
          <div className="py-12 border border-dashed border-border rounded-md text-center text-xs text-muted bg-surface/20">
            No reference papers uploaded yet. Upload a Crohn's trial paper or run search to begin.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {documents.filter((d: any) => d.type === 'LITERATURE').map((doc: any) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDocForModal(doc)}
                className="p-4 rounded-md border border-border bg-background hover:bg-surface/30 hover:border-accent/40 flex items-center justify-between cursor-pointer transition-all duration-200 group"
                title="Click to read document"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <BookOpen className="w-5 h-5 text-accent shrink-0 group-hover:scale-105 transition-transform" />
                  <div className="truncate">
                    <h4 className="font-bold text-xs text-foreground truncate group-hover:text-accent transition-colors">{doc.name}</h4>
                    <p className="text-[9px] text-muted font-mono mt-0.5">SHA: {doc.hash.substring(0, 12)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[9px] text-muted">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Structured Evidence Brief Panel */}
      <div className="border-t border-border pt-6">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-4 font-bold">Literature Scout Output</h3>
        {!evidenceBrief ? (
          <div className="py-16 text-center text-xs text-muted border border-dashed border-border rounded-md bg-surface/20">
            Run the Literature Scout Agent on reference papers to generate the Evidence Brief.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Safety Signals Cards */}
            <div>
              <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-3">Detected Safety Signals</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evidenceBrief.content_json?.safety_signals?.map((sig: any, index: number) => (
                  <div key={index} className="p-4 rounded-md border border-accent/15 bg-accent/[0.03] relative">
                    <span className="absolute top-3 right-3 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/5 text-accent border border-accent/15">
                      {sig.severity}
                    </span>
                    <h5 className="font-bold text-xs text-foreground mb-1.5">{sig.signal}</h5>
                    <p className="text-[11px] text-muted leading-relaxed">{sig.rationale}</p>
                    <div className="mt-3 flex items-center justify-between text-[9px] font-mono text-muted">
                      <span>Incidence: {sig.incidence}</span>
                      <span>Ref: {sig.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Efficacy & Target Population Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
              {/* Efficacy */}
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-3">Efficacy Endpoints</h4>
                {evidenceBrief.content_json?.efficacy?.map((eff: any, index: number) => (
                  <div key={index} className="p-4 rounded-md border border-border bg-background">
                    <h5 className="font-bold text-xs text-foreground mb-1">{eff.endpoint}</h5>
                    <p className="text-[11px] text-muted leading-relaxed mb-3">{eff.rationale}</p>
                    <div className="flex items-center justify-between text-[9px] font-mono text-muted border-t border-border/50 pt-2">
                      <span>Target Effect: <strong className="text-accent">{eff.rate}</strong></span>
                      <span>Ref: {eff.source}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Populations */}
              <div>
                <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-3">Patient Population Rules</h4>
                <div className="p-4 rounded-md border border-border bg-background space-y-3">
                  <div>
                    <span className="font-mono text-[9px] font-bold text-muted uppercase tracking-wider">Suggested Inclusions</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {evidenceBrief.content_json?.populations?.inclusion?.map((inc: string, index: number) => (
                        <span key={index} className="px-2 py-0.5 rounded bg-surface text-foreground text-[10px] border border-border font-medium">
                          {inc}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-border/50 pt-2.5">
                    <span className="font-mono text-[9px] font-bold text-muted uppercase tracking-wider">Suggested Exclusions</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {evidenceBrief.content_json?.populations?.exclusion?.map((exc: string, index: number) => (
                        <span key={index} className="px-2 py-0.5 rounded bg-accent/5 text-accent text-[10px] border border-accent/15 font-medium">
                          {exc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 📋 Raw Payload Inspector Popup Modal */}
      {selectedPayloadModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-background border border-border rounded-lg w-full max-w-2xl h-[70vh] flex flex-col shadow-2xl overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="p-4 border-b border-border bg-surface/30 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="truncate">
                  <h3 className="font-bold text-sm text-foreground truncate">{selectedPayloadModal.title}</h3>
                  <p className="text-[9px] text-muted font-mono mt-0.5">
                    Agent Call: <span className="text-foreground">{selectedPayloadModal.agentName}</span> · Query: <span>{selectedPayloadModal.query}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayloadModal(null)}
                className="p-1.5 rounded hover:bg-surface border border-border/60 text-muted hover:text-foreground transition-all cursor-pointer font-mono text-[10px] uppercase tracking-wider px-2 shrink-0"
              >
                Close
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2 font-bold">API Response Payload</h4>
                <pre className="p-4 rounded border border-border bg-surface/40 font-mono text-[11px] text-foreground leading-relaxed overflow-x-auto whitespace-pre-wrap select-text max-h-[50vh]">
                  {selectedPayloadModal.payload}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Literature Document Reader Modal */}
      {selectedDocForModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-background border border-border rounded-lg w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-zoom-in">
            {/* Header */}
            <div className="p-4 border-b border-border bg-surface/30 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <BookOpen className="w-4 h-4 text-accent shrink-0" />
                <div className="truncate">
                  <h3 className="font-bold text-sm text-foreground truncate">{selectedDocForModal.name}</h3>
                  <p className="text-[9px] text-muted font-mono mt-0.5">SHA: {selectedDocForModal.hash} • Ingested: {new Date(selectedDocForModal.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocForModal(null)}
                className="p-1.5 rounded hover:bg-surface border border-border/60 text-muted hover:text-foreground transition-all cursor-pointer font-mono text-[10px] uppercase tracking-wider px-2 shrink-0"
              >
                Close
              </button>
            </div>

            {/* Document Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 select-text">
              <div>
                <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2 font-bold">Metadata Summary</h4>
                <div className="grid grid-cols-2 gap-4 p-3 rounded border border-border/85 bg-surface/10 font-mono text-[10px] text-muted mb-6">
                  <div>
                    <span className="text-foreground font-semibold block uppercase tracking-wider text-[8px] mb-0.5">Document Type</span>
                    {selectedDocForModal.type}
                  </div>
                  <div>
                    <span className="text-foreground font-semibold block uppercase tracking-wider text-[8px] mb-0.5">Unique Reference ID</span>
                    {selectedDocForModal.id}
                  </div>
                </div>

                <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-3 font-bold">Document Text Content</h4>
                <div className="p-4 rounded border border-border bg-background/50 font-mono text-xs text-foreground leading-relaxed whitespace-pre-wrap select-text max-h-[50vh] overflow-y-auto">
                  {selectedDocForModal.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
