'use client';

import { useState, useRef, useEffect } from 'react';
import { useTrial } from '@/context/TrialContext';
import { MessageSquare, X, Send, Bot, Sparkles, HelpCircle, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface Message {
  id: string;
  sender: 'user' | 'agent';
  content: string;
  timestamp: string;
}

export default function WorkspaceCoPilot() {
  const { trialId, data } = useTrial();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'agent',
      content: `Hello! I am your TrialSync Co-Pilot. I monitor your 4 specialized agents (Scout, Designer, Analyst, and Reviewer).\n\nAsk me anything about this trial project, what conflicts need resolution, or how TrialSync automates clinical trial design.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialId, message: textToSend }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const agentMsg: Message = {
          id: `msg-${Date.now()}-agent`,
          sender: 'agent',
          content: json.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, agentMsg]);
      } else {
        throw new Error(json.error || 'Failed to get agent response.');
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `msg-${Date.now()}-error`,
        sender: 'agent',
        content: `Error: ${err.message || 'I am having trouble connecting to the Decision Orchestrator right now.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    { label: 'What is TrialSync?', text: 'What is TrialSync and what problems does it solve?' },
    { label: 'Explain this trial', text: 'Explain the current trial, indication, and the roles of our specialist agents.' },
    { label: 'How to fix conflicts?', text: 'What conflicts are currently active in our protocol and how do we resolve them?' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating expanded chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-96 h-[500px] border border-border rounded-xl bg-background/90 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-surface/30 p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center border border-accent/20">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    TrialSync Co-Pilot <Sparkles className="w-3 h-3 text-accent" />
                  </h4>
                  <p className="text-[9px] font-mono text-muted uppercase tracking-wider">Workspace Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-surface border border-border/40 text-muted hover:text-foreground transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Chat Body */}
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 select-text">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col max-w-[85%] ${
                    m.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                      m.sender === 'user'
                        ? 'bg-accent text-accent-foreground rounded-tr-none'
                        : 'bg-surface border border-border rounded-tl-none text-foreground'
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[8px] font-mono text-muted mt-1 px-1">{m.timestamp}</span>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 mr-auto bg-surface/50 border border-border p-3 rounded-xl rounded-tl-none max-w-[85%]">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions block */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 pt-1 border-t border-border/40">
                <span className="text-[8px] font-mono text-muted uppercase tracking-wider block mb-2">Suggested Queries</span>
                <div className="flex flex-col gap-1.5">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(q.text)}
                      className="w-full text-left p-2 rounded bg-surface/40 hover:bg-surface border border-border hover:border-accent/40 text-[10px] text-muted hover:text-foreground flex items-center justify-between transition-all group cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-accent shrink-0" />
                        {q.label}
                      </span>
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(input);
              }}
              className="p-3 border-t border-border bg-surface/20 flex gap-2"
            >
              <input
                type="text"
                placeholder="Ask about this trial or conflicts..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="p-2 rounded-md bg-accent text-accent-foreground hover:bg-accent/80 border border-transparent disabled:opacity-50 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-2xl flex items-center justify-center cursor-pointer border border-accent/20 relative"
      >
        {isOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <>
            <MessageSquare className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border border-background animate-pulse-dot" />
          </>
        )}
      </motion.button>
    </div>
  );
}
