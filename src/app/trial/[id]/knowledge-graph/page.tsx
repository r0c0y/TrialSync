'use client';

import { use, useState } from 'react';
import { Network } from 'lucide-react';
import KnowledgeGraph from '@/components/KnowledgeGraph';
import { useTrial } from '@/context/TrialContext';

export default function KnowledgeGraphPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: trialId } = use(params);
  const { data, loading } = useTrial();
  const [selectedNode, setSelectedNode] = useState<any>(null);

  if (loading || !data) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow mx-auto mb-3" />
        <span className="font-mono text-xs text-muted uppercase tracking-[0.2em]">Building knowledge graph...</span>
      </div>
    </div>
  );

  const { trial, evidenceBrief, protocol, sap, conflicts = [] } = data;
  const openConflicts = conflicts.filter((c: any) => c.status === 'OPEN').length;

  const nodeTypes = [
    { type: 'decision', color: '#ec4899', label: 'Trial (Central)' },
    { type: 'evidence', color: '#3b82f6', label: 'Evidence Signal' },
    { type: 'protocol', color: '#8b5cf6', label: 'Protocol Section' },
    { type: 'sap',      color: '#f59e0b', label: 'SAP Element' },
    { type: 'conflict', color: '#ef4444', label: 'Conflict / Flag' },
    { type: 'signal',   color: '#10b981', label: 'Safety Signal' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* Graph controls bar */}
      <div className="border-b border-border bg-surface/30 px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Network className="w-4 h-4 text-accent" />
          <div>
            <h1 className="text-sm font-bold">Knowledge Graph</h1>
            <p className="text-[10px] font-mono text-muted">
              Physics-based evidence chain visualization · Click nodes to inspect
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden md:flex items-center gap-3 flex-wrap">
          {nodeTypes.map(({ type, color, label }) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-[10px] font-mono text-muted">{label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Live
        </div>
      </div>

      {/* Graph + detail panel */}
      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - var(--topbar-h) - var(--subnav-h) - 57px)' }}>
        {/* Canvas */}
        <div className="flex-1 relative kg-canvas-container">
          <KnowledgeGraph
            trialName={trial?.name}
            evidenceBrief={evidenceBrief}
            protocol={protocol}
            sap={sap}
            conflicts={conflicts}
            onNodeClick={setSelectedNode}
          />

          {/* Hover hint overlay */}
          {!selectedNode && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-background/80 border border-border backdrop-blur-sm text-[10px] font-mono text-muted">
              Drag nodes · Hover to highlight · Click to inspect
            </div>
          )}
        </div>

        {/* Node detail panel */}
        {selectedNode && (
          <aside className="w-72 shrink-0 border-l border-border bg-background overflow-y-auto animate-slide-right">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <span className="text-sm font-bold">Node Detail</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-muted hover:text-foreground transition-colors text-[18px] leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Type badge */}
              <div>
                <span
                  className="inline-block px-2 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wide text-white"
                  style={{ background: selectedNode.color }}
                >
                  {selectedNode.type}
                </span>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-muted mb-1">Node</div>
                <p className="text-sm font-bold text-foreground">{selectedNode.label}</p>
              </div>

              {/* Render data based on type */}
              {selectedNode.data && (
                <div className="space-y-3">
                  {typeof selectedNode.data === 'string' ? (
                    <p className="text-[12px] text-foreground/80">{selectedNode.data}</p>
                  ) : (
                    Object.entries(selectedNode.data).slice(0, 8).map(([k, v]) => (
                      <div key={k}>
                        <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted mb-0.5">{k.replace(/_/g, ' ')}</div>
                        <p className="text-[11px] text-foreground/80">{String(v).slice(0, 120)}{String(v).length > 120 ? '…' : ''}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Stats footer */}
      <div className="border-t border-border bg-surface/30 px-6 py-2 flex items-center gap-6 text-[10px] font-mono text-muted">
        <span>{evidenceBrief?.content_json?.safety_signals?.length || 0} evidence nodes</span>
        <span>·</span>
        <span>{(protocol?.sections_json?.inclusion_criteria?.length || 0) + (protocol?.sections_json?.exclusion_criteria?.length || 0)} protocol nodes</span>
        <span>·</span>
        <span>{conflicts.length} conflict nodes</span>
        <span>·</span>
        <span>{sap ? '1 SAP node' : '0 SAP nodes'}</span>
      </div>
    </div>
  );
}
