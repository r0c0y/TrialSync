import { NextResponse } from 'next/server';
import { db, logAuditTrail } from '@/lib/db';
import { band } from '@/lib/band';

// ─── ClinicalTrials.gov API v2 ─────────────────────────────────────────────
const CT_API_BASE = 'https://clinicaltrials.gov/api/v2/studies';

interface CTStudy {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
      officialTitle?: string;
      organization?: { fullName?: string };
    };
    statusModule?: {
      overallStatus?: string;
      startDateStruct?: { date?: string };
      completionDateStruct?: { date?: string };
    };
    designModule?: {
      studyType?: string;
      phases?: string[];
      designInfo?: {
        allocation?: string;
        interventionModel?: string;
        primaryPurpose?: string;
        maskingInfo?: { masking?: string };
      };
      enrollmentInfo?: { count?: number; type?: string };
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
      sex?: string;
      minimumAge?: string;
      maximumAge?: string;
      healthyVolunteers?: string;
    };
    outcomesModule?: {
      primaryOutcomes?: Array<{
        measure?: string;
        description?: string;
        timeFrame?: string;
      }>;
      secondaryOutcomes?: Array<{
        measure?: string;
        description?: string;
        timeFrame?: string;
      }>;
    };
    armsInterventionsModule?: {
      armGroups?: Array<{
        label?: string;
        type?: string;
        description?: string;
      }>;
      interventions?: Array<{
        type?: string;
        name?: string;
        description?: string;
      }>;
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: { name?: string; class?: string };
    };
  };
}

function formatStudyDocument(study: CTStudy): string {
  const proto = study.protocolSection;
  if (!proto) return 'No protocol section available.';

  const id = proto.identificationModule;
  const status = proto.statusModule;
  const design = proto.designModule;
  const eligibility = proto.eligibilityModule;
  const outcomes = proto.outcomesModule;
  const arms = proto.armsInterventionsModule;
  const sponsor = proto.sponsorCollaboratorsModule;

  const sections: string[] = [];

  // Header
  sections.push(`═══════════════════════════════════════════════════════════`);
  sections.push(`CLINICAL TRIAL RECORD: ${id?.nctId || 'N/A'}`);
  sections.push(`═══════════════════════════════════════════════════════════`);
  sections.push('');

  // Identification
  sections.push(`TITLE: ${id?.briefTitle || 'N/A'}`);
  if (id?.officialTitle) sections.push(`OFFICIAL TITLE: ${id.officialTitle}`);
  sections.push(`NCT ID: ${id?.nctId || 'N/A'}`);
  if (sponsor?.leadSponsor?.name) sections.push(`SPONSOR: ${sponsor.leadSponsor.name} (${sponsor.leadSponsor.class || 'N/A'})`);
  sections.push('');

  // Status
  sections.push(`── STATUS ──`);
  sections.push(`Overall Status: ${status?.overallStatus || 'N/A'}`);
  if (status?.startDateStruct?.date) sections.push(`Start Date: ${status.startDateStruct.date}`);
  if (status?.completionDateStruct?.date) sections.push(`Completion Date: ${status.completionDateStruct.date}`);
  sections.push('');

  // Study Design
  sections.push(`── STUDY DESIGN ──`);
  if (design?.studyType) sections.push(`Study Type: ${design.studyType}`);
  if (design?.phases && design.phases.length > 0) sections.push(`Phase: ${design.phases.join(', ')}`);
  if (design?.designInfo) {
    const di = design.designInfo;
    if (di.allocation) sections.push(`Allocation: ${di.allocation}`);
    if (di.interventionModel) sections.push(`Intervention Model: ${di.interventionModel}`);
    if (di.primaryPurpose) sections.push(`Primary Purpose: ${di.primaryPurpose}`);
    if (di.maskingInfo?.masking) sections.push(`Masking: ${di.maskingInfo.masking}`);
  }
  if (design?.enrollmentInfo) {
    sections.push(`Enrollment: ${design.enrollmentInfo.count || 'N/A'} (${design.enrollmentInfo.type || 'N/A'})`);
  }
  sections.push('');

  // Eligibility Criteria
  sections.push(`── ELIGIBILITY CRITERIA ──`);
  if (eligibility) {
    if (eligibility.sex) sections.push(`Sex: ${eligibility.sex}`);
    if (eligibility.minimumAge) sections.push(`Minimum Age: ${eligibility.minimumAge}`);
    if (eligibility.maximumAge) sections.push(`Maximum Age: ${eligibility.maximumAge}`);
    if (eligibility.healthyVolunteers) sections.push(`Healthy Volunteers: ${eligibility.healthyVolunteers}`);
    sections.push('');
    if (eligibility.eligibilityCriteria) {
      sections.push(eligibility.eligibilityCriteria);
    }
  } else {
    sections.push('No eligibility criteria available.');
  }
  sections.push('');

  // Outcomes
  sections.push(`── PRIMARY ENDPOINTS ──`);
  if (outcomes?.primaryOutcomes && outcomes.primaryOutcomes.length > 0) {
    for (const [i, outcome] of outcomes.primaryOutcomes.entries()) {
      sections.push(`  ${i + 1}. ${outcome.measure || 'N/A'}`);
      if (outcome.description) sections.push(`     Description: ${outcome.description}`);
      if (outcome.timeFrame) sections.push(`     Time Frame: ${outcome.timeFrame}`);
    }
  } else {
    sections.push('  No primary outcomes specified.');
  }
  sections.push('');

  sections.push(`── SECONDARY ENDPOINTS ──`);
  if (outcomes?.secondaryOutcomes && outcomes.secondaryOutcomes.length > 0) {
    for (const [i, outcome] of outcomes.secondaryOutcomes.entries()) {
      sections.push(`  ${i + 1}. ${outcome.measure || 'N/A'}`);
      if (outcome.description) sections.push(`     Description: ${outcome.description}`);
      if (outcome.timeFrame) sections.push(`     Time Frame: ${outcome.timeFrame}`);
    }
  } else {
    sections.push('  No secondary outcomes specified.');
  }
  sections.push('');

  // Arms & Interventions
  sections.push(`── ARMS & INTERVENTIONS ──`);
  if (arms?.armGroups && arms.armGroups.length > 0) {
    sections.push('  Arms:');
    for (const arm of arms.armGroups) {
      sections.push(`    • ${arm.label || 'N/A'} (${arm.type || 'N/A'}): ${arm.description || 'No description'}`);
    }
  }
  if (arms?.interventions && arms.interventions.length > 0) {
    sections.push('  Interventions:');
    for (const intv of arms.interventions) {
      sections.push(`    • [${intv.type || 'N/A'}] ${intv.name || 'N/A'}: ${intv.description || 'No description'}`);
    }
  }
  if (!arms?.armGroups?.length && !arms?.interventions?.length) {
    sections.push('  No arms or interventions specified.');
  }

  return sections.join('\n');
}

