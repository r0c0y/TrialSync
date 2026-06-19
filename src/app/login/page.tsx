'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FlaskConical, GitBranch, Zap, Shield, Users, ArrowRight, CheckCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [loadingGithub, setLoadingGithub] = useState(false);

  useEffect(() => {
    if (window.location.hash === '#demo') {
      handleDemoLogin();
    }
  }, []);

  const handleDemoLogin = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (res.ok) {
        await new Promise(r => setTimeout(r, 600));
        router.push(from);
        return;
      }
    } catch {}
    document.cookie = `trialsync_session=${encodeURIComponent(JSON.stringify({
      id: 'demo-user-001',
      email: 'demo@trialsync.dev',
      name: 'Clinical Lead (Demo)',
      role: 'Clinical Research Director',
      isDemo: true,
      avatar: 'D',
    }))}; path=/; max-age=86400; SameSite=Lax`;
    await new Promise(r => setTimeout(r, 800));
    router.push(from);
  };

  const handleGithubLogin = () => {
    setLoadingGithub(true);
    window.location.href = `/api/auth/github?from=${encodeURIComponent(from)}`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)`,
        backgroundSize: '32px 32px',
        zIndex: 0,
      }} />
      <div className="dark:hidden fixed inset-0 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)`,
        backgroundSize: '32px 32px',
        zIndex: 0,
      }} />

      <header className="relative z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-6 rounded bg-foreground flex items-center justify-center">
              <span className="size-2 rounded-full bg-accent" />
            </div>
            <span className="font-mono text-sm font-bold uppercase tracking-[0.14em]">TrialSync</span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Enterprise Clinical OS
          </span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-10 items-center">

          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/8 border border-accent/15 mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-accent animate-ping opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">Live System Active</span>
            </div>

            <h1 className="text-4xl font-extrabold tracking-[-0.03em] leading-[1.1] mb-4">
              The Operating System<br />
              <span className="gradient-text-accent">for Clinical Trials</span>
            </h1>

            <p className="text-sm text-muted leading-relaxed mb-8 max-w-sm">
              Multi-agent AI coordinates Evidence Scout, Protocol Designer, Statistical Analyst, 
              and Regulatory Auditor — all through Band. Conflicts surface in seconds, not weeks.
            </p>

            <div className="space-y-3">
              {[
                { icon: FlaskConical, text: 'Real PubMed API — live evidence ingestion', color: 'text-blue-500' },
                { icon: Shield, text: 'openFDA black-box warning detection', color: 'text-red-500' },
                { icon: Users, text: 'Band-coordinated multi-agent handoffs', color: 'text-accent' },
                { icon: CheckCircle, text: '21 CFR Part 11 tamper-evident audit trail', color: 'text-emerald-500' },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${color}`} />
                  <span className="text-xs text-muted">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
            <div className="rounded-xl border border-border bg-surface/40 backdrop-blur-sm p-8 shadow-xl shadow-black/5">
              <div className="mb-8">
                <h2 className="text-xl font-bold tracking-tight mb-1">Sign in to TrialSync</h2>
                <p className="text-xs text-muted">Access the clinical trial coordination platform</p>
              </div>

              <button
                onClick={handleDemoLogin}
                disabled={loadingDemo || loadingGithub}
                className="w-full group relative flex items-center gap-4 px-5 py-4 rounded-lg bg-foreground hover:bg-accent text-background hover:text-white transition-all duration-200 mb-4 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-accent/20 hover:shadow-lg"
              >
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold">Try Demo Account</div>
                  <div className="text-xs opacity-70 font-mono">demo@trialsync.dev · Instant access</div>
                </div>
                {loadingDemo ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
                ) : (
                  <ArrowRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
                )}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-border" />
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                onClick={handleGithubLogin}
                disabled={loadingDemo || loadingGithub}
                className="w-full group flex items-center gap-4 px-5 py-4 rounded-lg border border-border bg-background hover:bg-surface hover:border-foreground/20 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center shrink-0">
                  <GitBranch className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-foreground">Continue with GitHub</div>
                  <div className="text-xs text-muted font-mono">Authenticate via GitHub OAuth</div>
                </div>
                {loadingGithub ? (
                  <div className="w-5 h-5 border-2 border-border border-t-foreground rounded-full animate-spin-slow" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                )}
              </button>

              <div className="mt-8 pt-6 border-t border-border grid grid-cols-3 gap-3 text-center">
                {[
                  { label: '6 Live Trials', sub: 'Pre-seeded' },
                  { label: 'Band API', sub: 'Connected' },
                  { label: 'Real FDA', sub: 'Integrated' },
                ].map(({ label, sub }) => (
                  <div key={label} className="rounded-lg bg-surface/60 p-3 border border-border">
                    <div className="text-xs font-bold text-foreground">{label}</div>
                    <div className="text-[10px] font-mono text-muted mt-0.5">{sub}</div>
                  </div>
                ))}
              </div>

              <p className="text-center text-[10px] font-mono text-muted mt-5">
                By signing in you agree to our{' '}
                <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">Terms</span>
                {' '}and{' '}
                <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
