'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Activity, Search, TrendingUp, AlertTriangle, CheckCircle,
  Clock, ChevronRight, FolderOpen, Sparkles, FlaskConical,
  ShieldCheck, BookOpen, FileText, LineChart, Zap, Radio,
  GitMerge, Filter, RefreshCw, X, ArrowUpRight
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';

// ── Status config ──────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  INITIAL:                     { label: 'Ready',          cls: 'badge-initial',   dot: 'bg-muted' },
  EVIDENCE_COMPLETE:           { label: 'Evidence Ready', cls: 'badge-evidence',  dot: 'bg-blue-500' },
  PROTOCOL_DRAFT_COMPLETE:     { label: 'Protocol Ready', cls: 'badge-protocol',  dot: 'bg-purple-500' },
  SAP_COMPLETE:                { label: 'SAP Done',       cls: 'badge-triage',    dot: 'bg-amber-500' },
  CONFLICT_DETECTED:           { label: 'Conflict',       cls: 'badge-conflict',  dot: 'bg-red-500' },
  STATUS_AWAITING_HUMAN_TRIAGE:{ label: 'Needs Review',   cls: 'badge-conflict',  dot: 'bg-red-500' },
  APPROVED_REGULATORY:         { label: 'FDA Cleared',    cls: 'badge-approved',  dot: 'bg-emerald-500' },
};

const AGENT_STEPS = [
  { key: 'scout',      label: 'Literature Scout',    color: 'var(--agent-scout)' },
  { key: 'designer',   label: 'Protocol Designer',   color: 'var(--agent-designer)' },
  { key: 'analyst',    label: 'Statistical Analyst', color: 'var(--agent-analyst)' },
  { key: 'auditor',    label: 'Regulatory Auditor',  color: 'var(--agent-auditor)' },
];

function getAgentProgress(status: string): number {
  const map: Record<string, number> = {
    INITIAL: 0,
    EVIDENCE_COMPLETE: 25,
    PROTOCOL_DRAFT_COMPLETE: 50,
    SAP_COMPLETE: 75,
    CONFLICT_DETECTED: 90,
    STATUS_AWAITING_HUMAN_TRIAGE: 90,
    APPROVED_REGULATORY: 100,
  };
  return map[status] ?? 0;
}

