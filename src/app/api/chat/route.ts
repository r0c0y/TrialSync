import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_KEYS = [
  process.env.GEMINI_KEY_1 || '',
  process.env.GEMINI_KEY_2 || '',
  process.env.GEMINI_KEY_3 || '',
].filter(Boolean);

const GROQ_KEYS = [
  process.env.GROQ_KEY_1 || '',
  process.env.GROQ_KEY_2 || '',
  process.env.GROQ_KEY_3 || '',
].filter(Boolean);

const SYSTEM_PROMPT = `You are the TrialSync AI Assistant, a helpful guide for the TrialSync clinical trial automation platform.

TrialSync is a multi-agent clinical trial design platform that coordinates:
1. Literature Scout Agent - Searches PubMed/scientific literature for safety signals, efficacy data
2. Protocol Designer Agent - Drafts inclusion/exclusion criteria, endpoints, visit schedules
3. Statistical Analyst Agent - Builds SAPs, sample-size calculations, power analysis
4. Regulatory Auditor Agent - Reviews for FDA compliance, flags conflicts, ensures 21 CFR Part 11

Key facts:
- Built with Next.js, Band.ai for agent orchestration, Google Gemini/Groq for LLMs
- openFDA integration for real drug safety data
- LiteParse for local OCR document ingestion
- Features: Evidence Briefs, Protocol Drafts, SAPs, Conflict Resolution, 21 CFR Part 11 Audit Trail
- The workspace has: dashboard with trial cards, per-trial pages with agent console + evidence/protocol/SAP/conflicts tabs, knowledge graph visualization, audit trail logging
- GitHub: https://github.com/r0c0y/TrialSync
- Contact: ranchoguruji07@gmail.com

Be concise, helpful, and enthusiastic. If asked about technical details you don't know, be honest. For support queries, direct to ranchoguruji07@gmail.com.`;

async function tryGemini(prompt: string): Promise<string | null> {
  for (const key of GEMINI_KEYS) {
    if (!key || key.trim().length < 5) continue;
    try {
      const ai = new GoogleGenerativeAI(key);
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent([
        { text: SYSTEM_PROMPT },
        { text: `User question: ${prompt}\n\nProvide a helpful, concise response about TrialSync:` }
      ]);
      return result.response.text();
    } catch (e) {
      console.warn('[Chat API] Gemini failed, trying next key:', e);
    }
  }
  return null;
}

async function tryGroq(prompt: string): Promise<string | null> {
  for (const key of GROQ_KEYS) {
    if (!key || key.trim().length < 5) continue;
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `User question: ${prompt}\n\nProvide a helpful, concise response about TrialSync:` }
          ]
        })
      });
      if (!res.ok) continue;
      const data = await res.json();
      return data.choices?.[0]?.message?.content || null;
    } catch (e) {
      console.warn('[Chat API] Groq failed:', e);
    }
  }
  return null;
}

function getFallback(message: string): string {
  const q = message.toLowerCase();

  if (q.includes('agent') || q.includes('scout') || q.includes('designer') || q.includes('analyst') || q.includes('auditor') || q.includes('reviewer')) {
    return `TrialSync has 4 specialist AI agents:

1. **Literature Scout** — Searches PubMed and scientific literature to extract safety signals, efficacy data, and patient population insights
2. **Protocol Designer** — Drafts inclusion/exclusion criteria, primary endpoints, and visit schedules based on evidence
3. **Statistical Analyst** — Calculates power analysis, sample sizes, and validates endpoints for the Statistical Analysis Plan (SAP)
4. **Regulatory Auditor** — Reviews protocol against FDA/EMA guidelines, flags conflicts between evidence and design, ensures 21 CFR Part 11 compliance

They work sequentially: Scout → Designer → Analyst → Auditor. Each hands off context to the next via Band.ai orchestration.`;
  }

  if (q.includes('what is') || q.includes('trial sync') || q.includes('trialsync')) {
    return `TrialSync is a multi-agent clinical trial design platform that automates the entire protocol development pipeline. It coordinates 4 specialist AI agents (Literature Scout, Protocol Designer, Statistical Analyst, Regulatory Auditor) through Band.ai, ensuring context is preserved across every stage. Features include evidence synthesis, protocol drafting, SAP generation, conflict resolution, openFDA integration, and a 21 CFR Part 11 compliant audit trail.`;
  }

  if (q.includes('feature') || q.includes('capability') || q.includes('can you do') || q.includes('what can')) {
    return `TrialSync can:
• Search PubMed and openFDA for real evidence and safety data
• Draft clinical trial protocols with evidence-linked criteria
• Generate Statistical Analysis Plans with power calculations
• Detect conflicts between literature evidence and protocol design
• Resolve conflicts with human-in-the-loop approval
• Provide a 21 CFR Part 11 tamper-evident audit trail
• Visualize trial data as an interactive knowledge graph
• Ingest PDFs/images via OCR (LiteParse)
• Orchestrate everything through Band.ai real-time coordination

Explore the workspace dashboard to see it in action!`;
  }

  if (q.includes('contact') || q.includes('support') || q.includes('help') || q.includes('email')) {
    return `You can reach the TrialSync team at ranchoguruji07@gmail.com. We're happy to help with any questions, feedback, or partnership inquiries!`;
  }

  if (q.includes('github') || q.includes('code') || q.includes('source')) {
    return `TrialSync is open source! Check out the code at https://github.com/r0c0y/TrialSync`;
  }

  return `TrialSync is a clinical trial automation platform that coordinates 4 AI agents (Literature Scout, Protocol Designer, Statistical Analyst, Regulatory Auditor) through Band.ai. It handles evidence synthesis, protocol drafting, SAP generation, conflict resolution, and regulatory compliance.

You can explore the platform by signing in and creating a trial workspace. Need specific help? Email ranchoguruji07@gmail.com.`;
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    // Try Gemini first, then Groq, then fallback
    let response = await tryGemini(message);
    if (!response) response = await tryGroq(message);
    if (!response) response = getFallback(message);

    return NextResponse.json({ success: true, response });
  } catch (err: any) {
    console.error('[Chat API] Error:', err);
    return NextResponse.json({ success: true, response: getFallback('') });
  }
}
