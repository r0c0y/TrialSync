'use client';

import { use, useEffect, useState } from 'react';
import { History, Download, Shield, User, Cpu, Search, Filter, FileText } from 'lucide-react';

const ACTION_CONFIG: Record<string, { color: string; icon: string }> = {
  FILE_UPLOAD:       { color: 'text-blue-500',    icon: '📄' },
  AGENT_START:       { color: 'text-accent',       icon: '▶' },
  AGENT_COMPLETE:    { color: 'text-emerald-500',  icon: '✓' },
  CONFLICT_DETECT:   { color: 'text-red-500',      icon: '⚠' },
  CONFLICT_RESOLVE:  { color: 'text-emerald-500',  icon: '✓' },
  STATUS_UPDATE:     { color: 'text-purple-500',   icon: '↻' },
  BAND_ROOM_CREATE:  { color: 'text-accent',       icon: '📡' },
  BAND_ROOM_LINK:    { color: 'text-accent',       icon: '🔗' },
  OVERRIDE:          { color: 'text-amber-500',    icon: '⚡' },
};

const ROLE_COLOR: Record<string, string> = {
  'Literature Scout Agent': 'text-blue-500',
  'Protocol Design Agent':  'text-purple-500',
  'Statistical Agent':      'text-amber-500',
  'Regulatory Agent':       'text-red-500',
  'Decision Orchestrator':  'text-accent',
  'Clinical Program Lead':  'text-emerald-500',
};

function AuditRow({ entry, index }: { entry: any; index: number }) {
  const cfg   = ACTION_CONFIG[entry.action] || { color: 'text-muted', icon: '•' };
  const rcolor = ROLE_COLOR[entry.role] || 'text-muted';

  return (
    <tr className="border-b border-border/50 hover:bg-surface/40 transition-colors group">
      <td className="py-3 px-4 text-center">
        <span className="font-mono text-[9px] text-muted">{String(index + 1).padStart(3, '0')}</span>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[10px] text-muted">
          {new Date(entry.created_at).toLocaleString('en-US', {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          })}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`font-mono text-[9px] font-bold uppercase tracking-wide ${cfg.color}`}>
          {cfg.icon} {entry.action}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className={`text-[11px] font-medium ${rcolor}`}>{entry.role}</span>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[9px] text-muted uppercase tracking-wide">{entry.record_type}</span>
      </td>
      <td className="py-3 px-4 max-w-xs">
        <p className="text-[11px] text-foreground/80 leading-snug line-clamp-2">{entry.change_description}</p>
      </td>
      <td className="py-3 px-4">
        <p className="text-[10px] text-muted line-clamp-1">{entry.reason}</p>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-[9px] text-muted">{entry.user_email}</span>
      </td>
    </tr>
  );
}

export default function AuditTrailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: trialId } = use(params);
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterRole, setRole]   = useState('all');

  useEffect(() => {
    fetch(`/api/trials/${trialId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [trialId]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="font-mono text-xs text-muted uppercase tracking-[0.2em]">Loading audit trail...</span>
    </div>
  );

  const { trial, auditTrail = [], conflicts = [] } = data || {};
  const openConflicts = conflicts.filter((c: any) => c.status === 'OPEN').length;

  const allRoles = [...new Set(auditTrail.map((e: any) => e.role))];

  const filtered = auditTrail.filter((e: any) => {
    const matchSearch = !search ||
      e.action?.toLowerCase().includes(search.toLowerCase()) ||
      e.role?.toLowerCase().includes(search.toLowerCase()) ||
      e.change_description?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || e.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleExport = () => {
    const rows = [
      ['#', 'Timestamp', 'Action', 'Role', 'Record Type', 'Description', 'Reason', 'User', 'IP'],
      ...filtered.map((e: any, i: number) => [
        i + 1,
        new Date(e.created_at).toISOString(),
        e.action,
        e.role,
        e.record_type,
        e.change_description,
        e.reason,
        e.user_email,
        e.ip_address,
      ]),
    ];
    const csv = rows.map(r => r.map(String).map((v: string) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `audit-trail-${trialId}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Page header */}
      <div className="border-b border-border bg-surface/30 px-6 py-5">
        <div className="max-w-[1400px] mx-auto flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-accent" />
              <h1 className="text-lg font-bold tracking-tight">21 CFR Part 11 Audit Trail</h1>
            </div>
            <p className="text-xs text-muted">
              Tamper-evident chronological record of all agent actions, human decisions, and system events for trial <span className="font-mono text-foreground">{trialId}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-center px-4 py-2 rounded-lg border border-border bg-background">
              <div className="text-xl font-bold font-serif">{auditTrail.length}</div>
              <div className="text-[9px] font-mono text-muted uppercase">Total Events</div>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-surface text-sm font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border px-6 py-3 bg-background">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3 h-3 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-background border border-border rounded-lg py-1.5 pl-7 pr-3 text-[12px] text-foreground placeholder:text-muted focus:outline-none focus:border-foreground/30 w-56 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-muted" />
            <select
              value={filterRole}
              onChange={e => setRole(e.target.value)}
              className="bg-background border border-border rounded-lg py-1.5 px-2 text-[12px] text-foreground focus:outline-none focus:border-foreground/30 transition-colors"
            >
              <option value="all">All Roles</option>
              {allRoles.map((r: any) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <span className="text-[10px] font-mono text-muted ml-auto">
            Showing {filtered.length} of {auditTrail.length} events
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface/60 border-b border-border">
                <tr>
                  {['#', 'Timestamp', 'Action', 'Role', 'Type', 'Description', 'Reason', 'User'].map(h => (
                    <th key={h} className="px-4 py-3 font-mono text-[9px] uppercase tracking-[0.15em] text-muted font-bold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-16 text-center">
                      <FileText className="w-6 h-6 text-muted mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-mono text-muted">No audit events found</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry: any, i: number) => (
                    <AuditRow key={`${entry.id}-${i}`} entry={entry} index={i} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compliance footer */}
        <div className="mt-6 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 flex items-center gap-3">
          <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
            <strong>21 CFR Part 11 Compliant:</strong> This audit trail is tamper-evident, time-stamped,
            and records all agent actions, human overrides, and system events in chronological order.
            All {auditTrail.length} records are preserved for regulatory submission.
          </p>
        </div>
      </div>
    </div>
  );
}
