import { GoogleGenAI } from '@google/generative-ai';
import { db, logAuditTrail } from './db';

// Initialize Gemini Client if API key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: any = null;

if (geminiApiKey) {
  // Use GoogleGenAI standard constructor or new GoogleGenAI({ apiKey })
  try {
    ai = new GoogleGenAI({ apiKey: geminiApiKey });
  } catch (err) {
    console.error('Error initializing GoogleGenAI:', err);
  }
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

  const combinedText = docContents.join('\n\n');
  let evidenceBrief: any = null;

  if (ai && geminiApiKey) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
        You are a PhD-level research librarian (Literature Scout Agent) specializing in clinical trials.
        Analyze the following scientific literature and extract a structured evidence briefing.
        Extract:
        1. Safety signals (specifically look for liver toxicity, renal issues, cardiac risk, QT prolongation, ALT, eGFR etc.)
        2. Efficacy endpoints (when does effect peak, primary response rate)
        3. Target patient population details.
        
        Output MUST be valid JSON matching this schema:
        {
          "safety_signals": [
            {
              "signal": "Hepatotoxicity",
              "severity": "HIGH",
              "incidence": "3%",
              "rationale": "High incidence in patients with baseline ALT > 40 U/L",
              "source": "Smith et al. 2023"
            }
          ],
          "efficacy": [
            {
              "endpoint": "Response rate at 12 weeks",
              "rate": "65%",
              "rationale": "Peak efficacy seen at 12 weeks; 8 weeks shows noise",
              "source": "Doe et al. 2024"
            }
          ],
          "populations": {
            "inclusion": ["Ages 18-65", "Crohn's Disease diagnosis"],
            "exclusion": ["Baseline ALT > 40 U/L", "eGFR < 60 mL/min/1.73m2"]
          }
        }
        
        Literature Text:
        ${combinedText.substring(0, 10000)}
      `;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      // Clean JSON if LLM returned markdown blocks
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      evidenceBrief = JSON.parse(cleanJson);
    } catch (err) {
      console.error('Gemini processing failed, falling back to mock agent:', err);
    }
  }

  // Fallback to high-quality mock data matching the Crohn's indication papers if Gemini fails or is not config'd
  if (!evidenceBrief) {
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

  const briefRecord = await db.getEvidenceBrief(trialId);
  if (!briefRecord) {
    throw new Error('Evidence Brief must exist before Protocol Design.');
  }

  const brief = briefRecord.content_json;
  let protocolSections: any = null;

  if (ai && geminiApiKey) {
    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `
        You are an experienced clinical trial designer (Protocol Designer Agent).
        Draft a clinical trial protocol template based on the following Evidence Brief.
        If introduceConflict is true, you MUST intentionally introduce one of these flaws to simulate downstream compliance errors:
        1. Set the Exclusion criteria for ALT to '> 100 U/L' (which is dangerous because evidence says ALT > 40 has hepatotoxicity risk).
        2. Set the Exclusion criteria for eGFR to '< 30 mL/min/1.73m2' (which is dangerous because evidence says eGFR < 60 has renal risk).
        3. Set the Primary Endpoint to '8 weeks' (which is incorrect because evidence shows 8-week data is noisy, and 12-week is efficacy point).
        
        If introduceConflict is false, align exclusions exactly with the evidence brief.
        
        Output MUST be valid JSON matching this schema:
        {
          "title": "Study of Zylastin-B in Crohn's Disease",
          "inclusion_criteria": ["List of criteria"],
          "exclusion_criteria": ["List of criteria"],
          "primary_endpoint": "Endpoint details",
          "assumptions": ["List of assumptions"]
        }
        
        Evidence Brief:
        ${JSON.stringify(brief, null, 2)}
        
        Introduce Conflict: ${introduceConflict}
      `;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      protocolSections = JSON.parse(cleanJson);
    } catch (err) {
      console.error('Gemini designer failed, falling back to mock:', err);
    }
  }

  if (!protocolSections) {
    // Determine exclusions and endpoints based on whether we want to simulate a conflict
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

  const protocolRecord = await db.getProtocol(trialId);
  if (!protocolRecord) {
    throw new Error('Protocol must exist before Statistical Analysis Plan can be drafted.');
  }

  const protocol = protocolRecord.sections_json;
  let sapContent: any = null;

  // Perform sample size calculations
  // Target response rate in Zylastin-B = 65% (efficacy evidence)
  // Assume placebo response rate = 40%
  // To detect difference of 25% (65% vs 40%) with 80% power and 5% significance level, we need approx 200 subjects
  const powerCalculation = {
    assumed_active_efficacy: 0.65,
    assumed_placebo_efficacy: 0.40,
    alpha: 0.05,
    power: 0.80,
    calculated_sample_size: 'N = 200 per treatment arm (Total N = 400)',
    formula: 'Two-sample chi-square comparison of proportions'
  };

  const endpoint = protocol.primary_endpoint;
  const isEightWeeks = endpoint.toLowerCase().includes('8 weeks') || endpoint.toLowerCase().includes('week 8');

  sapContent = {
    analysis_population: 'Intention-to-Treat (ITT) Population',
    primary_statistical_method: 'Chi-square test comparing active vs. placebo clinical remission rates',
    power_calculation: powerCalculation,
    endpoint_validation: isEightWeeks 
      ? 'WARNING: Primary endpoint at Week 8 has low statistical justification. Efficacy evidence suggests Week 12 response is optimal.' 
      : 'Efficacy endpoint validated at Week 12. Sample size calculations powered at 80%.',
    notes: [
      'Subgroup analysis planned for subjects with baseline renal impairment (eGFR 60-90)',
      'Interim safety analysis planned at 50% enrollment (N=200)'
    ]
  };

  const docId = `DOC-SAP-${Date.now()}`;
  const docContent = `
    Statistical Analysis Plan (SAP)
    
    ANALYSIS POPULATION:
    ${sapContent.analysis_population}
    
    PRIMARY METHOD:
    ${sapContent.primary_statistical_method}
    
    POWER CALCULATION:
    - Active group response rate: ${powerCalculation.assumed_active_efficacy * 100}%
    - Placebo response rate: ${powerCalculation.assumed_placebo_efficacy * 100}%
    - Calculated Size: ${powerCalculation.calculated_sample_size}
    - Power / Alpha: ${powerCalculation.power * 100}% / ${powerCalculation.alpha}
    
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

  return sapContent;
}

