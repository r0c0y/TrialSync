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

    // Load trial context (defensive)
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
      Answer their questions about the trial parameters, safety guidelines, and coordination decisions based on the context.
      If they want to run the pipeline, tell them they can type "/sync" or click the Sync button.
      If they ask how to resolve a conflict, explain they can type "/fix alt" (to fix liver ALT limits), "/fix renal" (to fix kidney eGFR limits), "/fix endpoint" (to update endpoints), or "/fix all" to resolve all conflicts.
      
      Be extremely professional, scientific, precise, and concise. Do not use verbose conversational filler.
    `;

    const prompt = `
      Current Trial Context JSON:
      ${JSON.stringify(context, null, 2)}
      
      User Message: "${message}"
      
      Provide your response as the Decision Orchestrator.
    `;

    let responseText = '';
    try {
      responseText = await callAgentModel({
        agentIndex: 5,
        prompt,
        systemInstruction
      });
    } catch (err: any) {
      console.warn('[Chat Route] LLM call failed, using rule-based chat fallback:', err.message || err);
      // Rules-based fallback chat if LLM keys are entirely offline
      const msg = message.toLowerCase();
      if (msg.includes('alt') || msg.includes('liver') || msg.includes('hepatotoxicity')) {
        responseText = `[Decision Orchestrator] The Literature Scout flagged baseline ALT > 40 U/L as a high hepatotoxicity risk based on Smith et al. (2023). Currently, the Protocol Designer set the limit to > 100 U/L. You can resolve this by typing "/fix alt" to restrict inclusion criteria to Baseline ALT ≤ 40 U/L.`;
      } else if (msg.includes('renal') || msg.includes('egfr') || msg.includes('kidney')) {
        responseText = `[Decision Orchestrator] The Literature Scout identified a renal safety signal starting at eGFR < 60 mL/min/1.73m² (Johnson et al. 2025). The Protocol Designer set the exclusion to < 30 mL/min, which is too permissive. Type "/fix renal" to update the protocol exclusion boundary to < 60 mL/min.`;
      } else if (msg.includes('endpoint') || msg.includes('week') || msg.includes('power')) {
        responseText = `[Decision Orchestrator] Literature reviews indicate clinical efficacy peaks at Week 12 (Doe et al. 2024), and Week 8 data is noisy. The Protocol Designer drafted a Week 8 primary endpoint, which has low statistical justification. Type "/fix endpoint" to change the primary endpoint to Week 12.`;
      } else if (msg.includes('fix') || msg.includes('resolve')) {
        responseText = `[Decision Orchestrator] To resolve conflicts, you can use these commands in the terminal input:
        - "/fix alt" - Restrict baseline ALT to <= 40 U/L.
        - "/fix renal" - Exclude baseline eGFR < 60 mL/min.
        - "/fix endpoint" - Update primary endpoint analysis to Week 12.
        - "/fix all" - Resolve all three conflicts simultaneously.`;
      } else if (msg.includes('sync') || msg.includes('run') || msg.includes('start')) {
        responseText = `[Decision Orchestrator] You can trigger a full pipeline execution loop by typing "/sync" or clicking the 'Initiate Protocol Sync' button.`;
      } else {
        responseText = `[Decision Orchestrator] I am TrialSync's central coordinator. I monitor our 4 agents (Scout, Designer, Analyst, and Regulatory Auditor). Currently, the trial status is ${trial.status} and there are ${openConflicts.length} open safety/design conflicts. Type "/help" to view all command parameters.`;
      }
    }

    return NextResponse.json({ success: true, response: responseText });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
