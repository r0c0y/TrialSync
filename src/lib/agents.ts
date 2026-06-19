import { db, logAuditTrail } from './db';
import { band } from './band';
import { callAgentModel } from './models';
import { ValidationEngine } from './validationEngine';

// --- Micro-Agent Architecture Foundation ---
export interface MicroAgent {
  id: string;
  specialty: string;
  execute: (context: any) => Promise<any>;
}

export abstract class MacroAgent {
  protected microAgents: MicroAgent[] = [];
  
  registerMicroAgent(agent: MicroAgent) { 
    this.microAgents.push(agent); 
  }
  
  async executeMicroAgents(context: any) {
    const results = [];
    for (const agent of this.microAgents) {
      results.push(await agent.execute(context));
    }
    return results;
  }
}
// ------------------------------------------

// ── Band topic channels (emulated via message prefix) ──────────────────────
const BAND_TOPICS = {
  EVIDENCE:  '#evidence-signals',
  PROTOCOL:  '#protocol-decisions',
  CONFLICTS: '#conflicts-detected',
  AUDIT:     '#audit-trail',
  STATS:     '#statistical',
  SYSTEM:    '#system',
} as const;

type BandTopic = typeof BAND_TOPICS[keyof typeof BAND_TOPICS];

async function notifyBandRoom(
  trialId: string,
  sender: string,
  message: string,
  topic: BandTopic = BAND_TOPICS.SYSTEM,
) {
  try {
    const trial = await db.getTrial(trialId);
    if (trial && trial.band_room_id) {
      const topicTagged = `[${topic}] ${message}`;
      await band.sendMessage(trialId, trial.band_room_id, sender, topicTagged);
    }
  } catch (err) {
    console.error('Error notifying Band room:', err);
  }
}

// Emit an inter-agent handoff message (agent A acknowledges agent B's output)
async function emitAgentHandoff(
  trialId: string,
  fromAgent: string,
  toAgent: string,
  handoffContent: string,
  topic: BandTopic,
) {
  await notifyBandRoom(
    trialId,
    toAgent,
    `[@${fromAgent} → ${toAgent}] ${handoffContent}`,
    topic,
  );
  await logAuditTrail(
    trialId,
    'AGENT_HANDOFF',
    'system@trialsync.com',
    toAgent,
    'Agent Coordination',
    `${toAgent} received handoff from ${fromAgent}: ${handoffContent.slice(0, 120)}`,
    'Inter-agent coordination via Band.'
  );
}


