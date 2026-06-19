'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft, BookOpen, FileText, LineChart, ShieldCheck, Brain,
  GitMerge, History, Network, Radio, Activity, AlertTriangle,
  CheckCircle, Clock, FlaskConical, Cpu
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import UserMenu from '@/components/UserMenu';

interface WorkspaceNavProps {
  trial: {
    id: string;
    name: string;
    status: string;
    band_room_id?: string | null;
    indication?: string;
  };
  agentProgress?: {
    scout: { status: string; progress: number; lastAction?: string };
    designer: { status: string; progress: number; lastAction?: string };
    analyst: { status: string; progress: number; lastAction?: string };
    auditor: { status: string; progress: number; lastAction?: string };
  };
  openConflicts?: number;
  currentPipelineAgent?: string | null;
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  INITIAL:                      { label: 'Initializing',    cls: 'badge-initial' },
  EVIDENCE_COMPLETE:            { label: 'Evidence Ready',  cls: 'badge-evidence' },
  PROTOCOL_DRAFT_COMPLETE:      { label: 'Protocol Ready',  cls: 'badge-protocol' },
  SAP_COMPLETE:                 { label: 'SAP Done',        cls: 'badge-triage' },
  CONFLICT_DETECTED:            { label: 'Conflict Found',  cls: 'badge-conflict' },
  STATUS_AWAITING_HUMAN_TRIAGE: { label: 'Needs Review',    cls: 'badge-conflict' },
  APPROVED_REGULATORY:          { label: 'FDA Cleared',     cls: 'badge-approved' },
};

const AGENTS = [
  {
    key: 'scout',
    label: 'Literature Scout',
    icon: BookOpen,
    color: 'var(--agent-scout)',
    bg: 'bg-agent-scout',
    model: 'Gemini 1.5 Pro',
    specialty: 'Dense literature analysis',
  },
  {
    key: 'designer',
    label: 'Protocol Designer',
    icon: FileText,
    color: 'var(--agent-designer)',
    bg: 'bg-agent-designer',
    model: 'Gemini 1.5 Pro',
    specialty: 'Structured medical writing',
  },
  {
    key: 'analyst',
    label: 'Statistical Analyst',
    icon: LineChart,
    color: 'var(--agent-analyst)',
    bg: 'bg-agent-analyst',
    model: 'Gemini 1.5 Flash',
    specialty: 'Regulatory-grade statistics',
  },
  {
    key: 'auditor',
    label: 'Regulatory Auditor',
    icon: ShieldCheck,
    color: 'var(--agent-auditor)',
    bg: 'bg-agent-auditor',
    model: 'Custom deterministic',
    specialty: 'FDA compliance & conflict detection',
  },
];

function AgentStatusDot({ status }: { status: string }) {
  if (status === 'PROCESSING') return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full rounded-full bg-accent animate-ping opacity-60" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
    </span>
  );
  if (status === 'COMPLETE') return <span className="w-2 h-2 rounded-full bg-emerald-500" />;
  if (status === 'ERROR')    return <span className="w-2 h-2 rounded-full bg-red-500" />;
  return <span className="w-2 h-2 rounded-full bg-border" />;
}

export default function WorkspaceNav({
  trial,
  agentProgress,
  openConflicts = 0,
  currentPipelineAgent,
}: WorkspaceNavProps) {
  const pathname = usePathname();
  const base = `/trial/${trial.id}`;
  const statusCfg = STATUS_LABELS[trial.status] || STATUS_LABELS.INITIAL;

  const NAV_ITEMS = [
    { href: base,                          label: 'Workspace',       icon: Cpu,          exact: true },
    { href: `${base}/knowledge-graph`,     label: 'Knowledge Graph', icon: Network },
    { href: `${base}/agent-activity`,      label: 'Agent Activity',  icon: Activity,
      badge: currentPipelineAgent ? '●' : undefined, badgeColor: 'text-accent' },
    { href: `${base}/audit`,               label: 'Audit Trail',     icon: History },
  ];

  return (
    <>
      {/* ── Topbar ── */}
      <header className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-30 h-[var(--topbar-h)]">
        <div className="max-w-[1600px] w-full mx-auto px-8 h-full flex items-center justify-between gap-3">
          {/* Left: back + trial name */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="p-1.5 rounded-md hover:bg-surface text-muted hover:text-foreground transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="w-px h-5 bg-border shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-extrabold text-foreground truncate max-w-[280px] tracking-tight">{trial.name}</span>
                <span className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wide ${statusCfg.cls}`}>
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted">
                <span>{trial.id}</span>
                {trial.indication && (
                  <>
                    <span>·</span>
                    <span className="truncate max-w-[180px]">{trial.indication}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Band status + controls */}
          <div className="flex items-center gap-2 shrink-0">
            {openConflicts > 0 && (
              <Link href={base} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/8 border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-mono hover:bg-red-500/12 transition-colors">
                <AlertTriangle className="w-3 h-3" />
                {openConflicts} conflict{openConflicts !== 1 ? 's' : ''}
              </Link>
            )}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono font-bold bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.1)]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Band Active
            </div>
            <UserMenu />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Sub-nav tabs ── */}
      <div className="border-b border-border bg-background sticky top-[var(--topbar-h)] z-20 h-[var(--subnav-h)]">
        <div className="max-w-[1600px] w-full mx-auto px-8 h-full flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact, badge, badgeColor }) => {
            const active = exact ? pathname === href : pathname.startsWith(href + '/') || pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 h-full text-[12px] font-medium border-b-2 transition-all relative ${
                  active
                    ? 'border-accent text-foreground'
                    : 'border-transparent text-muted hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {badge && (
                  <span className={`text-[9px] ${badgeColor} animate-pulse-dot`}>{badge}</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
