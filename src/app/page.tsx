'use client';

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/UserMenu";
import GlobalCoPilot from "@/components/GlobalCoPilot";

// ───────────────────────────────────────────────────────────
// Reusable: reveal on scroll
// ───────────────────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, filter: "blur(6px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ───────────────────────────────────────────────────────────
// Typewriter for hero subline (runs once)
// ───────────────────────────────────────────────────────────
function Typewriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    let i = 0;
    const start = setTimeout(() => {
      const id = setInterval(() => {
        i++;
        setShown(text.slice(0, i));
        if (i >= text.length) clearInterval(id);
      }, 18);
    }, delay);
    return () => clearTimeout(start);
  }, [text, delay]);
  return (
    <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent caret">
      {shown}
    </span>
  );
}

// ───────────────────────────────────────────────────────────
// Animated coordination diagram (hero)
// ───────────────────────────────────────────────────────────
function CoordinationDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const nodes = [
    {
      stage: "Stage 01 · Synthesis",
      title: "Literature Scout",
      lines: ["Scanning 14,213 papers…", "Found: Safety Signal [H2-A]"],
      delay: 0.1,
    },
    {
      stage: "Stage 02 · Protocol",
      title: "Trial Designer",
      lines: ["Mapping inclusion criteria…", "Linked: [H2-A] context preserved"],
      delay: 0.5,
      active: true,
    },
    {
      stage: "Stage 03 · Submission",
      title: "Regulatory Agent",
      lines: ["Drafting IND Section 4.2", "Audit trail · 100% verified"],
      delay: 0.9,
    },
  ];

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 md:p-12"
    >
      {/* Background grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #121211 1px, transparent 1px), linear-gradient(to bottom, #121211 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-6">
        {/* connecting line behind nodes */}
        <svg
          className="pointer-events-none absolute left-0 right-0 top-[78px] hidden h-px w-full md:block"
          viewBox="0 0 1000 2"
          preserveAspectRatio="none"
        >
          <motion.line
            x1="80"
            y1="1"
            x2="920"
            y2="1"
            stroke="currentColor"
            className="text-accent/40"
            strokeWidth="1.5"
            strokeDasharray="4 6"
            initial={{ pathLength: 0 }}
            animate={inView ? { pathLength: 1 } : {}}
            transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
          />
        </svg>

        {nodes.map((n, idx) => (
          <motion.div
            key={n.title}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: n.delay, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10"
          >
            <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              {n.stage}
            </div>
            <div
              className={`rounded-md border bg-background p-5 shadow-[0_1px_0_rgba(18,18,17,0.04)] ${
                n.active ? "border-accent ring-4 ring-accent/5" : "border-border"
              }`}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold tracking-tight">{n.title}</span>
                <span
                  className={`size-1.5 rounded-full ${
                    n.active ? "bg-accent animate-pulse-dot" : "bg-foreground/30"
                  }`}
                />
              </div>
              <div className="font-mono text-[11px] leading-relaxed text-muted">
                {n.lines.map((l) => (
                  <div key={l}>{l}</div>
                ))}
              </div>
            </div>
            <div className="mx-auto mt-3 h-6 w-px bg-border md:hidden" />
            <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              · agent {String(idx + 1).padStart(2, "0")}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 1.4, duration: 0.6 }}
        className="mt-10 flex items-center justify-center gap-2"
      >
        <span className="size-1.5 rounded-full bg-accent animate-pulse-dot" />
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
          Band coordination layer — live
        </span>
      </motion.div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Context timeline: traditional vs TrialSync
// ───────────────────────────────────────────────────────────
function TimelineCompare() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-120px" });
  return (
    <div ref={ref} className="space-y-8">
      {[
        {
          label: "Traditional sequential workflow",
          weeks: "Error caught · Week 14",
          width: "78%",
          tone: "bg-foreground/15",
          fill: "bg-foreground/50",
          mono: "text-muted",
        },
        {
          label: "TrialSync coordination",
          weeks: "Signal surfaced · Week 02",
          width: "14%",
          tone: "bg-accent/10",
          fill: "bg-accent",
          mono: "text-accent",
        },
      ].map((r, i) => (
        <div key={r.label} className="space-y-2">
          <div className={`flex items-baseline justify-between font-mono text-[10px] uppercase tracking-[0.18em] ${r.mono}`}>
            <span>{r.label}</span>
            <span>{r.weeks}</span>
          </div>
          <div className={`h-1.5 w-full overflow-hidden ${r.tone}`}>
            <motion.div
              className={`h-full ${r.fill}`}
              initial={{ width: 0 }}
              animate={inView ? { width: r.width } : {}}
              transition={{ duration: 1.4, delay: 0.25 + i * 0.25, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────
// Counter
// ───────────────────────────────────────────────────────────
function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1400;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return (
    <span ref={ref}>
      {prefix}
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

// ───────────────────────────────────────────────────────────
// Page
// ───────────────────────────────────────────────────────────
export default function Home() {
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      {/* Scroll progress bar */}
      <motion.div
        className="fixed left-0 top-0 z-[60] h-px bg-accent origin-left"
        style={{ width: progressWidth }}
      />

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-10">
            <a href="#" className="flex items-center gap-2">
              <span className="grid size-5 place-items-center rounded-sm bg-foreground">
                <span className="size-1.5 rounded-full bg-accent" />
              </span>
              <span className="font-mono text-sm font-bold uppercase tracking-[0.15em]">
                TrialSync
              </span>
            </a>
            <div className="hidden gap-7 text-sm font-medium text-muted md:flex">
              <a className="hover:text-foreground transition-colors" href="#agents">Agents</a>
              <a className="hover:text-foreground transition-colors" href="#workflow">Workflow</a>
              <a className="hover:text-foreground transition-colors" href="#compliance">Compliance</a>
              <Link className="hover:text-foreground transition-colors" href="/login">Workspace</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserMenu />
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-sm bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent"
            >
              Sign In →
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-20 md:pt-28">
        <div className="mb-14 max-w-4xl">
          <Reveal>
            <div className="mb-7 inline-flex items-center gap-2 rounded-sm border border-accent/15 bg-accent/[0.05] px-2.5 py-1.5">
              <span className="size-1.5 rounded-full bg-accent animate-pulse-dot" />
              <Typewriter text="Now in private beta · Built on Band" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-5xl font-extrabold tracking-[-0.04em] text-balance md:text-7xl lg:text-[5.5rem] lg:leading-[0.95]">
              The operating system{" "}
              <span className="font-serif italic font-normal text-foreground/85">
                for clinical trials.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.25}>
            <p className="mt-8 max-w-[54ch] text-pretty text-lg leading-relaxed text-muted md:text-xl">
              TrialSync coordinates literature synthesis, protocol design, statistical analysis,
              and regulatory submission inside a single tamper-evident workspace —{" "}
              <span className="text-foreground">where context never dies between teams.</span>
            </p>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-sm bg-foreground px-5 py-3 text-sm font-semibold text-background transition-colors hover:bg-accent"
              >
                Sign In to Workspace
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <a
                href="#workflow"
                className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-5 py-3 text-sm font-semibold hover:bg-surface"
              >
                See how it works
              </a>
              <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                21 CFR Part 11 · SOC 2 · HIPAA
              </span>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.55}>
          <CoordinationDiagram />
        </Reveal>
      </section>

      {/* TICKER */}
      <section className="border-y border-border bg-surface/50 py-5 overflow-hidden">
        <div className="flex animate-ticker gap-12 whitespace-nowrap font-mono text-xs uppercase tracking-[0.2em] text-muted">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex shrink-0 gap-12">
              <span>· Evidence Briefing</span>
              <span>· Protocol Draft v2.1</span>
              <span>· Safety Signal H2-A</span>
              <span>· SAP Endpoint Map</span>
              <span>· IND Section 4.2</span>
              <span>· Audit Hash Verified</span>
              <span>· Cohort B Excluded</span>
              <span>· Coordination Packet</span>
              <span>· Context Preserved</span>
              <span>· Band Sync Active</span>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEM */}
      <section id="workflow" className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 py-28 md:grid-cols-2 md:gap-24">
          <div>
            <Reveal>
              <div className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                · The bottleneck
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="text-4xl font-extrabold tracking-[-0.03em] text-balance md:text-5xl">
                Context dies <span className="font-serif italic font-normal">between teams.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-[44ch] text-muted leading-relaxed">
                Literature findings live in PDFs. Protocols live in Word. Analysis plans live in
                SAS. By the time a safety signal reaches Regulatory, the chain of reasoning is
                already gone — and the trial is already off-course.
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-10 space-y-3">
                {[
                  {
                    tag: "LOST",
                    title: "Renal signal flagged by Evidence team",
                    sub: "Misread as 'avoid if possible'. Cohort included. 3-week revision cycle.",
                  },
                  {
                    tag: "LOST",
                    title: "Primary endpoint at 12 weeks (literature)",
                    sub: "Design wrote 8 weeks. Statistical built SAP. Caught at IND draft.",
                  },
                  {
                    tag: "LOST",
                    title: "Renal contraindication evidence link",
                    sub: "Regulatory submission rejected. $1.4M cost. 6 weeks lost.",
                  },
                ].map((row, i) => (
                  <Reveal key={row.title} delay={0.35 + i * 0.08}>
                    <div className="flex items-start gap-4 border-l-2 border-accent bg-background p-4">
                      <span className="mt-0.5 font-mono text-[10px] font-bold tracking-[0.18em] text-accent">
                        {row.tag}
                      </span>
                      <div>
                        <div className="text-sm font-semibold">{row.title}</div>
                        <div className="text-xs text-muted">{row.sub}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>
          </div>

          <div className="flex flex-col gap-10 md:pt-20">
            <Reveal delay={0.2}>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
                {[
                  { k: "$4.2M", v: "Avg. cost per revision cycle" },
                  { k: "3–6mo", v: "Sequential team handoffs" },
                  { k: "2–3×", v: "Cascading failures per trial" },
                  { k: "8 wks", v: "Average delay surfaced late" },
                ].map((s) => (
                  <div key={s.k} className="bg-background p-6">
                    <div className="font-serif text-3xl tracking-tight">{s.k}</div>
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                      {s.v}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="rounded-md border border-border bg-background p-6">
                <div className="mb-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                  · Signal latency
                </div>
                <TimelineCompare />
                <p className="mt-6 text-sm leading-relaxed text-muted">
                  When Evidence, Design, and Regulatory share the same coordination layer, a
                  conflict that would normally surface in week 14 surfaces in week 2.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* AGENTS */}
      <section id="agents" className="mx-auto max-w-7xl px-6 py-28">
        <div className="mb-16 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <div className="max-w-xl">
            <Reveal>
              <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                · The agent stack
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
                Four specialists.{" "}
                <span className="font-serif italic font-normal">One shared memory.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-5 max-w-[48ch] text-muted">
                Each agent is purpose-built for one stage of protocol development — and every
                output is permanently linked back to the evidence that justified it.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.2}>
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              SYS_STATUS · OPERATIONAL
            </div>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: "01",
              name: "Literature Scout",
              desc: "Synthesizes global research. Surfaces safety signals, contraindications, and patient sub-populations.",
              out: "OUTPUT  Identifying Ph3 failure patterns in renal-impaired cohort…",
            },
            {
              n: "02",
              name: "Protocol Design",
              desc: "Drafts inclusion / exclusion criteria, endpoints, and visit schedules — every clause linked to evidence.",
              out: "OUTPUT  Revising criterion 1.4 — exclude eGFR <30 per signal [H2-A]…",
            },
            {
              n: "03",
              name: "Statistical Analyst",
              desc: "Builds the analysis plan, sample-size calc, and code specs. Escalates ambiguous endpoints in-band.",
              out: "OUTPUT  Defining SAP endpoints from Protocol v2.1 primary markers…",
            },
            {
              n: "04",
              name: "Regulatory Agent",
              desc: "Drafts IND submissions. Cross-references every claim against the upstream chain. Flags inconsistencies.",
              out: "OUTPUT  Section 4.1 drafted. Verified against 21 CFR Part 11 audit log…",
            },
          ].map((a, i) => (
            <Reveal key={a.name} delay={i * 0.08}>
              <div className="group flex h-full flex-col bg-background p-6 transition-colors hover:bg-surface">
                <div className="mb-6 grid size-8 place-items-center bg-foreground font-mono text-xs text-background">
                  {a.n}
                </div>
                <h3 className="text-lg font-bold tracking-tight">{a.name}</h3>
                <p className="mt-2 text-sm leading-snug text-muted">{a.desc}</p>
                <div className="mt-6 overflow-hidden rounded-xs bg-surface p-3 font-mono text-[10px] leading-relaxed text-muted group-hover:bg-background">
                  <span className="text-accent">{a.out.split("  ")[0]}  </span>
                  {a.out.split("  ").slice(1).join("  ")}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* BAND COORDINATION FEED */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 py-28 md:grid-cols-[1.05fr_1fr] md:gap-20">
          <div>
            <Reveal>
              <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                · Powered by Band
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <h2 className="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
                A coordination layer,{" "}
                <span className="font-serif italic font-normal">not another inbox.</span>
              </h2>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-[46ch] text-muted leading-relaxed">
                Agents don't email each other. They announce, escalate, and resolve inside a single
                shared workspace. Every decision is observable. Every output is anchored to the
                upstream context that produced it.
              </p>
            </Reveal>
            <Reveal delay={0.3}>
              <ul className="mt-8 space-y-4 text-sm">
                {[
                  "Evidence findings remain attached to design decisions, forever.",
                  "Conflicts surface in-band — no offline coordination loss.",
                  "Every agent action carries a cryptographic provenance chain.",
                  "Human reviewers join the same thread, not a parallel one.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 bg-accent" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <Reveal delay={0.2}>
            <div className="overflow-hidden rounded-md border border-border bg-background">
              <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-accent animate-pulse-dot" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                    Band · Trial GH-204 · Live feed
                  </span>
                </div>
                <span className="font-mono text-[10px] text-muted">14:32 UTC</span>
              </div>
              <div className="divide-y divide-border">
                {[
                  {
                    agent: "Literature Scout",
                    color: "text-foreground",
                    msg: "Signal detected · Renal impairment (eGFR <30) shows 3.1× safety event rate. Source: NEJM 2023-A.",
                    tag: "EVIDENCE",
                  },
                  {
                    agent: "Protocol Design",
                    color: "text-foreground",
                    msg: "Acknowledged [H2-A]. Updating exclusion criterion 1.4 → eGFR ≥30 required.",
                    tag: "DRAFT v2.1",
                  },
                  {
                    agent: "Statistical Analyst",
                    color: "text-foreground",
                    msg: "Sample size recalculated · n=412 → n=387 to preserve 0.8 power at adjusted criterion.",
                    tag: "SAP",
                  },
                  {
                    agent: "Regulatory Agent",
                    color: "text-accent",
                    msg: "Conflict resolved · IND Section 4.2 now consistent with Evidence Brief #08. Audit hash locked.",
                    tag: "✓ VERIFIED",
                    highlight: true,
                  },
                ].map((row, i) => (
                  <motion.div
                    key={row.msg}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.6, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className={`px-5 py-4 ${row.highlight ? "bg-accent/[0.04]" : ""}`}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className={`text-xs font-bold tracking-tight ${row.color}`}>
                        {row.agent}
                      </span>
                      <span
                        className={`font-mono text-[9px] uppercase tracking-[0.2em] ${
                          row.highlight ? "text-accent" : "text-muted"
                        }`}
                      >
                        {row.tag}
                      </span>
                    </div>
                    <p className="text-sm leading-snug text-muted">{row.msg}</p>
                  </motion.div>
                ))}
              </div>
              <div className="border-t border-border bg-surface px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                4 agents · 1 thread · context survived
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* METRICS */}
      <section className="mx-auto max-w-7xl px-6 py-28">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-4">
          {[
            { v: <Counter to={62} suffix="%" />, l: "Reduction in protocol revision cycles" },
            { v: <Counter to={8} suffix=" wks" />, l: "Median acceleration to IND draft" },
            { v: <Counter to={100} suffix="%" />, l: "Evidence → decision traceability" },
            { v: <Counter to={5} prefix="$" suffix="M+" />, l: "Acceleration value per Phase 3 trial" },
          ].map((m, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div className="flex h-full flex-col justify-between bg-background p-8">
                <div className="font-serif text-5xl tracking-tight md:text-6xl">{m.v}</div>
                <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {m.l}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* COMPLIANCE */}
      <section id="compliance" className="bg-foreground text-background">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 py-28 md:grid-cols-2 md:items-center">
          <Reveal>
            <div className="order-2 md:order-1">
              <div className="overflow-hidden rounded-md border border-background/10 bg-background/[0.04]">
                <div className="flex items-center justify-between border-b border-background/10 px-4 py-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-background/50">
                    audit_trail.log
                  </span>
                  <span className="font-mono text-[10px] text-accent">SHA-256 · LOCKED</span>
                </div>
                <div className="divide-y divide-background/10">
                  {[
                    { id: "TRAIL-8821", t: "2024-05-12T14:32:11Z", who: "LITERATURE_SCOUT", what: "Evidence verified · signal H2-A", tag: "✓" },
                    { id: "TRAIL-8822", t: "2024-05-12T14:35:44Z", who: "PROTOCOL_DESIGN",   what: "Criterion 1.4 amended → linked H2-A", tag: "✓" },
                    { id: "TRAIL-8823", t: "2024-05-12T14:38:21Z", who: "REGULATORY_AGENT",  what: "Conflict flagged in IND §4.2",        tag: "⚑" },
                    { id: "TRAIL-8824", t: "2024-05-12T14:41:09Z", who: "PROTOCOL_DESIGN",   what: "Resolution accepted · v2.1 sealed",  tag: "✓" },
                  ].map((row, i) => (
                    <motion.div
                      key={row.id}
                      initial={{ opacity: 0, y: 6 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 font-mono text-[11px]"
                    >
                      <span className="text-background/40">{row.id}</span>
                      <div className="min-w-0">
                        <div className="truncate text-background/85">{row.what}</div>
                        <div className="truncate text-[10px] text-background/40">
                          {row.who} · {row.t}
                        </div>
                      </div>
                      <span className={row.tag === "⚑" ? "text-accent" : "text-background/60"}>
                        {row.tag}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="order-1 md:order-2">
              <div className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
                · Regulated by default
              </div>
              <h2 className="text-4xl font-extrabold tracking-[-0.03em] md:text-5xl">
                Audit-ready{" "}
                <span className="font-serif italic font-normal text-background/85">
                  from day one.
                </span>
              </h2>
              <p className="mt-6 max-w-[44ch] leading-relaxed text-background/70">
                TrialSync is built to 21 CFR Part 11 standards. Every agent decision, every edit,
                every coordination signal is sealed in a tamper-evident chain — inspection-ready
                without a single export.
              </p>
              <ul className="mt-8 space-y-4 text-sm font-medium">
                {[
                  "Immutable agent outputs with electronic signatures",
                  "Version-locked records, cryptographic hash per artifact",
                  "Reason-for-change captured automatically per edit",
                  "Inspection-mode export for FDA / EMA / PMDA reviewers",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3">
                    <span className="size-1.5 bg-accent" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="border-b border-border bg-background">
        <div className="mx-auto max-w-5xl px-6 py-32 text-center">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-sm border border-accent/15 bg-accent/[0.05] px-2.5 py-1.5">
              <span className="size-1.5 rounded-full bg-accent animate-pulse-dot" />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                Built for the Band of Agents Hackathon
              </span>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 className="text-5xl font-extrabold tracking-[-0.04em] text-balance md:text-7xl">
              Accelerate your path{" "}
              <span className="font-serif italic font-normal">to first-in-human.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-8 max-w-[52ch] text-lg text-muted">
              Get immediate access to TrialSync and launch your secure workspace dashboard to manage active trials.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mx-auto mt-12 flex justify-center">
              <Link
                href="/login"
                className="rounded-sm bg-foreground px-8 py-4 text-sm font-semibold text-background transition-colors hover:bg-accent"
              >
                Get Started →
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Global CoPilot */}
      <GlobalCoPilot />

      {/* Footer */}
      <footer className="border-t border-border bg-surface/50 px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid size-5 place-items-center rounded-sm bg-foreground">
              <span className="size-1.5 rounded-full bg-accent" />
            </span>
            <span className="font-mono text-sm font-bold uppercase tracking-[0.15em]">
              TrialSync
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              · powered by Band
            </span>
          </div>
          <div className="flex gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            <a href="#" className="hover:text-foreground">Platform</a>
            <a href="#" className="hover:text-foreground">Security</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="mailto:ranchoguruji07@gmail.com" className="hover:text-foreground">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              © 2026 TrialSync Inc.
            </span>
            <a href="mailto:ranchoguruji07@gmail.com" className="font-mono text-[10px] text-accent hover:underline">
              ranchoguruji07@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