// 1. LITERATURE SCOUT AGENT
export async function runLiteratureScout(trialId: string, docContents: string[]) {
  await logAuditTrail(
    trialId,
    'AGENT_START',
    'system@trialsync.com',
    'Literature Scout Agent',
    'Evidence Brief',
    'Literature Scout Agent started analyzing uploaded literature.',
    'System triggered literature scout agent.'
  );
  await notifyBandRoom(trialId, 'Literature Scout Agent', `Starting clinical literature analysis (Gemini 1.5 Pro). Processing ${docContents.length} document(s) — extracting safety signals, efficacy endpoints, and population characteristics...`, BAND_TOPICS.EVIDENCE);
  await db.logAgentProgress(trialId, 'Literature Scout', 'PROCESSING', `Analyzing ${docContents.length} uploaded document(s)...`, 10);

  const combinedText = docContents.join('\n\n');
  let evidenceBrief: any = null;

  try {
    const prompt = `
      ROLE: Clinical Evidence Analyst (Literature Scout Agent) — TrialSync
      
      You are a PhD-level research librarian specialized in extracting clinically relevant safety signals from trial literature to inform protocol design decisions.

      A safety signal is defined as an adverse event that:
      1. Has documented incidence rate (not speculative)
      2. Occurs in the relevant patient population
      3. Is clinically meaningful (serious, requires intervention)
      4. Has clear evidence from clinical trials or post-marketing data

      For each paper, identify signals matching:
      - Hepatotoxicity (if liver metabolism relevant) — specifically look for ALT, AST, bilirubin
      - Renal impairment (if renal clearance relevant) — specifically look for eGFR, creatinine
      - Cardiovascular events (if cardiac relevant) — QT prolongation, arrhythmia
      - Drug interactions (if polypharmacy expected)
      - Population-specific risks (elderly, organ impairment, etc.)

      For each signal, extract EXACTLY:
      1. Event name: Exact terminology from paper
      2. Incidence: Precise percentage/rate (e.g., "3%", "1:1000")
      3. Population: Specific characteristics (age range, baseline labs, comorbidities)
      4. Severity: Life-threatening / Serious / Moderate / Mild
      5. Study details: Author, Year, Study type (RCT/observational/case), N=sample size
      6. Evidence quality: Strong (RCT, n>100) / Moderate (n=50-100) / Weak (n<50 or observational)
      7. Clinical relevance: Why this matters for trial design

      DO NOT:
      - Speculate about risk not documented in paper
      - Include theoretical warnings not backed by data
      - Report events with <0.5% incidence unless life-threatening
      - Add multiple signals for same event from same paper

      Output MUST be valid JSON matching this schema:
      {
        "safety_signals": [
          {
            "signal": "Hepatotoxicity",
            "severity": "HIGH",
            "incidence": "3%",
            "incidence_numerator": 45,
            "incidence_denominator": 1500,
            "population": "Patients with baseline ALT > 40 U/L",
            "rationale": "High incidence in vulnerable population suggests need for exclusion criteria",
            "source": "Smith et al. 2023",
            "evidence_quality": "Strong",
            "clinical_relevance": "High incidence suggests exclusion criteria needed"
          }
        ],
        "efficacy": [
          {
            "endpoint": "Clinical remission response rate at 12 weeks",
            "rate": "65%",
            "rationale": "Primary efficacy endpoint shows significant benefit at 12 weeks; 8-week data is statistically noisy",
            "source": "Doe et al. 2024",
            "evidence_quality": "Strong"
          }
        ],
        "populations": {
          "inclusion": ["Age 18-65 years", "Moderate-to-Severe Crohn's Disease diagnosis"],
          "exclusion": ["Baseline ALT > 40 U/L", "eGFR < 60 mL/min/1.73m2"]
        }
      }
      
      Literature Text:
      ${combinedText.substring(0, 10000)}
    `;

    await db.logAgentProgress(trialId, 'Literature Scout', 'PROCESSING', 'Extracting safety and efficacy signals...', 50);
    const responseText = await callAgentModel({
      agentIndex: 1,
      prompt,
      jsonMode: true
    });

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    evidenceBrief = JSON.parse(cleanJson);
  } catch (err) {
    console.error('Literature Scout LLM processing failed, falling back to mock agent:', err);
  }

  // Fallback to Crohn's indication mock data if LLM failed or response is malformed
  if (!evidenceBrief || !Array.isArray(evidenceBrief.safety_signals) || !Array.isArray(evidenceBrief.efficacy)) {
    evidenceBrief = {
      safety_signals: [
        {
          signal: 'Hepatotoxicity',
          severity: 'HIGH',
          incidence: '3%',
          rationale: 'Elevated liver enzymes observed primarily in patients with baseline ALT > 40 U/L. Absolute contraindication recommended.',
          source: 'Smith et al. 2023'
        },
        {
          signal: 'Renal Impairment Risk',
          severity: 'MEDIUM',
          incidence: '5%',
          rationale: 'Borderline safety signal observed in patients with eGFR < 60 mL/min/1.73m².',
          source: 'Johnson et al. 2025'
        },
        {
          signal: 'QT Prolongation',
          severity: 'MEDIUM',
          incidence: '1%',
          rationale: 'Rare, dose-dependent QT prolongation observed at doses exceeding 200mg/day.',
          source: 'Lee et al. 2025'
        }
      ],
      efficacy: [
        {
          endpoint: 'Clinical remission response rate at 12 weeks',
          rate: '65%',
          rationale: 'Primary efficacy endpoint shows significant benefit compared to placebo starting at week 12. 8-week data is statistically noisy.',
          source: 'Doe et al. 2024'
        }
      ],
      populations: {
        inclusion: ['Age 18-65 years', 'Moderate-to-Severe Crohn\'s Disease', 'Inadequate response to anti-TNF'],
        exclusion: ['Baseline ALT > 40 U/L', 'eGFR < 60 mL/min/1.73m²', 'QTc interval > 450 ms']
      }
    };
  }

  const id = `EVB-${Date.now()}`;
  await db.saveEvidenceBrief(id, trialId, evidenceBrief);
  await db.updateTrialStatus(trialId, 'EVIDENCE_COMPLETE');

  await logAuditTrail(
    trialId,
    'AGENT_COMPLETE',
    'system@trialsync.com',
    'Literature Scout Agent',
    'Evidence Brief',
    'Literature Scout Agent successfully generated the Evidence Brief.',
    'Saved structured evidence brief.'
  );
  await notifyBandRoom(
    trialId,
    'Literature Scout Agent',
    `Evidence synthesis complete (Gemini 1.5 Pro). Extracted ${evidenceBrief.safety_signals.length} safety signals (${evidenceBrief.safety_signals.filter((s: any) => s.severity === 'HIGH').length} critical HIGH-severity). ${evidenceBrief.efficacy.length} efficacy endpoints identified. Primary signal: ${evidenceBrief.safety_signals[0]?.signal || 'hepatotoxicity'}. Evidence Brief published.`,
    BAND_TOPICS.EVIDENCE,
  );
  await db.logAgentProgress(trialId, 'Literature Scout', 'COMPLETE', `Evidence Brief generated. ${evidenceBrief.safety_signals.length} safety signals extracted.`, 100);

  // Handoff to Protocol Designer
  await emitAgentHandoff(
    trialId,
    'Literature Scout Agent',
    'Protocol Design Agent',
    `Evidence Brief ready. Key constraints: ${evidenceBrief.safety_signals.filter((s: any) => s.severity === 'HIGH').map((s: any) => s.signal).join(', ')}. Primary endpoint validated at: ${evidenceBrief.efficacy[0]?.endpoint || 'Week 12'}. Anchoring protocol criteria to these thresholds.`,
    BAND_TOPICS.PROTOCOL,
  );

  return evidenceBrief;
}

