'use client';

import { useTrial } from '@/context/TrialContext';
import { CheckCircle, GitMerge, AlertTriangle } from 'lucide-react';

export default function ConflictsPage() {
  const {
    data,
    resolutionRationals,
    setResolutionRationals,
    handleResolveConflict,
  } = useTrial();

  if (!data) return null;
  const { conflicts = [] } = data;
  const openConflicts = conflicts.filter((c: any) => c.status === 'OPEN');

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h2 className="text-lg font-bold text-foreground mb-1">Conflicts & Escalation Hub</h2>
        <p className="text-xs text-muted">Resolve design choices that contradict safety bounds or statistics.</p>
      </div>

      {openConflicts.length === 0 ? (
        <div className="py-16 text-center text-xs text-emerald-600 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-md flex flex-col items-center justify-center gap-2">
          <CheckCircle className="w-6 h-6 text-emerald-500" />
          <span className="font-bold font-mono uppercase tracking-wider">All conflicts resolved! Protocol cleared for FDA IND submission.</span>
        </div>
      ) : (
        <div className="space-y-6">
          {openConflicts.map((conf: any) => (
            <div
              key={conf.id}
              className={`p-6 rounded-md border ${
                conf.severity === 'HIGH' ? 'border-accent/15 bg-accent/[0.02]' : 'border-amber-500/15 bg-amber-500/[0.02]'
              } space-y-4`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    conf.severity === 'HIGH'
                      ? 'bg-accent/10 text-accent border border-accent/15'
                      : 'bg-amber-500/10 text-amber-700 border border-amber-500/15'
                  }`}
                >
                  {conf.severity} Conflict
                </span>
                <span className="font-mono text-[9px] text-muted">{conf.id}</span>
              </div>

              {/* Side by side positions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-background border border-border">
                  <span className="font-mono text-[9px] font-bold text-accent uppercase tracking-wider">Position A (Evidence)</span>
                  <p className="text-xs text-foreground mt-2 leading-relaxed font-medium">{conf.position_a}</p>
                </div>
                <div className="p-4 rounded-md bg-background border border-border">
                  <span className="font-mono text-[9px] font-bold text-purple-600 uppercase tracking-wider">Position B (Design Draft)</span>
                  <p className="text-xs text-foreground mt-2 leading-relaxed font-medium">{conf.position_b}</p>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-3.5 rounded-sm bg-background border border-border text-xs text-muted flex items-start gap-2 leading-relaxed">
                <GitMerge className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground">Recommendation:</strong> {conf.recommendation}
                </div>
              </div>

              {/* Resolution notes */}
              <div>
                <input
                  type="text"
                  placeholder="Enter validation notes or change justification rationale (optional)..."
                  value={resolutionRationals[conf.id] || ''}
                  onChange={(e) =>
                    setResolutionRationals((prev) => ({
                      ...prev,
                      [conf.id]: e.target.value,
                    }))
                  }
                  className="w-full bg-background border border-border rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-foreground focus:outline-none"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  onClick={() => handleResolveConflict(conf.id, 'IGNORE_CONFLICT')}
                  className="px-4 py-2 rounded-sm bg-background hover:bg-surface border border-border text-foreground text-xs font-semibold transition-colors cursor-pointer"
                >
                  Ignore (Maintain Design)
                </button>
                <button
                  onClick={() => handleResolveConflict(conf.id, 'ACCEPT_RECOMMENDATION')}
                  className="px-4 py-2 rounded-sm bg-foreground hover:bg-accent text-background hover:text-accent-foreground text-xs font-semibold transition-colors cursor-pointer"
                >
                  Accept & Update Protocol
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
