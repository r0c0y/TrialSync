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
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans flex flex-col">
      {/* Top Header */}
      <header className="border-b border-zinc-900 bg-black/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </Link>
            <span className="font-bold tracking-tight text-lg text-zinc-200">TrialSync Board</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
            <span>21 CFR Part 11 Audit Active</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {/* Welcome and Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Clinical Workspace
            </h1>
            <p className="text-sm text-zinc-400">
              Manage and coordinate multi-agent protocol design for active drug candidates.
            </p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 transition-colors text-white text-sm font-semibold active:scale-95 shadow-lg shadow-blue-600/10"
          >
            <Plus className="w-4 h-4" />
            Create Clinical Trial
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Active Trials</span>
              <FolderOpen className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-3xl font-bold text-white">{activeCount}</div>
            <p className="text-[10px] text-zinc-500 mt-1">Currently in-flight design cycles</p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Conflicts Raised</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-amber-500">{conflictsCount}</div>
            <p className="text-[10px] text-zinc-500 mt-1">Require immediate lead reviewer input</p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Regulatory Approvals</span>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-emerald-500">{approvedCount}</div>
            <p className="text-[10px] text-zinc-500 mt-1">Cleared for FDA IND submission</p>
          </div>

          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Est. Time Saved</span>
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-blue-400">{approvedCount * 4 || 8} Weeks</div>
            <p className="text-[10px] text-zinc-500 mt-1">Timeline acceleration vs. sequential close</p>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trials by name or indication..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-900 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-800 transition-colors"
            />
          </div>
        </div>

        {/* Trials List */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500 text-sm">
            Loading trials...
          </div>
        ) : filteredTrials.length === 0 ? (
          <div className="py-20 rounded-2xl border border-dashed border-zinc-900 text-center">
            <FolderOpen className="w-10 h-10 text-zinc-700 mx-auto mb-4" />
            <h3 className="font-bold text-zinc-400 mb-1">No Clinical Trials Found</h3>
            <p className="text-xs text-zinc-600 max-w-xs mx-auto mb-6">
              Create a new trial project to begin coordinating clinical evidence with your design team.
            </p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-white text-xs font-semibold border border-zinc-800"
            >
              Add First Trial
            </button>
          </div>
        ) : (
          <div className="border border-zinc-900 rounded-2xl overflow-hidden bg-zinc-950/20 backdrop-blur-sm">
            <div className="divide-y divide-zinc-900">
              {filteredTrials.map((trial) => (
                <Link 
                  href={`/trial/${trial.id}`} 
                  key={trial.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-950/80 transition-colors group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">
                        {trial.name}
                      </h3>
                      <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                        {trial.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span>Indication: <strong className="text-zinc-300">{trial.indication}</strong></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                      <span>Created: {new Date(trial.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Status Badge */}
                    <div className="text-right">
                      {trial.status === 'INITIAL' && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded bg-zinc-900 border border-zinc-800 text-zinc-400 uppercase tracking-wider">
                          Ready for Evidence
                        </span>
                      )}
                      {trial.status === 'EVIDENCE_COMPLETE' && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded bg-blue-950/50 border border-blue-900/50 text-blue-400 uppercase tracking-wider">
                          Evidence Ready
                        </span>
                      )}
                      {trial.status === 'PROTOCOL_DRAFT_COMPLETE' && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded bg-purple-950/50 border border-purple-900/50 text-purple-400 uppercase tracking-wider">
                          Protocol Drafted
                        </span>
                      )}
                      {trial.status === 'SAP_COMPLETE' && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded bg-amber-950/50 border border-amber-900/50 text-amber-400 uppercase tracking-wider">
                          SAP Finalized
                        </span>
                      )}
                      {trial.status === 'CONFLICT_DETECTED' && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded bg-red-950/50 border border-red-900/50 text-red-400 uppercase tracking-wider animate-pulse">
                          Conflict Detected
                        </span>
                      )}
                      {trial.status === 'APPROVED_REGULATORY' && (
                        <span className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 uppercase tracking-wider">
                          Cleared (FDA)
                        </span>
                      )}
                    </div>

                    <ChevronRight className="w-5 h-5 text-zinc-700 group-hover:text-zinc-400 transition-colors group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-2xl p-6 shadow-2xl animate-scale-up">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              New Clinical Trial Project
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              Create a new trial record. All downstream agent workflows will start from this project workspace.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Trial Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zylastin-B Crohn's Phase 2b Study"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Indication Type
                </label>
                <select
                  value={indication}
                  onChange={(e) => setIndication(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-zinc-700"
                >
                  <option value="Crohn's Disease">Crohn's Disease</option>
                  <option value="Ulcerative Colitis">Ulcerative Colitis</option>
                  <option value="Rheumatoid Arthritis">Rheumatoid Arthritis</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors text-white text-xs font-semibold"
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
