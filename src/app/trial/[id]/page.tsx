'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Activity, 
  Upload, 
  FileText, 
  FileSearch, 
  ShieldCheck, 
  LineChart, 
  GitMerge, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Plus, 
  BookOpen, 
  History,
  Lock,
  Play,
  RotateCcw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function TrialWorkspace({ params }: { params: { id: string } }) {
  const trialId = params.id;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'evidence' | 'protocol' | 'sap' | 'conflicts' | 'audit'>('evidence');
  const [uploading, setUploading] = useState(false);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [introduceConflict, setIntroduceConflict] = useState(true);
  const [resolutionRationals, setResolutionRationals] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/trials/${trialId}`);
      const json = await res.json();
      if (json.trial) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching trial data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [trialId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('trialId', trialId);
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const runAgent = async (agentType: 'scout' | 'designer' | 'statistical' | 'reviewer') => {
    setRunningAgent(agentType);
    try {
      let endpoint = `/api/agents/${agentType}`;
      let body: any = { trialId };
      if (agentType === 'designer') {
        body.introduceConflict = introduceConflict;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        await fetchData();
        // Redirect tab based on execution
        if (agentType === 'scout') setActiveTab('evidence');
        else if (agentType === 'designer') setActiveTab('protocol');
        else if (agentType === 'statistical') setActiveTab('sap');
        else if (agentType === 'reviewer') setActiveTab('conflicts');
      }
    } catch (err) {
      console.error(`Agent ${agentType} execution failed:`, err);
    } finally {
      setRunningAgent(null);
    }
  };

  const handleResolveConflict = async (conflictId: string, option: 'ACCEPT_RECOMMENDATION' | 'IGNORE_CONFLICT') => {
    try {
      const rationale = resolutionRationals[conflictId] || '';
      const res = await fetch('/api/conflicts/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictId,
          trialId,
          resolutionOption: option,
          customRationale: rationale
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Conflict resolution failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] text-zinc-400 flex items-center justify-center text-sm font-sans">
        Loading clinical workspace...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#030303] text-zinc-400 flex items-center justify-center text-sm font-sans">
        Trial project not found.
      </div>
    );
  }

  const { trial, documents, evidenceBrief, protocol, sap, conflicts, auditTrail } = data;

  const currentStatus = trial.status;
  const openConflicts = conflicts.filter((c: any) => c.status === 'OPEN');

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans flex flex-col selection:bg-blue-500/30">
      {/* Top Header / Nav */}
      <header className="border-b border-zinc-900 bg-black/40 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-px h-6 bg-zinc-900" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-zinc-200">{trial.name}</span>
              <span className="text-[10px] font-mono text-zinc-600 bg-zinc-950 border border-zinc-900 px-1.5 py-0.5 rounded">
                {trial.id}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Room: {trial.id}-COORDINATE
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Agent Room Status & Control Panel */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Trial Status Timeline Card */}
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4 flex items-center justify-between">
              Project Phase
              <Clock className="w-3.5 h-3.5" />
            </h3>
            
            <div className="space-y-4 text-xs font-medium text-zinc-400">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStatus === 'INITIAL' ? 'bg-blue-600 text-white' : 'bg-emerald-950 border border-emerald-900/50 text-emerald-400'
                }`}>
                  1
                </div>
                <span>Evidence Synthesis</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStatus === 'EVIDENCE_COMPLETE' ? 'bg-blue-600 text-white' : 
                  currentStatus === 'INITIAL' ? 'bg-zinc-950 border border-zinc-900 text-zinc-700' : 'bg-emerald-950 border border-emerald-900/50 text-emerald-400'
                }`}>
                  2
                </div>
                <span>Protocol Draft</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStatus === 'PROTOCOL_DRAFT_COMPLETE' ? 'bg-blue-600 text-white' : 
                  currentStatus === 'SAP_COMPLETE' || currentStatus === 'CONFLICT_DETECTED' || currentStatus === 'APPROVED_REGULATORY' ? 'bg-emerald-950 border border-emerald-900/50 text-emerald-400' :
                  'bg-zinc-950 border border-zinc-900 text-zinc-700'
                }`}>
                  3
                </div>
                <span>Statistical SAP</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStatus === 'APPROVED_REGULATORY' ? 'bg-emerald-500 text-black' : 
                  currentStatus === 'CONFLICT_DETECTED' ? 'bg-red-600 text-white' :
                  currentStatus === 'SAP_COMPLETE' ? 'bg-blue-600 text-white' :
                  'bg-zinc-950 border border-zinc-900 text-zinc-700'
                }`}>
                  4
                </div>
                <span>Regulatory Approval</span>
              </div>
            </div>
          </div>

          {/* Multi-Agent Rooms panel */}
          <div className="p-5 rounded-2xl border border-zinc-900 bg-zinc-950/40 backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center justify-between">
              Multi-Agent Room
              <GitMerge className="w-3.5 h-3.5 text-zinc-600" />
            </h3>

            {/* Agent 1: Literature Scout */}
            <div className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <FileSearch className="w-3.5 h-3.5 text-blue-400" />
                  Literature Scout
                </span>
                {evidenceBrief ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Complete</span>
                ) : (
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">Idle</span>
                )}
              </div>
              <button 
                onClick={() => runAgent('scout')}
                disabled={runningAgent !== null || documents.filter((d: any) => d.type === 'LITERATURE').length === 0}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 disabled:opacity-50 text-xs font-semibold text-zinc-300 border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
              >
                {runningAgent === 'scout' ? 'Scouting Literature...' : 'Run Literature Scout'}
              </button>
            </div>

            {/* Agent 2: Protocol Designer */}
            <div className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-400" />
                  Protocol Designer
                </span>
                {protocol ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Complete</span>
                ) : !evidenceBrief ? (
                  <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-zinc-700" /> Locked
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">Ready</span>
                )}
              </div>

              {evidenceBrief && (
                <div className="mt-3 flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="conflict-check"
                    checked={introduceConflict}
                    onChange={(e) => setIntroduceConflict(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-950 text-blue-600 focus:ring-0"
                  />
                  <label htmlFor="conflict-check" className="text-[10px] text-zinc-500 cursor-pointer">
                    Simulate Design Error
                  </label>
                </div>
              )}

              <button 
                onClick={() => runAgent('designer')}
                disabled={runningAgent !== null || !evidenceBrief}
                className="w-full mt-1 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 disabled:opacity-50 text-xs font-semibold text-zinc-300 border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
              >
                {runningAgent === 'designer' ? 'Drafting Protocol...' : 'Run Protocol Designer'}
              </button>
            </div>

            {/* Agent 3: Statistical Analyst */}
            <div className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <LineChart className="w-3.5 h-3.5 text-amber-400" />
                  Statistical Analyst
                </span>
                {sap ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Complete</span>
                ) : !protocol ? (
                  <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-zinc-700" /> Locked
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">Ready</span>
                )}
              </div>
              <button 
                onClick={() => runAgent('statistical')}
                disabled={runningAgent !== null || !protocol}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 disabled:opacity-50 text-xs font-semibold text-zinc-300 border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
              >
                {runningAgent === 'statistical' ? 'Calculating Power...' : 'Run Statistical Agent'}
              </button>
            </div>

            {/* Agent 4: Regulatory Compliance Reviewer */}
            <div className="p-3.5 rounded-xl border border-zinc-900 bg-zinc-950">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Regulatory Agent
                </span>
                {currentStatus === 'APPROVED_REGULATORY' ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Approved</span>
                ) : currentStatus === 'CONFLICT_DETECTED' ? (
                  <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">Conflict</span>
                ) : !sap ? (
                  <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-zinc-700" /> Locked
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">Ready</span>
                )}
              </div>
              
              <button 
                onClick={() => runAgent('reviewer')}
                disabled={runningAgent !== null || !sap}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 disabled:opacity-50 text-xs font-semibold text-zinc-300 border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
              >
                {runningAgent === 'reviewer' ? 'Analyzing Compliance...' : 'Run Regulatory Agent'}
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Main Documents / Editing & Resolution Tabs */}
        <div className="lg:col-span-3 space-y-6 flex flex-col h-[calc(100vh-10rem)]">
          
          {/* Tab Navigation Menu */}
          <div className="flex items-center gap-2 border-b border-zinc-900">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`pb-4 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'evidence' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <FileSearch className="w-4 h-4" />
              Evidence & Sources
            </button>
            <button
              onClick={() => setActiveTab('protocol')}
              disabled={!protocol}
              className={`pb-4 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${
                !protocol ? 'opacity-30 cursor-not-allowed' : ''
              } ${activeTab === 'protocol' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <FileText className="w-4 h-4" />
              Protocol Draft
            </button>
            <button
              onClick={() => setActiveTab('sap')}
              disabled={!sap}
              className={`pb-4 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${
                !sap ? 'opacity-30 cursor-not-allowed' : ''
              } ${activeTab === 'sap' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <LineChart className="w-4 h-4" />
              Statistical SAP
            </button>
            <button
              onClick={() => setActiveTab('conflicts')}
              disabled={conflicts.length === 0}
              className={`pb-4 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 relative ${
                conflicts.length === 0 ? 'opacity-30 cursor-not-allowed' : ''
              } ${activeTab === 'conflicts' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              Conflicts Hub
              {openConflicts.length > 0 && (
                <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-4 px-4 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'audit' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <History className="w-4 h-4" />
              21 CFR Part 11 Audit
            </button>
          </div>

          {/* Active Tab View Body Area */}
          <div className="flex-1 bg-zinc-950/20 border border-zinc-900 rounded-2xl p-6 overflow-y-auto">
            
            {/* EVIDENCE TAB */}
            {activeTab === 'evidence' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Literature Sources & Evidence Brief</h2>
                    <p className="text-xs text-zinc-500">Upload clinical trial papers to build your synchronized evidence base.</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleUpload}
                      accept=".pdf,.txt,.docx"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 transition-colors text-xs font-semibold text-zinc-300 active:scale-95"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload Reference Paper'}
                    </button>
                  </div>
                </div>

                {/* Uploaded Papers Grid */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Ingested literature</h3>
                  {documents.filter((d: any) => d.type === 'LITERATURE').length === 0 ? (
                    <div className="py-12 border border-dashed border-zinc-900 rounded-xl text-center text-xs text-zinc-600">
                      No reference papers uploaded yet. Upload a Crohn's trial paper to begin.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {documents.filter((d: any) => d.type === 'LITERATURE').map((doc: any) => (
                        <div key={doc.id} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <BookOpen className="w-5 h-5 text-blue-400 shrink-0" />
                            <div className="truncate">
                              <h4 className="font-bold text-xs text-zinc-300 truncate">{doc.name}</h4>
                              <p className="text-[10px] text-zinc-600 font-mono mt-0.5">SHA: {doc.hash.substring(0, 12)}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Structured Evidence Brief Panel */}
                <div className="border-t border-zinc-900 pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-4">Literature Scout Output</h3>
                  {!evidenceBrief ? (
                    <div className="py-16 text-center text-xs text-zinc-600 border border-dashed border-zinc-900 rounded-xl">
                      Run the Literature Scout Agent on your reference papers to generate the Evidence Brief.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Safety Signals Cards */}
                      <div>
                        <h4 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Detected Safety Signals</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {evidenceBrief.content_json.safety_signals.map((sig: any, index: number) => (
                            <div key={index} className="p-4 rounded-xl border border-blue-500/10 bg-blue-500/5 relative">
                              <span className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                {sig.severity} Severity
                              </span>
                              <h5 className="font-bold text-xs text-zinc-200 mb-1.5">{sig.signal}</h5>
                              <p className="text-[11px] text-zinc-400 leading-relaxed">{sig.rationale}</p>
                              <div className="mt-3 flex items-center justify-between text-[9px] text-zinc-500">
                                <span>Incidence: {sig.incidence}</span>
                                <span>Ref: {sig.source}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Efficacy & Target Population Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-900/60">
                        {/* Efficacy */}
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Efficacy Endpoints</h4>
                          {evidenceBrief.content_json.efficacy.map((eff: any, index: number) => (
                            <div key={index} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40">
                              <h5 className="font-bold text-xs text-zinc-200 mb-1">{eff.endpoint}</h5>
                              <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">{eff.rationale}</p>
                              <div className="flex items-center justify-between text-[9px] text-zinc-500 border-t border-zinc-900/50 pt-2">
                                <span>Target Effect: <strong className="text-blue-400">{eff.rate}</strong></span>
                                <span>Ref: {eff.source}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Populations */}
                        <div>
                          <h4 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Patient Population Rules</h4>
                          <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 space-y-3">
                            <div>
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Suggested Inclusions</span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {evidenceBrief.content_json.populations.inclusion.map((inc: string, index: number) => (
                                  <span key={index} className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 text-[10px] border border-zinc-800">
                                    {inc}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="border-t border-zinc-900/50 pt-2.5">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Suggested Exclusions</span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {evidenceBrief.content_json.populations.exclusion.map((exc: string, index: number) => (
                                  <span key={index} className="px-2 py-0.5 rounded bg-red-950/20 text-red-400 text-[10px] border border-red-900/20">
                                    {exc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PROTOCOL TAB */}
            {activeTab === 'protocol' && protocol && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Study Protocol Draft</h2>
                    <p className="text-xs text-zinc-500">Drafted by Protocol Design Agent. Linked to Evidence Brief.</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                      Version: {protocol.version}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Protocol Content */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">1. Protocol Title</h3>
                      <p className="text-sm font-semibold text-zinc-200">{protocol.sections_json.title}</p>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">2. Inclusion Criteria</h3>
                      <ul className="space-y-2 text-xs text-zinc-300">
                        {protocol.sections_json.inclusion_criteria.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold shrink-0">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">3. Exclusion Criteria</h3>
                      <ul className="space-y-2 text-xs text-zinc-300">
                        {protocol.sections_json.exclusion_criteria.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-red-500 font-bold shrink-0">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">4. Primary Efficacy Endpoint</h3>
                      <p className="text-xs text-zinc-300 bg-zinc-900/50 p-3 rounded-lg border border-zinc-900">
                        {protocol.sections_json.primary_endpoint}
                      </p>
                    </div>
                  </div>

                  {/* Assumptions & Design Flags */}
                  <div className="space-y-6 border-l border-zinc-900 pl-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
                        Assumptions Flagged
                      </h3>
                      <div className="space-y-3">
                        {protocol.sections_json.assumptions.map((a: string, i: number) => (
                          <div key={i} className="p-3 rounded-xl border border-zinc-900 bg-zinc-950 text-xs text-zinc-400">
                            {a}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STATISTICAL SAP TAB */}
            {activeTab === 'sap' && sap && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">Statistical Analysis Plan (SAP)</h2>
                    <p className="text-xs text-zinc-500">Sample size justifications, power calculations, and endpoints.</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
                      Version: {sap.version}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Main Calculations */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">1. Analysis Population</h3>
                      <p className="text-xs text-zinc-300">{sap.content_json.analysis_population}</p>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">2. Primary Statistical Method</h3>
                      <p className="text-xs text-zinc-300">{sap.content_json.primary_statistical_method}</p>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">3. Power & Sample Size Calculation</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Required Sample Size</span>
                          <p className="font-bold text-white mt-1">{sap.content_json.power_calculation.calculated_sample_size}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Formula / Power</span>
                          <p className="text-xs text-zinc-300 mt-1">
                            {sap.content_json.power_calculation.power * 100}% Power (alpha = {sap.content_json.power_calculation.alpha})
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Endpoint Validation & Warnings */}
                  <div className="space-y-6 border-l border-zinc-900 pl-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Endpoint Verification</h3>
                      
                      {sap.content_json.endpoint_validation.includes('WARNING') ? (
                        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400 space-y-2">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            Statistical Inconsistency
                          </div>
                          <p className="leading-relaxed text-[11px]">{sap.content_json.endpoint_validation}</p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-400 space-y-2">
                          <div className="flex items-center gap-1.5 font-bold">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            Endpoint Validated
                          </div>
                          <p className="leading-relaxed text-[11px]">{sap.content_json.endpoint_validation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONFLICTS TAB */}
            {activeTab === 'conflicts' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-900 pb-5">
                  <h2 className="text-lg font-bold text-white mb-1">Conflicts & Escalation Hub</h2>
                  <p className="text-xs text-zinc-500">Surface and resolve inconsistencies between evidence and design choices.</p>
                </div>

                {openConflicts.length === 0 ? (
                  <div className="py-16 text-center text-xs text-emerald-400 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-xl flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="w-8 h-8" />
                    <span className="font-bold">All conflicts resolved! Protocol cleared for FDA IND submission.</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {openConflicts.map((conf: any) => (
                      <div key={conf.id} className={`p-6 rounded-2xl border ${
                        conf.severity === 'HIGH' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'
                      } space-y-4`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            conf.severity === 'HIGH' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {conf.severity} Conflict
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">{conf.id}</span>
                        </div>

                        {/* Side by side positions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900">
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Position A (Evidence)</span>
                            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{conf.position_a}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900">
                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Position B (Design Draft)</span>
                            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{conf.position_b}</p>
                          </div>
                        </div>

                        {/* Resolution recommendation */}
                        <div className="p-3.5 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2">
                          <GitMerge className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-zinc-200">Recommendation:</strong> {conf.recommendation}
                          </div>
                        </div>

                        {/* User Action Rationale text block */}
                        <div>
                          <input
                            type="text"
                            placeholder="Enter validation notes or change justification rationale (optional)..."
                            value={resolutionRationals[conf.id] || ''}
                            onChange={(e) => setResolutionRationals({ ...resolutionRationals, [conf.id]: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-900 rounded-xl px-4 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-850"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900/50">
                          <button
                            onClick={() => handleResolveConflict(conf.id, 'IGNORE_CONFLICT')}
                            className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 text-xs font-semibold"
                          >
                            Ignore (Maintain Design)
                          </button>
                          <button
                            onClick={() => handleResolveConflict(conf.id, 'ACCEPT_RECOMMENDATION')}
                            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                          >
                            Accept & Update Protocol
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 21 CFR PART 11 AUDIT TRAIL TAB */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="border-b border-zinc-900 pb-5">
                  <h2 className="text-lg font-bold text-white mb-1">CFR 21 Part 11 Audit Trail</h2>
                  <p className="text-xs text-zinc-500">Immutable execution and modification logs for FDA validation checks.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 uppercase tracking-wider font-semibold">
                        <th className="pb-3 pr-4">User</th>
                        <th className="pb-3 px-4">Role</th>
                        <th className="pb-3 px-4">Action</th>
                        <th className="pb-3 px-4">Record type</th>
                        <th className="pb-3 px-4">Change Description</th>
                        <th className="pb-3 pl-4">Timestamp (UTC)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/50 text-zinc-400 font-mono">
                      {auditTrail.map((log: any) => (
                        <tr key={log.id} className="hover:bg-zinc-950/40 transition-colors">
                          <td className="py-3.5 pr-4 text-zinc-300">{log.user_email}</td>
                          <td className="py-3.5 px-4 text-zinc-500">{log.role}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.action === 'CONFLICT_RESOLVE' ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/30' :
                              log.action === 'FILE_UPLOAD' ? 'bg-blue-950/50 text-blue-400 border border-blue-900/30' :
                              log.action === 'TRIAL_CREATE' ? 'bg-zinc-900 text-zinc-300' :
                              'bg-purple-950/50 text-purple-400'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-zinc-500">{log.record_type}</td>
                          <td className="py-3.5 px-4 text-zinc-300 max-w-xs truncate" title={log.change_description}>
                            {log.change_description}
                          </td>
                          <td className="py-3.5 pl-4 text-zinc-500 text-[10px]">
                            {new Date(log.created_at).toISOString().replace('T', ' ').substring(0, 19)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