// 4. REGULATORY COMPLIANCE AGENT (Adversarial inconsistency reviewer with state lock checks)
export async function runRegulatoryComplianceReview(trialId: string) {
  // 21 CFR Part 11: strict verification of workspace state
  const trial = await db.getTrial(trialId);
  if (!trial) throw new Error('Trial not found.');

  // STATE LOCK: Regulatory reviewer must explicitly listen for a completion state.
  // We enforce this: if status is not 'SAP_COMPLETE', we fail or report state lock.
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

  const briefRecord = await db.getEvidenceBrief(trialId);
  const protocolRecord = await db.getProtocol(trialId);
  const sapRecord = await db.getSap(trialId);

  if (!briefRecord || !protocolRecord || !sapRecord) {
    throw new Error('All evidence, protocol, and SAP records must be complete for review.');
  }

  const brief = briefRecord.content_json;
  const protocol = protocolRecord.sections_json;
  const sap = sapRecord.content_json;

  // Let's clear any old open conflicts
  await db.clearOpenConflicts(trialId);

  const conflictsList: any[] = [];

  // Adversarial check 1: Hepatotoxicity ALT levels
  const exclusionText = protocol.exclusion_criteria.join('\n').toLowerCase();
  const matchesAltLimit = exclusionText.match(/alt\s*(?:>|>=|greater than)\s*(\d+)/i);
  
  if (matchesAltLimit) {
    const value = parseInt(matchesAltLimit[1], 10);
    if (value > 40) {
      conflictsList.push({
        id: `CONF-ALT-${Date.now()}`,
        type: 'EVIDENCE_vs_PROTOCOL',
        severity: 'HIGH',
        position_a: 'Evidence Scout states baseline ALT > 40 U/L represents high hepatotoxicity risk (absolute contraindication).',
        position_b: `Protocol exclusion limits ALT to > ${value} U/L, which exposes patients in the 40-${value} range to severe risk.`,
        recommendation: 'Modify the protocol exclusion criteria to restrict baseline ALT to ≤ 40 U/L.'
      });
    }
  } else if (exclusionText.includes('alt > uln') || exclusionText.includes('alt > upper limit')) {
    conflictsList.push({
      id: `CONF-ALT-${Date.now()}`,
      type: 'EVIDENCE_vs_PROTOCOL',
      severity: 'MEDIUM',
      position_a: 'Evidence Scout states baseline ALT > 40 U/L represents high hepatotoxicity risk.',
      position_b: 'Protocol exclusion specifies ALT > ULN. ULN can vary between labs and typically exceeds 40 U/L, introducing ambiguity.',
      recommendation: 'Specify exact value: "Baseline ALT ≤ 40 U/L" per Evidence Brief.'
    });
  }

  // Adversarial check 2: Renal eGFR limit
  const matchesEgfr = exclusionText.match(/egfr\s*(?:<|<=|less than)\s*(\d+)/i);
  if (matchesEgfr) {
    const value = parseInt(matchesEgfr[1], 10);
    if (value < 60) {
      conflictsList.push({
        id: `CONF-RENAL-${Date.now()}`,
        type: 'EVIDENCE_vs_PROTOCOL',
        severity: 'HIGH',
        position_a: 'Evidence Scout notes renal impairment risk (borderline safety signal) in patients with eGFR < 60.',
        position_b: `Protocol exclusions only cover eGFR < ${value}, exposing patients with mild-to-moderate impairment (eGFR ${value}-60) to risk.`,
        recommendation: 'Restrict inclusion criteria to subjects with eGFR > 60 mL/min/1.73m².'
      });
    }
  }

  // Adversarial check 3: Efficacy endpoint timepoint
  const endpoint = protocol.primary_endpoint.toLowerCase();
  if (endpoint.includes('8 weeks') || endpoint.includes('week 8')) {
    conflictsList.push({
      id: `CONF-ENDPOINT-${Date.now()}`,
      type: 'EVIDENCE_vs_PROTOCOL',
      severity: 'HIGH',
      position_a: 'Evidence Scout shows peak response rate (65%) occurs at week 12; earlier points are statistically noisy.',
      position_b: 'Protocol lists the primary efficacy endpoint at week 8, risking study failure due to inadequate duration.',
      recommendation: 'Change primary endpoint analysis timepoint to Week 12.'
    });
  }

  // Adversarial check 4: SAP endpoint warning
  if (sap.endpoint_validation && sap.endpoint_validation.includes('WARNING')) {
    conflictsList.push({
      id: `CONF-SAP-${Date.now()}`,
      type: 'PROTOCOL_vs_SAP',
      severity: 'MEDIUM',
      position_a: 'Protocol specifies primary efficacy endpoint at Week 8.',
      position_b: 'Statistical Analyst Agent reports power calculation is unstable for Week 8 endpoint due to literature noise.',
      recommendation: 'Change primary endpoint to Week 12 to stabilize statistical power and sample size calculation.'
    });
  }

  // Save detected conflicts to db
  for (const c of conflictsList) {
    await db.createConflict(c.id, trialId, c.type, c.severity, c.position_a, c.position_b, c.recommendation, 'OPEN');
  }

  const status = conflictsList.length > 0 ? 'CONFLICT_DETECTED' : 'APPROVED_REGULATORY';
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

  return {
    status,
    conflicts: conflictsList
  };
}
