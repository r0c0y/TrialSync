'use client';

import { use, useEffect, useState, useRef } from 'react';
import {
  BookOpen, FileText, LineChart, ShieldCheck, Brain, Cpu,
  ChevronDown, ChevronUp, Radio, Activity, Zap, Filter, Clock
} from 'lucide-react';

const AGENT_META: Record<string, {
  label: string; color: string; bg: string; border: string; icon: React.ElementType; model: string;
}> = {
  'Literature Scout Agent':  { label: 'Literature Scout',    color: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.18)', icon: BookOpen,   model: 'Gemini 1.5 Pro' },
  'Protocol Design Agent':   { label: 'Protocol Designer',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.18)',icon: FileText,   model: 'Gemini 1.5 Pro' },
  'Statistical Agent':       { label: 'Statistical Analyst', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.18)', icon: LineChart,  model: 'Gemini 1.5 Flash' },
  'Regulatory Agent':        { label: 'Regulatory Auditor',  color: '#ef4444', bg: 'rgba(239,68,68,0.06)',  border: 'rgba(239,68,68,0.18)',  icon: ShieldCheck,model: 'Deterministic' },
  'Decision Orchestrator':   { label: 'Orchestrator',        color: '#ff4d00', bg: 'rgba(255,77,0,0.06)',   border: 'rgba(255,77,0,0.18)',   icon: Brain,      model: 'Gemini 1.5 Pro' },
  'System':                  { label: 'System',              color: '#6b7280', bg: 'rgba(107,114,128,0.06)',border: 'rgba(107,114,128,0.18)',icon: Cpu,        model: '—' },
  'Human Lead':              { label: 'Human Lead',          color: '#10b981', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.18)', icon: Activity,   model: '—' },
};

const ACTION_TYPES: Record<string, { label: string; color: string }> = {
  AGENT_START:      { label: 'Agent Start',     color: '#ff4d00' },
  AGENT_COMPLETE:   { label: 'Completed',       color: '#10b981' },
  FILE_UPLOAD:      { label: 'File Upload',     color: '#3b82f6' },
  CONFLICT_DETECT:  { label: 'Conflict Found',  color: '#ef4444' },
  CONFLICT_RESOLVE: { label: 'Resolved',        color: '#10b981' },
  STATUS_UPDATE:    { label: 'Status Updated',  color: '#8b5cf6' },
  BAND_ROOM_CREATE: { label: 'Band Room Init',  color: '#ff4d00' },
  BAND_ROOM_LINK:   { label: 'Band Linked',     color: '#ff4d00' },
};

// Derived reasoning path from audit log
function deriveReasoning(entry: any): { thought: string; action: string; observation: string; decision: string } | null {
  if (!['AGENT_COMPLETE', 'AGENT_START'].includes(entry.action)) return null;

  if (entry.role.includes('Literature')) return {
    thought: 'Extract safety signals from clinical literature to build structured evidence base for protocol design.',
    action: 'Analyzed literature documents for hepatotoxicity (ALT), renal impairment (eGFR), and efficacy endpoints using Gemini 1.5 Pro.',
    observation: entry.change_description,
    decision: 'Published Evidence Brief. Passed safety thresholds to Protocol Designer via Band.',
  };
  if (entry.role.includes('Protocol')) return {
    thought: 'Formulate inclusion/exclusion criteria aligned with evidence-defined safety boundaries and efficacy rates.',
    action: 'Generated protocol sections using Gemini 1.5 Pro, applying safety thresholds from Evidence Brief.',
    observation: entry.change_description,
    decision: 'Protocol v1.0 drafted. Notified Statistical Analyst for sample size calculation.',
  };
  if (entry.role.includes('Statistical')) return {
    thought: 'Calculate required sample size for statistical power given protocol primary endpoint and assumed efficacy rates.',
    action: 'Ran chi-square power calculation with α=0.05, β=0.80 using Gemini 1.5 Flash.',
    observation: entry.change_description,
    decision: 'SAP v1.0 published. Gate locked for Regulatory Review.',
  };
  if (entry.role.includes('Regulatory')) return {
    thought: 'Cross-reference protocol safety thresholds and endpoint definitions against Evidence Brief for compliance gaps.',
    action: 'Deterministic engine audited ALT limits, eGFR cutoffs, endpoint timing, and statistical validity.',
    observation: entry.change_description,
    decision: entry.change_description.includes('conflict') || entry.change_description.includes('Conflict')
      ? 'CONFLICT_DETECTED. Gating FDA workflow. Requesting human triage.'
      : 'All parameters compliant. Cleared for FDA IND submission.',
  };
  return null;
}

