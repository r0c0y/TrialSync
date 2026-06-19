import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY_1 || process.env.GEMINI_KEY_2 || '');

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
- GitHub: https://github.com/r0c0y/TrialSync
- Contact: ranchoguruji07@gmail.com

Be concise, helpful, and enthusiastic. If asked about technical details you don't know, be honest. For support queries, direct to ranchoguruji07@gmail.com.`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: `User question: ${message}\n\nProvide a helpful, concise response about TrialSync:` }
    ]);

    const response = result.response.text();

    return NextResponse.json({ success: true, response });
  } catch (err: any) {
    console.error('[Chat API] Error:', err);
    // Fallback response when LLM fails
    const fallbackResponse = getFallbackResponse(err.message || '');
    return NextResponse.json({ success: true, response: fallbackResponse });
  }
}

function getFallbackResponse(error: string): string {
  const lower = error.toLowerCase();
  if (lower.includes('api key') || lower.includes('quota') || lower.includes('not found')) {
    return `I'm running in offline mode right now. TrialSync coordinates 4 AI agents (Literature Scout, Protocol Designer, Statistical Analyst, Regulatory Auditor) to automate clinical trial design. For help, email ranchoguruji07@gmail.com.`;
  }
  return `TrialSync is a clinical trial automation platform that orchestrates multiple AI agents for literature synthesis, protocol design, statistical analysis, and regulatory compliance. For detailed support, contact ranchoguruji07@gmail.com.`;
}
