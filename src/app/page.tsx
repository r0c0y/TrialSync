'use client';

import Link from 'next/link';
import { 
  FileSearch, 
  FileText, 
  LineChart, 
  ShieldCheck, 
  GitMerge, 
  ArrowRight, 
  Activity, 
  Lock, 
  Database,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#030303] text-zinc-100 overflow-hidden font-sans select-none">
      {/* Background glowing effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[400px] h-[400px] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header / Navbar */}
      <header className="relative z-10 border-b border-zinc-900/80 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                TrialSync
              </span>
              <span className="ml-1.5 px-2 py-0.5 text-[10px] font-medium border border-blue-500/30 rounded bg-blue-500/10 text-blue-400 uppercase tracking-widest">
                CFR Part 11
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
            <a href="#problem" className="hover:text-white transition-colors">The Problem</a>
            <a href="#agents" className="hover:text-white transition-colors">Agent Platform</a>
            <a href="#features" className="hover:text-white transition-colors">Product Specifications</a>
          </nav>

          <Link href="/dashboard" className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all shadow-md shadow-white/5 active:scale-95">
            Enter Workspace
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 text-center flex flex-col items-center">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/80 text-xs text-zinc-400 mb-8 select-none">
          <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
          <span>Built for Band of Agents Hackathon</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600" />
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.15] bg-gradient-to-b from-white via-zinc-100 to-zinc-500 bg-clip-text text-transparent mb-6">
          Clinical trials run on time.
        </h1>

        {/* Sub-headline */}
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-12">
          TrialSync replaces disconnected document management with a unified, auditable 
          workspace where evidence, protocol design, statistical plans, and regulatory submissions remain 
          cryptographically synchronized.
        </p>

        {/* Hero CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-24">
          <Link href="/dashboard" className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold text-white hover:opacity-95 transition-opacity shadow-lg shadow-blue-500/20 active:scale-[0.98]">
            Launch Clinical Board
          </Link>
          <a href="#agents" className="px-8 py-4 rounded-xl border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80 transition-colors font-semibold text-zinc-300">
            See Agents in Action
          </a>
        </div>

        {/* Interactive Multi-Agent Flow Visualization */}
        <div className="w-full max-w-5xl p-1 rounded-2xl border border-zinc-900 bg-zinc-950/50 backdrop-blur-sm relative mb-32 group shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-emerald-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="p-8 md:p-12">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-10">
              Coordinated Workflow Architecture
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
              {/* Agent 1: Literature Scout */}
              <div className="flex flex-col items-center p-5 rounded-xl border border-zinc-900 bg-zinc-950/80 relative">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400 mb-4">
                  <FileSearch className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-sm mb-1 text-zinc-200">Literature Scout</h4>
                <p className="text-[11px] text-zinc-500 text-center">Synthesizes literature & extracts safety signals</p>
                <div className="mt-4 text-[10px] font-mono text-zinc-400 bg-zinc-900/50 px-2 py-1 rounded">
                  Gemini 1.5 Pro
                </div>
              </div>

              {/* Connector */}
              <div className="hidden md:flex items-center justify-center text-zinc-800">
                <ArrowRight className="w-5 h-5 animate-pulse text-zinc-700" />
              </div>

              {/* Agent 2: Protocol Designer */}
              <div className="flex flex-col items-center p-5 rounded-xl border border-zinc-900 bg-zinc-950/80 relative">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-sm mb-1 text-zinc-200">Protocol Designer</h4>
                <p className="text-[11px] text-zinc-500 text-center">Drafts inclusion criteria & endpoints</p>
                <div className="mt-4 text-[10px] font-mono text-zinc-400 bg-zinc-900/50 px-2 py-1 rounded">
                  Structured Layout
                </div>
              </div>

              {/* Connector */}
              <div className="hidden md:flex items-center justify-center text-zinc-800">
                <ArrowRight className="w-5 h-5 animate-pulse text-zinc-700" />
              </div>

              {/* Agent 3: Statistical analyst */}
              <div className="flex flex-col items-center p-5 rounded-xl border border-zinc-900 bg-zinc-950/80 relative">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 mb-4">
                  <LineChart className="w-6 h-6" />
                </div>
                <h4 className="font-semibold text-sm mb-1 text-zinc-200">Statistical Analyst</h4>
                <p className="text-[11px] text-zinc-500 text-center">Calculates sample size & drafts SAP</p>
                <div className="mt-4 text-[10px] font-mono text-zinc-400 bg-zinc-900/50 px-2 py-1 rounded">
                  Power Analysis
                </div>
              </div>
            </div>

            {/* Central Orchestrator & Compliance review connections */}
            <div className="mt-12 pt-10 border-t border-zinc-900 flex flex-col md:flex-row items-center justify-around gap-8">
              {/* Orchestrator */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 max-w-sm">
                <GitMerge className="w-8 h-8 text-blue-400 shrink-0" />
                <div>
                  <h4 className="font-semibold text-xs text-blue-400 uppercase tracking-widest">Decision Orchestrator</h4>
                  <p className="text-xs text-zinc-400 mt-1">Tracks state locks, coordinates resolutions, and registers auditable decision trails.</p>
                </div>
              </div>

              {/* Compliance reviewer */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 max-w-sm">
                <ShieldCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-semibold text-xs text-emerald-400 uppercase tracking-widest">Regulatory Agent</h4>
                  <p className="text-xs text-zinc-400 mt-1">Runs adversarial zero-shot check on evidence vs protocol to flag conflicts early.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="relative z-10 border-t border-zinc-950 bg-zinc-950/20 py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">
                The Real Bottleneck in Drug Development
              </h2>
              <p className="text-zinc-400 mb-6 leading-relaxed">
                Clinical trial design requires clinical evidence, protocol design, statistical calculations, and regulatory 
                filings to be completed by independent teams. Information is lost between reference databases, Word documents on shared drives, and statistical packages.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                This fragmentation results in **preventable contradictions** (e.g. including patient populations that literature flagged as risky) 
                which are caught weeks later during regulatory review, causing expensive redesign cycles.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/50">
                <h3 className="font-bold text-lg mb-2 text-zinc-100">4-8 Weeks</h3>
                <p className="text-xs text-zinc-500">Average timeline delay caused by document coordination failures per trial.</p>
              </div>
              <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/50">
                <h3 className="font-bold text-lg mb-2 text-zinc-100">$2M - $5M</h3>
                <p className="text-xs text-zinc-500">Timeline acceleration value of a single 2-week reduction in protocol finalization.</p>
              </div>
              <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/50">
                <h3 className="font-bold text-lg mb-2 text-zinc-100">21 CFR Part 11</h3>
                <p className="text-xs text-zinc-500">FDA regulation requiring immutable electronic signatures and complete system audit logs.</p>
              </div>
              <div className="p-6 rounded-xl border border-zinc-900 bg-zinc-950/50">
                <h3 className="font-bold text-lg mb-2 text-zinc-100">Zero Trust</h3>
                <p className="text-xs text-zinc-500">Every design choice is traceably linked back to a verified scientific paper citation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-900 py-12 text-center text-xs text-zinc-600 bg-black/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-zinc-400">TrialSync</span>
            <span className="text-zinc-600">| Regulatory Agent Workspace</span>
          </div>
          <div className="flex items-center gap-6">
            <span>FDA 21 CFR Part 11 Compliance Module Enabled</span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Cryptographic Signatures
            </span>
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> PostgreSQL Verified
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
