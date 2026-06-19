'use client';

import { useState, useMemo } from 'react';
import { useBandWebSocket, WsMessage } from '@/hooks/useBandWebSocket';
import {
  Cpu, BookOpen, FileText, LineChart, ShieldCheck, User, Brain,
  Hammer, CheckCircle, XCircle, AlertTriangle, Radio, Filter,
  FlaskConical, Shield, BarChart3, Layers
} from 'lucide-react';

interface Props {
  roomId: string | null;
  wsUrl: string;
  connected: boolean;
  agentStatus: Record<string, 'idle' | 'working' | 'done' | 'error'>;
}

// Topic channel detection from message content
const TOPICS = [
  { id: 'all',               label: 'All',              icon: Layers,       color: 'text-foreground' },
  { id: 'evidence-signals',  label: 'Evidence',         icon: FlaskConical, color: 'text-blue-500' },
  { id: 'protocol-decisions',label: 'Protocol',         icon: FileText,     color: 'text-purple-500' },
  { id: 'conflicts-detected',label: 'Conflicts',        icon: AlertTriangle,color: 'text-red-500' },
  { id: 'audit-trail',       label: 'Audit',            icon: Shield,       color: 'text-emerald-500' },
  { id: 'statistical',       label: 'Stats',            icon: BarChart3,    color: 'text-amber-500' },
];

function classifyTopic(msg: WsMessage): string {
  const c = msg.content.toLowerCase();
  const n = (msg.senderName || '').toLowerCase();

  if (c.includes('[#conflict') || c.includes('conflict') || c.includes('triage') || c.includes('discrepancy') || c.includes('mismatch'))
    return 'conflicts-detected';
  if (c.includes('[#audit') || c.includes('audit') || c.includes('logged') || c.includes('compliance') || c.includes('21 cfr'))
    return 'audit-trail';
  if (c.includes('[#stat') || c.includes('sample size') || c.includes('power') || c.includes('statistical') || n.includes('analyst'))
    return 'statistical';
  if (c.includes('[#protocol') || c.includes('protocol') || c.includes('inclusion') || c.includes('exclusion') || c.includes('drafting') || n.includes('designer'))
    return 'protocol-decisions';
  if (c.includes('[#evidence') || c.includes('evidence') || c.includes('signal') || c.includes('safety') || c.includes('literature') || n.includes('scout'))
    return 'evidence-signals';
  return 'all';
}

const AGENT_COLORS: Record<string, string> = {
  'Literature Scout':     'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Literature Scout Agent':'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Protocol Designer':    'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Protocol Design Agent':'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Statistical Analyst':  'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Statistical Agent':    'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Regulatory Auditor':   'bg-red-500/10 text-red-600 border-red-500/20',
  'Regulatory Agent':     'bg-red-500/10 text-red-600 border-red-500/20',
  'Decision Orchestrator':'bg-accent/10 text-accent border-accent/20',
};

function AgentIcon({ name, size = 12 }: { name: string; size?: number }) {
  const n = name.toLowerCase();
  if (n.includes('scout')) return <BookOpen size={size} />;
  if (n.includes('designer') || n.includes('protocol')) return <FileText size={size} />;
  if (n.includes('analyst') || n.includes('statistical')) return <LineChart size={size} />;
  if (n.includes('auditor') || n.includes('regulatory')) return <ShieldCheck size={size} />;
  if (n.includes('orchestrator')) return <Brain size={size} />;
  return <Cpu size={size} />;
}

