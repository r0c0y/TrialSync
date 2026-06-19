import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { callAgentModel } from '@/lib/models';

export async function POST(req: Request) {
  try {
    const { trialId, message } = await req.json();

    if (!trialId || !message) {
      return NextResponse.json({ error: 'Trial ID and Message are required.' }, { status: 400 });
    }

    const trial = await db.getTrial(trialId);
    if (!trial) {
      return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
    }

    let docs = [], brief = null, protocol = null, sap = null, conflictsList = [], decisions = [];
    try {
      docs = (await db.getDocuments(trialId)) || [];
      brief = await db.getEvidenceBrief(trialId) || null;
      protocol = await db.getProtocol(trialId) || null;
      sap = await db.getSap(trialId) || null;
      conflictsList = (await db.getConflicts(trialId)) || [];
      decisions = (await db.getDecisionLogs(trialId)) || [];
    } catch (e) {
      console.warn('[Chat Route] Failed to load some context:', e);
    }

    const openConflicts = Array.isArray(conflictsList) ? conflictsList.filter((c: any) => c.status === 'OPEN') : [];

    const context = {
      trialId,
      name: trial.name,
      indication: trial.indication,
      status: trial.status,
      documentsCount: docs.length,
      evidenceBrief: brief?.content_json || null,
      protocol: protocol?.sections_json || null,
      sap: sap?.content_json || null,
      openConflicts: openConflicts.map((c: any) => ({
        id: c.id,
        type: c.type,
        severity: c.severity,
        position_a: c.position_a,
        position_b: c.position_b,
        recommendation: c.recommendation
      })),
      decisionLogs: decisions.map((d: any) => ({
        title: d.title,
        decision: d.decision,
        rationale: d.rationale
      }))
    };

    const systemInstruction = `
      You are the Decision Orchestrator, the central AI manager of TrialSync, an enterprise clinical trial coordination system.
      You coordinate 4 specialist agents:
      1. Literature Scout (Scans literature, extracts safety signals and efficacy points)
      2. Protocol Designer (Drafts inclusion/exclusion criteria and primary endpoints based on evidence)
      3. Statistical Analyst (Calculates power and sample size, validates endpoints)
      4. Regulatory Compliance Reviewer (Checks design choices against evidence safety bounds, flags conflicts)
      
      You are talking to the Human Clinical Program Lead (the user).
      You have full context of the current trial. Answer their questions about:
      - The trial parameters, safety guidelines, and coordination decisions
      - What the agents are doing or have done
      - The evidence, protocol, SAP contents
      - Any conflicts and how to resolve them
      
      If they ask general questions about TrialSync (not trial-specific), answer those too:
      - What TrialSync is and how it works
      - How the agents coordinate
      - Features of the platform
      - Contact/support info (email: ranchoguruji07@gmail.com)
      
      If they want to run the pipeline, tell them to type "/sync" or click the Sync button.
      If they ask how to resolve a conflict, explain they can type "/fix alt", "/fix renal", "/fix endpoint", or "/fix all".
      
      Be professional, helpful, and concise. Use the trial context to give specific answers.
    `;

    const prompt = `
      Current Trial Context JSON:
      ${JSON.stringify(context, null, 2)}
      
      User Message: "${message}"
      
      Respond helpfully as the Decision Orchestrator. If the user asks a general question about TrialSync, answer it. If they ask about the trial, use the context above.
    `;

    let responseText = '';
    try {
      responseText = await callAgentModel({ agentIndex: 5, prompt, systemInstruction });
    } catch (err: any) {
      console.warn('[Chat Route] LLM call failed, using comprehensive fallback:', err.message || err);
      const q = message.toLowerCase();
      const status = trial.status || 'UNKNOWN';
      const conflictCount = openConflicts.length;

      if (q.includes('alt') || q.includes('liver') || q.includes('hepatotoxicity')) {
        const conf = openConflicts.find((c: any) => c.id?.includes('ALT'));
        responseText = conf
          ? `[Decision Orchestrator] Conflict ${conf.id}: Evidence flags ALT > 40 U/L as hepatotoxic risk, but protocol uses ALT > 100 U/L. Type "/fix alt" to align the criterion to ≤ 40 U/L.`
          : `[Decision Orchestrator] No active ALT conflict detected in this trial.`;
      } else if (q.includes('renal') || q.includes('egfr') || q.includes('kidney')) {
        const conf = openConflicts.find((c: any) => c.id?.includes('RENAL'));
        responseText = conf
          ? `[Decision Orchestrator] Conflict ${conf.id}: Evidence shows renal risk at eGFR < 60, protocol excludes at < 30. Type "/fix renal" to correct.`
          : `[Decision Orchestrator] No active renal conflict detected in this trial.`;
      } else if (q.includes('endpoint') || q.includes('week') || q.includes('power')) {
        const conf = openConflicts.find((c: any) => c.id?.includes('ENDPOINT'));
        responseText = conf
          ? `[Decision Orchestrator] Conflict ${conf.id}: Protocol uses Week 8 but evidence supports Week 12. Type "/fix endpoint" to update.`
          : `[Decision Orchestrator] No active endpoint conflict detected.`;
      } else if (q.includes('fix') || q.includes('resolve') || q.includes('conflict')) {
        responseText = conflictCount > 0
          ? `[Decision Orchestrator] There ${conflictCount === 1 ? 'is 1 open conflict' : `are ${conflictCount} open conflicts`}. Use: "/fix alt", "/fix renal", "/fix endpoint", or "/fix all" to resolve.`
          : `[Decision Orchestrator] No open conflicts — the trial is on track!`;
      } else if (q.includes('sync') || q.includes('run') || q.includes('start') || q.includes('pipeline')) {
        responseText = `[Decision Orchestrator] To trigger the agent pipeline, type "/sync" or click the "Initiate Protocol Sync" button.`;
      } else if (q.includes('agent') || q.includes('scout') || q.includes('designer') || q.includes('analyst') || q.includes('auditor')) {
        responseText = `[Decision Orchestrator] TrialSync has 4 agents: Literature Scout (searches evidence), Protocol Designer (drafts criteria), Statistical Analyst (power/SAP), Regulatory Auditor (compliance/FDA). They work sequentially: Scout → Designer → Analyst → Auditor. Each passes context to the next via Band.ai.`;
      } else if (q.includes('what is') || q.includes('trialsync') || q.includes('trial sync') || q.includes('platform')) {
        responseText = `[Decision Orchestrator] TrialSync is a multi-agent clinical trial design platform. It coordinates 4 specialist AI agents through Band.ai to automate evidence synthesis, protocol drafting, SAP generation, conflict resolution, and regulatory compliance — all with a 21 CFR Part 11 audit trail.`;
      } else if (q.includes('band') || q.includes('orchestrat') || q.includes('not working') || q.includes('pro') || q.includes('plan')) {
        responseText = `[Decision Orchestrator] Band.ai is our orchestration layer. The integration is fully coded — agent registration, rooms, WebSocket streaming — but requires a Band Pro/Enterprise plan for Human API access. Currently our account is on a limited plan. Apply promo code BANDHACK26 on the Band dashboard to upgrade. The app works in demo mode with local orchestration in the meantime.`;
      } else if (q.includes('contact') || q.includes('support') || q.includes('email') || q.includes('help')) {
        responseText = `[Decision Orchestrator] For support, email ranchoguruji07@gmail.com. I'm here to help with trial-specific questions too!`;
      } else if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('what can you do') || q.includes('help')) {
        responseText = `[Decision Orchestrator] Hi! I'm your TrialSync co-pilot for trial "${trial.name}". I can answer questions about this trial's evidence, protocol, SAP, conflicts, and general questions about TrialSync. Current status: ${status}. ${conflictCount > 0 ? `There ${conflictCount === 1 ? 'is 1' : `are ${conflictCount}`} open conflict${conflictCount > 1 ? 's' : ''} to review.` : 'No open conflicts.'}`;
      } else {
        responseText = `[Decision Orchestrator] I'm your TrialSync co-pilot for trial "${trial.name}" (${trial.indication}). Current status: ${status}. ${conflictCount > 0 ? `${conflictCount} open conflict${conflictCount > 1 ? 's' : ''} need${conflictCount === 1 ? 's' : ''} review.` : 'All clear.'} I can explain the evidence, protocol, SAP, conflicts, or general platform features. Ask me anything!`;
      }
    }

    return NextResponse.json({ success: true, response: responseText });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