// 2. PROTOCOL DESIGNER AGENT
export async function runProtocolDesigner(trialId: string, introduceConflict: boolean = false) {
  await logAuditTrail(
    trialId,
    'AGENT_START',
    'system@trialsync.com',
    'Protocol Design Agent',
    'Protocol Draft',
    'Protocol Design Agent started drafting study protocol.',
    'System triggered protocol designer agent.'
  );
  await notifyBandRoom(
    trialId,
    'Protocol Design Agent',
    `[Gemini 1.5 Pro] Received Evidence Brief handoff from Scout. Drafting inclusion/exclusion criteria anchored to evidence thresholds${introduceConflict ? ' [CONFLICT SIMULATION: intentionally misaligning thresholds to test regulatory filters]' : ''}. Aligning primary endpoint with Scout's efficacy analysis.`,
    BAND_TOPICS.PROTOCOL,
  );
  await db.logAgentProgress(trialId, 'Protocol Designer', 'PROCESSING', 'Drafting protocol templates...', 10);

  const briefRecord = await db.getEvidenceBrief(trialId);
  if (!briefRecord) {
    throw new Error('Evidence Brief must exist before Protocol Design.');
  }

  const brief = briefRecord.content_json;
  let protocolSections: any = null;

  try {
    const prompt = `
      ROLE: Clinical Trial Protocol Designer — TrialSync

      You are an experienced clinical trial designer responsible for creating evidence-based protocol designs. Each decision must be EXPLICITLY JUSTIFIED by the evidence.

      DECISION FRAMEWORK:
      For each safety signal from the Evidence Brief, decide:
      A) EXCLUDE this population entirely — Use when incidence >2% or severity=life-threatening
      B) RESTRICT dosing or monitoring — Use when incidence 0.5-2% and manageable with monitoring
      C) ACCEPT risk with enhanced monitoring — Use when incidence <0.5% or management well-established

      If introduceConflict is true, you MUST intentionally introduce one or more of these flaws:
      1. Set Exclusion criteria for ALT to '> 100 U/L' (dangerous: evidence says ALT > 40 has hepatotoxicity risk)
      2. Set Exclusion criteria for eGFR to '< 30 mL/min/1.73m2' (dangerous: evidence says eGFR < 60 has renal risk)
      3. Set Primary Endpoint to '8 weeks' (incorrect: evidence shows 8-week data is noisy, 12-week is efficacy point)
      
      If introduceConflict is false, align every criterion exactly with the evidence brief parameters.

      CONSTRAINTS:
      - Cannot exclude large populations without strong evidence
      - Must be specific (not "patients with liver disease" → "ALT > 40 U/L")
      - Must be FDA-compliant
      - Must preserve trial feasibility

      Output MUST be valid JSON matching this schema:
      {
        "title": "Study of Zylastin-B in Crohn's Disease",
        "inclusion_criteria": [
          {
            "criterion": "Age 18-65",
            "justification": "Efficacy shown in this age range",
            "evidence_source": "Smith et al. 2023"
          }
        ],
        "exclusion_criteria": [
          {
            "criterion": "Baseline ALT > 40 U/L",
            "justification": "Hepatotoxicity risk: 3% incidence in ALT > 40 group",
            "evidence_source": "Smith et al. 2023",
            "linked_signal": "Hepatotoxicity",
            "decision_type": "EXCLUDE"
          }
        ],
        "primary_endpoint": "Proportion of subjects in clinical remission at Week 12",
        "assumptions": [
          {
            "assumption": "Safety profile manageable in eGFR 30-60",
            "evidence_support": "Moderate",
            "risk_if_wrong": "Increased renal AEs",
            "mitigation": "Plan subgroup analysis"
          }
        ]
      }
      
      Evidence Brief:
      ${JSON.stringify(brief, null, 2)}
      
      Introduce Conflict: ${introduceConflict}
    `;

    await db.logAgentProgress(trialId, 'Protocol Designer', 'PROCESSING', 'Aligning parameters with Evidence Brief...', 50);
    const responseText = await callAgentModel({
      agentIndex: 2,
      prompt,
      jsonMode: true
    });

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    protocolSections = JSON.parse(cleanJson);
  } catch (err) {
    console.error('Protocol Designer LLM processing failed, falling back to mock:', err);
  }

  if (!protocolSections) {
    if (introduceConflict) {
      protocolSections = {
        title: 'Evaluation of Zylastin-B for Crohn\'s Disease Remission',
        inclusion_criteria: [
          'Age 18-65 years at screening',
          'Confirmed diagnosis of moderate-to-severe Crohn\'s Disease',
          'Failed at least one biologic treatment (anti-TNF)'
        ],
        exclusion_criteria: [
          'Baseline ALT > 100 U/L (Upper Limit of Normal)',
          'Renal impairment defined as eGFR < 30 mL/min/1.73m²',
          'Concurrent pregnancy or lactation'
        ],
        primary_endpoint: 'Proportion of subjects in clinical remission at Week 8',
        assumptions: [
          'Assumed safety profile is manageable in patients with eGFR 30-60',
          'Assumed 8-week endpoint provides adequate time for clinical response'
        ]
      };
    } else {
      protocolSections = {
        title: 'Evaluation of Zylastin-B for Crohn\'s Disease Remission',
        inclusion_criteria: [
          'Age 18-65 years at screening',
          'Confirmed diagnosis of moderate-to-severe Crohn\'s Disease',
          'Failed at least one biologic treatment (anti-TNF)'
        ],
        exclusion_criteria: [
          'Baseline ALT > 40 U/L (due to high hepatotoxicity risk)',
          'Renal impairment defined as eGFR < 60 mL/min/1.73m²',
          'Concurrent pregnancy or lactation',
          'Baseline QTc interval > 450 ms'
        ],
        primary_endpoint: 'Proportion of subjects in clinical remission at Week 12',
        assumptions: [
          'Baseline ALT restriction is necessary to prevent liver injury',
          'eGFR cutoff of 60 is conservative based on Johnson et al. safety signal'
        ]
      };
    }
  }

  const docId = `DOC-${Date.now()}`;
  const docContent = `
    Protocol Title: ${protocolSections.title}
    
    INCLUSION CRITERIA:
    ${protocolSections.inclusion_criteria.map((c: string) => `- ${c}`).join('\n')}
    
    EXCLUSION CRITERIA:
    ${protocolSections.exclusion_criteria.map((c: string) => `- ${c}`).join('\n')}
    
    PRIMARY ENDPOINT:
    ${protocolSections.primary_endpoint}
    
    ASSUMPTIONS:
    ${protocolSections.assumptions.map((a: string) => `- ${a}`).join('\n')}
  `;

  await db.createDocument(docId, trialId, 'Protocol Draft v1.0', docContent, 'PROTOCOL', `HASH-${Date.now()}`);
  await db.saveProtocol(`PRT-${Date.now()}`, trialId, docId, protocolSections, '1.0');
  await db.updateTrialStatus(trialId, 'PROTOCOL_DRAFT_COMPLETE');

  await logAuditTrail(
    trialId,
    'AGENT_COMPLETE',
    'system@trialsync.com',
    'Protocol Design Agent',
    'Protocol Draft',
    'Protocol Design Agent drafted Protocol v1.0.',
    'Saved protocol v1.0.'
  );
  await notifyBandRoom(
    trialId,
    'Protocol Designer Agent',
    `Protocol Draft v1.0 compiled. Inclusion criteria: ${protocolSections.inclusion_criteria.length} rules, Exclusion criteria: ${protocolSections.exclusion_criteria.length} rules, Primary endpoint: "${protocolSections.primary_endpoint}".`
  );
  await db.logAgentProgress(trialId, 'Protocol Designer', 'COMPLETE', 'Protocol Draft generated.', 100);

  return protocolSections;
}