// ── Trial Card ──────────────────────────────────────────────
function TrialCard({ trial }: { trial: any }) {
  const cfg = STATUS_CONFIG[trial.status] || STATUS_CONFIG.INITIAL;
  const progress = getAgentProgress(trial.status);
  const conflicts = trial.individual_conflict_count || 0;
  const isConflict = ['CONFLICT_DETECTED', 'STATUS_AWAITING_HUMAN_TRIAGE'].includes(trial.status);

  return (
    <Link
      href={`/trial/${trial.id}`}
      className={`group block rounded-xl border bg-background transition-all duration-200 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 ${
        isConflict
          ? 'border-red-500/25 hover:border-red-500/40'
          : 'border-border hover:border-foreground/20'
      }`}
    >
      {/* Card header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wide ${cfg.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${isConflict ? 'animate-pulse-dot' : ''}`} />
                {cfg.label}
              </span>
              {trial.band_room_id && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-accent/8 text-accent border border-accent/15">
                  <Radio className="w-2.5 h-2.5" />
                  Band
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm text-foreground leading-snug group-hover:text-accent transition-colors line-clamp-2">
              {trial.name}
            </h3>
          </div>
          <ChevronRight className="w-4 h-4 text-muted shrink-0 mt-0.5 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted">
          <FlaskConical className="w-3 h-3 shrink-0" />
          <span className="truncate">{trial.indication}</span>
          <span className="w-0.5 h-3 bg-border shrink-0" />
          <span className="font-mono shrink-0">{trial.id}</span>
        </div>
      </div>

      {/* Pipeline progress */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-2 mb-2">
          {AGENT_STEPS.map((step, i) => {
            const stepProgress = (i + 1) * 25;
            const active = progress >= stepProgress;
            const current = progress === (i) * 25 && progress < stepProgress;
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full h-1 rounded-full transition-all duration-500 ${
                    active ? 'opacity-100' : 'opacity-20 bg-border'
                  }`}
                  style={active ? { background: step.color } : {}}
                />
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-muted">Pipeline {progress}%</span>
          <span className="text-[10px] font-mono text-muted">
            {new Date(trial.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Conflict alert footer */}
      {conflicts > 0 && (
        <div className="px-5 pb-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] ${
            isConflict
              ? 'bg-red-500/8 border border-red-500/20 text-red-600 dark:text-red-400'
              : 'bg-amber-500/8 border border-amber-500/20 text-amber-600 dark:text-amber-400'
          }`}>
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span className="font-medium">
              {conflicts} conflict{conflicts !== 1 ? 's' : ''} {isConflict ? '— Human review required' : 'detected'}
            </span>
            {isConflict && <ArrowUpRight className="w-3 h-3 ml-auto shrink-0" />}
          </div>
        </div>
      )}
    </Link>
  );
}

// ── Activity Feed Item ──────────────────────────────────────
function ActivityItem({ event }: { event: any }) {
  const agentColorMap: Record<string, string> = {
    'Literature Scout Agent': 'text-blue-500',
    'Protocol Design Agent': 'text-purple-500',
    'Statistical Agent': 'text-amber-500',
    'Regulatory Agent': 'text-red-500',
    'Decision Orchestrator': 'text-accent',
    'Human Lead': 'text-emerald-500',
  };
  const color = agentColorMap[event.role] || 'text-muted';
  const timeStr = new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const isConflict = event.action === 'CONFLICT_RESOLVE';
  const isError    = event.record_type === 'Compliance Review' && event.action === 'AGENT_COMPLETE';

  return (
    <div className="flex items-start gap-2.5 py-2.5 border-b border-border/50 last:border-0">
      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
        isConflict ? 'bg-emerald-500' : isError ? 'bg-red-500' : 'bg-border'
      }`} />
      <div className="flex-1 min-w-0">
        <div className={`text-[10px] font-mono font-bold ${color} mb-0.5`}>{event.role}</div>
        <p className="text-[11px] text-foreground/80 leading-tight line-clamp-2">{event.change_description}</p>
      </div>
      <span className="text-[9px] font-mono text-muted shrink-0">{timeStr}</span>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [trials, setTrials] = useState<any[]>([]);
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [indication, setIndication] = useState("Crohn's Disease");
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'conflict' | 'approved' | 'active'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrials = useCallback(async () => {
    try {
      const res = await fetch('/api/trials');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTrials(data);
        // Aggregate audit events
        const events: any[] = [];
        for (const t of data) {
          if (t.auditTrail) events.push(...t.auditTrail.slice(0, 3));
        }
        setAllEvents(events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 15));
      }
    } catch (err) {
      console.error('Failed to fetch trials:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTrials(); }, [fetchTrials]);

  const handleRefresh = () => { setRefreshing(true); fetchTrials(); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !indication) return;
    setCreating(true);
    try {
      const res = await fetch('/api/trials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, indication }),
      });
      if (res.ok) {
        const newTrial = await res.json();
        setName('');
        setShowCreateModal(false);
        await fetchTrials();
        if (newTrial?.id) router.push(`/trial/${newTrial.id}`);
      }
    } catch (err) {
      console.error('Failed to create trial:', err);
    } finally {
      setCreating(false);
    }
  };

  // Stats
  const totalConflicts     = trials.reduce((s, t) => s + (t.individual_conflict_count || 0), 0);
  const triageCount        = trials.filter(t => ['STATUS_AWAITING_HUMAN_TRIAGE', 'CONFLICT_DETECTED'].includes(t.status)).length;
  const approvedCount      = trials.filter(t => t.status === 'APPROVED_REGULATORY').length;
  const activeCount        = trials.filter(t => !['APPROVED_REGULATORY', 'INITIAL'].includes(t.status)).length;
  const timeSaved          = approvedCount * 6 + triageCount * 2 || 8;

  // Filter
  const filtered = trials.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.indication.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'conflict') return ['CONFLICT_DETECTED', 'STATUS_AWAITING_HUMAN_TRIAGE'].includes(t.status);
    if (filter === 'approved') return t.status === 'APPROVED_REGULATORY';
    if (filter === 'active')   return !['APPROVED_REGULATORY', 'INITIAL'].includes(t.status);
    return true;
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* ── Topbar ── */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30 h-[var(--topbar-h)]">
        <div className="max-w-[1440px] mx-auto px-6 h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="grid size-6 place-items-center rounded bg-foreground hover:bg-accent transition-colors">
              <span className="size-1.5 rounded-full bg-accent-foreground" />
            </Link>
            <span className="font-mono text-[12px] font-bold uppercase tracking-[0.14em]">TrialSync</span>
            <span className="w-px h-4 bg-border" />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Mission Control</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="p-2 rounded-md hover:bg-surface text-muted hover:text-foreground transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin-slow' : ''}`} />
            </button>
            <UserMenu />
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/8 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">21 CFR Part 11</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="max-w-[1440px] mx-auto px-6 py-8 flex gap-8">

        {/* ─ Primary content ─ */}
        <div className="flex-1 min-w-0">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-extrabold tracking-[-0.02em] mb-0.5">Workspace Board</h1>
              <p className="text-xs text-muted">
                {loading ? 'Loading...' : `${trials.length} trials · ${totalConflicts} total conflicts · ${approvedCount} IND ready`}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-foreground hover:bg-accent text-background hover:text-white transition-all text-sm font-semibold shadow-sm hover:shadow-accent/20 hover:shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              New Trial
            </button>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: 'Active Trials',
                value: activeCount,
                sub: 'In pipeline',
                icon: Activity,
                color: 'text-blue-500',
                bg: 'bg-agent-scout',
              },
              {
                label: 'Conflicts Raised',
                value: totalConflicts,
                sub: triageCount > 0 ? `${triageCount} need human review` : 'All clear',
                icon: AlertTriangle,
                color: totalConflicts > 0 ? 'text-red-500' : 'text-muted',
                bg: totalConflicts > 0 ? 'bg-agent-auditor' : '',
                pulse: totalConflicts > 0,
              },
              {
                label: 'FDA Cleared',
                value: approvedCount,
                sub: 'IND ready',
                icon: CheckCircle,
                color: 'text-emerald-500',
                bg: '',
              },
              {
                label: 'Weeks Saved',
                value: timeSaved,
                sub: 'vs sequential workflow',
                icon: TrendingUp,
                color: 'text-foreground/70',
                bg: '',
                tooltip: `Sequential: ${approvedCount * 10 || 10}w → Parallel: ~${Math.ceil(timeSaved / 3)}w`,
              },
            ].map(({ label, value, sub, icon: Icon, color, bg, pulse, tooltip }) => (
              <div
                key={label}
                title={tooltip}
                className={`rounded-xl border border-border bg-background p-5 transition-all ${bg ? `border rounded-xl ${bg} border` : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">{label}</span>
                  <Icon className={`w-4 h-4 ${color} ${pulse ? 'animate-pulse-dot' : ''}`} />
                </div>
                <div className="font-serif text-3xl font-normal tracking-tight text-foreground mb-1">{value}</div>
                <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted">{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Search & Filter ── */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search trials..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-lg py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted focus:border-foreground/30 focus:outline-none transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-surface border border-border">
              {(['all', 'active', 'conflict', 'approved'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-[0.12em] transition-all ${
                    filter === f
                      ? 'bg-foreground text-background shadow-sm'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  {f}
                  {f === 'conflict' && totalConflicts > 0 && (
                    <span className="ml-1.5 px-1 rounded bg-red-500 text-white text-[8px]">{totalConflicts}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Trials grid ── */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="rounded-xl border border-border bg-background p-5 h-44">
                  <div className="animate-shimmer rounded-md h-4 w-2/3 mb-3 bg-surface" />
                  <div className="animate-shimmer rounded-md h-3 w-full mb-2 bg-surface" />
                  <div className="animate-shimmer rounded-md h-3 w-3/4 bg-surface" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 rounded-xl border border-dashed border-border text-center">
              <FolderOpen className="w-8 h-8 text-muted mx-auto mb-3" />
              <h3 className="font-bold text-sm mb-1">
                {search ? 'No trials match your search' : 'No trials yet'}
              </h3>
              <p className="text-xs text-muted mb-5 max-w-xs mx-auto">
                {search ? 'Try a different search term.' : 'Create your first clinical trial to start the multi-agent pipeline.'}
              </p>
              {!search && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 rounded-lg bg-foreground hover:bg-accent text-background text-xs font-semibold transition-all"
                >
                  Create First Trial
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(trial => (
                <TrialCard key={trial.id} trial={trial} />
              ))}
            </div>
          )}
        </div>

        {/* ─ Sidebar: activity feed ─ */}
        <aside className="hidden xl:flex flex-col w-72 shrink-0 gap-4">

          {/* Band Status */}
          <div className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-3.5 h-3.5 text-accent" />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold">Band Coordination</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Literature Scout', color: 'var(--agent-scout)' },
                { label: 'Protocol Designer', color: 'var(--agent-designer)' },
                { label: 'Statistical Analyst', color: 'var(--agent-analyst)' },
                { label: 'Regulatory Auditor', color: 'var(--agent-auditor)' },
              ].map(a => (
                <div key={a.label} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.color }} />
                  <span className="text-[11px] text-muted flex-1">{a.label}</span>
                  <span className="text-[9px] font-mono text-muted">Active</span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Activity */}
          <div className="rounded-xl border border-border bg-background flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold">Live Activity</span>
              </div>
              <span className="text-[9px] font-mono text-muted">{allEvents.length} events</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {allEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Activity className="w-6 h-6 text-muted mb-2 opacity-40" />
                  <p className="text-[11px] font-mono text-muted">No recent activity</p>
                </div>
              ) : (
                allEvents.map((ev, i) => <ActivityItem key={`${ev.id}-${i}`} event={ev} />)
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="rounded-xl border border-border bg-background p-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted font-bold block mb-3">Quick Access</span>
            <div className="space-y-1">
              {[
                { label: 'Metformin / Renal', id: 'TRL-MET-RENAL-01', badge: '🔴' },
                { label: 'COVID Dexamethasone', id: 'TRL-COVID-DEXA-02', badge: '🔴' },
                { label: 'Lecanemab (ARIA)', id: 'TRL-LECAN-AD-06', badge: '✅' },
              ].map(t => (
                <Link
                  key={t.id}
                  href={`/trial/${t.id}`}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-surface transition-colors text-xs text-muted hover:text-foreground"
                >
                  <span>{t.badge}</span>
                  <span className="flex-1 truncate">{t.label}</span>
                  <ChevronRight className="w-3 h-3 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Create Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
          <div className="w-full max-w-md bg-background border border-border rounded-xl p-6 shadow-2xl animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  New Clinical Trial
                </h2>
                <p className="text-xs text-muted mt-0.5">Initialize a multi-agent protocol design workspace</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 rounded-md hover:bg-surface text-muted hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-1.5">
                  Trial Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RESILIENT-1: Upadacitinib in Moderate-Severe Crohn's"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-foreground/30 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.15em] text-muted mb-1.5">
                  Indication
                </label>
                <select
                  value={indication}
                  onChange={e => setIndication(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:border-foreground/30 focus:outline-none transition-colors"
                >
                  <option>Crohn's Disease</option>
                  <option>Ulcerative Colitis</option>
                  <option>Rheumatoid Arthritis</option>
                  <option>Type 2 Diabetes + CKD</option>
                  <option>Metastatic Melanoma</option>
                  <option>Alzheimer's Disease</option>
                  <option>COVID-19 / ARDS</option>
                  <option>Large B-Cell Lymphoma</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !name}
                  className="px-4 py-2 rounded-lg bg-foreground hover:bg-accent text-background text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {creating ? 'Initializing...' : 'Create Workspace →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
