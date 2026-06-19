'use client';

import { useState } from 'react';
import { Cpu, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface AgentResult {
  name: string;
  agentId: string;
  apiKey: string;
  error?: string;
}

export default function BandAgentSetup({ onComplete }: { onComplete?: (results: AgentResult[]) => void }) {
  const [registering, setRegistering] = useState(false);
  const [results, setResults] = useState<AgentResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    setRegistering(true);
    setError(null);
    try {
      const res = await fetch('/api/band/register-agents', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setResults(json.agents);
        onComplete?.(json.agents);
      } else {
        setError(json.message || 'Registration failed');
        setResults(json.agents);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRegistering(false);
    }
  };

  const copyKeys = () => {
    if (!results) return;
    const envBlock = results
      .map((r) => {
        const varName = r.name === 'Literature Scout' ? 'BAND_AGENT_SCOUT_KEY' : r.name === 'Protocol Designer' ? 'BAND_AGENT_DESIGNER_KEY' : 'BAND_AGENT_AUDITOR_KEY';
        return `# ${r.name}\n# Agent ID: ${r.agentId}\n${varName}=${r.apiKey}`;
      })
      .join('\n\n');
    navigator.clipboard.writeText(envBlock);
  };

  return (
    <div className="p-3 rounded-md border border-border bg-surface/20">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted font-bold flex items-center gap-1.5">
          <Cpu className="w-3 h-3" /> Band Agent Setup
        </h3>
        {!results && !registering && (
          <button
            onClick={handleRegister}
            className="text-[9px] font-mono uppercase tracking-wider text-accent hover:underline cursor-pointer"
          >
            Register Agents
          </button>
        )}
      </div>

      {registering && (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-3 h-3 animate-spin text-accent" />
          <span className="text-[10px] font-mono text-muted">Registering 3 agents on Band...</span>
        </div>
      )}

      {error && (
        <p className="text-[9px] font-mono text-red-600 mb-2">{error}</p>
      )}

      {results && (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.name} className="flex items-center gap-2 text-[10px] font-mono">
              {r.error ? (
                <XCircle className="w-3 h-3 text-red-500 shrink-0" />
              ) : (
                <CheckCircle className="w-3 h-3 text-emerald-500 shrink-0" />
              )}
              <span className={r.error ? 'text-red-600' : 'text-foreground'}>{r.name}</span>
              {r.agentId && <span className="text-muted">({r.agentId.slice(0, 8)}...)</span>}
              {r.error && <span className="text-red-500">{r.error}</span>}
            </div>
          ))}
          {results.some(r => !r.error) && (
            <button
              onClick={copyKeys}
              className="mt-2 text-[9px] font-mono uppercase tracking-wider text-accent hover:underline cursor-pointer"
            >
              Copy API keys to clipboard
            </button>
          )}
        </div>
      )}
    </div>
  );
}
