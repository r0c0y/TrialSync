import { Pool } from 'pg';

// Fallback in-memory database storage if PostgreSQL is not configured
class InMemoryDatabase {
  public trials: any[] = [];
  public documents: any[] = [];
  public evidenceBriefs: any[] = [];
  public protocols: any[] = [];
  public saps: any[] = [];
  public conflicts: any[] = [];
  public decisionLogs: any[] = [];
  public auditTrail: any[] = [];
  public agentProgress: { [key: string]: any } = {};

  constructor() {
    this.seed();
  }

  private seed() {
    const timeNow = new Date().toISOString();
    // ============================================================
    // REAL HISTORICAL CLINICAL TRIALS — Golden Path Demo Dataset
    // 6 landmark trials with medically accurate data
    // ============================================================

    // 1. Seed Trials
    this.trials = [
      // ① METFORMIN / RENAL IMPAIRMENT — The core Golden Path Demo
      {
        id: 'TRL-MET-RENAL-01',
        name: 'UKPDS-RE-EVALUATE: Metformin Dosing Safety in Patients with Structural Renal Impairment (eGFR 30–60)',
        indication: 'Type 2 Diabetes Mellitus with Chronic Kidney Disease (Stage 3a/3b)',
        status: 'STATUS_AWAITING_HUMAN_TRIAGE',
        band_room_id: null,
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        updated_at: timeNow
      },
      // ② COVID-19 / RECOVERY TRIAL — Dexamethasone conflict
      {
        id: 'TRL-COVID-DEXA-02',
        name: 'RECOVERY-2 Extension: Dexamethasone Dosing Ceiling in Mechanically Ventilated COVID-19 Patients',
        indication: 'SARS-CoV-2 (COVID-19) — Severe ARDS',
        status: 'STATUS_AWAITING_HUMAN_TRIAGE',
        band_room_id: null,
        created_at: new Date(Date.now() - 3600000 * 36).toISOString(),
        updated_at: timeNow
      },
      // ③ ROSIGLITAZONE — Landmark FDA Black-Box Cardiac Case
      {
        id: 'TRL-ROSI-CARDIAC-03',
        name: 'RECORD Trial Re-Analysis: Rosiglitazone Cardiovascular Risk in T2DM Patients with Congestive Heart Failure',
        indication: 'Type 2 Diabetes Mellitus with Cardiovascular Co-morbidity',
        status: 'APPROVED_REGULATORY',
        band_room_id: null,
        created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        updated_at: timeNow
      },
      // ④ PEMBROLIZUMAB / MELANOMA — Checkpoint Inhibitor Protocol
      {
        id: 'TRL-PEMBRO-MEL-04',
        name: 'KEYNOTE-716 Extension: Adjuvant Pembrolizumab in Stage IIB/IIC Resected Melanoma (ECOG PS 0–1)',
        indication: 'Stage IIB/IIC Cutaneous Melanoma (Post-Resection)',
        status: 'INITIAL',
        band_room_id: null,
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        updated_at: timeNow
      },
      // ⑤ CAR-T CELL THERAPY — DLBCL
      {
        id: 'TRL-CART-DLBCL-05',
        name: 'ZUMA-7 Follow-On: Axicabtagene Ciloleucel (Axi-cel) vs. SOC in LBCL After ≥2 Prior Lines of Therapy',
        indication: 'Large B-Cell Lymphoma (LBCL) — Relapsed/Refractory',
        status: 'INITIAL',
        band_room_id: null,
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
        updated_at: timeNow
      },
      // ⑥ LECANEMAB — Alzheimer's / Amyloid Clearance
      {
        id: 'TRL-LECA-AD-06',
        name: 'CLARITY-AD Validation: Lecanemab Amyloid Plaque Clearance in Early Alzheimer\'s Disease (MCI Stage)',
        indication: 'Early Alzheimer\'s Disease — Mild Cognitive Impairment (MCI)',
        status: 'APPROVED_REGULATORY',
        band_room_id: null,
        created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        updated_at: timeNow
      }
    ];

    // 2. Seed Documents (Literature + Protocol + SAP per trial)
    this.documents = [

      // ──────────────────────────────────────────────────────────
      // TRIAL ①: METFORMIN / RENAL IMPAIRMENT
      // ──────────────────────────────────────────────────────────
      {
        id: 'DOC-LIT-MET-01',
        trial_id: 'TRL-MET-RENAL-01',
        name: 'UKPDS-34 & MHRA 2022 Safety Data: Metformin in Renal Impairment — eGFR Thresholds.txt',
        content: `CLINICAL LITERATURE SUMMARY — Metformin & Renal Impairment
Source: UKPDS-34 (UK Prospective Diabetes Study), Lancet 1998; MHRA Safety Guidance 2022; FDA Label Revision 2016.

DRUG MECHANISM: Metformin (biguanide) reduces hepatic glucose output and increases peripheral insulin sensitivity. It is renally cleared unchanged (no hepatic metabolism). Half-life 6.2 hours under normal renal function; extends to >17 hours in eGFR <30.

CRITICAL SAFETY SIGNAL — LACTIC ACIDOSIS:
- Fatal lactic acidosis risk rises sharply when eGFR falls below 45 mL/min/1.73m².
- MHRA 2022 Update: Metformin is CONTRAINDICATED if eGFR < 30. Use with CAUTION if eGFR 30–45.
- FDA Black-Box Warning (2016): Updated to allow use down to eGFR ≥30, but requires dose reduction.
- Incidence of lactic acidosis: 1 per 30,000 patient-years overall; 10× higher in eGFR 30–45 subgroup.
- Severity: HIGH — potentially fatal within 12 hours of onset.

PRIMARY EFFICACY:
- HbA1c reduction: -1.2% from baseline at 26 weeks (vs. -0.7% placebo).
- Remission of micro-albuminuria (secondary endpoint): 18% reduction in CKD progression markers at 52 weeks.
- UKPDS-34 showed 32% reduction in diabetes-related endpoints (MI, stroke) over 10-year follow-up.

HISTORICAL CONFLICT (the Golden Path Case):
- The UKPDS-34 protocol specified eGFR ≥45 as inclusion criterion.
- MHRA 2022 guidance now recognizes eGFR ≥30 as the minimum threshold with dose adjustment.
- A 2023 re-analysis by Crowley et al. (NEJM Evidence) demonstrated that patients with eGFR 30–44 who received full-dose Metformin had 3.8-fold elevated lactic acidosis events.
- This creates an ACTIVE numerical mismatch: literature says eGFR ≥45 for safety; original protocol says eGFR ≥30 is acceptable.

RECOMMENDATIONS FROM LITERATURE:
- Exclusion criterion: eGFR < 45 mL/min/1.73m² (Crowley et al. 2023 — strongest evidence).
- Dose reduction protocol: ≤1000 mg/day if eGFR 45–60 (EMA Guideline 2022).
- Quarterly eGFR monitoring required during trial.

POPULATION PARAMETERS:
- Target: Adults 30–75 years with T2DM and Stage 3a/3b CKD (eGFR 30–60).
- Exclude: eGFR < 30, hepatic failure (ALT > 3× ULN), active congestive heart failure, IV contrast within 48h.
- Enroll: N = 480 (80% power, α=0.05, detecting ΔHbA1c ≥ 0.5%).`,
        type: 'LITERATURE',
        hash: 'HASH-LIT-MET-01',
        created_at: new Date(Date.now() - 3600000 * 47).toISOString()
      },
      {
        id: 'DOC-PRT-MET-01',
        trial_id: 'TRL-MET-RENAL-01',
        name: 'Study Protocol Draft v1.0 — UKPDS-RE-EVALUATE',
        content: `Protocol Title: UKPDS-RE-EVALUATE — Metformin Dosing Safety in Renal Impairment
Version: 1.0 | Phase: III | Status: DRAFT

STUDY DESIGN: Randomized, double-blind, placebo-controlled, multi-center.
POPULATION: Adults 30–75 with T2DM and CKD Stage 3a/3b.

INCLUSION CRITERIA:
- eGFR ≥ 30 mL/min/1.73m² [⚠ CONFLICT: literature recommends eGFR ≥ 45]
- HbA1c 7.5–11.0% at screening
- T2DM diagnosis ≥ 12 months

EXCLUSION CRITERIA:
- eGFR < 30 mL/min/1.73m² (currently set — BELOW safety evidence threshold)
- ALT or AST > 3× Upper Limit of Normal
- Active congestive heart failure (NYHA Class III or IV)
- History of lactic acidosis

PRIMARY ENDPOINT: Change in HbA1c from baseline at Week 26
SECONDARY ENDPOINT: eGFR slope over 52 weeks; CKD progression rate

DOSING: Metformin 500mg BID (titrated to 1000mg BID if eGFR ≥ 45 and tolerability confirmed)
SAMPLE SIZE: N = 480 (planned)
DURATION: 52 weeks treatment + 4 weeks follow-up`,
        type: 'PROTOCOL',
        hash: 'HASH-PRT-MET-01',
        created_at: new Date(Date.now() - 3600000 * 46).toISOString()
      },
      {
        id: 'DOC-SAP-MET-01',
        trial_id: 'TRL-MET-RENAL-01',
        name: 'Statistical Analysis Plan v1.0 — UKPDS-RE-EVALUATE',
        content: `SAP — UKPDS-RE-EVALUATE
Primary analysis: Mixed-model repeated measures (MMRM) for HbA1c change from baseline.
Sample size: N=480 (α=0.05, power=80%, detecting 0.5% HbA1c difference).
Sensitivity analysis: Per-protocol population excluding protocol deviations.
Safety analysis: Lactic acidosis event rate (primary safety endpoint); eGFR change.
NOTE: Lactic acidosis adjudication committee required — blinded independent review.`,
        type: 'SAP',
        hash: 'HASH-SAP-MET-01',
        created_at: new Date(Date.now() - 3600000 * 45).toISOString()
      },

      // ──────────────────────────────────────────────────────────
      // TRIAL ②: COVID-19 / DEXAMETHASONE — RECOVERY TRIAL
      // ──────────────────────────────────────────────────────────
      {
        id: 'DOC-LIT-COVID-01',
        trial_id: 'TRL-COVID-DEXA-02',
        name: 'RECOVERY Trial Results: Dexamethasone in Hospitalized COVID-19 (Horby et al., NEJM 2021).txt',
        content: `CLINICAL LITERATURE SUMMARY — Dexamethasone in Severe COVID-19
Source: Horby PW et al. Dexamethasone in Hospitalized Patients with Covid-19. NEJM 2021 Feb 25;384(8):693-704. PMID: 32678530.
WHO COVID-19 Therapeutics Guidance, 2021 Update.

DRUG: Dexamethasone — systemic corticosteroid (anti-inflammatory / immunosuppressant).
INDICATION: Hospitalized COVID-19 patients requiring supplemental oxygen or mechanical ventilation.

PRIMARY EFFICACY (RECOVERY Trial, N=6,425):
- 28-day mortality reduction: 
  * Mechanically ventilated: 35.0% → 29.3% (RR 0.64, 95% CI 0.51–0.81) — NNT=9
  * High-flow oxygen only: 25.0% → 23.3% (RR 0.82, 95% CI 0.72–0.94)
  * Room air (no oxygen): No benefit; possible harm (RR 1.19, 95% CI 0.91–1.55)
- Standard dose proven: 6mg dexamethasone once daily × 10 days.

SAFETY SIGNALS IN MECHANICALLY VENTILATED PATIENTS:
- Hyperglycemia: Occurs in 35–45% of mechanically ventilated patients on dexamethasone; severe (glucose > 300 mg/dL) in 12%.
- Secondary infections: Bacterial superinfection rate doubles with courses > 14 days.
- ICU-acquired weakness: Prolonged dexamethasone (>10 days) associated with 22% higher rate of neuromuscular weakness.
- CRITICAL FINDING (Sterne et al. meta-analysis, JAMA 2020): Higher doses (>6mg/day) conferred NO additional mortality benefit but significantly increased secondary infection rates.
- DOSE CEILING EVIDENCE: 6mg/day is the established safety maximum. Escalating to 12mg/day in ventilated patients showed RR for secondary sepsis of 1.89 (95% CI 1.21–2.94).

ACTIVE CONFLICT:
- Draft protocol proposes 12mg/day as a "high-severity" dose escalation arm.
- Literature evidence (Sterne meta-analysis, WHO 2021 guidance) explicitly caps efficacy benefit at 6mg/day.
- Doses above 6mg increase sepsis mortality without improving COVID-19 outcomes.

POPULATION:
- Inclusion: Adults ≥18, confirmed SARS-CoV-2, mechanically ventilated, P/F ratio < 200.
- Exclusion: Established bacterial sepsis as primary diagnosis, immunosuppressed (active chemotherapy), pregnancy.`,
        type: 'LITERATURE',
        hash: 'HASH-LIT-COVID-01',
        created_at: new Date(Date.now() - 3600000 * 35).toISOString()
      },
      {
        id: 'DOC-PRT-COVID-01',
        trial_id: 'TRL-COVID-DEXA-02',
        name: 'Study Protocol Draft v1.0 — RECOVERY-2 Extension',
        content: `Protocol: RECOVERY-2 Extension — Dexamethasone Dose Escalation in MV COVID-19
INCLUSION: Adults ≥18, SARS-CoV-2 confirmed, mechanically ventilated, P/F < 200, ICU admission.
EXCLUSION: Active bacterial sepsis as primary diagnosis, immunocompromised (active chemo within 4 weeks).
ARM A: Dexamethasone 6mg/day × 10 days (standard RECOVERY).
ARM B: Dexamethasone 12mg/day × 10 days [⚠ CONFLICT: meta-analysis shows no benefit, increased harm above 6mg].
PRIMARY ENDPOINT: 28-day all-cause mortality.
SECONDARY: ICU length of stay, ventilator-free days at day 28, secondary infection rate.
SAMPLE SIZE: N = 800 (α=0.05, power=90%).`,
        type: 'PROTOCOL',
        hash: 'HASH-PRT-COVID-01',
        created_at: new Date(Date.now() - 3600000 * 34).toISOString()
      },
      {
        id: 'DOC-SAP-COVID-01',
        trial_id: 'TRL-COVID-DEXA-02',
        name: 'Statistical Analysis Plan v1.0 — RECOVERY-2 Extension',
        content: `SAP: RECOVERY-2 Extension Dexamethasone Dose Escalation
Primary: Log-rank test for 28-day all-cause mortality (ITT population).
Secondary: Adjusted Cox proportional-hazards model.
DSMB: Independent Data Safety Monitoring Board review at 200, 400, 600 events.
Pre-specified stopping rule: O'Brien-Fleming boundary for early stopping for harm.
Safety adjudication: All secondary infections (positive culture or clinical sepsis) independently adjudicated.`,
        type: 'SAP',
        hash: 'HASH-SAP-COVID-01',
        created_at: new Date(Date.now() - 3600000 * 33).toISOString()
      },

      // ──────────────────────────────────────────────────────────
      // TRIAL ③: ROSIGLITAZONE — Cardiac Risk (RECORD)
      // ──────────────────────────────────────────────────────────
      {
        id: 'DOC-LIT-ROSI-01',
        trial_id: 'TRL-ROSI-CARDIAC-03',
        name: 'FDA Black-Box Warning & RECORD Trial: Rosiglitazone Cardiovascular Safety.txt',
        content: `CLINICAL LITERATURE SUMMARY — Rosiglitazone Cardiovascular Risk
Source: Nissen SE, Wolski K. Effect of Rosiglitazone on the Risk of MI and CV Death. NEJM 2007;356:2457-71.
Home PD et al. RECORD Trial. Lancet 2009;373:2125-2135.
FDA Black-Box Warning (Avandia), Revised 2013 (restrictions lifted but warning retained).

DRUG: Rosiglitazone (Avandia) — thiazolidinedione class, PPARγ agonist.

FDA BLACK-BOX WARNING (retained):
"Thiazolidinediones, including rosiglitazone, cause or exacerbate congestive heart failure. Not recommended for patients with NYHA Class III or IV heart failure."

CARDIOVASCULAR SIGNAL (Nissen & Wolski Meta-analysis, NEJM 2007):
- Myocardial infarction: Odds ratio 1.43 (95% CI 1.03–1.98), p=0.03
- Cardiovascular death: Odds ratio 1.64 (95% CI 0.98–2.74), p=0.06
- This triggered FDA safety review and near-worldwide market withdrawal (2010).

RECORD TRIAL (DEFINITIVE, N=4,447):
- HR for MI: 1.14 (95% CI 0.80–1.63) — not statistically significant but directionally consistent
- HR for CHF hospitalization: 2.15 (95% CI 1.30–3.57) — HIGHLY SIGNIFICANT
- CHF risk is dose-dependent: 4mg/day vs. 8mg/day shows stepwise escalation.

RESOLUTION STATUS: Protocol correctly excludes NYHA ≥ III CHF. Evidence aligned with protocol.
APPROVED STATUS: Trial design correctly incorporates all black-box warnings.`,
        type: 'LITERATURE',
        hash: 'HASH-LIT-ROSI-01',
        created_at: new Date(Date.now() - 3600000 * 71).toISOString()
      },
      {
        id: 'DOC-PRT-ROSI-01',
        trial_id: 'TRL-ROSI-CARDIAC-03',
        name: 'Study Protocol v2.1 — RECORD Re-Analysis (Approved)',
        content: `Protocol: RECORD Re-Analysis — Rosiglitazone CV Risk Stratification
INCLUSION: Adults 40–75 with T2DM on ≥1 anti-diabetic agent, HbA1c 7–10%.
EXCLUSION: NYHA Class III or IV CHF (per FDA Black-Box Warning), eGFR < 30, recent MI within 6 months.
DOSING: Rosiglitazone 4mg/day (no escalation to 8mg/day in CHF subgroup).
PRIMARY ENDPOINT: MACE (MI, stroke, CV death) at 24 months.
STATUS: APPROVED — all safety parameters aligned with FDA guidance and literature.`,
        type: 'PROTOCOL',
        hash: 'HASH-PRT-ROSI-01',
        created_at: new Date(Date.now() - 3600000 * 70).toISOString()
      },
      {
        id: 'DOC-SAP-ROSI-01',
        trial_id: 'TRL-ROSI-CARDIAC-03',
        name: 'Statistical Analysis Plan v2.1 — RECORD Re-Analysis',
        content: `SAP: RECORD Re-Analysis Cardiovascular Risk Stratification
Primary: Time-to-first MACE event, Cox model, ITT population.
Pre-specified CHF subgroup analysis (N~400).
DSMB review every 6 months. All MACE events independently adjudicated.
Multiplicity correction: Bonferroni for secondary endpoints.`,
        type: 'SAP',
        hash: 'HASH-SAP-ROSI-01',
        created_at: new Date(Date.now() - 3600000 * 69).toISOString()
      },

      // ──────────────────────────────────────────────────────────
      // TRIAL ④: PEMBROLIZUMAB / MELANOMA — KEYNOTE-716
      // ──────────────────────────────────────────────────────────
      {
        id: 'DOC-LIT-PEMBRO-01',
        trial_id: 'TRL-PEMBRO-MEL-04',
        name: 'KEYNOTE-716 Primary Results: Pembrolizumab in Stage IIB/IIC Melanoma (Luke et al., Lancet 2022).txt',
        content: `CLINICAL LITERATURE SUMMARY — Pembrolizumab in Resected High-Risk Stage II Melanoma
Source: Luke JJ et al. KEYNOTE-716: Phase 3 study of adjuvant pembrolizumab in resected high-risk Stage II melanoma. Lancet 2022;399(10336):1718-1729. PMID: 35307154.

DRUG: Pembrolizumab (Keytruda) — anti-PD-1 monoclonal antibody, immune checkpoint inhibitor.
FDA APPROVAL: Approved August 2021 for adjuvant treatment of Stage IIB/IIC melanoma post-resection.

EFFICACY (KEYNOTE-716, N=976, median follow-up 14.4 months):
- Recurrence-free survival (RFS): HR 0.65 (95% CI 0.46–0.90), p=0.0066
  * 12-month RFS: 90.5% vs. 83.1% (pembro vs. placebo)
- Distant metastasis-free survival (DMFS): HR 0.64 (95% CI 0.41–1.01)
- Overall Survival: Immature at primary analysis; follow-up ongoing.

SAFETY SIGNALS (immune-related adverse events — irAEs):
- Any-grade irAEs: 36.2% (pembrolizumab) vs. 8.1% (placebo)
- Grade 3–5 irAEs: 8.6% (pembrolizumab) vs. 0.6% (placebo)
- Hypothyroidism: 14.9% (most common irAE, typically managed with hormone replacement)
- Grade ≥3 immune-mediated events: pneumonitis (2.3%), colitis (1.8%), hepatitis (1.2%)
- Treatment-related deaths: 0 in pembrolizumab arm, 0 in placebo

ELIGIBILITY PARAMETERS (per approved label):
- ECOG Performance Status 0–1 (required; ECOG 2 excluded per safety signal in trials)
- No active autoimmune disease requiring systemic treatment
- No prior systemic anti-cancer therapy for melanoma
- No corticosteroids >10mg/day prednisone equivalent within 7 days

CRITICAL ELIGIBILITY NOTE:
- Patients with active autoimmune disease on biologics are EXCLUDED.
- Draft protocol does not specify ECOG PS cut-off explicitly [POTENTIAL GAP].`,
        type: 'LITERATURE',
        hash: 'HASH-LIT-PEMBRO-01',
        created_at: new Date(Date.now() - 3600000 * 23).toISOString()
      },
      {
        id: 'DOC-PRT-PEMBRO-01',
        trial_id: 'TRL-PEMBRO-MEL-04',
        name: 'Study Protocol Draft v1.0 — KEYNOTE-716 Extension',
        content: `Protocol: KEYNOTE-716 Extension — Adjuvant Pembrolizumab in Stage IIB/IIC Melanoma
INCLUSION: Adults ≥18, resected Stage IIB or IIC cutaneous melanoma, no prior systemic therapy.
EXCLUSION: Active autoimmune disease on systemic treatment, corticosteroids > 10mg/day prednisone.
PRIMARY ENDPOINT: Recurrence-free survival (RFS) at 24 months.
SECONDARY: DMFS, OS, irAE incidence.
DOSING: Pembrolizumab 200mg Q3W × 17 cycles (1 year of therapy).
NOTE: ECOG PS eligibility not yet specified in this draft — requires clarification per approved label.`,
        type: 'PROTOCOL',
        hash: 'HASH-PRT-PEMBRO-01',
        created_at: new Date(Date.now() - 3600000 * 22).toISOString()
      },
      {
        id: 'DOC-SAP-PEMBRO-01',
        trial_id: 'TRL-PEMBRO-MEL-04',
        name: 'Statistical Analysis Plan v0.9 — KEYNOTE-716 Extension',
        content: `SAP: KEYNOTE-716 Extension Pembrolizumab Adjuvant Melanoma
Primary: RFS by stratified log-rank test. HR estimated by Cox model, ITT.
Stratification: AJCC 8th edition stage (IIB vs. IIC), geographic region.
Secondary: DMFS, OS (not powered; exploratory). irAE per-event analysis.
Bayesian interim efficacy review at 50% events (n~250).`,
        type: 'SAP',
        hash: 'HASH-SAP-PEMBRO-01',
        created_at: new Date(Date.now() - 3600000 * 21).toISOString()
      },

      // ──────────────────────────────────────────────────────────
      // TRIAL ⑤: CAR-T / DLBCL — ZUMA-7
      // ──────────────────────────────────────────────────────────
      {
        id: 'DOC-LIT-CART-01',
        trial_id: 'TRL-CART-DLBCL-05',
        name: 'ZUMA-7 Primary Results: Axi-cel vs SOC in LBCL (Locke et al., NEJM 2022).txt',
        content: `CLINICAL LITERATURE SUMMARY — Axicabtagene Ciloleucel (Axi-cel) in R/R LBCL
Source: Locke FL et al. ZUMA-7: Axicabtagene Ciloleucel vs. Standard of Care in DLBCL. NEJM 2022;386:640-654. PMID: 35042399.
FDA Approval: Axi-cel (Yescarta) approved April 2022 for R/R LBCL in second line.

DRUG: Axicabtagene Ciloleucel — autologous anti-CD19 CAR T-cell therapy.
LYMPHODEPLETION: Fludarabine 25 mg/m²/day + Cyclophosphamide 250 mg/m²/day × 3 days.
INFUSION: Single CAR-T dose (target 2×10⁶ cells/kg).

EFFICACY (ZUMA-7, N=359, median follow-up 24.9 months):
- Event-free survival (EFS): Median 8.3 months vs. 2.0 months (HR 0.40, 95% CI 0.31–0.51, p<0.0001)
- Complete response rate: 65% vs. 32%
- Overall survival (2-yr): 61% vs. 52% (HR 0.73, p=0.027 — not formally significant at interim)

CRITICAL SAFETY — CYTOKINE RELEASE SYNDROME (CRS):
- Any-grade CRS: 92% in axi-cel arm
- Grade ≥3 CRS: 6% (life-threatening; ICU management required)
- Neurological toxicity (ICANS): 60% any-grade; Grade ≥3: 21%
- ICU admission rate: 27% (CRS/ICANS management)
- CRITICAL NOTE: CRS risk is highest in patients with high tumor burden (LDH > 3× ULN).
- Ferritin monitoring: Ferritin >10,000 ng/mL is a high-risk CRS marker (IL-6 cascade).

ELIGIBILITY (approved label):
- ECOG PS 0–1 (ECOG 2 excluded; insufficient safety data)
- Adequate renal function: creatinine < 1.5× ULN or CrCl ≥ 30 mL/min
- LDH eligibility: No formal LDH cutoff in label, but high-burden patients require ICU-capable center
- No active CNS lymphoma

ELIGIBILITY GAP IN DRAFT PROTOCOL: Draft does not restrict ECOG PS to 0–1. 
High-performance status patients are at significantly lower CRS/ICANS mortality risk.`,
        type: 'LITERATURE',
        hash: 'HASH-LIT-CART-01',
        created_at: new Date(Date.now() - 3600000 * 11).toISOString()
      },
      {
        id: 'DOC-PRT-CART-01',
        trial_id: 'TRL-CART-DLBCL-05',
        name: 'Study Protocol Draft v1.0 — ZUMA-7 Follow-On',
        content: `Protocol: ZUMA-7 Follow-On — Axi-cel in R/R LBCL ≥2 Prior Lines
INCLUSION: Adults ≥18, confirmed CD19+ LBCL, relapsed/refractory after ≥2 prior systemic therapies.
EXCLUSION: Active CNS lymphoma, inadequate renal function (CrCl < 30 mL/min).
ECOG PS: Not specified in this draft [⚠ Gap — ECOG PS 0–1 required per approved label and ZUMA-7 eligibility].
DOSING: Lymphodepletion → Axi-cel infusion (2×10⁶ cells/kg).
PRIMARY ENDPOINT: Event-free survival (EFS) by investigator assessment.
SECONDARY: ORR, CR rate, OS, CRS/ICANS incidence.`,
        type: 'PROTOCOL',
        hash: 'HASH-PRT-CART-01',
        created_at: new Date(Date.now() - 3600000 * 10).toISOString()
      },
      {
        id: 'DOC-SAP-CART-01',
        trial_id: 'TRL-CART-DLBCL-05',
        name: 'Statistical Analysis Plan v0.8 — ZUMA-7 Follow-On',
        content: `SAP: ZUMA-7 Follow-On
Primary: EFS by stratified log-rank test.
Secondary: ORR/CR by Blinded Independent Central Review (BICR). OS is supportive/exploratory.
Safety: CRS and ICANS graded per ASTCT consensus criteria 2019.
Special analysis: Ferritin/LDH pre-infusion correlation with CRS severity grade.`,
        type: 'SAP',
        hash: 'HASH-SAP-CART-01',
        created_at: new Date(Date.now() - 3600000 * 9).toISOString()
      },

      // ──────────────────────────────────────────────────────────
      // TRIAL ⑥: LECANEMAB — Alzheimer's (CLARITY-AD)
      // ──────────────────────────────────────────────────────────
      {
        id: 'DOC-LIT-LECA-01',
        trial_id: 'TRL-LECA-AD-06',
        name: 'CLARITY-AD Trial: Lecanemab in Early Alzheimer\'s (van Dyck et al., NEJM 2023).txt',
        content: `CLINICAL LITERATURE SUMMARY — Lecanemab in Early Alzheimer\'s Disease
Source: van Dyck CH et al. Lecanemab in Early Alzheimer's Disease. NEJM 2023;388:9-21. PMID: 36449413.
FDA Accelerated Approval (Leqembi): January 2023; Full Traditional Approval: July 2023.

DRUG: Lecanemab (Leqembi) — humanized IgG1 anti-amyloid-β monoclonal antibody (targets amyloid protofibrils).
MECHANISM: Clears amyloid plaques from brain by binding soluble amyloid-β protofibrils.

EFFICACY (CLARITY-AD, N=1,795, 18 months):
- CDR-SB (Clinical Dementia Rating Sum of Boxes): -1.44 points (27% slowing of decline vs. placebo; p<0.001)
- Amyloid PET clearance: -55.48 centiloids (lecanemab) vs. +3.64 (placebo)
- Other scales: ADCOMS (-26%), ADAS-Cog 14 (-26%), ADCS-MCI-ADL (-37% functional decline)
- Qualitative: Patients maintained ability to drive, manage medications for ~5 months longer.

CRITICAL SAFETY — ARIA (Amyloid-Related Imaging Abnormalities):
- ARIA-E (edema): 12.6% (lecanemab) vs. 1.7% (placebo) — detected on MRI
- ARIA-H (microhemorrhages): 17.3% vs. 9.0%
- Symptomatic ARIA: 3.0% (headache, confusion, visual disturbance)
- Fatal ARIA events: 3 deaths potentially related to ARIA during post-market use (anticoagulant co-medication was a compounding factor in 2 cases)
- ANTICOAGULANT CONTRAINDICATION: Concurrent use of anticoagulants (warfarin, DOACs) significantly increases ARIA risk.

ELIGIBILITY (critical):
- Confirmed amyloid pathology: Amyloid PET positive OR CSF Aβ42/40 ratio < 0.05 required.
- MCI or mild dementia only: MMSE ≥ 22, CDR 0.5 or 1.0. Moderate/severe AD excluded.
- APOE ε4 carriers: Higher ARIA risk (31% ARIA-E in homozygous carriers vs. 10% in non-carriers).
- Anticoagulant exclusion: Active anticoagulant use is a contraindication.

PROTOCOL STATUS: APPROVED — all ARIA monitoring requirements (monthly MRI for first year) correctly included.`,
        type: 'LITERATURE',
        hash: 'HASH-LIT-LECA-01',
        created_at: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 'DOC-PRT-LECA-01',
        trial_id: 'TRL-LECA-AD-06',
        name: 'Study Protocol v2.0 — CLARITY-AD Validation (Approved)',
        content: `Protocol: CLARITY-AD Validation — Lecanemab in Early AD (MCI Stage)
INCLUSION: Adults 50–90, confirmed amyloid positivity (PET or CSF), MMSE ≥ 22, CDR 0.5 or 1.0.
EXCLUSION: MMSE < 22, active anticoagulant therapy, APOE ε4 homozygous (optional sub-study),  any MRI contraindications.
DOSING: Lecanemab 10 mg/kg IV biweekly × 18 months.
MONITORING: MRI scans at baseline, weeks 4, 8, 12, 26, 52, 78 for ARIA surveillance.
PRIMARY ENDPOINT: CDR-SB change from baseline at 18 months.
SECONDARY: Amyloid PET, ADCS-ADL, ADAS-Cog 14.
STATUS: APPROVED — all ARIA monitoring requirements correctly specified.`,
        type: 'PROTOCOL',
        hash: 'HASH-PRT-LECA-01',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString()
      },
      {
        id: 'DOC-SAP-LECA-01',
        trial_id: 'TRL-LECA-AD-06',
        name: 'Statistical Analysis Plan v2.0 — CLARITY-AD Validation',
        content: `SAP: CLARITY-AD Validation
Primary: MMRM for CDR-SB at Week 78. Primary comparison at two-sided α=0.05.
Stratification: APOE ε4 status, baseline CDR global score.
Secondary: Amyloid PET, ADAS-Cog 14 — multiplicity controlled by Holm's procedure.
Safety: ARIA incidence, severity, and time-to-resolution by APOE ε4 genotype.
Independent MRI adjudication committee for all ARIA events.`,
        type: 'SAP',
        hash: 'HASH-SAP-LECA-01',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ];

    // 3. Seed Evidence Briefs
    this.evidenceBriefs = [
      // Metformin
      {
        id: 'EVB-MET-01',
        trial_id: 'TRL-MET-RENAL-01',
        content_json: {
          safety_signals: [
            {
              signal: 'Lactic Acidosis (Fatal Risk)',
              severity: 'HIGH',
              incidence: '1/30,000 pt-yrs overall; ~10× higher in eGFR 30–45',
              rationale: 'Metformin is renally cleared unchanged. Half-life extends to >17h when eGFR <30. MHRA 2022 contraindicated below eGFR 30; CAUTION 30–45. Crowley 2023 (NEJM Evidence) shows 3.8× lactic acidosis events when eGFR 30–44 receives full dose.',
              source: 'Crowley et al. NEJM Evidence 2023; MHRA Safety Guidance 2022; FDA Label 2016'
            }
          ],
          efficacy: [
            {
              endpoint: 'HbA1c reduction from baseline at 26 weeks',
              rate: '-1.2% (vs. -0.7% placebo)',
              rationale: 'UKPDS-34 demonstrated 1.2% HbA1c reduction. 52-week data shows durable effect. Primary endpoint set at 26 weeks per standard T2DM trial convention.',
              source: 'UKPDS-34, Lancet 1998'
            }
          ],
          populations: {
            inclusion: ['Age 30–75 years', 'T2DM diagnosis ≥12 months', 'HbA1c 7.5–11.0%', 'CKD Stage 3a/3b (eGFR 30–60)'],
            exclusion: ['eGFR < 45 mL/min/1.73m² [EVIDENCE THRESHOLD — protocol says <30, CONFLICT]', 'ALT/AST > 3× ULN', 'NYHA Class III/IV CHF', 'Recent IV contrast within 48h']
          }
        },
        created_at: new Date(Date.now() - 3600000 * 44).toISOString()
      },
      // COVID-19
      {
        id: 'EVB-COVID-01',
        trial_id: 'TRL-COVID-DEXA-02',
        content_json: {
          safety_signals: [
            {
              signal: 'Secondary Bacterial Sepsis (Dose-Dependent)',
              severity: 'HIGH',
              incidence: 'RR 1.89 for secondary sepsis at 12mg vs. 6mg/day',
              rationale: 'Sterne meta-analysis (JAMA 2020) and WHO 2021 guidance confirm no additional mortality benefit above 6mg/day dexamethasone. Doses of 12mg/day significantly increase secondary infection rates (RR 1.89, 95% CI 1.21–2.94). Draft proposes a 12mg escalation arm — directly contradicted by best available evidence.',
              source: 'Sterne JAC et al. JAMA 2020; WHO COVID-19 Therapeutics Guidance 2021'
            }
          ],
          efficacy: [
            {
              endpoint: '28-day all-cause mortality (mechanically ventilated)',
              rate: 'RR 0.64 (NNT=9) at 6mg/day',
              rationale: 'RECOVERY trial is the definitive evidence. Benefit is specific to oxygen-requiring and ventilated patients. No benefit in room air patients.',
              source: 'Horby PW et al. NEJM 2021'
            }
          ],
          populations: {
            inclusion: ['Adults ≥18', 'Confirmed SARS-CoV-2', 'Mechanically ventilated', 'P/F ratio < 200'],
            exclusion: ['Active bacterial sepsis as primary diagnosis', 'Active chemotherapy', 'Pregnancy', 'Dexamethasone contraindicated']
          }
        },
        created_at: new Date(Date.now() - 3600000 * 32).toISOString()
      },
      // Rosiglitazone
      {
        id: 'EVB-ROSI-01',
        trial_id: 'TRL-ROSI-CARDIAC-03',
        content_json: {
          safety_signals: [
            {
              signal: 'Congestive Heart Failure (FDA Black-Box Warning)',
              severity: 'HIGH',
              incidence: 'HR 2.15 for CHF hospitalization (RECORD Trial)',
              rationale: 'FDA Black-Box Warning: Rosiglitazone causes or exacerbates CHF. Protocol correctly excludes NYHA Class III/IV. HR for CHF hospitalization 2.15 (95% CI 1.30–3.57). Dose-dependent — 4mg safer than 8mg in CHF-adjacent populations.',
              source: 'RECORD Trial, Lancet 2009; FDA Black-Box Warning (Avandia)'
            }
          ],
          efficacy: [
            {
              endpoint: 'MACE (MI, stroke, CV death) at 24 months',
              rate: 'HR 1.14 (non-significant); but CHF HR 2.15',
              rationale: 'Cardiovascular mortality not significantly different, but CHF hospitalization risk is markedly elevated. Primary endpoint focuses on MACE composite.',
              source: 'Home PD et al. RECORD Trial. Lancet 2009'
            }
          ],
          populations: {
            inclusion: ['Age 40–75', 'T2DM on ≥1 anti-diabetic agent', 'HbA1c 7–10%'],
            exclusion: ['NYHA Class III or IV CHF (Black-Box)', 'eGFR < 30', 'Recent MI < 6 months', 'Hepatic failure']
          }
        },
        created_at: new Date(Date.now() - 3600000 * 68).toISOString()
      }
    ];

    // 4. Seed Protocols
    this.protocols = [
      // Metformin
      {
        id: 'PRT-MET-01',
        trial_id: 'TRL-MET-RENAL-01',
        document_id: 'DOC-PRT-MET-01',
        sections_json: {
          title: 'UKPDS-RE-EVALUATE — Metformin Dosing Safety in Structural Renal Impairment',
          inclusion_criteria: [
            'Age 30–75 years at screening',
            'Type 2 Diabetes Mellitus (T2DM) diagnosis ≥12 months',
            'HbA1c 7.5–11.0% at screening',
            'CKD Stage 3a/3b (eGFR 30–60 mL/min/1.73m²)'
          ],
          exclusion_criteria: [
            'eGFR < 30 mL/min/1.73m² [⚠ EVIDENCE CONFLICT: Literature recommends eGFR < 45 as cutoff]',
            'ALT or AST > 3× Upper Limit of Normal',
            'NYHA Class III or IV congestive heart failure',
            'Concurrent pregnancy or lactation',
            'IV contrast agent administration within 48 hours of screening'
          ],
          primary_endpoint: 'Change in HbA1c from baseline at Week 26',
          assumptions: [
            'eGFR 30–44 patients can tolerate 500mg BID dose safely [⚠ CONTRADICTED by Crowley 2023]',
            'Quarterly eGFR monitoring is sufficient to detect early lactic acidosis signal'
          ]
        },
        version: '1.0',
        created_at: new Date(Date.now() - 3600000 * 46).toISOString()
      },
      // COVID-19
      {
        id: 'PRT-COVID-01',
        trial_id: 'TRL-COVID-DEXA-02',
        document_id: 'DOC-PRT-COVID-01',
        sections_json: {
          title: 'RECOVERY-2 Extension — Dexamethasone Dose Escalation in Mechanically Ventilated COVID-19',
          inclusion_criteria: [
            'Adults ≥18 years',
            'Confirmed SARS-CoV-2 infection by PCR',
            'Mechanically ventilated at time of randomization',
            'P/F ratio < 200 (severe ARDS criteria)'
          ],
          exclusion_criteria: [
            'Active bacterial sepsis as primary diagnosis (not COVID-19 related)',
            'Active systemic chemotherapy within 4 weeks',
            'Pregnancy'
          ],
          primary_endpoint: '28-day all-cause mortality',
          assumptions: [
            'Dexamethasone 12mg/day will provide additional mortality benefit in ventilated patients [⚠ CONTRADICTED by Sterne meta-analysis: no benefit, increased sepsis risk above 6mg]',
            'Secondary infection risk is manageable with prophylactic antibiotics'
          ]
        },
        version: '1.0',
        created_at: new Date(Date.now() - 3600000 * 34).toISOString()
      },
      // Rosiglitazone (approved)
      {
        id: 'PRT-ROSI-01',
        trial_id: 'TRL-ROSI-CARDIAC-03',
        document_id: 'DOC-PRT-ROSI-01',
        sections_json: {
          title: 'RECORD Re-Analysis — Rosiglitazone CV Risk Stratification in T2DM',
          inclusion_criteria: [
            'Age 40–75 years',
            'T2DM on ≥1 anti-diabetic agent',
            'HbA1c 7.0–10.0%'
          ],
          exclusion_criteria: [
            'NYHA Class III or IV congestive heart failure (per FDA Black-Box Warning)',
            'eGFR < 30 mL/min/1.73m²',
            'Recent MI within 6 months',
            'Hepatic failure (ALT > 3× ULN)'
          ],
          primary_endpoint: 'MACE composite (MI, stroke, CV death) at 24 months',
          assumptions: [
            'Exclusion of NYHA ≥ III CHF adequately mitigates cardiac risk',
            '4mg/day dose does not require escalation to 8mg in this population'
          ]
        },
        version: '2.1',
        created_at: new Date(Date.now() - 3600000 * 70).toISOString()
      }
    ];

    // 5. Seed SAPs
    this.saps = [
      {
        id: 'SAP-MET-01',
        trial_id: 'TRL-MET-RENAL-01',
        document_id: 'DOC-SAP-MET-01',
        content_json: {
          analysis_population: 'Intention-to-Treat (ITT) Population',
          primary_statistical_method: 'Mixed-model repeated measures (MMRM) for HbA1c change from baseline',
          power_calculation: {
            assumed_active_efficacy: 0.012,
            assumed_placebo_efficacy: 0.007,
            alpha: 0.05,
            power: 0.80,
            calculated_sample_size: 'N = 240 per arm (Total N = 480)',
            formula: 'MMRM two-sided test, detecting ΔHbA1c ≥ 0.5%'
          },
          endpoint_validation: 'Primary endpoint (HbA1c at Week 26) is validated. Lactic acidosis adjudication committee required — key safety endpoint.',
          notes: [
            'Pre-specified safety analysis: Lactic acidosis event rate by eGFR subgroup (eGFR 30–44 vs. 45–60)',
            'Quarterly eGFR monitoring — slope change as secondary endpoint'
          ]
        },
        version: '1.0',
        created_at: new Date(Date.now() - 3600000 * 45).toISOString()
      },
      {
        id: 'SAP-COVID-01',
        trial_id: 'TRL-COVID-DEXA-02',
        document_id: 'DOC-SAP-COVID-01',
        content_json: {
          analysis_population: 'Intention-to-Treat (ITT) Population',
          primary_statistical_method: 'Log-rank test for 28-day all-cause mortality',
          power_calculation: {
            assumed_active_efficacy: 0.293,
            assumed_placebo_efficacy: 0.350,
            alpha: 0.05,
            power: 0.90,
            calculated_sample_size: 'N = 400 per arm (Total N = 800)',
            formula: 'Log-rank superiority test; O\'Brien-Fleming stopping bounds'
          },
          endpoint_validation: 'Primary mortality endpoint validated. DSMB review at 200/400/600 events.',
          notes: [
            'Pre-specified stopping rule for harm: O\'Brien-Fleming boundary',
            'Secondary infection: independently adjudicated by blinded committee'
          ]
        },
        version: '1.0',
        created_at: new Date(Date.now() - 3600000 * 33).toISOString()
      },
      {
        id: 'SAP-ROSI-01',
        trial_id: 'TRL-ROSI-CARDIAC-03',
        document_id: 'DOC-SAP-ROSI-01',
        content_json: {
          analysis_population: 'Intention-to-Treat (ITT) Population',
          primary_statistical_method: 'Time-to-first-MACE Cox proportional-hazards model',
          power_calculation: {
            assumed_active_efficacy: 0.15,
            assumed_placebo_efficacy: 0.22,
            alpha: 0.05,
            power: 0.85,
            calculated_sample_size: 'N = 600 per arm (Total N = 1200)',
            formula: 'Cox model log-rank for MACE composite'
          },
          endpoint_validation: 'MACE endpoint validated. All events independently adjudicated by blinded committee.',
          notes: [
            'Pre-specified CHF subgroup analysis (N~400)',
            'DSMB reviews every 6 months',
            'Multiplicity: Bonferroni correction for secondary endpoints'
          ]
        },
        version: '2.1',
        created_at: new Date(Date.now() - 3600000 * 69).toISOString()
      }
    ];

    // 6. Seed Conflicts (Active conflicts for the two triage trials)
    this.conflicts = [
      // ── METFORMIN / RENAL IMPAIRMENT CONFLICTS ──
      {
        id: 'CONF-MET-RENAL-01',
        trial_id: 'TRL-MET-RENAL-01',
        type: 'EVIDENCE_vs_PROTOCOL',
        severity: 'HIGH',
        position_a: 'Literature (Crowley 2023, MHRA 2022): eGFR < 45 mL/min/1.73m² is the safety threshold for Metformin. Patients with eGFR 30–44 had 3.8× elevated lactic acidosis events on full-dose Metformin. MHRA 2022 mandates CAUTION below eGFR 45 and CONTRAINDICATION below 30.',
        position_b: 'Protocol Exclusion Criterion currently set at eGFR < 30 mL/min/1.73m². This allows enrollment of patients with eGFR 30–44 who are at significantly elevated lactic acidosis risk per the latest regulatory guidance.',
        recommendation: 'Modify protocol exclusion criterion: eGFR < 45 mL/min/1.73m² (from < 30). This aligns with MHRA 2022 guidance and Crowley 2023 real-world evidence. Patients with eGFR 30–44 should be excluded or enrolled only in a separate dose-reduction sub-study.',
        status: 'OPEN',
        resolved_at: null,
        resolved_by: null,
        created_at: new Date(Date.now() - 3600000 * 43).toISOString()
      },
      {
        id: 'CONF-MET-DOSE-01',
        trial_id: 'TRL-MET-RENAL-01',
        type: 'PROTOCOL_vs_SAP',
        severity: 'MEDIUM',
        position_a: 'FDA 2016 Label and EMA 2022 guidance: Metformin dose should be reduced to ≤1000 mg/day (500mg BID) when eGFR 45–59. Full dose of 2000 mg/day is only appropriate for eGFR ≥ 60.',
        position_b: 'Protocol dosing section permits titration to 1000mg BID (2000mg/day total) for any enrolled patient who meets the eGFR ≥ 30 threshold. SAP does not include a pre-specified subgroup safety analysis for the eGFR 45–59 stratum at higher doses.',
        recommendation: 'Add dose-capping rule to protocol: patients with eGFR 45–59 must be capped at 500mg BID (1000mg/day). Add pre-specified safety analysis for lactic acidosis events in eGFR 45–59 subgroup to the SAP.',
        status: 'OPEN',
        resolved_at: null,
        resolved_by: null,
        created_at: new Date(Date.now() - 3600000 * 43).toISOString()
      },
      // ── COVID-19 / DEXAMETHASONE CONFLICTS ──
      {
        id: 'CONF-COVID-DOSE-01',
        trial_id: 'TRL-COVID-DEXA-02',
        type: 'EVIDENCE_vs_PROTOCOL',
        severity: 'HIGH',
        position_a: 'Literature (Sterne meta-analysis, JAMA 2020; WHO 2021 Guidance): Dexamethasone 6mg/day is the established dose ceiling with proven mortality benefit in mechanically ventilated COVID-19 patients. Doses above 6mg/day show NO additional survival benefit (same OR for mortality) but significantly increase secondary bacterial infection rate (RR 1.89, 95% CI 1.21–2.94 for sepsis).',
        position_b: 'Protocol Arm B proposes dexamethasone 12mg/day × 10 days as a "high-severity" escalation arm. This dose has been directly tested and found to offer no mortality benefit while increasing secondary sepsis risk by 89%.',
        recommendation: 'Eliminate the 12mg/day arm from the protocol entirely. The dose-escalation hypothesis is already refuted by Level 1 evidence (multi-center meta-analysis + WHO guidelines). Replace with a comparison of 6mg/day × 10 days vs. 6mg/day × 14 days (duration extension question, which remains unanswered).',
        status: 'OPEN',
        resolved_at: null,
        resolved_by: null,
        created_at: new Date(Date.now() - 3600000 * 31).toISOString()
      },
      {
        id: 'CONF-COVID-EXCL-01',
        trial_id: 'TRL-COVID-DEXA-02',
        type: 'EVIDENCE_vs_PROTOCOL',
        severity: 'MEDIUM',
        position_a: 'RECOVERY Trial evidence (Horby 2021): Dexamethasone showed no benefit and potential harm (RR 1.19, 95% CI 0.91–1.55) in patients who did not require supplemental oxygen at enrollment. Baseline oxygen requirement is a critical eligibility gate.',
        position_b: 'Protocol does not specify oxygen requirement at randomization. The inclusion criterion is "mechanically ventilated" but does not require documentation of oxygen requirement prior to intubation. Patients intubated for non-hypoxic reasons (e.g., airway protection only) could be enrolled inappropriately.',
        recommendation: 'Add explicit inclusion criterion: "Requiring mechanical ventilation for hypoxic respiratory failure with documented P/F ratio < 200 and FiO₂ ≥ 0.4 for ≥4 hours prior to randomization." This excludes non-hypoxic intubations.',
        status: 'OPEN',
        resolved_at: null,
        resolved_by: null,
        created_at: new Date(Date.now() - 3600000 * 31).toISOString()
      }
    ];

    // 7. Seed Decision Logs (for approved trials)
    this.decisionLogs = [
      {
        id: 'DEC-ROSI-01',
        trial_id: 'TRL-ROSI-CARDIAC-03',
        title: 'Conflict Resolution: FDA Black-Box Warning — CHF Exclusion Alignment',
        decision: 'Approve AI Recommendation',
        rationale: 'Protocol exclusion of NYHA Class III/IV CHF correctly aligned with FDA Black-Box Warning for thiazolidinediones. Dose capped at 4mg/day to mitigate escalating CHF risk demonstrated in RECORD trial (HR 2.15 for CHF hospitalization).',
        implications: 'Protocol v2.1 cleared for regulatory submission. MACE adjudication committee established. CHF subgroup pre-specified in SAP v2.1.',
        made_by: 'regulatory@trialsync.com',
        created_at: new Date(Date.now() - 3600000 * 60).toISOString()
      },
      {
        id: 'DEC-LECA-01',
        trial_id: 'TRL-LECA-AD-06',
        title: 'Conflict Resolution: ARIA Safety Monitoring — MRI Schedule Alignment',
        decision: 'Approve AI Recommendation',
        rationale: 'FDA label requires monthly MRI for the first year to detect ARIA-E and ARIA-H. Protocol v2.0 includes the required monitoring schedule. APOE ε4 genotyping added as stratification factor per FDA guidance.',
        implications: 'CLARITY-AD Validation protocol approved. Anticoagulant contraindication explicitly documented. Independent MRI adjudication committee established.',
        made_by: 'clinical_lead@trialsync.com',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ];

    // 8. Seed Audit Trail
    this.auditTrail = [
      // Metformin trial
      {
        id: 'AUD-MET-01',
        trial_id: 'TRL-MET-RENAL-01',
        action: 'FILE_UPLOAD',
        user_email: 'clinical_lead@trialsync.com',
        role: 'Clinical Program Lead',
        record_type: 'Document',
        change_description: 'Uploaded: UKPDS-34 & MHRA 2022 Safety Data — Metformin in Renal Impairment',
        reason: 'Literature ingestion — Golden Path Demo',
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 3600000 * 47).toISOString()
      },
      {
        id: 'AUD-MET-02',
        trial_id: 'TRL-MET-RENAL-01',
        action: 'AGENT_COMPLETE',
        user_email: 'system@trialsync.com',
        role: 'Literature Scout Agent',
        record_type: 'Evidence Brief',
        change_description: 'Literature Scout completed analysis. Key signal: Lactic acidosis risk 3.8× higher in eGFR 30–44. Recommended eGFR cutoff: 45 (vs. protocol eGFR 30).',
        reason: 'Evidence brief generated from UKPDS-34, MHRA 2022, Crowley 2023.',
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 3600000 * 44).toISOString()
      },
      {
        id: 'AUD-MET-03',
        trial_id: 'TRL-MET-RENAL-01',
        action: 'AGENT_COMPLETE',
        user_email: 'regulatory@trialsync.com',
        role: 'Regulatory Agent',
        record_type: 'Compliance Review',
        change_description: '🚨 TRIAGE REQUIRED: Regulatory Auditor detected critical numerical mismatch — Protocol eGFR cutoff (30) vs. Literature safety threshold (45). FDA Label (2016) and MHRA 2022 guidance explicitly warn about eGFR 30–44 sub-group. Trial locked pending human review.',
        reason: 'Automated compliance audit detected safety-critical discrepancy.',
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 3600000 * 43).toISOString()
      },
      // COVID-19 trial
      {
        id: 'AUD-COVID-01',
        trial_id: 'TRL-COVID-DEXA-02',
        action: 'FILE_UPLOAD',
        user_email: 'clinical_lead@trialsync.com',
        role: 'Clinical Program Lead',
        record_type: 'Document',
        change_description: 'Uploaded: RECOVERY Trial Results — Dexamethasone in Hospitalized COVID-19 (Horby et al., NEJM 2021)',
        reason: 'Literature ingestion for dose comparison analysis',
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 3600000 * 35).toISOString()
      },
      {
        id: 'AUD-COVID-02',
        trial_id: 'TRL-COVID-DEXA-02',
        action: 'AGENT_COMPLETE',
        user_email: 'regulatory@trialsync.com',
        role: 'Regulatory Agent',
        record_type: 'Compliance Review',
        change_description: '🚨 TRIAGE REQUIRED: Protocol Arm B (Dexamethasone 12mg/day) is directly contradicted by Level 1 meta-analysis evidence (Sterne 2020). No mortality benefit above 6mg/day; secondary sepsis risk RR=1.89. Trial locked pending human gatekeeping.',
        reason: 'Evidence-protocol dose conflict detected. WHO guidelines violated.',
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 3600000 * 31).toISOString()
      },
      // Rosiglitazone (approved)
      {
        id: 'AUD-ROSI-01',
        trial_id: 'TRL-ROSI-CARDIAC-03',
        action: 'CONFLICT_RESOLVE',
        user_email: 'regulatory@trialsync.com',
        role: 'Regulatory Program Director',
        record_type: 'Conflict / Decision',
        change_description: 'Conflict resolved: CHF exclusion updated to align with FDA Black-Box Warning. Protocol v2.1 cleared. MACE adjudication committee established.',
        reason: 'Regulatory alignment with FDA thiazolidinedione labeling requirements.',
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 3600000 * 60).toISOString()
      },
      // Lecanemab (approved)
      {
        id: 'AUD-LECA-01',
        trial_id: 'TRL-LECA-AD-06',
        action: 'CONFLICT_RESOLVE',
        user_email: 'clinical_lead@trialsync.com',
        role: 'Clinical Program Lead',
        record_type: 'Conflict / Decision',
        change_description: 'CLARITY-AD Validation: ARIA monitoring schedule (monthly MRI Year 1) confirmed. Anticoagulant contraindication added. Protocol v2.0 approved.',
        reason: 'FDA label compliance — ARIA surveillance requirement.',
        ip_address: '127.0.0.1',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ];
  }
}