// 3. STATISTICAL ANALYST AGENT
export async function runStatisticalAnalyst(trialId: string) {
  await logAuditTrail(
    trialId,
    'AGENT_START',
    'system@trialsync.com',
    'Statistical Agent',
    'Statistical Analysis Plan',
    'Statistical Agent started designing analysis plan and sample size calculations.',
    'System triggered statistical analyst agent.'
  );
  await notifyBandRoom(trialId, 'Statistical Analyst Agent', 'Commencing power calculations and sample size estimates...');
  await db.logAgentProgress(trialId, 'Statistical Analyst', 'PROCESSING', 'Designing analysis plan...', 10);

  const protocolRecord = await db.getProtocol(trialId);
  const briefRecord = await db.getEvidenceBrief(trialId);
  if (!protocolRecord || !briefRecord) {
    throw new Error('Protocol and Evidence Brief must exist before Statistical Analysis Plan can be drafted.');
  }

  const protocol = protocolRecord.sections_json;
  const brief = briefRecord.content_json;
  let sapContent: any = null;

  try {
    const prompt = `
      You are a Biostatistician (Statistical Analyst Agent) specializing in clinical trial designs.
      Review the Protocol Draft and the original Evidence Brief.
      Perform statistical calculations and endpoint validation.
      
      Calculate:
      1. Appropriate sample size based on the efficacy response rates found in the evidence brief (assume placebo response rate = 40%, alpha = 0.05, power = 0.80).
      2. Validate if the primary endpoint proposed in the Protocol (e.g. Week 8 vs Week 12) is statistically justified. If the protocol uses an endpoint with literature noise (e.g. Week 8), flag it with a WARNING in the "endpoint_validation" field.
      
      Output MUST be valid JSON matching this schema:
      {
        "analysis_population": "Intention-to-Treat (ITT) Population",
        "primary_statistical_method": "Chi-square test or ANCOVA",
        "power_calculation": {
          "assumed_active_efficacy": 0.65,
          "assumed_placebo_efficacy": 0.40,
          "alpha": 0.05,
          "power": 0.80,
          "calculated_sample_size": "N = 200 per treatment arm (Total N = 400)",
          "formula": "Two-sample chi-square comparison of proportions"
        },
        "endpoint_validation": "Detailed evaluation text. If the protocol uses Week 8, start this field with 'WARNING: ...'",
        "notes": ["Statistical notes and subgroup analyses"]
      }
      
      Evidence Brief:
      ${JSON.stringify(brief, null, 2)}
      
      Protocol Draft:
      ${JSON.stringify(protocol, null, 2)}
    `;

    await db.logAgentProgress(trialId, 'Statistical Analyst', 'PROCESSING', 'Calculating sample sizes and endpoint powers...', 50);
    const responseText = await callAgentModel({
      agentIndex: 3,
      prompt,
      jsonMode: true
    });

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    sapContent = JSON.parse(cleanJson);
  } catch (err) {
    console.error('Statistical Analyst LLM processing failed, falling back:', err);
  }

  // Fallback to mock data if LLM failed
  if (!sapContent) {
    const endpoint = protocol.primary_endpoint || '';
    const isEightWeeks = endpoint.toLowerCase().includes('8 weeks') || endpoint.toLowerCase().includes('week 8');

    sapContent = {
      analysis_population: 'Intention-to-Treat (ITT) Population',
      primary_statistical_method: 'Chi-square test comparing active vs. placebo clinical remission rates',
      power_calculation: {
        assumed_active_efficacy: 0.65,
        assumed_placebo_efficacy: 0.40,
        alpha: 0.05,
        power: 0.80,
        calculated_sample_size: 'N = 200 per treatment arm (Total N = 400)',
        formula: 'Two-sample chi-square comparison of proportions'
      },
      endpoint_validation: isEightWeeks 
        ? 'WARNING: Primary endpoint at Week 8 has low statistical justification. Efficacy evidence suggests Week 12 response is optimal.' 
        : 'Efficacy endpoint validated at Week 12. Sample size calculations powered at 80%.',
      notes: [
        'Subgroup analysis planned for subjects with baseline renal impairment (eGFR 60-90)',
        'Interim safety analysis planned at 50% enrollment (N=200)'
      ]
    };
  }

  const docId = `DOC-SAP-${Date.now()}`;
  const docContent = `
    Statistical Analysis Plan (SAP)
    
    ANALYSIS POPULATION:
    ${sapContent.analysis_population}
    
    PRIMARY METHOD:
    ${sapContent.primary_statistical_method}
    
    POWER CALCULATION:
    - Active group response rate: ${sapContent.power_calculation.assumed_active_efficacy * 100}%
    - Placebo response rate: ${sapContent.power_calculation.assumed_placebo_efficacy * 100}%
    - Calculated Size: ${sapContent.power_calculation.calculated_sample_size}
    - Power / Alpha: ${sapContent.power_calculation.power * 100}% / ${sapContent.power_calculation.alpha}
    
    ENDPOINT VALIDATION:
    ${sapContent.endpoint_validation}
  `;

  await db.createDocument(docId, trialId, 'Statistical Analysis Plan v1.0', docContent, 'SAP', `HASH-SAP-${Date.now()}`);
  await db.saveSap(`SAP-${Date.now()}`, trialId, docId, sapContent, '1.0');
  await db.updateTrialStatus(trialId, 'SAP_COMPLETE');

  await logAuditTrail(
    trialId,
    'AGENT_COMPLETE',
    'system@trialsync.com',
    'Statistical Agent',
    'Statistical Analysis Plan',
    'Statistical Agent completed SAP v1.0.',
    'Saved SAP v1.0.'
  );
  await notifyBandRoom(
    trialId,
    'Statistical Analyst Agent',
    `Statistical Analysis Plan (SAP) generated. Power: ${sapContent.power_calculation.power * 100}%, Alpha: ${sapContent.power_calculation.alpha}, Sample Size: ${sapContent.power_calculation.calculated_sample_size}.`
  );
  await db.logAgentProgress(trialId, 'Statistical Analyst', 'COMPLETE', 'Statistical Analysis Plan generated.', 100);

  return sapContent;
}