function EventCard({ entry }: { entry: any }) {
  const [expanded, setExpanded] = useState(false);
  const meta = AGENT_META[entry.role] || AGENT_META['System'];
  const Icon = meta.icon;
  const reasoning = deriveReasoning(entry);
  const actionCfg = ACTION_TYPES[entry.action] || { label: entry.action, color: '#6b7280' };
  const timeStr = new Date(entry.created_at).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const isConflict = entry.action === 'CONFLICT_DETECT' || entry.action === 'CONFLICT_RESOLVE';

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        background: meta.bg,
        borderColor: meta.border,
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Agent icon */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
          >
            <Icon className="w-4.5 h-4.5" style={{ color: meta.color }} size={18} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[11px] font-bold" style={{ color: meta.color }}>{meta.label}</span>
              <span
                className="px-1.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wide"
                style={{ background: `${actionCfg.color}18`, color: actionCfg.color }}
              >
                {actionCfg.label}
              </span>
              {meta.model !== '—' && (
                <span className="px-1.5 py-0.5 rounded bg-surface border border-border font-mono text-[8px] text-muted">
                  {meta.model}
                </span>
              )}
            </div>
            <p className="text-[12px] text-foreground/85 leading-relaxed">{entry.change_description}</p>

            {/* Reasoning toggle */}
            {reasoning && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-2 flex items-center gap-1 text-[10px] font-mono text-muted hover:text-foreground transition-colors"
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Hide' : 'View'} reasoning path
              </button>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-[9px] font-mono text-muted shrink-0">{timeStr}</span>
        </div>

        {/* Expanded reasoning */}
        {expanded && reasoning && (
          <div className="mt-4 ml-12 space-y-2.5 border-t border-border/50 pt-4">
            {[
              { label: '🧠 Thought',      text: reasoning.thought },
              { label: '🔧 Action',       text: reasoning.action },
              { label: '👁 Observation',  text: reasoning.observation },
              { label: '✅ Decision',     text: reasoning.decision },
            ].map(({ label, text }) => (
              <div key={label}>
                <div className="font-mono text-[9px] uppercase tracking-wide text-muted mb-0.5">{label}</div>
                <p className="text-[11px] text-foreground/80 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: trialId } = use(params);
  const [data, setData]          = useState<any>(null);
  const [loading, setLoading]    = useState(true);
  const [filterRole, setRole]    = useState('all');
  const bottomRef                = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/trials/${trialId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));

    // Poll while pipeline could be running
    const iv = setInterval(async () => {
      const res = await fetch(`/api/trials/${trialId}`).catch(() => null);
      if (!res?.ok) return;
      const d = await res.json();
      setData(d);
    }, 4000);
    return () => clearInterval(iv);
  }, [trialId]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="font-mono text-xs text-muted uppercase tracking-[0.2em]">Loading agent activity...</span>
    </div>
  );

  const { trial, auditTrail = [], conflicts = [] } = data || {};
  const openConflicts = conflicts.filter((c: any) => c.status === 'OPEN').length;

  const allRoles = [...new Set(auditTrail.map((e: any) => e.role as string))] as string[];

  const filtered = filterRole === 'all'
    ? auditTrail
    : auditTrail.filter((e: any) => e.role === filterRole);

  // Agent summary stats
  const agentStats = Object.entries(AGENT_META).map(([key, meta]) => {
    const events = auditTrail.filter((e: any) => e.role === key);
    const complete = events.some((e: any) => e.action === 'AGENT_COMPLETE');
    return { key, meta, eventCount: events.length, complete };
  }).filter(a => a.eventCount > 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-[1400px] mx-auto px-6 py-6 flex gap-6">

        {/* Main feed */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Agent Activity Feed
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Live timeline of all agent thoughts, actions, and decisions. {auditTrail.length} total events.
              </p>
            </div>
            {/* Role filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted" />
              <select
                value={filterRole}
                onChange={e => setRole(e.target.value)}
                className="bg-background border border-border rounded-lg px-2 py-1.5 text-[12px] text-foreground focus:outline-none transition-colors"
              >
                <option value="all">All Agents</option>
                {allRoles.map(r => <option key={r} value={r}>{AGENT_META[r]?.label || r}</option>)}
              </select>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="py-16 text-center rounded-xl border border-dashed border-border">
                <Activity className="w-8 h-8 text-muted mx-auto mb-3 opacity-40" />
                <p className="text-xs font-mono text-muted">No agent activity yet. Run the pipeline to see events here.</p>
              </div>
            ) : (
              filtered.map((entry: any, i: number) => (
                <div key={`${entry.id}-${i}`} className="animate-fade-in" style={{ animationDelay: `${i * 0.02}s` }}>
                  <EventCard entry={entry} />
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Sidebar: agent summary */}
        <aside className="w-64 shrink-0 space-y-4">
          <div className="rounded-xl border border-border bg-background p-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold mb-3">
              Agent Summary
            </h3>
            <div className="space-y-3">
              {agentStats.map(({ key, meta, eventCount, complete }) => {
                const Icon = meta.icon;
                return (
                  <div key={key} className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
                    >
                      <Icon size={14} style={{ color: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-medium text-foreground truncate">{meta.label}</div>
                      <div className="text-[9px] font-mono text-muted">{eventCount} event{eventCount !== 1 ? 's' : ''}</div>
                    </div>
                    {complete ? (
                      <span className="text-[9px] font-mono text-emerald-500">✓ Done</span>
                    ) : (
                      <span className="text-[9px] font-mono text-muted">Idle</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Band integration note */}
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-3.5 h-3.5 text-accent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold">Band Messages</span>
            </div>
            <p className="text-[11px] text-muted leading-relaxed">
              All agent coordination messages are published to the trial's Band room in real-time. 
              Run the pipeline to see live Band events.
            </p>
            {trial?.band_room_id && (
              <div className="mt-3 px-2.5 py-2 rounded-lg bg-accent/8 border border-accent/15 text-[10px] font-mono text-accent">
                Room: {trial.band_room_id}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-border bg-background p-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold mb-3">Pipeline Stats</h3>
            <div className="space-y-2">
              {[
                { label: 'Total Events',     value: auditTrail.length },
                { label: 'Agent Completions',value: auditTrail.filter((e: any) => e.action === 'AGENT_COMPLETE').length },
                { label: 'Conflicts Detected',value: conflicts.length },
                { label: 'Conflicts Resolved',value: conflicts.filter((c: any) => c.status === 'RESOLVED').length },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">{label}</span>
                  <span className="font-bold text-foreground">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
