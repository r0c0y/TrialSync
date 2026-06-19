'use client';

import { useTrial } from '@/context/TrialContext';
import { GitMerge, CheckCircle, AlertTriangle, FileSearch } from 'lucide-react';

export default function ProtocolPage() {
  const {
    data,
    isEditingProtocol,
    setIsEditingProtocol,
    editedProtocolTitle,
    setEditedProtocolTitle,
    editedInclusionCriteria,
    setEditedInclusionCriteria,
    editedExclusionCriteria,
    setEditedExclusionCriteria,
    editedPrimaryEndpoint,
    setEditedPrimaryEndpoint,
    editedAssumptions,
    setEditedAssumptions,
    handleStartEditProtocol,
    handleSaveProtocol,
  } = useTrial();

  if (!data) return null;
  const { protocol, evidenceBrief } = data;

  if (!protocol) {
    return (
      <div className="py-16 text-center text-xs text-muted">
        No protocol drafted yet. Run the design pipeline to generate one.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Study Protocol Draft</h2>
          <p className="text-xs text-muted">Drafted by Protocol Design Agent, aligned to Evidence.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 rounded bg-background border border-border text-[9px] font-mono text-muted uppercase tracking-wider">
            Version: {protocol.version}
          </span>
          {!isEditingProtocol ? (
            <button
              onClick={handleStartEditProtocol}
              className="px-2.5 py-1 rounded bg-foreground hover:bg-accent text-background hover:text-accent-foreground text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer font-bold"
            >
              Edit Protocol
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveProtocol}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer font-bold"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditingProtocol(false)}
                className="px-2.5 py-1 rounded bg-background hover:bg-surface border border-border text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditingProtocol ? (
        <div className="space-y-5">
          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2 block font-bold">1. Protocol Title</label>
            <input
              type="text"
              className="bg-background border border-border w-full p-2.5 rounded text-xs focus:border-foreground focus:outline-none text-foreground font-sans font-medium"
              value={editedProtocolTitle}
              onChange={(e) => setEditedProtocolTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2 block font-bold">2. Inclusion Criteria (One per line)</label>
              <textarea
                className="bg-background border border-border w-full p-2.5 rounded text-xs font-mono h-48 focus:border-foreground focus:outline-none text-foreground"
                placeholder="Age 18-65 years..."
                value={editedInclusionCriteria}
                onChange={(e) => setEditedInclusionCriteria(e.target.value)}
              />
            </div>

            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2 block font-bold">3. Exclusion Criteria (One per line)</label>
              <textarea
                className="bg-background border border-border w-full p-2.5 rounded text-xs font-mono h-48 focus:border-foreground focus:outline-none text-foreground"
                placeholder="Baseline ALT > 40 U/L..."
                value={editedExclusionCriteria}
                onChange={(e) => setEditedExclusionCriteria(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2 block font-bold">4. Primary Efficacy Endpoint</label>
            <textarea
              className="bg-background border border-border w-full p-2.5 rounded text-xs font-mono h-20 focus:border-foreground focus:outline-none text-foreground"
              value={editedPrimaryEndpoint}
              onChange={(e) => setEditedPrimaryEndpoint(e.target.value)}
            />
          </div>

          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2 block font-bold">5. Assumptions Flagged (One per line)</label>
            <textarea
              className="bg-background border border-border w-full p-2.5 rounded text-xs font-mono h-32 focus:border-foreground focus:outline-none text-foreground"
              value={editedAssumptions}
              onChange={(e) => setEditedAssumptions(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Protocol Content */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">1. Protocol Title</h3>
              <p className="text-sm font-semibold text-foreground">{protocol.sections_json?.title}</p>
            </div>

            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">2. Inclusion Criteria</h3>
              <ul className="space-y-3 text-xs text-muted">
                {protocol.sections_json?.inclusion_criteria?.map((c: any, i: number) => {
                  const text = typeof c === 'string' ? c : c?.criterion || '';
                  const justification = typeof c === 'object' && c?.justification ? c.justification : null;
                  const source = typeof c === 'object' && c?.evidence_source ? c.evidence_source : null;
                  return (
                    <li key={i} className="flex flex-col gap-1 border-b border-border/20 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-start gap-2">
                        <span className="text-accent font-bold shrink-0">•</span>
                        <span className="text-foreground">{text}</span>
                      </div>
                      {justification && (
                        <div className="pl-4 text-[10px] text-muted leading-relaxed">
                          <span className="font-semibold text-foreground/80">Justification:</span> {justification}
                          {source && <span className="italic ml-1">({source})</span>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">3. Exclusion Criteria</h3>
              <ul className="space-y-3 text-xs text-muted">
                {protocol.sections_json?.exclusion_criteria?.map((c: any, i: number) => {
                  const text = typeof c === 'string' ? c : c?.criterion || '';
                  const justification = typeof c === 'object' && c?.justification ? c.justification : null;
                  const source = typeof c === 'object' && c?.evidence_source ? c.evidence_source : null;
                  return (
                    <li key={i} className="flex flex-col gap-1 border-b border-border/20 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-start gap-2">
                        <span className="text-accent font-bold shrink-0">•</span>
                        <span className="text-foreground">{text}</span>
                      </div>
                      {justification && (
                        <div className="pl-4 text-[10px] text-muted leading-relaxed">
                          <span className="font-semibold text-foreground/80">Justification:</span> {justification}
                          {source && <span className="italic ml-1">({source})</span>}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">4. Primary Efficacy Endpoint</h3>
              <p className="text-xs text-foreground bg-background p-3 rounded border border-border leading-relaxed">
                {protocol.sections_json?.primary_endpoint}
              </p>
            </div>
          </div>

          {/* Assumptions */}
          <div className="space-y-6 border-l border-border pl-6">
            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-3">Assumptions Flagged</h3>
              <div className="space-y-3">
                {protocol.sections_json?.assumptions?.map((a: any, i: number) => {
                  const text = typeof a === 'string' ? a : a?.assumption || '';
                  const support = typeof a === 'object' && a?.evidence_support ? a.evidence_support : null;
                  const risk = typeof a === 'object' && a?.risk_if_wrong ? a.risk_if_wrong : null;
                  const mitigation = typeof a === 'object' && a?.mitigation ? a.mitigation : null;
                  return (
                    <div key={i} className="p-3 rounded border border-border bg-surface/20 text-xs text-muted leading-relaxed space-y-1.5">
                      <p className="text-foreground font-semibold">{text}</p>
                      {support && <p className="text-[10px]"><span className="text-foreground/75 font-semibold">Evidence Support:</span> {support}</p>}
                      {risk && <p className="text-[10px] text-red-400/80"><span className="text-foreground/75 font-semibold">Risk if Wrong:</span> {risk}</p>}
                      {mitigation && <p className="text-[10px] text-emerald-400/80"><span className="text-foreground/75 font-semibold">Mitigation:</span> {mitigation}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct Literature Citation Mapping Panel */}
      {!isEditingProtocol && (
        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground font-bold mb-4 flex items-center gap-2">
            <GitMerge className="w-4 h-4 text-accent" /> Direct Evidence Citation Mapping
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {protocol.sections_json?.exclusion_criteria?.map((item: any, i: number) => {
              const clause = typeof item === 'string' ? item : item.criterion || '';
              const clauseL = clause.toLowerCase();
              if (!clauseL) return null;

              const matchedSignal = evidenceBrief?.content_json?.safety_signals?.find((s: any) => {
                const sigL = s.signal.toLowerCase();
                
                // ALT / Liver
                if ((clauseL.includes('alt') || clauseL.includes('ast') || clauseL.includes('liver') || clauseL.includes('hepat')) && 
                    (sigL.includes('hepato') || sigL.includes('liver') || sigL.includes('alt') || sigL.includes('ast'))) {
                  return true;
                }
                // eGFR / Kidney
                if ((clauseL.includes('egfr') || clauseL.includes('renal') || clauseL.includes('kidney')) && 
                    (sigL.includes('renal') || sigL.includes('kidney') || sigL.includes('egfr'))) {
                  return true;
                }
                // Cardiac / QT / CHF / Heart
                if ((clauseL.includes('qt') || clauseL.includes('cardiac') || clauseL.includes('heart') || clauseL.includes('chf') || clauseL.includes('failure')) && 
                    (sigL.includes('qt') || sigL.includes('cardiac') || sigL.includes('heart') || sigL.includes('chf') || sigL.includes('failure') || sigL.includes('arrhythmia') || sigL.includes('cardio'))) {
                  return true;
                }
                // Sepsis / Infection
                if ((clauseL.includes('sepsis') || clauseL.includes('infection') || clauseL.includes('bacterial') || clauseL.includes('pneumonia')) && 
                    (sigL.includes('sepsis') || sigL.includes('infection') || sigL.includes('bacterial') || sigL.includes('pneumonia'))) {
                  return true;
                }
                // Pregnancy
                if (clauseL.includes('pregnancy') && sigL.includes('pregnancy')) {
                  return true;
                }
                return false;
              });

              if (!matchedSignal) return null;

              const isAligned = 
                (clause.includes('40') && matchedSignal.rationale.includes('40')) ||
                (clause.includes('60') && matchedSignal.rationale.includes('60')) ||
                (clause.includes('450') && matchedSignal.rationale.includes('450')) ||
                (clauseL.includes('sepsis') && matchedSignal.rationale.toLowerCase().includes('sepsis')) ||
                (clauseL.includes('failure') && matchedSignal.rationale.toLowerCase().includes('chf'));

              return (
                <div key={i} className="p-4 rounded border border-border bg-surface/20 flex flex-col gap-3 relative overflow-hidden group hover:border-accent/30 transition-all">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent/40 group-hover:bg-accent transition-colors" />
                  <div className="flex items-center justify-between ml-2">
                    <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Protocol Clause</span>
                    {isAligned ? (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-500 uppercase tracking-wide bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> Aligned
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-accent uppercase tracking-wide bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                        <AlertTriangle className="w-3 h-3" /> Misaligned
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground font-medium ml-2">{clause}</p>

                  <div className="mt-2 pt-3 border-t border-border border-dashed ml-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Literature Source</span>
                      <span className="text-[9px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Confidence: High</span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed mb-3">{matchedSignal.rationale}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-accent hover:text-accent-foreground cursor-pointer transition-colors bg-background border border-border rounded px-2 py-1 w-fit">
                      <FileSearch className="w-3 h-3" /> {matchedSignal.source}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
