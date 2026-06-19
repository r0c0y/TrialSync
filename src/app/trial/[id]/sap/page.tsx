'use client';

import { useTrial } from '@/context/TrialContext';
import { GitMerge, CheckCircle, AlertTriangle, FileSearch } from 'lucide-react';

export default function SapPage() {
  const {
    data,
    isEditingSap,
    setIsEditingSap,
    editedAnalysisPopulation,
    setEditedAnalysisPopulation,
    editedPrimaryStatisticalMethod,
    setEditedPrimaryStatisticalMethod,
    editedCalculatedSampleSize,
    setEditedCalculatedSampleSize,
    editedAssumedActiveEfficacy,
    setEditedAssumedActiveEfficacy,
    editedAssumedPlaceboEfficacy,
    setEditedAssumedPlaceboEfficacy,
    editedAlpha,
    setEditedAlpha,
    editedPower,
    setEditedPower,
    editedEndpointValidation,
    setEditedEndpointValidation,
    handleStartEditSap,
    handleSaveSap,
  } = useTrial();

  if (!data) return null;
  const { sap, protocol, evidenceBrief } = data;

  if (!sap) {
    return (
      <div className="py-16 text-center text-xs text-muted">
        No SAP drafted yet. Run the design pipeline to generate one.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-1">Statistical Analysis Plan (SAP)</h2>
          <p className="text-xs text-muted">Sample size justifications, power calculations, and endpoints.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 rounded bg-background border border-border text-[9px] font-mono text-muted uppercase tracking-wider">
            Version: {sap.version}
          </span>
          {!isEditingSap ? (
            <button
              onClick={handleStartEditSap}
              className="px-2.5 py-1 rounded bg-foreground hover:bg-accent text-background hover:text-accent-foreground text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer font-bold"
            >
              Edit SAP
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSaveSap}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer font-bold"
              >
                Save Changes
              </button>
              <button
                onClick={() => setIsEditingSap(false)}
                className="px-2.5 py-1 rounded bg-background hover:bg-surface border border-border text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditingSap ? (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2 block font-bold">1. Analysis Population</label>
              <input
                type="text"
                className="bg-background border border-border w-full p-2.5 rounded text-xs focus:border-foreground focus:outline-none text-foreground font-sans font-medium"
                value={editedAnalysisPopulation}
                onChange={(e) => setEditedAnalysisPopulation(e.target.value)}
              />
            </div>

            <div>
              <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2 block font-bold">2. Primary Statistical Method</label>
              <input
                type="text"
                className="bg-background border border-border w-full p-2.5 rounded text-xs focus:border-foreground focus:outline-none text-foreground font-sans font-medium"
                value={editedPrimaryStatisticalMethod}
                onChange={(e) => setEditedPrimaryStatisticalMethod(e.target.value)}
              />
            </div>
          </div>

          <div className="p-4 rounded-md border border-border bg-surface/20 space-y-4">
            <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold">3. Power & Sample Size Parameters</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-[9px] font-mono text-muted uppercase block mb-1">Calculated Size</label>
                <input
                  type="text"
                  className="bg-background border border-border w-full p-2 rounded text-xs font-semibold focus:border-foreground focus:outline-none text-foreground"
                  value={editedCalculatedSampleSize}
                  onChange={(e) => setEditedCalculatedSampleSize(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-muted uppercase block mb-1">Target Efficacy</label>
                <input
                  type="number"
                  step="0.05"
                  className="bg-background border border-border w-full p-2 rounded text-xs font-semibold focus:border-foreground focus:outline-none text-foreground"
                  value={editedAssumedActiveEfficacy}
                  onChange={(e) => setEditedAssumedActiveEfficacy(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-muted uppercase block mb-1">Placebo Efficacy</label>
                <input
                  type="number"
                  step="0.05"
                  className="bg-background border border-border w-full p-2 rounded text-xs font-semibold focus:border-foreground focus:outline-none text-foreground"
                  value={editedAssumedPlaceboEfficacy}
                  onChange={(e) => setEditedAssumedPlaceboEfficacy(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-muted uppercase block mb-1">Power / Alpha</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    step="0.05"
                    className="bg-background border border-border w-1/2 p-2 rounded text-xs font-semibold focus:border-foreground focus:outline-none text-foreground"
                    value={editedPower}
                    onChange={(e) => setEditedPower(Number(e.target.value))}
                    title="Power (e.g. 0.80)"
                  />
                  <span className="text-muted text-[10px]">/</span>
                  <input
                    type="number"
                    step="0.01"
                    className="bg-background border border-border w-1/2 p-2 rounded text-xs font-semibold focus:border-foreground focus:outline-none text-foreground"
                    value={editedAlpha}
                    onChange={(e) => setEditedAlpha(Number(e.target.value))}
                    title="Alpha (e.g. 0.05)"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2 block font-bold">4. Endpoint Verification Notes</label>
            <textarea
              className="bg-background border border-border w-full p-2.5 rounded text-xs font-mono h-24 focus:border-foreground focus:outline-none text-foreground"
              value={editedEndpointValidation}
              onChange={(e) => setEditedEndpointValidation(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Calculations */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">1. Analysis Population</h3>
              <p className="text-xs text-foreground font-medium">{sap.content_json?.analysis_population}</p>
            </div>

            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">2. Primary Statistical Method</h3>
              <p className="text-xs text-foreground leading-relaxed">{sap.content_json?.primary_statistical_method}</p>
            </div>

            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-3">3. Power & Sample Size Calculation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-background border border-border">
                  <span className="font-mono text-[9px] text-muted uppercase font-bold tracking-wider">Required Sample Size</span>
                  <p className="font-bold text-foreground text-sm mt-1">{sap.content_json?.power_calculation?.calculated_sample_size}</p>
                </div>
                <div className="p-4 rounded-md bg-background border border-border">
                  <span className="font-mono text-[9px] text-muted uppercase font-bold tracking-wider">Formula / Power</span>
                  <p className="text-xs text-foreground font-semibold mt-1">
                    {sap.content_json?.power_calculation?.power * 100}% Power (alpha = {sap.content_json?.power_calculation?.alpha})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Endpoint Verification */}
          <div className="space-y-6 border-l border-border pl-6">
            <div>
              <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-3">Endpoint Verification</h3>

              {sap.content_json?.endpoint_validation?.includes('WARNING') ? (
                <div className="p-4 rounded-md border border-accent/20 bg-accent/5 text-xs text-accent space-y-2 animate-pulse-dot">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider font-mono text-[9px]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Statistical Inconsistency
                  </div>
                  <p className="leading-relaxed text-[11px] font-medium text-accent">{sap.content_json?.endpoint_validation}</p>
                </div>
              ) : (
                <div className="p-4 rounded-md border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-600 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider font-mono text-[9px]">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    Endpoint Validated
                  </div>
                  <p className="leading-relaxed text-[11px] font-medium">{sap.content_json?.endpoint_validation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Direct Literature Citation Mapping Panel */}
      {!isEditingSap && protocol && (
        <div className="md:col-span-3 mt-8 pt-8 border-t border-border">
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