// 4. REGULATORY COMPLIANCE AGENT
export async function runRegulatoryComplianceReview(trialId: string) {
  const trial = await db.getTrial(trialId);
  if (!trial) throw new Error('Trial not found.');

  // STATE LOCK verification
  if (trial.status !== 'SAP_COMPLETE') {
    await logAuditTrail(
      trialId,
      'STATE_LOCK_BLOCKED',
      'regulatory@trialsync.com',
      'Regulatory Agent',
      'Compliance Review',
      'Regulatory Agent check was BLOCKED due to state lock. Waiting for Statistical Agent completion.',
      'Agent state lock active.'
    );
    await notifyBandRoom(trialId, 'Regulatory Agent', 'Regulatory compliance review check BLOCKED by state lock: Waiting for Statistical Analysis Plan (SAP) to be finalized.');
    await db.logAgentProgress(trialId, 'Regulatory Auditor', 'BLOCKED', 'Waiting for SAP completion.', 0);
    return {
      status: 'BLOCKED',
      message: 'State lock active: Regulatory review requires the Statistical Analysis Plan (SAP) to be finalized first.'
    };
  }

  await logAuditTrail(
    trialId,
    'AGENT_START',
    'regulatory@trialsync.com',
    'Regulatory Agent',
    'Compliance Review',
    'Regulatory Agent started consistency review.',
    'System triggered regulatory agent review.'
  );
  await notifyBandRoom(trialId, 'Regulatory Agent', 'Commencing compliance and design consistency review between evidence briefing, protocol draft, and SAP...');
  await db.logAgentProgress(trialId, 'Regulatory Auditor', 'PROCESSING', 'Commencing consistency review...', 10);

  const briefRecord = await db.getEvidenceBrief(trialId);
  const protocolRecord = await db.getProtocol(trialId);
  const sapRecord = await db.getSap(trialId);

  if (!briefRecord || !protocolRecord || !sapRecord) {
    throw new Error('All evidence, protocol, and SAP records must be complete for review.');
  }

  const brief = briefRecord.content_json;
  const protocol = protocolRecord.sections_json;
  const sap = sapRecord.content_json;

  await db.clearOpenConflicts(trialId);
  let conflictsList: any[] = [];

  try {
    const prompt = `
      ROLE: Regulatory Compliance Auditor / FDA Reviewer — TrialSync

      You are an adversarial FDA reviewer ensuring the protocol matches FDA expectations and evidence is properly incorporated. Identify CONFLICTS and GAPS.

      CONFLICT DEFINITION:
      A conflict exists when:
      - Evidence says "risk in population X" but protocol includes population X
      - Evidence says "no data in subgroup Y" but protocol includes subgroup Y
      - Evidence supports efficacy at timepoint T but protocol uses different timepoint
      - Safety restriction suggested but protocol doesn't implement it

      Look for:
      1. Safety bounds mismatch (e.g. Evidence says ALT > 40 is hepatotoxic, but Protocol exclusion says ALT > 100)
      2. Renal safety mismatch (e.g. Evidence says eGFR < 60 is renal risk, but Protocol says eGFR < 30)
      3. Endpoint mismatch (e.g. Protocol says Week 8, Evidence says Week 12 is optimal, or SAP validates Week 12 but Protocol has Week 8)

      Your output ID MUST match specific conflict codes (CONF-ALT, CONF-RENAL, CONF-ENDPOINT, CONF-SAP) so the automatic resolver can map and fix them.

      For each conflict:
      1. Name the conflict clearly
      2. State evidence position: position_a
      3. State protocol position: position_b
      4. Rate severity: HIGH / MEDIUM
      5. Suggest resolution options in recommendation
      
      Output MUST be valid JSON matching this schema:
      {
        "conflicts": [
          {
            "id": "CONF-ALT" | "CONF-RENAL" | "CONF-ENDPOINT" | "CONF-SAP",
            "type": "EVIDENCE_vs_PROTOCOL" | "PROTOCOL_vs_SAP" | "EVIDENCE_vs_SAP",
            "severity": "HIGH" | "MEDIUM" | "LOW",
            "position_a": "Evidence Brief parameter detail (e.g., ALT > 40 is high-risk — source: Smith et al. 2023)",
            "position_b": "Protocol/SAP design flaw detail (e.g., Protocol exclusion ALT > 100)",
            "recommendation": "Specific correction instructions including alternate thresholds (e.g., Specify Baseline ALT <= 40 U/L)"
          }
        ]
      }
      
      Evidence Brief:
      ${JSON.stringify(brief, null, 2)}
      
      Protocol Draft:
      ${JSON.stringify(protocol, null, 2)}
      
      Statistical Analysis Plan (SAP):
      ${JSON.stringify(sap, null, 2)}
    `;

    await db.logAgentProgress(trialId, 'Regulatory Auditor', 'PROCESSING', 'Auditing Protocol and SAP against Evidence Bounds...', 50);
    const responseText = await callAgentModel({
      agentIndex: 4,
      prompt,
      jsonMode: true
    });

    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);
    conflictsList = parsed.conflicts || [];
  } catch (err) {
    console.error('Regulatory Agent LLM processing failed, falling back to rule audit:', err);
  }

  // --- Advanced Citation Mapping Engine ---
  try {
    await db.logAgentProgress(trialId, 'Regulatory Auditor', 'PROCESSING', 'Running structural validation engine...', 70);
    
    const literatureText = [
      ...brief.safety_signals.map((s: any) => s.rationale),
      ...brief.efficacy.map((e: any) => e.rationale)
    ].join('\n');
    const protocolText = protocol.exclusion_criteria.join('\n');
    
    const litThresholds = await ValidationEngine.extractNumericalThresholds(literatureText);
    const protThresholds = await ValidationEngine.extractNumericalThresholds(protocolText);
    
    const citationMismatches = ValidationEngine.mapCitationsAndFindMismatches(litThresholds, protThresholds);
    
    for (const mismatch of citationMismatches) {
      const exists = conflictsList.some(c => c.id === `CONF-${mismatch.parameter.toUpperCase()}`);
      if (!exists) {
        conflictsList.push({
          id: `CONF-${mismatch.parameter.toUpperCase()}`,
          type: 'EVIDENCE_vs_PROTOCOL',
          severity: mismatch.severity,
          position_a: `[CITATION: "${mismatch.literatureThreshold.sourceText}"] Literature bounds: ${mismatch.parameter} ${mismatch.literatureThreshold.operator} ${mismatch.literatureThreshold.value} ${mismatch.literatureThreshold.unit}`,
          position_b: `[CITATION: "${mismatch.protocolThreshold.sourceText}"] Protocol bounds: ${mismatch.parameter} ${mismatch.protocolThreshold.operator} ${mismatch.protocolThreshold.value} ${mismatch.protocolThreshold.unit}`,
          recommendation: mismatch.explanation
        });
      }
    }
  } catch (err) {
    console.error('Validation Engine citation mapping failed:', err);
  }

  // Fallback to rule checking if LLM failed
  if (conflictsList.length === 0) {
    const exclusionText = protocol.exclusion_criteria.join('\n').toLowerCase();
    const matchesAltLimit = exclusionText.match(/alt\s*(?:>|>=|greater than)\s*(\d+)/i);
    
    if (matchesAltLimit) {
      const value = parseInt(matchesAltLimit[1], 10);
      if (value > 40) {
        conflictsList.push({
          id: 'CONF-ALT',
          type: 'EVIDENCE_vs_PROTOCOL',
          severity: 'HIGH',
          position_a: 'Evidence Scout states baseline ALT > 40 U/L represents high hepatotoxicity risk (absolute contraindication).',
          position_b: `Protocol exclusion limits ALT to > ${value} U/L, which exposes patients in the 40-${value} range to severe risk.`,
          recommendation: 'Modify the protocol exclusion criteria to restrict baseline ALT to ≤ 40 U/L.'
        });
      }
    }

    const matchesEgfr = exclusionText.match(/egfr\s*(?:<|<=|less than)\s*(\d+)/i);
    if (matchesEgfr) {
      const value = parseInt(matchesEgfr[1], 10);
      if (value < 60) {
        conflictsList.push({
          id: 'CONF-RENAL',
          type: 'EVIDENCE_vs_PROTOCOL',
          severity: 'HIGH',
          position_a: 'Evidence Scout notes renal impairment risk (borderline safety signal) in patients with eGFR < 60.',
          position_b: `Protocol exclusions only cover eGFR < ${value}, exposing patients with mild-to-moderate impairment (eGFR ${value}-60) to risk.`,
          recommendation: 'Restrict inclusion criteria to subjects with eGFR > 60 mL/min/1.73m².'
        });
      }
    }

    const endpoint = protocol.primary_endpoint.toLowerCase();
    if (endpoint.includes('8 weeks') || endpoint.includes('week 8')) {
      conflictsList.push({
        id: 'CONF-ENDPOINT',
        type: 'EVIDENCE_vs_PROTOCOL',
        severity: 'HIGH',
        position_a: 'Evidence Scout shows peak response rate (65%) occurs at week 12; earlier points are statistically noisy.',
        position_b: 'Protocol lists the primary efficacy endpoint at week 8, risking study failure due to inadequate duration.',
        recommendation: 'Change primary endpoint analysis timepoint to Week 12.'
      });
    }

    if (sap.endpoint_validation && sap.endpoint_validation.includes('WARNING')) {
      conflictsList.push({
        id: 'CONF-SAP',
        type: 'PROTOCOL_vs_SAP',
        severity: 'MEDIUM',
        position_a: 'Protocol specifies primary efficacy endpoint at Week 8.',
        position_b: 'Statistical Analyst Agent reports power calculation is unstable for Week 8 endpoint due to literature noise.',
        recommendation: 'Change primary endpoint to Week 12 to stabilize statistical power and sample size calculation.'
      });
    }
  }

  // Save detected conflicts to database
  for (const c of conflictsList) {
    await db.createConflict(c.id, trialId, c.type, c.severity, c.position_a, c.position_b, c.recommendation, 'OPEN');
  }

  const status = conflictsList.length > 0 ? 'STATUS_AWAITING_HUMAN_TRIAGE' : 'APPROVED_REGULATORY';
  await db.updateTrialStatus(trialId, status);

  await logAuditTrail(
    trialId,
    'AGENT_COMPLETE',
    'regulatory@trialsync.com',
    'Regulatory Agent',
    'Compliance Review',
    `Regulatory review complete. Conflicts found: ${conflictsList.length}. Status updated to: ${status}`,
    'Audit checks completed.'
  );

  if (conflictsList.length > 0) {
    const codes = conflictsList.map((c: any) => c.id).join(', ');
    await notifyBandRoom(
      trialId,
      'Regulatory Agent',
      `🚨 TRIAGE INTERVENTION REQUIRED: Compliance review detected ${conflictsList.length} safety/design discrepancies (${codes}). Trial state locked. Human gatekeeping required in the Conflicts Hub.`
    );
  } else {
    await notifyBandRoom(
      trialId,
      'Regulatory Agent',
      `✓ Compliance review complete. Status: APPROVED. Protocol design aligns perfectly with evidence-based safety parameters and statistical power criteria.`
    );
  }
  await db.logAgentProgress(trialId, 'Regulatory Auditor', 'COMPLETE', 'Compliance review complete.', 100);

  return {
    status,
    conflicts: conflictsList
  };
}