export async function POST(req: Request) {
  try {
    const { trialId, condition, intervention } = await req.json();

    if (!trialId || !condition) {
      return NextResponse.json(
        { error: 'Trial ID and condition are required.' },
        { status: 400 }
      );
    }

    const trial = await db.getTrial(trialId);
    if (!trial) {
      return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
    }

    console.log(`[ClinicalTrials.gov] Searching for condition="${condition}"${intervention ? `, intervention="${intervention}"` : ''}...`);

    // Build query params for ClinicalTrials.gov API v2
    const queryParams = new URLSearchParams({
      'query.cond': condition,
      'pageSize': '5',
    });

    if (intervention) {
      queryParams.set('query.intr', intervention);
    }

    const apiUrl = `${CT_API_BASE}?${queryParams.toString()}`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`ClinicalTrials.gov API returned ${apiRes.status}: ${errText}`);
    }

    const apiData = await apiRes.json();
    const studies: CTStudy[] = apiData.studies || [];

    if (studies.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: `No clinical trials found for condition: "${condition}"${intervention ? ` with intervention: "${intervention}"` : ''}.`,
      });
    }

    console.log(`[ClinicalTrials.gov] Found ${studies.length} studies. Processing...`);

    const userEmail = 'clinical_lead@pharmacompany.com';
    const role = 'Clinical Program Lead';
    const importedDocs: {
      id: string;
      nctId: string;
      title: string;
      status: string;
      phase: string;
    }[] = [];

    for (const study of studies) {
      try {
        const proto = study.protocolSection;
        const nctId = proto?.identificationModule?.nctId || `UNKNOWN-${Date.now()}`;
        const briefTitle = proto?.identificationModule?.briefTitle || 'Untitled Study';
        const overallStatus = proto?.statusModule?.overallStatus || 'Unknown';
        const phases = proto?.designModule?.phases?.join(', ') || 'N/A';

        const docId = `DOC-CT-${nctId}`;
        const hash = `SHA-CT-${nctId}-${Date.now()}`;
        const docContent = formatStudyDocument(study);

        // Save to database
        const createdDoc = await db.createDocument(
          docId,
          trialId,
          `ClinicalTrial: ${briefTitle.substring(0, 70)}${briefTitle.length > 70 ? '...' : ''} (${nctId})`,
          docContent,
          'CLINICAL_TRIAL_TEMPLATE',
          hash
        );

        importedDocs.push({
          id: createdDoc.id || docId,
          nctId,
          title: briefTitle,
          status: overallStatus,
          phase: phases,
        });

        // Log to Audit Trail
        await logAuditTrail(
          trialId,
          'DOCUMENT_INGEST',
          userEmail,
          role,
          'Clinical Trial Registry',
          `Imported ClinicalTrials.gov study: "${briefTitle}" (${nctId}) — Status: ${overallStatus}, Phase: ${phases}`,
          'ClinicalTrials.gov API v2 integration fetch successful.'
        );

      } catch (err: unknown) {
        const nctId = study.protocolSection?.identificationModule?.nctId || 'unknown';
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[ClinicalTrials.gov] Failed to process study ${nctId}:`, message);
      }
    }

    // Notify Band room
    try {
      if (trial.band_room_id) {
        await band.sendMessage(
          trialId,
          trial.band_room_id,
          'ClinicalTrials.gov Integration',
          `Imported ${importedDocs.length} clinical trial records for condition "${condition}"${intervention ? ` (intervention: ${intervention})` : ''}. Studies: ${importedDocs.map(d => d.nctId).join(', ')}`
        );
      }
    } catch (err) {
      console.error('Error sending ClinicalTrials.gov update to Band:', err);
    }

    return NextResponse.json({
      success: true,
      count: importedDocs.length,
      condition,
      intervention: intervention || null,
      studies: importedDocs,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ClinicalTrials.gov] Route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
