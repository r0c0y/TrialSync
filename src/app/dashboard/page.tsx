'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Activity, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ChevronRight,
  FolderOpen,
  Sparkles
} from 'lucide-react';

export default function Dashboard() {
  const [trials, setTrials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [indication, setIndication] = useState('Crohn\'s Disease');
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  const fetchTrials = async () => {
    try {
      const res = await fetch('/api/trials');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTrials(data);
      }
    } catch (err) {
      console.error('Failed to fetch trials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrials();
  }, []);

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
        setName('');
        setShowCreateModal(false);
        fetchTrials();
      }
    } catch (err) {
      console.error('Failed to create trial:', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredTrials = trials.filter((t) => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.indication.toLowerCase().includes(search.toLowerCase())
  );

  // Stats calculation
  const totalTrials = trials.length;
  const conflictsCount = trials.filter((t) => t.status === 'CONFLICT_DETECTED').length;
  const approvedCount = trials.filter((t) => t.status === 'APPROVED_REGULATORY').length;
  const activeCount = totalTrials - approvedCount;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Top Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="grid size-6 place-items-center rounded-sm bg-foreground hover:bg-accent transition-colors">
              <span className="size-1.5 rounded-full bg-accent-foreground" />
            </Link>
            <span className="font-mono text-sm font-bold uppercase tracking-[0.15em] text-foreground">
              TrialSync Board
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-[0.18em] text-muted">
            <span>21 CFR Part 11 Audit Active</span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {/* Welcome and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-[-0.03em] mb-1">
              Workspace board
            </h1>
            <p className="text-sm text-muted">
              Manage and coordinate multi-agent protocol design for active drug candidates.
            </p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-foreground hover:bg-accent text-background hover:text-accent-foreground transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create Clinical Trial
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-md border border-border bg-border mb-10">
          <div className="bg-background p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Active Trials</span>
              <FolderOpen className="w-4 h-4 text-muted" />
            </div>
            <div className="font-serif text-3xl tracking-tight">{activeCount}</div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted mt-1">Currently in-flight</p>
          </div>

          <div className="bg-background p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Conflicts Raised</span>
              <AlertTriangle className="w-4 h-4 text-accent animate-pulse" />
            </div>
            <div className="font-serif text-3xl tracking-tight text-accent">{conflictsCount}</div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted mt-1">Reviewer input required</p>
          </div>

          <div className="bg-background p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Regulatory Approvals</span>
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="font-serif text-3xl tracking-tight text-emerald-600">{approvedCount}</div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted mt-1">FDA IND Submission ready</p>
          </div>

          <div className="bg-background p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Est. Time Saved</span>
              <TrendingUp className="w-4 h-4 text-foreground/75" />
            </div>
            <div className="font-serif text-3xl tracking-tight">{approvedCount * 4 || 8} Weeks</div>
            <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted mt-1">vs sequential workflow</p>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trials by name or indication..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-sm py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-foreground focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Trials List */}
        {loading ? (
          <div className="py-20 text-center text-muted font-mono text-xs uppercase tracking-[0.2em]">
            Loading trials...
          </div>
        ) : filteredTrials.length === 0 ? (
          <div className="py-20 rounded-md border border-dashed border-border text-center bg-surface/30">
            <FolderOpen className="w-8 h-8 text-muted mx-auto mb-4" />
            <h3 className="font-bold text-sm text-foreground mb-1">No Clinical Trials Found</h3>
            <p className="text-xs text-muted max-w-xs mx-auto mb-6">
              Create a new trial project to begin coordinating clinical evidence with your design team.
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-sm bg-foreground hover:bg-accent text-background hover:text-accent-foreground text-xs font-semibold transition-colors"
            >
              Add First Trial
            </button>
          </div>
        ) : (
          <div className="border border-border rounded-md overflow-hidden bg-surface/20">
            <div className="divide-y divide-border">
              {filteredTrials.map((trial) => (
                <Link 
                  href={`/trial/${trial.id}`} 
                  key={trial.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface transition-colors group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-bold text-base text-foreground group-hover:text-accent transition-colors">
                        {trial.name}
                      </h3>
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
                        {trial.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span>Indication: <strong className="text-foreground font-medium">{trial.indication}</strong></span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>Created: {new Date(trial.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Status Badge */}
                    <div className="text-right">
                      {trial.status === 'INITIAL' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] rounded bg-surface border border-border text-muted">
                          Ready for Evidence
                        </span>
                      )}
                      {trial.status === 'EVIDENCE_COMPLETE' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] rounded bg-blue-500/5 border border-blue-500/15 text-blue-600">
                          Evidence Ready
                        </span>
                      )}
                      {trial.status === 'PROTOCOL_DRAFT_COMPLETE' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] rounded bg-purple-500/5 border border-purple-500/15 text-purple-600">
                          Protocol Drafted
                        </span>
                      )}
                      {trial.status === 'SAP_COMPLETE' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] rounded bg-amber-500/5 border border-amber-500/15 text-amber-600">
                          SAP Finalized
                        </span>
                      )}
                      {trial.status === 'CONFLICT_DETECTED' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] rounded bg-accent/5 border border-accent/15 text-accent animate-pulse-dot">
                          Conflict Detected
                        </span>
                      )}
                      {trial.status === 'APPROVED_REGULATORY' && (
                        <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] rounded bg-emerald-500/5 border border-emerald-500/15 text-emerald-600">
                          Cleared (FDA)
                        </span>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-background border border-border rounded-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              New Clinical Trial Project
            </h2>
            <p className="text-xs text-muted mb-6">
              Create a new trial record. All downstream agent workflows will start from this project workspace.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-1.5">
                  Trial Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zylastin-B Crohn's Phase 2b Study"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-1.5">
                  Indication Type
                </label>
                <select
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-foreground focus:border-foreground focus:outline-none"
                >
                  <option value="Crohn's Disease">Crohn's Disease</option>
                  <option value="Ulcerative Colitis">Ulcerative Colitis</option>
                  <option value="Rheumatoid Arthritis">Rheumatoid Arthritis</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-sm bg-foreground hover:bg-accent text-background hover:text-accent-foreground text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Initialize Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
