'use client';

import { useState, useEffect, useRef, use } from 'react';
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
  BookOpen, 
  History,
  Lock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function TrialWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id: trialId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'evidence' | 'protocol' | 'sap' | 'conflicts' | 'audit'>('evidence');
  const [uploading, setUploading] = useState(false);
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [introduceConflict, setIntroduceConflict] = useState(true);
  const [resolutionRationals, setResolutionRationals] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Band.ai States
  const [bandRooms, setBandRooms] = useState<any[]>([]);
  const [fetchingRooms, setFetchingRooms] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [bandError, setBandError] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);
  const [testSending, setTestSending] = useState(false);

  const fetchBandRooms = async () => {
    setFetchingRooms(true);
    setBandError(null);
    try {
      const res = await fetch('/api/band/rooms');
      const json = await res.json();
      if (json.error) {
        setBandError(json.error);
      } else {
        setBandRooms(json.rooms || []);
      }
    } catch (err: any) {
      setBandError(err.message);
    } finally {
      setFetchingRooms(false);
    }
  };

  const handleCreateBandRoom = async () => {
    setLinking(true);
    setBandError(null);
    try {
      const res = await fetch('/api/band/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, action: 'CREATE_ROOM' }),
      });
      const json = await res.json();
      if (json.error) {
        setBandError(json.error);
      } else {
        fetchData();
        fetchBandRooms();
      }
    } catch (err: any) {
      setBandError(err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleLinkBandRoom = async (roomId: string) => {
    if (!roomId) return;
    setLinking(true);
    setBandError(null);
    try {
      const res = await fetch('/api/band/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, action: 'LINK_ROOM', roomId }),
      });
      const json = await res.json();
      if (json.error) {
        setBandError(json.error);
      } else {
        fetchData();
        fetchBandRooms();
      }
    } catch (err: any) {
      setBandError(err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkBandRoom = async () => {
    setLinking(true);
    setBandError(null);
    try {
      const res = await fetch('/api/band/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, action: 'UNLINK_ROOM' }),
      });
      const json = await res.json();
      if (json.error) {
        setBandError(json.error);
      } else {
        fetchData();
        fetchBandRooms();
      }
    } catch (err: any) {
      setBandError(err.message);
    } finally {
      setLinking(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!data?.trial?.band_room_id) return;
    setTestSending(true);
    try {
      const res = await fetch('/api/band/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trialId,
          action: 'SEND_MESSAGE',
          roomId: data.trial.band_room_id,
          sender: 'Decision Orchestrator',
          message: '⚡ Manual connectivity test: Connection to TrialSync is active and validated.'
        }),
      });
      const json = await res.json();
      if (json.error) {
        alert(`Test failed: ${json.error}`);
      } else {
        alert('Connectivity test message sent successfully!');
      }
    } catch (err: any) {
      alert(`Error sending test: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

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
    fetchBandRooms();
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
      <div className="min-h-screen bg-background text-muted flex items-center justify-center text-xs font-mono uppercase tracking-[0.2em]">
        Loading clinical workspace...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background text-muted flex items-center justify-center text-xs font-mono uppercase tracking-[0.2em]">
        Trial project not found.
      </div>
    );
  }

  const { trial, documents, evidenceBrief, protocol, sap, conflicts, auditTrail } = data;

  const currentStatus = trial.status;
  const openConflicts = conflicts.filter((c: any) => c.status === 'OPEN');

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-accent/15 selection:text-foreground">
      {/* Top Header / Nav */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-foreground">{trial.name}</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted bg-surface border border-border px-1.5 py-0.5 rounded">
                {trial.id}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${trial.band_room_id ? 'bg-accent animate-pulse-dot' : 'bg-foreground/20'}`} />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {trial.band_room_id ? `Room: ${trial.band_room_id.substring(0, 16)}...` : 'Band: Not Connected'}
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
          <div className="p-5 rounded-md border border-border bg-surface/50">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-4 flex items-center justify-between">
              Project Phase
              <Clock className="w-3.5 h-3.5 text-muted" />
            </h3>
            
            <div className="space-y-4 text-xs font-medium text-foreground">
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-sm flex items-center justify-center font-mono text-[9px] font-bold ${
                  currentStatus === 'INITIAL' ? 'bg-accent text-accent-foreground' : 'bg-foreground/10 text-foreground'
                }`}>
                  01
                </div>
                <span className={currentStatus !== 'INITIAL' ? 'text-muted' : 'font-bold'}>Evidence Synthesis</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-sm flex items-center justify-center font-mono text-[9px] font-bold ${
                  currentStatus === 'EVIDENCE_COMPLETE' ? 'bg-accent text-accent-foreground' : 
                  currentStatus === 'INITIAL' ? 'bg-surface border border-border text-muted' : 'bg-foreground/10 text-foreground'
                }`}>
                  02
                </div>
                <span className={currentStatus === 'EVIDENCE_COMPLETE' ? 'font-bold' : 'text-muted'}>Protocol Draft</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-sm flex items-center justify-center font-mono text-[9px] font-bold ${
                  currentStatus === 'PROTOCOL_DRAFT_COMPLETE' ? 'bg-accent text-accent-foreground' : 
                  currentStatus === 'SAP_COMPLETE' || currentStatus === 'CONFLICT_DETECTED' || currentStatus === 'APPROVED_REGULATORY' ? 'bg-foreground/10 text-foreground' :
                  'bg-surface border border-border text-muted'
                }`}>
                  03
                </div>
                <span className={currentStatus === 'PROTOCOL_DRAFT_COMPLETE' ? 'font-bold' : 'text-muted'}>Statistical SAP</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-sm flex items-center justify-center font-mono text-[9px] font-bold ${
                  currentStatus === 'APPROVED_REGULATORY' ? 'bg-emerald-600 text-white' : 
                  currentStatus === 'CONFLICT_DETECTED' ? 'bg-accent text-accent-foreground' :
                  currentStatus === 'SAP_COMPLETE' ? 'bg-accent text-accent-foreground' :
                  'bg-surface border border-border text-muted'
                }`}>
                  04
                </div>
                <span className={currentStatus === 'APPROVED_REGULATORY' || currentStatus === 'CONFLICT_DETECTED' || currentStatus === 'SAP_COMPLETE' ? 'font-bold' : 'text-muted'}>
                  Regulatory Approval
                </span>
              </div>
            </div>
          </div>

          {/* Band Collaboration Room Card */}
          <div className="p-5 rounded-md border border-border bg-surface/50 space-y-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted flex items-center justify-between">
              Band.ai Integration
              <Activity className={`w-3.5 h-3.5 ${trial.band_room_id ? 'text-accent animate-pulse-dot' : 'text-muted'}`} />
            </h3>

            {trial.band_room_id ? (
              <div className="space-y-3">
                <div className="p-3 rounded-md border border-border bg-background flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-foreground font-semibold">Collaboration Room</span>
                    <span className="text-[9px] font-mono font-bold uppercase text-accent bg-accent/5 px-1.5 py-0.5 rounded border border-accent/15">
                      Connected
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted truncate" title={trial.band_room_id}>
                    ID: {trial.band_room_id}
                  </span>
                </div>

                <a
                  href={`https://app.band.ai/chats/${trial.band_room_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-sm bg-foreground hover:bg-accent text-background hover:text-accent-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  Open Band Chat <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSendTestMessage}
                    disabled={testSending}
                    className="py-1.5 px-3 rounded-sm bg-background hover:bg-surface border border-border text-foreground text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                  >
                    {testSending ? 'Testing...' : 'Test Ping'}
                  </button>
                  <button
                    onClick={handleUnlinkBandRoom}
                    disabled={linking}
                    className="py-1.5 px-3 rounded-sm bg-background hover:bg-red-500/5 border border-border hover:border-red-500/15 text-muted hover:text-red-500 text-xs font-semibold transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 border border-border bg-background rounded-md text-center text-xs text-muted leading-relaxed">
                  Connect this clinical trial to a Band.ai room to coordinate agents in real time.
                </div>

                <button
                  onClick={handleCreateBandRoom}
                  disabled={linking}
                  className="w-full py-2 px-3 rounded-sm bg-foreground hover:bg-accent text-background hover:text-accent-foreground text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  {linking ? 'Creating Room...' : 'Create Collaboration Room'}
                </button>

                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted block">
                    Link Existing Room
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      disabled={fetchingRooms || bandRooms.length === 0}
                      className="flex-1 bg-background border border-border rounded-sm px-2 py-1.5 text-xs text-foreground focus:border-foreground focus:outline-none disabled:opacity-50"
                    >
                      <option value="">
                        {fetchingRooms
                          ? 'Loading rooms...'
                          : bandRooms.length === 0
                          ? 'No rooms found'
                          : 'Select room...'}
                      </option>
                      {bandRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleLinkBandRoom(selectedRoomId)}
                      disabled={linking || !selectedRoomId}
                      className="px-3 py-1.5 rounded-sm bg-background hover:bg-surface border border-border text-foreground text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      Link
                    </button>
                  </div>
                </div>

                {bandError && (
                  <div className="p-3.5 rounded-md border border-amber-500/20 bg-amber-500/5 text-amber-600 space-y-2 text-[11px] leading-relaxed">
                    <div className="flex items-start gap-1.5 font-bold text-xs text-amber-700">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      Band API Setup
                    </div>
                    <p>{bandError}</p>
                    <p className="text-[10px] text-muted border-t border-amber-500/10 pt-2">
                      Tip: Apply promo code <strong className="text-foreground">BANDHACK26</strong> on your <a href="https://app.band.ai" target="_blank" rel="noreferrer" className="underline text-accent">Band dashboard</a> to unlock human API access.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Multi-Agent Rooms panel */}
          <div className="p-5 rounded-md border border-border bg-surface/50 space-y-4">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted flex items-center justify-between">
              Multi-Agent Room
              <GitMerge className="w-3.5 h-3.5 text-muted" />
            </h3>

            {/* Agent 1: Literature Scout */}
            <div className="p-3.5 rounded-md border border-border bg-background">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileSearch className="w-3.5 h-3.5 text-accent" />
                  Literature Scout
                </span>
                {evidenceBrief ? (
                  <span className="text-[9px] font-mono font-bold uppercase text-emerald-600 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/15">Complete</span>
                ) : (
                  <span className="text-[9px] font-mono font-bold uppercase text-muted bg-surface px-1.5 py-0.5 rounded border border-border">Idle</span>
                )}
              </div>
              <button 
                onClick={() => runAgent('scout')}
                disabled={runningAgent !== null || documents.filter((d: any) => d.type === 'LITERATURE').length === 0}
                className="w-full mt-2 py-1.5 px-3 rounded-sm bg-background hover:bg-surface disabled:opacity-50 text-xs font-semibold text-foreground border border-border transition-colors flex items-center justify-center gap-1.5"
              >
                {runningAgent === 'scout' ? 'Scouting Literature...' : 'Run Literature Scout'}
              </button>
            </div>

            {/* Agent 2: Protocol Designer */}
            <div className="p-3.5 rounded-md border border-border bg-background">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  Protocol Designer
                </span>
                {protocol ? (
                  <span className="text-[9px] font-mono font-bold uppercase text-emerald-600 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/15">Complete</span>
                ) : !evidenceBrief ? (
                  <span className="text-[9px] font-mono font-bold uppercase text-muted flex items-center gap-1">
                    <Lock className="w-3 h-3 text-muted/70" /> Locked
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold uppercase text-accent bg-accent/5 px-1.5 py-0.5 rounded border border-accent/15">Ready</span>
                )}
              </div>

              {evidenceBrief && (
                <div className="mt-3 flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="conflict-check"
                    checked={introduceConflict}
                    onChange={(e) => setIntroduceConflict(e.target.checked)}
                    className="rounded-sm border-border bg-background text-accent focus:ring-0"
                  />
                  <label htmlFor="conflict-check" className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted cursor-pointer">
                    Simulate Design Error
                  </label>
                </div>
              )}

              <button 
                onClick={() => runAgent('designer')}
                disabled={runningAgent !== null || !evidenceBrief}
                className="w-full mt-1 py-1.5 px-3 rounded-sm bg-background hover:bg-surface disabled:opacity-50 text-xs font-semibold text-foreground border border-border transition-colors flex items-center justify-center gap-1.5"
              >
                {runningAgent === 'designer' ? 'Drafting Protocol...' : 'Run Protocol Designer'}
              </button>
            </div>

            {/* Agent 3: Statistical Analyst */}
            <div className="p-3.5 rounded-md border border-border bg-background">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <LineChart className="w-3.5 h-3.5 text-amber-600" />
                  Statistical Analyst
                </span>
                {sap ? (
                  <span className="text-[9px] font-mono font-bold uppercase text-emerald-600 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/15">Complete</span>
                ) : !protocol ? (
                  <span className="text-[9px] font-mono font-bold uppercase text-muted flex items-center gap-1">
                    <Lock className="w-3 h-3 text-muted/70" /> Locked
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold uppercase text-accent bg-accent/5 px-1.5 py-0.5 rounded border border-accent/15">Ready</span>
                )}
              </div>
              <button 
                onClick={() => runAgent('statistical')}
                disabled={runningAgent !== null || !protocol}
                className="w-full mt-2 py-1.5 px-3 rounded-sm bg-background hover:bg-surface disabled:opacity-50 text-xs font-semibold text-foreground border border-border transition-colors flex items-center justify-center gap-1.5"
              >
                {runningAgent === 'statistical' ? 'Calculating Power...' : 'Run Statistical Agent'}
              </button>
            </div>

            {/* Agent 4: Regulatory Compliance Reviewer */}
            <div className="p-3.5 rounded-md border border-border bg-background">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Regulatory Agent
                </span>
                {currentStatus === 'APPROVED_REGULATORY' ? (
                  <span className="text-[9px] font-mono font-bold uppercase text-emerald-600 bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/15">Approved</span>
                ) : currentStatus === 'CONFLICT_DETECTED' ? (
                  <span className="text-[9px] font-mono font-bold uppercase text-accent bg-accent/5 px-1.5 py-0.5 rounded border border-accent/15">Conflict</span>
                ) : !sap ? (
                  <span className="text-[9px] font-mono font-bold uppercase text-muted flex items-center gap-1">
                    <Lock className="w-3 h-3 text-muted/70" /> Locked
                  </span>
                ) : (
                  <span className="text-[9px] font-mono font-bold uppercase text-accent bg-accent/5 px-1.5 py-0.5 rounded border border-accent/15">Ready</span>
                )}
              </div>
              
              <button 
                onClick={() => runAgent('reviewer')}
                disabled={runningAgent !== null || !sap}
                className="w-full mt-2 py-1.5 px-3 rounded-sm bg-background hover:bg-surface disabled:opacity-50 text-xs font-semibold text-foreground border border-border transition-colors flex items-center justify-center gap-1.5"
              >
                {runningAgent === 'reviewer' ? 'Analyzing Compliance...' : 'Run Regulatory Agent'}
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Main Documents / Editing & Resolution Tabs */}
        <div className="lg:col-span-3 space-y-6 flex flex-col h-[calc(100vh-10rem)]">
          
          {/* Tab Navigation Menu */}
          <div className="flex items-center gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab('evidence')}
              className={`pb-4 px-4 font-mono text-[10px] font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'evidence' ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              Evidence & Sources
            </button>
            <button
              onClick={() => setActiveTab('protocol')}
              disabled={!protocol}
              className={`pb-4 px-4 font-mono text-[10px] font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${
                !protocol ? 'opacity-30 cursor-not-allowed' : ''
              } ${activeTab === 'protocol' ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              Protocol Draft
            </button>
            <button
              onClick={() => setActiveTab('sap')}
              disabled={!sap}
              className={`pb-4 px-4 font-mono text-[10px] font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${
                !sap ? 'opacity-30 cursor-not-allowed' : ''
              } ${activeTab === 'sap' ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}
            >
              <LineChart className="w-3.5 h-3.5" />
              Statistical SAP
            </button>
            <button
              onClick={() => setActiveTab('conflicts')}
              disabled={conflicts.length === 0}
              className={`pb-4 px-4 font-mono text-[10px] font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 relative ${
                conflicts.length === 0 ? 'opacity-30 cursor-not-allowed' : ''
              } ${activeTab === 'conflicts' ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Conflicts Hub
              {openConflicts.length > 0 && (
                <span className="absolute top-0 right-2 w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-4 px-4 font-mono text-[10px] font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'audit' ? 'border-accent text-foreground' : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              21 CFR Part 11 Audit
            </button>
          </div>

          {/* Active Tab View Body Area */}
          <div className="flex-1 bg-surface/30 border border-border rounded-md p-6 overflow-y-auto">
            
            {/* EVIDENCE TAB */}
            {activeTab === 'evidence' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Literature Sources & Evidence Brief</h2>
                    <p className="text-xs text-muted">Upload clinical trial papers to build your synchronized evidence base.</p>
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
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm border border-border bg-background hover:bg-surface transition-colors text-xs font-semibold text-foreground cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploading ? 'Uploading...' : 'Upload Reference Paper'}
                    </button>
                  </div>
                </div>

                {/* Uploaded Papers Grid */}
                <div>
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-4">Ingested literature</h3>
                  {documents.filter((d: any) => d.type === 'LITERATURE').length === 0 ? (
                    <div className="py-12 border border-dashed border-border rounded-md text-center text-xs text-muted bg-surface/20">
                      No reference papers uploaded yet. Upload a Crohn's trial paper to begin.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {documents.filter((d: any) => d.type === 'LITERATURE').map((doc: any) => (
                        <div key={doc.id} className="p-4 rounded-md border border-border bg-background flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <BookOpen className="w-5 h-5 text-accent shrink-0" />
                            <div className="truncate">
                              <h4 className="font-bold text-xs text-foreground truncate">{doc.name}</h4>
                              <p className="text-[9px] text-muted font-mono mt-0.5">SHA: {doc.hash.substring(0, 12)}</p>
                            </div>
                          </div>
                          <span className="font-mono text-[9px] text-muted shrink-0">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Structured Evidence Brief Panel */}
                <div className="border-t border-border pt-6">
                  <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-4">Literature Scout Output</h3>
                  {!evidenceBrief ? (
                    <div className="py-16 text-center text-xs text-muted border border-dashed border-border rounded-md bg-surface/20">
                      Run the Literature Scout Agent on your reference papers to generate the Evidence Brief.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Safety Signals Cards */}
                      <div>
                        <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-3">Detected Safety Signals</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {evidenceBrief.content_json.safety_signals.map((sig: any, index: number) => (
                            <div key={index} className="p-4 rounded-md border border-accent/15 bg-accent/[0.03] relative">
                              <span className="absolute top-3 right-3 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/5 text-accent border border-accent/15">
                                {sig.severity}
                              </span>
                              <h5 className="font-bold text-xs text-foreground mb-1.5">{sig.signal}</h5>
                              <p className="text-[11px] text-muted leading-relaxed">{sig.rationale}</p>
                              <div className="mt-3 flex items-center justify-between text-[9px] font-mono text-muted">
                                <span>Incidence: {sig.incidence}</span>
                                <span>Ref: {sig.source}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Efficacy & Target Population Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                        {/* Efficacy */}
                        <div>
                          <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-3">Efficacy Endpoints</h4>
                          {evidenceBrief.content_json.efficacy.map((eff: any, index: number) => (
                            <div key={index} className="p-4 rounded-md border border-border bg-background">
                              <h5 className="font-bold text-xs text-foreground mb-1">{eff.endpoint}</h5>
                              <p className="text-[11px] text-muted leading-relaxed mb-3">{eff.rationale}</p>
                              <div className="flex items-center justify-between text-[9px] font-mono text-muted border-t border-border/50 pt-2">
                                <span>Target Effect: <strong className="text-accent">{eff.rate}</strong></span>
                                <span>Ref: {eff.source}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Populations */}
                        <div>
                          <h4 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted mb-3">Patient Population Rules</h4>
                          <div className="p-4 rounded-md border border-border bg-background space-y-3">
                            <div>
                              <span className="font-mono text-[9px] font-bold text-muted uppercase tracking-wider">Suggested Inclusions</span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {evidenceBrief.content_json.populations.inclusion.map((inc: string, index: number) => (
                                  <span key={index} className="px-2 py-0.5 rounded bg-surface text-foreground text-[10px] border border-border font-medium">
                                    {inc}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="border-t border-border/50 pt-2.5">
                              <span className="font-mono text-[9px] font-bold text-muted uppercase tracking-wider">Suggested Exclusions</span>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {evidenceBrief.content_json.populations.exclusion.map((exc: string, index: number) => (
                                  <span key={index} className="px-2 py-0.5 rounded bg-accent/5 text-accent text-[10px] border border-accent/15 font-medium">
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
                <div className="flex items-center justify-between border-b border-border pb-5">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Study Protocol Draft</h2>
                    <p className="text-xs text-muted">Drafted by Protocol Design Agent. Linked to Evidence Brief.</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded bg-background border border-border text-[9px] font-mono text-muted uppercase tracking-wider">
                      Version: {protocol.version}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Protocol Content */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">1. Protocol Title</h3>
                      <p className="text-sm font-semibold text-foreground">{protocol.sections_json.title}</p>
                    </div>

                    <div>
                      <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">2. Inclusion Criteria</h3>
                      <ul className="space-y-2 text-xs text-muted">
                        {protocol.sections_json.inclusion_criteria.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-accent font-bold shrink-0">•</span>
                            <span className="text-foreground">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">3. Exclusion Criteria</h3>
                      <ul className="space-y-2 text-xs text-muted">
                        {protocol.sections_json.exclusion_criteria.map((c: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-accent font-bold shrink-0">•</span>
                            <span className="text-foreground">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">4. Primary Efficacy Endpoint</h3>
                      <p className="text-xs text-foreground bg-background p-3 rounded border border-border leading-relaxed">
                        {protocol.sections_json.primary_endpoint}
                      </p>
                    </div>
                  </div>

                  {/* Assumptions & Design Flags */}
                  <div className="space-y-6 border-l border-border pl-6">
                    <div>
                      <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-3 flex items-center gap-1.5">
                        Assumptions Flagged
                      </h3>
                      <div className="space-y-3">
                        {protocol.sections_json.assumptions.map((a: string, i: number) => (
                          <div key={i} className="p-3 rounded-md border border-border bg-background text-xs text-muted leading-relaxed">
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
                <div className="flex items-center justify-between border-b border-border pb-5">
                  <div>
                    <h2 className="text-lg font-bold text-foreground mb-1">Statistical Analysis Plan (SAP)</h2>
                    <p className="text-xs text-muted">Sample size justifications, power calculations, and endpoints.</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded bg-background border border-border text-[9px] font-mono text-muted uppercase tracking-wider">
                      Version: {sap.version}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Main Calculations */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">1. Analysis Population</h3>
                      <p className="text-xs text-foreground font-medium">{sap.content_json.analysis_population}</p>
                    </div>

                    <div>
                      <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-2">2. Primary Statistical Method</h3>
                      <p className="text-xs text-foreground leading-relaxed">{sap.content_json.primary_statistical_method}</p>
                    </div>

                    <div>
                      <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-3">3. Power & Sample Size Calculation</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-md bg-background border border-border">
                          <span className="font-mono text-[9px] text-muted uppercase font-bold tracking-wider">Required Sample Size</span>
                          <p className="font-bold text-foreground text-sm mt-1">{sap.content_json.power_calculation.calculated_sample_size}</p>
                        </div>
                        <div className="p-4 rounded-md bg-background border border-border">
                          <span className="font-mono text-[9px] text-muted uppercase font-bold tracking-wider">Formula / Power</span>
                          <p className="text-xs text-foreground font-semibold mt-1">
                            {sap.content_json.power_calculation.power * 100}% Power (alpha = {sap.content_json.power_calculation.alpha})
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Endpoint Validation & Warnings */}
                  <div className="space-y-6 border-l border-border pl-6">
                    <div>
                      <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-3">Endpoint Verification</h3>
                      
                      {sap.content_json.endpoint_validation.includes('WARNING') ? (
                        <div className="p-4 rounded-md border border-accent/20 bg-accent/5 text-xs text-accent space-y-2">
                          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider font-mono text-[9px]">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Statistical Inconsistency
                          </div>
                          <p className="leading-relaxed text-[11px] font-medium text-accent">{sap.content_json.endpoint_validation}</p>
                        </div>
                      ) : (
                        <div className="p-4 rounded-md border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-600 space-y-2">
                          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider font-mono text-[9px]">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            Endpoint Validated
                          </div>
                          <p className="leading-relaxed text-[11px] font-medium">{sap.content_json.endpoint_validation}</p>
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
                <div className="border-b border-border pb-5">
                  <h2 className="text-lg font-bold text-foreground mb-1">Conflicts & Escalation Hub</h2>
                  <p className="text-xs text-muted">Surface and resolve inconsistencies between evidence and design choices.</p>
                </div>

                {openConflicts.length === 0 ? (
                  <div className="py-16 text-center text-xs text-emerald-600 bg-emerald-500/5 border border-dashed border-emerald-500/20 rounded-md flex flex-col items-center justify-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    <span className="font-bold font-mono uppercase tracking-wider">All conflicts resolved! Protocol cleared for FDA IND submission.</span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {openConflicts.map((conf: any) => (
                      <div key={conf.id} className={`p-6 rounded-md border ${
                        conf.severity === 'HIGH' ? 'border-accent/15 bg-accent/[0.02]' : 'border-amber-500/15 bg-amber-500/[0.02]'
                      } space-y-4`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            conf.severity === 'HIGH' ? 'bg-accent/10 text-accent border border-accent/15' : 'bg-amber-500/10 text-amber-700 border border-amber-500/15'
                          }`}>
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

                        {/* Resolution recommendation */}
                        <div className="p-3.5 rounded-sm bg-background border border-border text-xs text-muted flex items-start gap-2 leading-relaxed">
                          <GitMerge className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-foreground">Recommendation:</strong> {conf.recommendation}
                          </div>
                        </div>

                        {/* User Action Rationale text block */}
                        <div>
                          <input
                            type="text"
                            placeholder="Enter validation notes or change justification rationale (optional)..."
                            value={resolutionRationals[conf.id] || ''}
                            onChange={(e) => setResolutionRationals({ ...resolutionRationals, [conf.id]: e.target.value })}
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
            )}

            {/* 21 CFR PART 11 AUDIT TRAIL TAB */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                <div className="border-b border-border pb-5">
                  <h2 className="text-lg font-bold text-foreground mb-1">CFR 21 Part 11 Audit Trail</h2>
                  <p className="text-xs text-muted">Immutable execution and modification logs for FDA validation checks.</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted uppercase tracking-wider font-mono text-[9px] font-semibold">
                        <th className="pb-3 pr-4">User</th>
                        <th className="pb-3 px-4">Role</th>
                        <th className="pb-3 px-4">Action</th>
                        <th className="pb-3 px-4">Record type</th>
                        <th className="pb-3 px-4">Change Description</th>
                        <th className="pb-3 pl-4">Timestamp (UTC)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-muted font-mono text-[10px]">
                      {auditTrail.map((log: any) => (
                        <tr key={log.id} className="hover:bg-surface/50 transition-colors">
                          <td className="py-3.5 pr-4 text-foreground font-semibold">{log.user_email}</td>
                          <td className="py-3.5 px-4 text-muted">{log.role}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                              log.action === 'CONFLICT_RESOLVE' ? 'bg-emerald-500/5 text-emerald-600 border border-emerald-500/15' :
                              log.action === 'FILE_UPLOAD' ? 'bg-blue-500/5 text-blue-600 border border-blue-500/15' :
                              log.action === 'TRIAL_CREATE' ? 'bg-surface text-foreground border border-border' :
                              'bg-accent/5 text-accent border border-accent/15'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-muted">{log.record_type}</td>
                          <td className="py-3.5 px-4 text-foreground max-w-xs truncate" title={log.change_description}>
                            {log.change_description}
                          </td>
                          <td className="py-3.5 pl-4 text-muted">
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