function TopicTag({ topic }: { topic: string }) {
  const cfg = TOPICS.find(t => t.id === topic) || TOPICS[0];
  if (topic === 'all') return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wide ${cfg.color} bg-current/10`}
      style={{ backgroundColor: 'currentColor' }}
    >
      <span className={cfg.color}>{cfg.label}</span>
    </span>
  );
}

function MsgRow({ msg }: { msg: WsMessage & { topic: string } }) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const agentCls = AGENT_COLORS[msg.senderName] || 'bg-surface text-muted border-border';
  const isConflict = msg.topic === 'conflicts-detected';
  const isThought  = msg.messageType === 'thought';
  const isToolCall = msg.messageType === 'tool_call';
  const isError    = msg.messageType === 'error';

  return (
    <div className={`py-2.5 px-3 rounded-lg mb-1.5 border transition-all ${
      isConflict ? 'bg-red-500/5 border-red-500/15' :
      isError    ? 'bg-red-500/5 border-red-500/10' :
      isThought  ? 'bg-indigo-500/5 border-indigo-500/10' :
      'bg-background/60 border-border/50'
    }`}>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${agentCls}`}>
          <AgentIcon name={msg.senderName} size={10} />
          <span className="truncate max-w-[90px]">{msg.senderName}</span>
        </span>
        {/* Topic tag */}
        {msg.topic !== 'all' && (() => {
          const t = TOPICS.find(x => x.id === msg.topic);
          const Icon = t?.icon || Layers;
          return (
            <span className={`inline-flex items-center gap-1 px-1 py-0.5 rounded text-[8px] font-mono ${t?.color || 'text-muted'}`}>
              <Icon size={8} />
              #{msg.topic.replace(/-/g, '\u2011')}
            </span>
          );
        })()}
        {/* Event type badge */}
        {msg.messageType && msg.type === 'event' && (
          <span className="text-[8px] font-mono text-muted border border-border px-1 py-0.5 rounded">
            {msg.messageType.replace('_', ' ')}
          </span>
        )}
        <span className="ml-auto text-[8px] font-mono text-muted shrink-0">{time}</span>
      </div>
      <p className={`text-[11px] leading-relaxed break-words ${
        isConflict ? 'text-red-700 dark:text-red-400 font-medium' :
        isThought  ? 'text-muted font-mono italic' :
        'text-foreground/80'
      }`}>
        {msg.content.replace(/\[#[\w-]+\]\s*/g, '')}
      </p>
    </div>
  );
}

// Static "handoff" demo messages shown when no live messages exist
const DEMO_MESSAGES: Array<WsMessage & { topic: string }> = [
  {
    id: 'demo-1', type: 'event', senderName: 'Literature Scout Agent', senderType: 'Agent',
    content: 'Literature analysis complete. Extracted 47 papers: 3 safety signals (ALT hepatotoxicity HIGH, eGFR renal impairment HIGH, QTc prolongation MOD). Publishing to #evidence-signals.',
    messageType: 'tool_result', metadata: {}, topic: 'evidence-signals',
    timestamp: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'demo-2', type: 'message', senderName: 'Protocol Design Agent', senderType: 'Agent',
    content: '[#protocol-decisions] Received Evidence Brief from Scout. Anchoring exclusion criteria: ALT > 40 U/L (hepatotoxicity signal), eGFR < 60 mL/min (renal risk). Setting primary endpoint at Week 12 per CDAI efficacy data.',
    messageType: undefined, metadata: {}, topic: 'protocol-decisions',
    timestamp: new Date(Date.now() - 720000).toISOString(),
  },
  {
    id: 'demo-3', type: 'event', senderName: 'Statistical Agent', senderType: 'Agent',
    content: '[#statistical] SAP v1.0 compiled. Power: 80%, α=0.05, N=200/arm. Endpoint validated at Week 12. Chi-square method. Sample feasibility confirmed.',
    messageType: 'tool_call', metadata: {}, topic: 'statistical',
    timestamp: new Date(Date.now() - 540000).toISOString(),
  },
  {
    id: 'demo-4', type: 'event', senderName: 'Regulatory Agent', senderType: 'Agent',
    content: '[#conflicts-detected] ⚠ CONFLICT DETECTED: Protocol eGFR threshold (< 30 mL/min) conflicts with Evidence Brief (< 60 mL/min). Delta: 30 units. This allows patients with documented renal impairment risk into the study. Flagging for human triage.',
    messageType: 'thought', metadata: {}, topic: 'conflicts-detected',
    timestamp: new Date(Date.now() - 360000).toISOString(),
  },
  {
    id: 'demo-5', type: 'event', senderName: 'Decision Orchestrator', senderType: 'Agent',
    content: '[#audit-trail] Pipeline complete. 4 agents coordinated via Band. 2 conflicts detected: CONF-ALT, CONF-RENAL. Trial status → AWAITING_HUMAN_TRIAGE. All events logged per 21 CFR Part 11.',
    messageType: 'task', metadata: {}, topic: 'audit-trail',
    timestamp: new Date(Date.now() - 180000).toISOString(),
  },
];

export default function BandOrchestrationPanel({ roomId, wsUrl, connected: wsConfigured, agentStatus }: Props) {
  const { messages: liveMessages, connected, error } = useBandWebSocket({
    roomId,
    wsUrl,
    enabled: !!roomId,
  });

  const [activeTopic, setActiveTopic] = useState<string>('all');

  // Annotate live messages with topics
  const enrichedLive = useMemo(() =>
    liveMessages.map(m => ({ ...m, topic: classifyTopic(m) })),
    [liveMessages]
  );

  // Use live messages if any, else demo
  const allMessages = enrichedLive.length > 0 ? enrichedLive : DEMO_MESSAGES;

  const filtered = activeTopic === 'all'
    ? allMessages
    : allMessages.filter(m => m.topic === activeTopic);

  // Count per topic
  const counts: Record<string, number> = {};
  for (const m of allMessages) {
    counts[m.topic] = (counts[m.topic] || 0) + 1;
  }

  return (
    <div className="rounded-xl border border-border bg-background flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-border bg-surface/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full ${connected ? 'bg-emerald-400' : roomId ? 'bg-amber-500' : 'bg-muted'} animate-ping opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-400' : roomId ? 'bg-amber-500' : 'bg-muted'}`} />
          </span>
          <Radio className="w-3 h-3 text-accent" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] font-bold text-muted">
            Band {connected ? 'Live' : roomId ? 'Connecting…' : 'No Room'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {enrichedLive.length === 0 && (
            <span className="text-[8px] font-mono text-muted bg-surface px-1.5 py-0.5 rounded border border-border">demo data</span>
          )}
          <span className="text-[8px] font-mono text-muted">{allMessages.length} msgs</span>
        </div>
      </div>

      {/* Topic Channel Tabs */}
      <div className="border-b border-border bg-surface/20 overflow-x-auto">
        <div className="flex items-center gap-0.5 px-2 py-1.5 min-w-max">
          {TOPICS.map(({ id, label, icon: Icon, color }) => {
            const count = id === 'all' ? allMessages.length : (counts[id] || 0);
            const active = activeTopic === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTopic(id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-wide transition-all ${
                  active
                    ? `bg-foreground text-background shadow-sm`
                    : `text-muted hover:text-foreground hover:bg-surface`
                }`}
              >
                <Icon size={9} />
                #{label}
                {count > 0 && (
                  <span className={`px-1 rounded text-[7px] ${active ? 'bg-white/20 text-background' : 'bg-border text-muted'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error bar */}
      {error && (
        <div className="mx-3 mt-2 px-2 py-1 rounded bg-red-500/5 border border-red-500/20">
          <p className="text-[9px] font-mono text-red-500">{error}</p>
        </div>
      )}

      {/* Message feed */}
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Radio className="w-6 h-6 text-muted mb-2 opacity-30" />
            <p className="text-[10px] font-mono text-muted">
              {roomId ? `No messages on #${activeTopic}` : 'No Band room linked'}
            </p>
          </div>
        ) : (
          filtered.map(msg => <MsgRow key={msg.id} msg={msg as WsMessage & { topic: string }} />)
        )}
      </div>

      {/* Room info footer */}
      {roomId && (
        <div className="border-t border-border px-3 py-1.5 bg-surface/20">
          <p className="font-mono text-[8px] text-muted truncate">Room: {roomId}</p>
        </div>
      )}
    </div>
  );
}