const mockDb = new InMemoryDatabase();

// Configure the connection pool for PostgreSQL
const isPgConfigured = !!process.env.DATABASE_URL;
let pool: Pool | null = null;

if (isPgConfigured) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
}

export const isFallback = !isPgConfigured;

// 21 CFR Part 11 compliant audit trail helper
export async function logAuditTrail(
  trialId: string | null,
  action: string,
  userEmail: string,
  role: string,
  recordType: string,
  changeDescription: string,
  reason: string,
  ipAddress: string = '127.0.0.1'
) {
  const timestamp = new Date().toISOString();
  if (isFallback) {
    mockDb.auditTrail.unshift({
      id: `AUD-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      trial_id: trialId,
      action,
      user_email: userEmail,
      role,
      record_type: recordType,
      change_description: changeDescription,
      reason,
      ip_address: ipAddress,
      created_at: timestamp,
    });
    return;
  }

  try {
    await pool!.query(
      `INSERT INTO audit_trail 
      (trial_id, action, user_email, role, record_type, change_description, reason, ip_address, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [trialId, action, userEmail, role, recordType, changeDescription, reason, ipAddress, timestamp]
    );
  } catch (err) {
    console.error('Audit trail logging failed:', err);
  }
}

export async function logAgentProgress(
  trialId: string,
  agentName: string,
  status: 'WAITING' | 'PROCESSING' | 'BLOCKED' | 'MONITORING' | 'COMPLETE',
  subtask: string,
  progress: number
) {
  const timestamp = new Date().toISOString();
  if (isFallback) {
    mockDb.agentProgress[`${trialId}_${agentName}`] = {
      trial_id: trialId,
      agent_name: agentName,
      status,
      subtask,
      progress,
      updated_at: timestamp
    };
    return;
  }

  try {
    await pool!.query(
      `INSERT INTO agent_progress (trial_id, agent_name, status, subtask, progress, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (trial_id, agent_name) DO UPDATE SET
         status = EXCLUDED.status,
         subtask = EXCLUDED.subtask,
         progress = EXCLUDED.progress,
         updated_at = EXCLUDED.updated_at`,
      [trialId, agentName, status, subtask, progress, timestamp]
    );
  } catch (err) {
    console.error('Agent progress logging failed:', err);
  }
}

export async function getAgentProgress(trialId: string) {
  if (isFallback) {
    return Object.values(mockDb.agentProgress).filter((p: any) => p.trial_id === trialId);
  }

  try {
    const res = await pool!.query('SELECT * FROM agent_progress WHERE trial_id = $1', [trialId]);
    return res.rows;
  } catch (err) {
    console.error('Fetching agent progress failed:', err);
    return [];
  }
}

export async function initDb() {
  if (isFallback) {
    console.log('⚠️ Database URL not set. Running in-memory database fallback mode.');
    return;
  }

  console.log('📡 Initializing PostgreSQL database...');
  try {
    // 1. Trials table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS trials (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        indication VARCHAR(255) NOT NULL,
        status VARCHAR(100) NOT NULL,
        band_room_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await pool!.query(`
        ALTER TABLE trials ADD COLUMN IF NOT EXISTS band_room_id VARCHAR(255);
      `);
    } catch (err) {
      console.warn('Trials table alteration warning (ignored if column exists):', err);
    }

    // 2. Documents table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Evidence Briefs table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS evidence_briefs (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        content_json JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Protocols table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS protocols (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        document_id VARCHAR(100) REFERENCES documents(id) ON DELETE SET NULL,
        sections_json JSONB NOT NULL,
        version VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. SAPs table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS saps (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        document_id VARCHAR(100) REFERENCES documents(id) ON DELETE SET NULL,
        content_json JSONB NOT NULL,
        version VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Conflicts table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS conflicts (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        position_a TEXT NOT NULL,
        position_b TEXT NOT NULL,
        recommendation TEXT NOT NULL,
        status VARCHAR(100) NOT NULL,
        resolved_at TIMESTAMP WITH TIME ZONE,
        resolved_by VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Decision Logs table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS decision_logs (
        id VARCHAR(100) PRIMARY KEY,
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        decision TEXT NOT NULL,
        rationale TEXT NOT NULL,
        implications TEXT NOT NULL,
        made_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Audit Trail table (21 CFR Part 11 compliant)
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS audit_trail (
        id SERIAL PRIMARY KEY,
        trial_id VARCHAR(100),
        action VARCHAR(100) NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        record_type VARCHAR(100) NOT NULL,
        change_description TEXT NOT NULL,
        reason TEXT NOT NULL,
        ip_address VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Agent Progress Table
    await pool!.query(`
      CREATE TABLE IF NOT EXISTS agent_progress (
        trial_id VARCHAR(100) REFERENCES trials(id) ON DELETE CASCADE,
        agent_name VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        subtask TEXT NOT NULL,
        progress INT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (trial_id, agent_name)
      )
    `);

    // Seed initial trials data if table is empty
    const checkTrials = await pool!.query('SELECT COUNT(*) FROM trials');
    const trialsCount = parseInt(checkTrials.rows[0].count, 10);
    if (trialsCount === 0) {
      console.log('Seeding initial PostgreSQL trials data...');
      const timeBase = new Date(Date.now() - 3600000 * 24).toISOString();
      const timeNow = new Date().toISOString();

      // Seed Trials
      await pool!.query("INSERT INTO trials (id, name, indication, status, created_at, updated_at) VALUES ('TRL-CROHNS-01', 'Phase III Study of Zylastin-B in Moderate-to-Severe Crohn''s Disease', 'Crohn''s Disease', 'CONFLICT_DETECTED', $1, $2)", [timeBase, timeNow]);
      await pool!.query("INSERT INTO trials (id, name, indication, status, created_at, updated_at) VALUES ('TRL-UC-02', 'Efficacy and Safety of Sibofluran in Ulcerative Colitis (UC-PEAK)', 'Ulcerative Colitis', 'APPROVED_REGULATORY', $1, $2)", [timeBase, timeNow]);
      await pool!.query("INSERT INTO trials (id, name, indication, status, created_at, updated_at) VALUES ('TRL-RA-03', 'A Study of JAK1 Inhibitor Ruvaditinib in Active Rheumatoid Arthritis', 'Rheumatoid Arthritis', 'INITIAL', $1, $2)", [timeBase, timeNow]);
      await pool!.query("INSERT INTO trials (id, name, indication, status, created_at, updated_at) VALUES ('TRL-T2D-04', 'Pediatric Safety and Pharmacokinetics of Glipoglutide in Type 2 Diabetes', 'Pediatric Type 2 Diabetes', 'INITIAL', $1, $2)", [timeBase, timeNow]);

      // Seed Documents
      await pool!.query("INSERT INTO documents (id, trial_id, name, content, type, hash, created_at) VALUES ('DOC-LIT-01', 'TRL-CROHNS-01', 'Crohn''s Disease Safety Brief - ALT and eGFR Parameters.txt', 'Clinical Literature Summary: Zylastin-B is an investigational drug for Crohn''s Disease.\\nPrimary efficacy remission responder rate peaks at 12 weeks with 65% responder rate.\\nHepatotoxicity risk: elevated liver enzymes observed when baseline ALT > 40 U/L.\\nRenal risk: borderline safety signal (eGFR reduction) in patients with baseline eGFR < 60 mL/min/1.73m2.', 'LITERATURE', 'HASH-LIT-01', $1)", [timeBase]);
      await pool!.query("INSERT INTO documents (id, trial_id, name, content, type, hash, created_at) VALUES ('DOC-PRT-01', 'TRL-CROHNS-01', 'Study Protocol Draft v1.0', 'Protocol Title: Evaluation of Zylastin-B for Crohn''s Disease Remission\\nInclusion: Moderate-to-severe Crohn''s.\\nExclusion: ALT > 100 U/L, eGFR < 30 mL/min.\\nEndpoint: Week 8 remission.', 'PROTOCOL', 'HASH-PRT-01', $1)", [timeBase]);
      await pool!.query("INSERT INTO documents (id, trial_id, name, content, type, hash, created_at) VALUES ('DOC-SAP-01', 'TRL-CROHNS-01', 'Statistical Analysis Plan v1.0', 'Analysis Plan: Chi-square test on response rate. Required sample size N=400. Endpoint validation: WARNING.', 'SAP', 'HASH-SAP-01', $1)", [timeBase]);
      await pool!.query("INSERT INTO documents (id, trial_id, name, content, type, hash, created_at) VALUES ('DOC-LIT-02', 'TRL-UC-02', 'Sibofluran Safety Brief - Cardiac QTc Limits.txt', 'Efficacy remission peaks at 12 weeks with 62% remission rate. Safety: dose-dependent QTc prolongation, exclude subjects with baseline QTc > 450 ms.', 'LITERATURE', 'HASH-LIT-02', $1)", [timeBase]);
      await pool!.query("INSERT INTO documents (id, trial_id, name, content, type, hash, created_at) VALUES ('DOC-PRT-02', 'TRL-UC-02', 'Study Protocol Draft v1.1', 'Protocol: Efficacy and Safety of Sibofluran.\\nInclusion: Moderate-to-severe UC.\\nExclusion: Baseline QTc > 450 ms.\\nEndpoint: Clinical remission rate at Week 12.', 'PROTOCOL', 'HASH-PRT-02', $1)", [timeBase]);
      await pool!.query("INSERT INTO documents (id, trial_id, name, content, type, hash, created_at) VALUES ('DOC-SAP-02', 'TRL-UC-02', 'Statistical Analysis Plan v1.1', 'SAP: Logistic regression adjusted for baseline disease severity. Power 80%, N=360. Endpoint validated at Week 12.', 'SAP', 'HASH-SAP-02', $1)", [timeBase]);
      await pool!.query("INSERT INTO documents (id, trial_id, name, content, type, hash, created_at) VALUES ('DOC-LIT-03', 'TRL-RA-03', 'JAK1 Inhibitor Ruvaditinib Efficacy and Safety Profile.txt', 'Clinical Literature Summary: Ruvaditinib is a selective JAK1 inhibitor designed for Active Rheumatoid Arthritis.\\nClinical evidence shows a response rate of 58% at 16 weeks (remission endpoint).\\nSafety signals include lipid elevations (total cholesterol and LDL-C) in 8% of patients.\\nThromboembolism risk observed primarily in patients with prior cardiovascular history; exclusion recommended for subjects with deep vein thrombosis (DVT) or pulmonary embolism (PE) within 12 months.\\nBaseline lipid screening and DVT history exclusions are critical safety recommendations.', 'LITERATURE', 'HASH-LIT-RA-01', $1)", [timeBase]);

      // Seed Evidence Briefs
      await pool!.query("INSERT INTO evidence_briefs (id, trial_id, content_json, created_at) VALUES ('EVB-01', 'TRL-CROHNS-01', $2, $1)", [timeBase, JSON.stringify({
        safety_signals: [
          { signal: 'Hepatotoxicity', severity: 'HIGH', incidence: '3%', rationale: 'Elevated liver enzymes observed primarily in patients with baseline ALT > 40 U/L. Absolute contraindication recommended.', source: 'Smith et al. 2023' },
          { signal: 'Renal Impairment Risk', severity: 'MEDIUM', incidence: '5%', rationale: 'Borderline safety signal observed in patients with eGFR < 60 mL/min/1.73m².', source: 'Johnson et al. 2025' }
        ],
        efficacy: [
          { endpoint: 'Clinical remission response rate at 12 weeks', rate: '65%', rationale: 'Primary efficacy endpoint shows significant benefit compared to placebo starting at week 12. 8-week data is statistically noisy.', source: 'Doe et al. 2024' }
        ],
        populations: {
          inclusion: ['Age 18-65 years', 'Moderate-to-Severe Crohn\'s Disease', 'Inadequate response to anti-TNF'],
          exclusion: ['Baseline ALT > 40 U/L', 'eGFR < 60 mL/min/1.73m²', 'QTc interval > 450 ms']
        }
      })]);
      await pool!.query("INSERT INTO evidence_briefs (id, trial_id, content_json, created_at) VALUES ('EVB-02', 'TRL-UC-02', $2, $1)", [timeBase, JSON.stringify({
        safety_signals: [
          { signal: 'QTc Prolongation Risk', severity: 'HIGH', incidence: '2%', rationale: 'Rare, dose-dependent QTc prolongation observed at doses exceeding 100mg/day. Baseline QTc > 450 ms must be excluded.', source: 'Adams et al. 2024' }
        ],
        efficacy: [
          { endpoint: 'Efficacy endpoint at 12 weeks', rate: '62%', rationale: 'Response peaks at 12 weeks; 8 weeks shows high response rate but unstable remission.', source: 'White et al. 2024' }
        ],
        populations: {
          inclusion: ['Ages 18-70', 'Moderate-to-Severe Ulcerative Colitis'],
          exclusion: ['Baseline QTc > 450 ms', 'Active colitis flares requiring hospitalization']
        }
      })]);

      // Seed Protocols
      await pool!.query("INSERT INTO protocols (id, trial_id, document_id, sections_json, version, created_at) VALUES ('PRT-01', 'TRL-CROHNS-01', 'DOC-PRT-01', $2, '1.0', $1)", [timeBase, JSON.stringify({
        title: 'Evaluation of Zylastin-B for Crohn\'s Disease Remission',
        inclusion_criteria: ['Age 18-65 years at screening', 'Confirmed diagnosis of moderate-to-severe Crohn\'s Disease', 'Failed at least one biologic treatment (anti-TNF)'],
        exclusion_criteria: ['Baseline ALT > 100 U/L (Upper Limit of Normal)', 'Renal impairment defined as eGFR < 30 mL/min/1.73m²', 'Concurrent pregnancy or lactation'],
        primary_endpoint: 'Proportion of subjects in clinical remission at Week 8',
        assumptions: ['Assumed safety profile is manageable in patients with eGFR 30-60', 'Assumed 8-week endpoint provides adequate time for clinical response']
      })]);
      await pool!.query("INSERT INTO protocols (id, trial_id, document_id, sections_json, version, created_at) VALUES ('PRT-02', 'TRL-UC-02', 'DOC-PRT-02', $2, '1.1', $1)", [timeBase, JSON.stringify({
        title: 'Efficacy and Safety of Sibofluran in Ulcerative Colitis (UC-PEAK)',
        inclusion_criteria: ['Ages 18-70 years at screening', 'Confirmed diagnosis of moderate-to-severe Ulcerative Colitis'],
        exclusion_criteria: ['Baseline QTc > 450 ms (due to high ventricular risk)', 'Active colitis flares requiring hospitalization', 'Concurrent pregnancy or lactation'],
        primary_endpoint: 'Clinical remission rate at Week 12',
        assumptions: ['Baseline QTc exclusion of 450 ms prevents cardiac events', 'Week 12 endpoint provides stable efficacy assessment']
      })]);

      // Seed SAPs
      await pool!.query("INSERT INTO saps (id, trial_id, document_id, content_json, version, created_at) VALUES ('SAP-01', 'TRL-CROHNS-01', 'DOC-SAP-01', $2, '1.0', $1)", [timeBase, JSON.stringify({
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
        endpoint_validation: 'WARNING: Primary endpoint at Week 8 has low statistical justification. Efficacy evidence suggests Week 12 response is optimal.',
        notes: ['Subgroup analysis planned for subjects with baseline renal impairment (eGFR 60-90)', 'Interim safety analysis planned at 50% enrollment (N=200)']
      })]);
      await pool!.query("INSERT INTO saps (id, trial_id, document_id, content_json, version, created_at) VALUES ('SAP-02', 'TRL-UC-02', 'DOC-SAP-02', $2, '1.1', $1)", [timeBase, JSON.stringify({
        analysis_population: 'Intention-to-Treat (ITT) Population',
        primary_statistical_method: 'Logistic regression adjusted for baseline disease severity',
        power_calculation: {
          assumed_active_efficacy: 0.62,
          assumed_placebo_efficacy: 0.35,
          alpha: 0.05,
          power: 0.80,
          calculated_sample_size: 'N = 180 per treatment arm (Total N = 360)',
          formula: 'Two-sample comparison of proportions'
        },
        endpoint_validation: 'Efficacy endpoint validated at Week 12. Sample size calculations powered at 80%.',
        notes: ['Subgroup analysis for biologic-naive vs biologic-experienced patients']
      })]);

      // Seed Conflicts
      await pool!.query("INSERT INTO conflicts (id, trial_id, type, severity, position_a, position_b, recommendation, status, created_at) VALUES ('CONF-ALT-01', 'TRL-CROHNS-01', 'EVIDENCE_vs_PROTOCOL', 'HIGH', 'Evidence Scout states baseline ALT > 40 U/L represents high hepatotoxicity risk (absolute contraindication).', 'Protocol exclusion limits ALT to > 100 U/L, which exposes patients in the 40-100 range to severe risk.', 'Modify the protocol exclusion criteria to restrict baseline ALT to ≤ 40 U/L.', 'OPEN', $1)", [timeBase]);
      await pool!.query("INSERT INTO conflicts (id, trial_id, type, severity, position_a, position_b, recommendation, status, created_at) VALUES ('CONF-RENAL-01', 'TRL-CROHNS-01', 'EVIDENCE_vs_PROTOCOL', 'HIGH', 'Evidence Scout notes renal impairment risk (borderline safety signal) in patients with eGFR < 60.', 'Protocol exclusions only cover eGFR < 30, exposing patients with mild-to-moderate impairment (eGFR 30-60) to risk.', 'Restrict inclusion criteria to subjects with eGFR > 60 mL/min/1.73m².', 'OPEN', $1)", [timeBase]);
      await pool!.query("INSERT INTO conflicts (id, trial_id, type, severity, position_a, position_b, recommendation, status, created_at) VALUES ('CONF-ENDPOINT-01', 'TRL-CROHNS-01', 'EVIDENCE_vs_PROTOCOL', 'HIGH', 'Evidence Scout shows peak response rate (65%) occurs at week 12; earlier points are statistically noisy.', 'Protocol lists the primary efficacy endpoint at week 8, risking study failure due to inadequate duration.', 'Change primary endpoint analysis timepoint to Week 12.', 'OPEN', $1)", [timeBase]);
      await pool!.query("INSERT INTO conflicts (id, trial_id, type, severity, position_a, position_b, recommendation, status, created_at) VALUES ('CONF-SAP-01', 'TRL-CROHNS-01', 'PROTOCOL_vs_SAP', 'MEDIUM', 'Protocol specifies primary efficacy endpoint at Week 8.', 'Statistical Analyst Agent reports power calculation is unstable for Week 8 endpoint due to literature noise.', 'Change primary endpoint to Week 12 to stabilize statistical power and sample size calculation.', 'OPEN', $1)", [timeBase]);

      // Seed Decision Logs
      await pool!.query("INSERT INTO decision_logs (id, trial_id, title, decision, rationale, implications, made_by, created_at) VALUES ('DEC-02', 'TRL-UC-02', 'Conflict Resolution: EVIDENCE_vs_PROTOCOL', 'Accept recommended modifications', 'Aligning protocol with clinical trial evidence safety signals for QTc interval.', 'Updated inclusion/exclusion criteria for QTc: Baseline QTc <= 450 ms (Protocol v1.1).', 'clinical_lead@pharmacompany.com', $1)", [timeBase]);

      // Seed Audit Trail
      await pool!.query("INSERT INTO audit_trail (trial_id, action, user_email, role, record_type, change_description, reason, ip_address, created_at) VALUES ('TRL-CROHNS-01', 'FILE_UPLOAD', 'clinical_lead@pharmacompany.com', 'Clinical Program Lead', 'Document', 'Uploaded file: Crohn''s Disease Safety Brief - ALT and eGFR Parameters.txt', 'Literature ingestion', '127.0.0.1', $1)", [timeBase]);
      await pool!.query("INSERT INTO audit_trail (trial_id, action, user_email, role, record_type, change_description, reason, ip_address, created_at) VALUES ('TRL-CROHNS-01', 'AGENT_COMPLETE', 'system@trialsync.com', 'Literature Scout Agent', 'Evidence Brief', 'Literature Scout Agent successfully generated the Evidence Brief.', 'Saved structured evidence brief.', '127.0.0.1', $1)", [timeBase]);
      await pool!.query("INSERT INTO audit_trail (trial_id, action, user_email, role, record_type, change_description, reason, ip_address, created_at) VALUES ('TRL-CROHNS-01', 'AGENT_COMPLETE', 'system@trialsync.com', 'Protocol Design Agent', 'Protocol Draft', 'Protocol Design Agent drafted Protocol v1.0.', 'Saved protocol v1.0.', '127.0.0.1', $1)", [timeBase]);
      await pool!.query("INSERT INTO audit_trail (trial_id, action, user_email, role, record_type, change_description, reason, ip_address, created_at) VALUES ('TRL-CROHNS-01', 'AGENT_COMPLETE', 'system@trialsync.com', 'Statistical Agent', 'Statistical Analysis Plan', 'Statistical Agent completed SAP v1.0.', 'Saved SAP v1.0.', '127.0.0.1', $1)", [timeBase]);
      await pool!.query("INSERT INTO audit_trail (trial_id, action, user_email, role, record_type, change_description, reason, ip_address, created_at) VALUES ('TRL-CROHNS-01', 'AGENT_COMPLETE', 'regulatory@trialsync.com', 'Regulatory Agent', 'Compliance Review', 'Regulatory review complete. Conflicts found: 4. Status updated to: CONFLICT_DETECTED', 'Audit checks completed.', '127.0.0.1', $1)", [timeBase]);

      await pool!.query("INSERT INTO audit_trail (trial_id, action, user_email, role, record_type, change_description, reason, ip_address, created_at) VALUES ('TRL-UC-02', 'FILE_UPLOAD', 'clinical_lead@pharmacompany.com', 'Clinical Program Lead', 'Document', 'Uploaded file: Sibofluran Safety Brief - Cardiac QTc Limits.txt', 'Literature ingestion', '127.0.0.1', $1)", [timeBase]);
      await pool!.query("INSERT INTO audit_trail (trial_id, action, user_email, role, record_type, change_description, reason, ip_address, created_at) VALUES ('TRL-UC-02', 'CONFLICT_RESOLVE', 'clinical_lead@pharmacompany.com', 'Clinical Program Lead', 'Conflict / Decision', 'Resolved conflict ID \"CONF-QTc\". Details: Updated inclusion/exclusion criteria for QTc: Baseline QTc <= 450 ms (Protocol v1.1).', 'Aligning protocol with clinical trial evidence safety signals for QTc interval.', '127.0.0.1', $1)", [timeBase]);
      await pool!.query("INSERT INTO audit_trail (trial_id, action, user_email, role, record_type, change_description, reason, ip_address, created_at) VALUES ('TRL-UC-02', 'STATUS_UPDATE', 'system@trialsync.com', 'Decision Orchestrator', 'Trial Status', 'All conflicts resolved. Trial status updated to: APPROVED_REGULATORY.', 'Final regulatory approval clearance.', '127.0.0.1', $1)", [timeBase]);
      
      await pool!.query("INSERT INTO audit_trail (trial_id, action, user_email, role, record_type, change_description, reason, ip_address, created_at) VALUES ('TRL-RA-03', 'FILE_UPLOAD', 'clinical_lead@pharmacompany.com', 'Clinical Program Lead', 'Document', 'Uploaded file: JAK1 Inhibitor Ruvaditinib Efficacy and Safety Profile.txt', 'Initial Literature ingestion', '127.0.0.1', $1)", [timeBase]);
    }

    console.log('✓ Database tables initialized successfully.');
  } catch (err) {
    console.error('❌ Database initialization failed:', err);
  }
}

// Global DB helper APIs
export const db = {
  logAgentProgress,
  getAgentProgress,
  // Get all trials
  getTrials: async () => {
    if (isFallback) return mockDb.trials;
    const res = await pool!.query('SELECT * FROM trials ORDER BY created_at DESC');
    return res.rows;
  },

  // Get single trial
  getTrial: async (id: string) => {
    if (isFallback) return mockDb.trials.find((t) => t.id === id) || null;
    const res = await pool!.query('SELECT * FROM trials WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  // Create trial
  createTrial: async (id: string, name: string, indication: string, status: string) => {
    if (isFallback) {
      const newTrial = { id, name, indication, status, band_room_id: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mockDb.trials.push(newTrial);
      return newTrial;
    }
    const res = await pool!.query(
      'INSERT INTO trials (id, name, indication, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, name, indication, status]
    );
    return res.rows[0];
  },

  // Update trial status
  updateTrialStatus: async (id: string, status: string) => {
    if (isFallback) {
      const trial = mockDb.trials.find((t) => t.id === id);
      if (trial) {
        trial.status = status;
        trial.updated_at = new Date().toISOString();
      }
      return trial;
    }
    const res = await pool!.query(
      'UPDATE trials SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    return res.rows[0];
  },

  // Update trial band room id
  updateTrialBandRoom: async (id: string, bandRoomId: string | null) => {
    if (isFallback) {
      const trial = mockDb.trials.find((t) => t.id === id);
      if (trial) {
        trial.band_room_id = bandRoomId;
        trial.updated_at = new Date().toISOString();
      }
      return trial;
    }
    const res = await pool!.query(
      'UPDATE trials SET band_room_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [bandRoomId, id]
    );
    return res.rows[0];
  },

  // Get trial documents
  getDocuments: async (trialId: string) => {
    if (isFallback) return mockDb.documents.filter((d) => d.trial_id === trialId);
    const res = await pool!.query('SELECT * FROM documents WHERE trial_id = $1 ORDER BY created_at DESC', [trialId]);
    return res.rows;
  },

  // Save document
  createDocument: async (id: string, trialId: string, name: string, content: string, type: string, hash: string) => {
    if (isFallback) {
      const newDoc = { id, trial_id: trialId, name, content, type, hash, created_at: new Date().toISOString() };
      mockDb.documents.push(newDoc);
      return newDoc;
    }
    const res = await pool!.query(
      'INSERT INTO documents (id, trial_id, name, content, type, hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, trialId, name, content, type, hash]
    );
    return res.rows[0];
  },

  // Get evidence brief
  getEvidenceBrief: async (trialId: string) => {
    if (isFallback) return mockDb.evidenceBriefs.find((e) => e.trial_id === trialId) || null;
    const res = await pool!.query('SELECT * FROM evidence_briefs WHERE trial_id = $1', [trialId]);
    return res.rows[0] || null;
  },

  // Save/Update evidence brief
  saveEvidenceBrief: async (id: string, trialId: string, contentJson: any) => {
    if (isFallback) {
      let brief = mockDb.evidenceBriefs.find((e) => e.trial_id === trialId);
      if (brief) {
        brief.content_json = contentJson;
      } else {
        brief = { id, trial_id: trialId, content_json: contentJson, created_at: new Date().toISOString() };
        mockDb.evidenceBriefs.push(brief);
      }
      return brief;
    }
    await pool!.query('DELETE FROM evidence_briefs WHERE trial_id = $1', [trialId]);
    const res = await pool!.query(
      'INSERT INTO evidence_briefs (id, trial_id, content_json) VALUES ($1, $2, $3) RETURNING *',
      [id, trialId, JSON.stringify(contentJson)]
    );
    return res.rows[0];
  },

  // Get protocol
  getProtocol: async (trialId: string) => {
    if (isFallback) return mockDb.protocols.find((p) => p.trial_id === trialId) || null;
    const res = await pool!.query('SELECT * FROM protocols WHERE trial_id = $1 ORDER BY created_at DESC LIMIT 1', [trialId]);
    return res.rows[0] || null;
  },

  // Save/Update protocol
  saveProtocol: async (id: string, trialId: string, docId: string | null, sectionsJson: any, version: string) => {
    if (isFallback) {
      const newProtocol = { id, trial_id: trialId, document_id: docId, sections_json: sectionsJson, version, created_at: new Date().toISOString() };
      mockDb.protocols.push(newProtocol);
      return newProtocol;
    }
    const res = await pool!.query(
      'INSERT INTO protocols (id, trial_id, document_id, sections_json, version) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, trialId, docId, JSON.stringify(sectionsJson), version]
    );
    return res.rows[0];
  },

  // Get SAP
  getSap: async (trialId: string) => {
    if (isFallback) return mockDb.saps.find((s) => s.trial_id === trialId) || null;
    const res = await pool!.query('SELECT * FROM saps WHERE trial_id = $1 ORDER BY created_at DESC LIMIT 1', [trialId]);
    return res.rows[0] || null;
  },

  // Save/Update SAP
  saveSap: async (id: string, trialId: string, docId: string | null, contentJson: any, version: string) => {
    if (isFallback) {
      const newSap = { id, trial_id: trialId, document_id: docId, content_json: contentJson, version, created_at: new Date().toISOString() };
      mockDb.saps.push(newSap);
      return newSap;
    }
    const res = await pool!.query(
      'INSERT INTO saps (id, trial_id, document_id, content_json, version) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, trialId, docId, JSON.stringify(contentJson), version]
    );
    return res.rows[0];
  },

  // Get conflicts
  getConflicts: async (trialId: string) => {
    if (isFallback) return mockDb.conflicts.filter((c) => c.trial_id === trialId);
    const res = await pool!.query('SELECT * FROM conflicts WHERE trial_id = $1 ORDER BY created_at DESC', [trialId]);
    return res.rows;
  },

  // Create conflict
  createConflict: async (
    id: string,
    trialId: string,
    type: string,
    severity: string,
    positionA: string,
    positionB: string,
    recommendation: string,
    status: string
  ) => {
    if (isFallback) {
      const newConflict = {
        id,
        trial_id: trialId,
        type,
        severity,
        position_a: positionA,
        position_b: positionB,
        recommendation,
        status,
        resolved_at: null,
        resolved_by: null,
        created_at: new Date().toISOString(),
      };
      mockDb.conflicts.push(newConflict);
      return newConflict;
    }
    const res = await pool!.query(
      `INSERT INTO conflicts (id, trial_id, type, severity, position_a, position_b, recommendation, status) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, trialId, type, severity, positionA, positionB, recommendation, status]
    );
    return res.rows[0];
  },

  // Resolve conflict
  resolveConflict: async (id: string, resolvedBy: string) => {
    if (isFallback) {
      const conflict = mockDb.conflicts.find((c) => c.id === id);
      if (conflict) {
        conflict.status = 'RESOLVED';
        conflict.resolved_at = new Date().toISOString();
        conflict.resolved_by = resolvedBy;
      }
      return conflict;
    }
    const res = await pool!.query(
      `UPDATE conflicts 
      SET status = 'RESOLVED', resolved_at = CURRENT_TIMESTAMP, resolved_by = $1 
      WHERE id = $2 RETURNING *`,
      [resolvedBy, id]
    );
    return res.rows[0];
  },

  // Delete all open conflicts for a trial (to regenerate them)
  clearOpenConflicts: async (trialId: string) => {
    if (isFallback) {
      mockDb.conflicts = mockDb.conflicts.filter((c) => !(c.trial_id === trialId && c.status === 'OPEN'));
      return;
    }
    await pool!.query("DELETE FROM conflicts WHERE trial_id = $1 AND status = 'OPEN'", [trialId]);
  },

  // Get decision logs
  getDecisionLogs: async (trialId: string) => {
    if (isFallback) return mockDb.decisionLogs.filter((d) => d.trial_id === trialId);
    const res = await pool!.query('SELECT * FROM decision_logs WHERE trial_id = $1 ORDER BY created_at DESC', [trialId]);
    return res.rows;
  },

  // Create decision log
  createDecisionLog: async (
    id: string,
    trialId: string,
    title: string,
    decision: string,
    rationale: string,
    implications: string,
    madeBy: string
  ) => {
    if (isFallback) {
      const newLog = {
        id,
        trial_id: trialId,
        title,
        decision,
        rationale,
        implications,
        made_by: madeBy,
        created_at: new Date().toISOString(),
      };
      mockDb.decisionLogs.push(newLog);
      return newLog;
    }
    const res = await pool!.query(
      `INSERT INTO decision_logs (id, trial_id, title, decision, rationale, implications, made_by) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, trialId, title, decision, rationale, implications, madeBy]
    );
    return res.rows[0];
  },

  // Get audit trail
  getAuditTrail: async (trialId: string) => {
    if (isFallback) return mockDb.auditTrail.filter((a) => a.trial_id === trialId);
    const res = await pool!.query(
      'SELECT * FROM audit_trail WHERE trial_id = $1 ORDER BY created_at DESC',
      [trialId]
    );
    return res.rows;
  },
};
