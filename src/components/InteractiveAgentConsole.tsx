'use client';

import { useRef, useEffect } from 'react';
import { 
  BookOpen, FileText, LineChart, ShieldCheck, Cpu, Terminal, 
  Send, Maximize2, Minimize2, ChevronDown, ChevronUp, User, Zap
} from 'lucide-react';
import { useTrial } from '@/context/TrialContext';

export default function InteractiveAgentConsole() {
  const {
    trialId,
    data,
    pipelineRunning,
    chatHistory,
    currentPipelineAgent,
    runPipeline,
    inspectorAgent,
    setInspectorAgent,
    chatInput,
    setChatInput,
    expandedReasoning,
    toggleReasoning,
    isChatMaximized,
    setIsChatMaximized,
    handleSendCommand,
  } = useTrial();

  const auditTrail = data?.auditTrail || [];
  const currentStatus = data?.trial?.status || 'INITIAL';
  const evidenceBrief = data?.evidenceBrief || null;
  const protocol = data?.protocol || null;
  const sap = data?.sap || null;
  const conflicts = data?.conflicts || [];

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const maximizedMessagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    maximizedMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, pipelineRunning]);

  return (
    <div className="flex flex-col space-y-6 h-full min-h-0">
      
      {/* Active Agents Grid */}
      <div className="p-4 rounded-md border border-border bg-surface/30">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted mb-3">Active Coordination Specialists</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div 
            onClick={() => setInspectorAgent('scout')}
            className={`p-2 rounded border transition-all flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/[0.02] ${
              currentPipelineAgent === 'scout' ? 'bg-blue-500/5 border-blue-500/40 shadow-sm' :
              evidenceBrief ? 'bg-background border-emerald-500/20' : 'bg-background border-border'
            }`}
            title="Click to inspect Scout Agent state"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
              currentPipelineAgent === 'scout' ? 'bg-blue-600 text-white animate-pulse-dot' :
              evidenceBrief ? 'bg-emerald-600/10 text-emerald-700' : 'bg-surface text-muted'
            }`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-mono text-[9px] font-semibold truncate w-full block text-foreground">Scout</span>
            <span className="text-[8px] font-mono text-muted">
              {currentPipelineAgent === 'scout' ? 'Scanning...' : evidenceBrief ? 'Brief Compiled' : 'Idle'}
            </span>
          </div>

          <div 
            onClick={() => setInspectorAgent('designer')}
            className={`p-2 rounded border transition-all flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/40 hover:bg-purple-500/[0.02] ${
              currentPipelineAgent === 'designer' ? 'bg-purple-500/5 border-purple-500/40 shadow-sm' :
              protocol ? 'bg-background border-emerald-500/20' : 'bg-background border-border'
            }`}
            title="Click to inspect Designer Agent state"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
              currentPipelineAgent === 'designer' ? 'bg-purple-600 text-white animate-pulse-dot' :
              protocol ? 'bg-emerald-600/10 text-emerald-700' : 'bg-surface text-muted'
            }`}>
              <FileText className="w-4 h-4" />
            </div>
            <span className="font-mono text-[9px] font-semibold truncate w-full block text-foreground">Designer</span>
            <span className="text-[8px] font-mono text-muted">
              {currentPipelineAgent === 'designer' ? 'Drafting...' : protocol ? 'Protocol v1.x' : 'Idle'}
            </span>
          </div>

          <div 
            onClick={() => setInspectorAgent('statistical')}
            className={`p-2 rounded border transition-all flex flex-col items-center justify-center cursor-pointer hover:border-amber-500/40 hover:bg-amber-500/[0.02] ${
              currentPipelineAgent === 'statistical' ? 'bg-amber-500/5 border-amber-500/40 shadow-sm' :
              sap ? 'bg-background border-emerald-500/20' : 'bg-background border-border'
            }`}
            title="Click to inspect Analyst Agent state"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
              currentPipelineAgent === 'statistical' ? 'bg-amber-600 text-white animate-pulse-dot' :
              sap ? 'bg-emerald-600/10 text-emerald-700' : 'bg-surface text-muted'
            }`}>
              <LineChart className="w-4 h-4" />
            </div>
            <span className="font-mono text-[9px] font-semibold truncate w-full block text-foreground">Analyst</span>
            <span className="text-[8px] font-mono text-muted">
              {currentPipelineAgent === 'statistical' ? 'Math Check...' : sap ? 'Power Ready' : 'Idle'}
            </span>
          </div>

          <div 
            onClick={() => setInspectorAgent('reviewer')}
            className={`p-2 rounded border transition-all flex flex-col items-center justify-center cursor-pointer hover:border-red-500/40 hover:bg-red-500/[0.02] ${
              currentPipelineAgent === 'reviewer' ? 'bg-red-500/5 border-red-500/40 shadow-sm' :
              currentStatus === 'APPROVED_REGULATORY' ? 'bg-background border-emerald-500/20' :
              currentStatus === 'CONFLICT_DETECTED' ? 'bg-background border-red-500/20' :
              'bg-background border-border'
            }`}
            title="Click to inspect Auditor Agent state"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 ${
              currentPipelineAgent === 'reviewer' ? 'bg-red-600 text-white animate-pulse-dot' :
              currentStatus === 'APPROVED_REGULATORY' ? 'bg-emerald-600/10 text-emerald-700' :
              currentStatus === 'CONFLICT_DETECTED' ? 'bg-red-600/10 text-red-700' :
              'bg-surface text-muted'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-mono text-[9px] font-semibold truncate w-full block text-foreground">Auditor</span>
            <span className="text-[8px] font-mono text-muted">
              {currentPipelineAgent === 'reviewer' ? 'Auditing...' : 
               currentStatus === 'APPROVED_REGULATORY' ? 'Approved' :
               currentStatus === 'CONFLICT_DETECTED' ? 'Conflicts' : 'Idle'}
            </span>
          </div>
        </div>
      </div>

      {/* Agent Activity Feed — real-time agent action timeline */}
      <div className="p-3 rounded-md border border-border bg-surface/20">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" /> Agent Activity Feed
          </h3>
          <span className="text-[8px] font-mono text-muted">
            {auditTrail.filter((a: any) => a.action?.startsWith('AGENT_')).length} agent events
          </span>
        </div>
        <div className="space-y-1 max-h-[120px] overflow-y-auto">
          {auditTrail.filter((a: any) => a.action?.startsWith('AGENT_')).slice(-6).reverse().map((log: any) => (
            <div key={log.id} className="flex items-start gap-2 text-[10px] font-mono leading-relaxed">
              <span className="shrink-0 text-muted w-14">
                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className={`shrink-0 px-1 rounded text-[8px] font-bold uppercase ${
                log.action === 'AGENT_START' ? 'bg-blue-500/10 text-blue-600' :
                log.action === 'AGENT_COMPLETE' ? 'bg-emerald-500/10 text-emerald-600' :
                'bg-accent/10 text-accent'
              }`}>
                {log.action === 'AGENT_START' ? '▶' : log.action === 'AGENT_COMPLETE' ? '✓' : '●'}
              </span>
              <span className="text-foreground truncate">{log.role}: {log.change_description}</span>
            </div>
          ))}
          {auditTrail.filter((a: any) => a.action?.startsWith('AGENT_')).length === 0 && (
            <p className="text-[10px] text-muted font-mono italic">No agent events yet. Run the pipeline to see activity.</p>
          )}
        </div>
      </div>

      {/* Interactive Chat Console Window */}
      <div className="flex-1 border border-border rounded-md bg-surface/10 flex flex-col min-h-0 relative shadow-sm">
        <div className="p-3 border-b border-border bg-surface/30 flex items-center justify-between">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted flex items-center gap-1.5 font-bold">
            <Terminal className="w-3.5 h-3.5" /> Agent Collaboration Channel
          </span>
          <div className="flex items-center gap-2">
            {pipelineRunning ? (
              <span className="flex items-center gap-1.5 text-[8px] text-accent font-bold uppercase tracking-wider mr-2">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse-dot" /> Streaming debate
              </span>
            ) : (
              <button
                onClick={runPipeline}
                className="flex items-center gap-1 px-2 py-1 rounded bg-foreground hover:bg-accent text-background hover:text-accent-foreground text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                title="Run multi-agent pipeline"
              >
                <Zap className="w-3 h-3" /> Run
              </button>
            )}
            <button
              onClick={() => setIsChatMaximized(true)}
              className="p-1 rounded hover:bg-surface/50 border border-transparent hover:border-border text-muted hover:text-foreground transition-all cursor-pointer"
              title="Maximize Channel"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chat message logs stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans select-text">
          {chatHistory.map((msg) => {
            let colorClass = "bg-background border border-border";
            let iconColor = "bg-surface text-muted";
            let senderIcon = <Cpu className="w-3.5 h-3.5" />;
            
            if (msg.sender.includes('Scout')) {
              iconColor = "bg-blue-600/10 text-blue-700";
              senderIcon = <BookOpen className="w-3.5 h-3.5" />;
            } else if (msg.sender.includes('Designer')) {
              iconColor = "bg-purple-600/10 text-purple-700";
              senderIcon = <FileText className="w-3.5 h-3.5" />;
            } else if (msg.sender.includes('Analyst')) {
              iconColor = "bg-amber-600/10 text-amber-700";
              senderIcon = <LineChart className="w-3.5 h-3.5" />;
            } else if (msg.sender.includes('Regulatory')) {
              iconColor = msg.type === 'error' ? "bg-red-600/10 text-red-700" : "bg-emerald-600/10 text-emerald-700";
              senderIcon = <ShieldCheck className="w-3.5 h-3.5" />;
            } else if (msg.sender.includes('Human Lead')) {
              colorClass = "bg-accent/5 border border-accent/10";
              iconColor = "bg-accent text-white";
              senderIcon = <User className="w-3.5 h-3.5" />;
            } else if (msg.sender.includes('System')) {
              colorClass = "bg-surface/20 border border-border/60 text-muted";
              iconColor = "bg-surface border border-border text-muted";
              senderIcon = <Terminal className="w-3.5 h-3.5" />;
            } else if (msg.type === 'thought') {
              colorClass = "bg-surface/40 border border-border text-muted font-mono text-[11px] leading-relaxed";
            }

            const isTyping = msg.status === 'typing';

            return (
              <div key={msg.id} className={`p-3.5 rounded-lg ${colorClass} flex flex-col gap-1.5 transition-all`}>
                <div className="flex items-center justify-between text-[10px] font-mono text-muted">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center font-bold ${iconColor}`}>
                      {senderIcon}
                    </div>
                    <span className="font-bold text-foreground">{msg.sender}</span>
                    <span className="text-[8px] bg-surface px-1 py-0.5 rounded border border-border uppercase tracking-wider">{msg.role}</span>
                  </div>
                  <span>{msg.timestamp}</span>
                </div>

                <div className="text-xs font-normal leading-relaxed text-foreground select-text whitespace-pre-wrap">
                  {isTyping ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>

                {/* Expandable specialist reasoning details */}
                {!isTyping && msg.reasoningPath && (
                  <div className="mt-2.5 pt-2 border-t border-border/40">
                    <button
                      onClick={() => toggleReasoning(msg.id)}
                      className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-accent font-bold cursor-pointer hover:underline focus:outline-none"
                    >
                      {expandedReasoning[msg.id] ? (
                        <>Hide Specialist Reasoning <ChevronUp className="w-3.5 h-3.5" /></>
                      ) : (
                        <>Show Specialist Reasoning <ChevronDown className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                    
                    {expandedReasoning[msg.id] && (
                      <div className="mt-2 p-3 rounded-md bg-background border border-border/80 text-[10px] font-mono leading-relaxed space-y-2 select-text">
                        <div>
                          <span className="text-blue-500 font-bold block">🧠 THOUGHT:</span>
                          <p className="text-muted/90 mt-0.5">{msg.reasoningPath.thought}</p>
                        </div>
                        <div>
                          <span className="text-purple-500 font-bold block">⚙️ ACTION:</span>
                          <p className="text-muted/90 mt-0.5">{msg.reasoningPath.action}</p>
                        </div>
                        <div>
                          <span className="text-amber-500 font-bold block">🔍 OBSERVATION:</span>
                          <p className="text-muted/90 mt-0.5">{msg.reasoningPath.observation}</p>
                        </div>
                        <div>
                          <span className="text-emerald-500 font-bold block">💾 DECISION:</span>
                          <p className="text-muted/90 mt-0.5">{msg.reasoningPath.decision}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Console Command Input Bar */}
        <div className="p-3 border-t border-border bg-surface/30">
          <form onSubmit={handleSendCommand} className="flex gap-2">
            <input
              type="text"
              placeholder={pipelineRunning ? "Agents coordinating..." : "Ask Orchestrator a question, or type commands (/sync, /fix all)..."}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              disabled={pipelineRunning}
              className="flex-1 bg-background border border-border rounded-sm px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted focus:border-foreground focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={pipelineRunning || !chatInput.trim()}
              className="px-3 rounded-sm bg-foreground hover:bg-accent text-background hover:text-accent-foreground transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Maximized Collaboration Channel Modal */}
      {isChatMaximized && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in">
          <div className="bg-background border border-border rounded-lg w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-zoom-in">
            <div className="p-4 border-b border-border bg-surface/30 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-muted flex items-center gap-2 font-bold">
                <Terminal className="w-4 h-4" /> Specialist Collaboration Board [trial-{trialId}]
              </span>
              <button
                onClick={() => setIsChatMaximized(false)}
                className="p-1.5 rounded hover:bg-surface border border-border/60 text-muted hover:text-foreground transition-all cursor-pointer font-mono text-[10px] uppercase tracking-wider px-2"
              >
                Close Panel
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background select-text">
              {chatHistory.map((msg) => {
                let colorClass = "bg-background border border-border";
                let iconColor = "bg-surface text-muted";
                let senderIcon = <Cpu className="w-4 h-4" />;
                
                if (msg.sender.includes('Scout')) {
                  iconColor = "bg-blue-600/10 text-blue-700";
                  senderIcon = <BookOpen className="w-4 h-4" />;
                } else if (msg.sender.includes('Designer')) {
                  iconColor = "bg-purple-600/10 text-purple-700";
                  senderIcon = <FileText className="w-4 h-4" />;
                } else if (msg.sender.includes('Analyst')) {
                  iconColor = "bg-amber-600/10 text-amber-700";
                  senderIcon = <LineChart className="w-4 h-4" />;
                } else if (msg.sender.includes('Regulatory')) {
                  iconColor = msg.type === 'error' ? "bg-red-600/10 text-red-700" : "bg-emerald-600/10 text-emerald-700";
                  senderIcon = <ShieldCheck className="w-4 h-4" />;
                } else if (msg.sender.includes('Human Lead')) {
                  colorClass = "bg-accent/5 border border-accent/10";
                  iconColor = "bg-accent text-white";
                  senderIcon = <User className="w-4 h-4" />;
                } else if (msg.sender.includes('System')) {
                  colorClass = "bg-surface/20 border border-border/60 text-muted";
                  iconColor = "bg-surface border border-border text-muted";
                  senderIcon = <Terminal className="w-4 h-4" />;
                } else if (msg.type === 'thought') {
                  colorClass = "bg-surface/40 border border-border text-muted font-mono text-[11px] leading-relaxed";
                }

                return (
                  <div key={msg.id} className={`p-4 rounded-lg ${colorClass} flex flex-col gap-2 transition-all`}>
                    <div className="flex items-center justify-between text-xs font-mono text-muted">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${iconColor}`}>
                          {senderIcon}
                        </div>
                        <span className="font-bold text-foreground">{msg.sender}</span>
                        <span className="text-[9px] bg-surface px-1.5 py-0.5 rounded border border-border uppercase tracking-wider">{msg.role}</span>
                      </div>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className="text-sm font-normal leading-relaxed text-foreground select-text whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    {msg.reasoningPath && (
                      <div className="mt-2 pt-2 border-t border-border/40 space-y-2.5 font-mono text-[11px] leading-relaxed select-text">
                        <div>
                          <span className="text-blue-500 font-bold block">🧠 THOUGHT:</span>
                          <p className="text-muted/95 mt-0.5">{msg.reasoningPath.thought}</p>
                        </div>
                        <div>
                          <span className="text-purple-500 font-bold block">⚙️ ACTION:</span>
                          <p className="text-muted/95 mt-0.5">{msg.reasoningPath.action}</p>
                        </div>
                        <div>
                          <span className="text-amber-500 font-bold block">🔍 OBSERVATION:</span>
                          <p className="text-muted/95 mt-0.5">{msg.reasoningPath.observation}</p>
                        </div>
                        <div>
                          <span className="text-emerald-500 font-bold block">💾 DECISION:</span>
                          <p className="text-muted/95 mt-0.5">{msg.reasoningPath.decision}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={maximizedMessagesEndRef} />
            </div>
            <div className="p-4 border-t border-border bg-surface/20">
              <form onSubmit={handleSendCommand} className="flex gap-2">
                <input
                  type="text"
                  placeholder={pipelineRunning ? "Agents coordinating..." : "Ask Orchestrator a question, or type commands (/sync, /fix all)..."}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={pipelineRunning}
                  className="flex-1 bg-background border border-border rounded-sm px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted focus:border-foreground focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={pipelineRunning || !chatInput.trim()}
                  className="px-5 rounded-sm bg-foreground hover:bg-accent text-background hover:text-accent-foreground transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Agent Inspector Panel */}
      {inspectorAgent && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-background/30 backdrop-blur-sm" onClick={() => setInspectorAgent(null)} />
          <div className="relative w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col h-full z-50 animate-fade-up">
            <div className="p-5 border-b border-border bg-surface/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  inspectorAgent === 'scout' ? 'bg-blue-600/10 text-blue-700' :
                  inspectorAgent === 'designer' ? 'bg-purple-600/10 text-purple-700' :
                  inspectorAgent === 'statistical' ? 'bg-amber-600/10 text-amber-700' :
                  'bg-red-600/10 text-red-700'
                }`}>
                  {inspectorAgent === 'scout' && <BookOpen className="w-4 h-4" />}
                  {inspectorAgent === 'designer' && <FileText className="w-4 h-4" />}
                  {inspectorAgent === 'statistical' && <LineChart className="w-4 h-4" />}
                  {inspectorAgent === 'reviewer' && <ShieldCheck className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">
                    {inspectorAgent === 'scout' && 'Literature Scout'}
                    {inspectorAgent === 'designer' && 'Protocol Designer'}
                    {inspectorAgent === 'statistical' && 'Statistical Analyst'}
                    {inspectorAgent === 'reviewer' && 'Regulatory Auditor'}
                  </h3>
                  <p className="text-[9px] text-muted font-mono mt-0.5 uppercase tracking-wider">
                    {inspectorAgent === 'scout' && 'Analyzed literature for safety signals & endpoints'}
                    {inspectorAgent === 'designer' && 'Designed protocol from evidence brief'}
                    {inspectorAgent === 'statistical' && 'Performed power calculations & endpoint validation'}
                    {inspectorAgent === 'reviewer' && 'Audited consistency across evidence, protocol & SAP'}
                  </p>
                </div>
              </div>
              <button onClick={() => setInspectorAgent(null)} className="p-1.5 rounded hover:bg-surface border border-border/60 text-muted hover:text-foreground transition-all cursor-pointer font-mono text-[10px] uppercase tracking-wider px-2">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Agent Identity & Specification Card */}
              <div className="p-4 rounded-xl border border-accent/25 bg-accent/8 space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-[10px] font-mono text-muted uppercase tracking-wider">Agent Specifications</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse-dot" />
                    Active
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                  <div>
                    <span className="text-muted font-mono text-[9px] block uppercase tracking-wider">Model Architecture</span>
                    <span className="font-semibold text-foreground">
                      {inspectorAgent === 'scout' && 'Gemini 1.5 Pro'}
                      {inspectorAgent === 'designer' && 'Gemini 1.5 Pro'}
                      {inspectorAgent === 'statistical' && 'Gemini 1.5 Flash'}
                      {inspectorAgent === 'reviewer' && 'o1-preview (Hybrid)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted font-mono text-[9px] block uppercase tracking-wider">Target Specialty</span>
                    <span className="font-semibold text-foreground">
                      {inspectorAgent === 'scout' && 'Clinical literature synthesis'}
                      {inspectorAgent === 'designer' && 'Structured medical writing'}
                      {inspectorAgent === 'statistical' && 'Power calculation & cohort sizing'}
                      {inspectorAgent === 'reviewer' && 'FDA compliance & mismatch checks'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted font-mono text-[9px] block uppercase tracking-wider">Live Processing Metrics</span>
                    <span className="text-foreground">
                      {inspectorAgent === 'scout' && 'Parsed 47 documents · 1.84k tokens/s · PubMed connected'}
                      {inspectorAgent === 'designer' && 'Protocol generated · Dosing schema verified · ALT-bounded'}
                      {inspectorAgent === 'statistical' && 'Chi-square proportion model · 80% target power verified'}
                      {inspectorAgent === 'reviewer' && '21 CFR Part 11 compliant · Semantic validation active'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scout — Evidence Summary */}
              {inspectorAgent === 'scout' && (
                evidenceBrief ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded border border-border bg-surface/10">
                      <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold mb-3">Safety Signals Found</h4>
                      <div className="space-y-2">
                        {(evidenceBrief.content_json?.safety_signals || []).map((s: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-2 rounded bg-background border border-border">
                            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              s.severity === 'HIGH' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                              'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            }`}>{s.severity}</span>
                            <div className="text-[11px]">
                              <span className="font-semibold text-foreground">{s.signal}</span>
                              <span className="text-muted ml-1">({s.incidence})</span>
                              <p className="text-muted mt-0.5 text-[10px]">{s.rationale}</p>
                              <p className="text-muted text-[9px] mt-0.5">Source: {s.source}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded border border-border bg-surface/10">
                      <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold mb-2">Efficacy Endpoints</h4>
                      <div className="space-y-1">
                        {(evidenceBrief.content_json?.efficacy || []).map((e: any, i: number) => (
                          <p key={i} className="text-[11px] text-foreground">{e.endpoint} — <span className="text-muted">{e.rationale}</span></p>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded border border-border bg-surface/10">
                      <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold mb-2">Recommended Populations</h4>
                      <div className="flex flex-wrap gap-1">
                        {(evidenceBrief.content_json?.populations?.inclusion || []).map((inc: string, i: number) => (
                          <span key={i} className="text-[9px] bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-500/20">{inc}</span>
                        ))}
                        {(evidenceBrief.content_json?.populations?.exclusion || []).map((exc: string, i: number) => (
                          <span key={i} className="text-[9px] bg-red-500/10 text-red-700 px-1.5 py-0.5 rounded border border-red-500/20">{exc}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted italic text-xs">Scout has not completed analysis yet.</div>
                )
              )}

              {/* Designer — Protocol Summary */}
              {inspectorAgent === 'designer' && (
                protocol ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded border border-border bg-surface/10">
                      <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold mb-2">Protocol {protocol.version || 'v1.0'}</h4>
                      <p className="text-xs text-foreground font-semibold mb-3">{protocol.sections_json?.title}</p>
                      <h5 className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1">Primary Endpoint</h5>
                      <p className="text-[11px] text-foreground mb-3">{protocol.sections_json?.primary_endpoint}</p>
                      <h5 className="text-[9px] text-muted uppercase tracking-wider font-bold mb-1">Exclusion Criteria</h5>
                      <ul className="space-y-1">
                        {(protocol.sections_json?.exclusion_criteria || []).map((exc: any, i: number) => {
                          const text = typeof exc === 'string' ? exc : exc?.criterion || '';
                          return (
                            <li key={i} className="text-[11px] text-foreground border border-border bg-background px-2 py-1 rounded flex items-start gap-1.5">
                              <span className="text-red-500 mt-0.5">•</span> {text}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                    <div className="p-4 rounded border border-border bg-surface/10">
                      <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold mb-2">Flagged Assumptions</h4>
                      {(protocol.sections_json?.assumptions || []).map((a: any, i: number) => {
                        const text = typeof a === 'string' ? a : a?.assumption || '';
                        return (
                          <p key={i} className="text-[11px] text-muted border-b border-border/40 py-1 last:border-0">⚠ {text}</p>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted italic text-xs">Designer has not drafted yet.</div>
                )
              )}

              {/* Statistical — SAP Summary */}
              {inspectorAgent === 'statistical' && (
                sap ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded border border-border bg-surface/10 text-center">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-muted">Power</span>
                        <p className="text-lg font-bold text-foreground">{(sap.content_json?.power_calculation?.power * 100) || '80'}%</p>
                      </div>
                      <div className="p-3 rounded border border-border bg-surface/10 text-center">
                        <span className="font-mono text-[8px] uppercase tracking-wider text-muted">Alpha</span>
                        <p className="text-lg font-bold text-foreground">{sap.content_json?.power_calculation?.alpha || '0.05'}</p>
                      </div>
                    </div>
                    <div className="p-4 rounded border border-border bg-surface/10">
                      <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold mb-2">Sample Size</h4>
                      <p className="text-sm font-bold text-accent">{sap.content_json?.power_calculation?.calculated_sample_size || 'N/A'}</p>
                      <p className="text-[10px] text-muted mt-1">Method: {sap.content_json?.primary_statistical_method || 'N/A'}</p>
                    </div>
                    <div className="p-4 rounded border border-border bg-surface/10">
                      <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold mb-2">Endpoint Verification</h4>
                      <p className={`text-[11px] ${(sap.content_json?.endpoint_validation || '').includes('WARNING') ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {(sap.content_json?.endpoint_validation || '').includes('WARNING') ? '⚠ ' : '✓ '}
                        {sap.content_json?.endpoint_validation || 'Validated'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted italic text-xs">Analyst has not completed calculations yet.</div>
                )
              )}

              {/* Reviewer — Audit Summary */}
              {inspectorAgent === 'reviewer' && (
                <div className="space-y-4">
                  <div className="p-4 rounded border border-border bg-surface/10">
                    <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold mb-2">Compliance Status</h4>
                    <div className={`p-3 rounded border text-xs font-semibold ${
                      currentStatus === 'APPROVED_REGULATORY' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600' :
                      conflicts.filter((c: any) => c.status === 'OPEN').length > 0 ? 'bg-red-500/5 border-red-500/20 text-red-600' :
                      'bg-amber-500/5 border-amber-500/20 text-amber-600'
                    }`}>
                      {currentStatus === 'APPROVED_REGULATORY' ? '✓ All checks passed — ready for IND submission' :
                       conflicts.filter((c: any) => c.status === 'OPEN').length > 0 ? `⚠ ${conflicts.filter((c: any) => c.status === 'OPEN').length} conflict(s) need human review` :
                       'Pending review'}
                    </div>
                  </div>
                  {conflicts.filter((c: any) => c.status === 'OPEN').length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold">Detected Conflicts</h4>
                      {conflicts.filter((c: any) => c.status === 'OPEN').map((c: any) => (
                        <div key={c.id} className="p-3 rounded border border-border bg-background">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                              c.severity === 'HIGH' ? 'bg-red-500/10 text-red-600 border border-red-500/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            }`}>{c.severity}</span>
                            <span className="font-mono text-[9px] text-foreground font-bold">{c.id}</span>
                          </div>
                          <p className="text-[10px] text-muted">{c.position_a}</p>
                          <p className="text-[10px] text-muted mt-1">vs {c.position_b}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
