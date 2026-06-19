import { NextResponse } from 'next/server';
import { db, logAuditTrail } from '@/lib/db';
import { runRegulatoryComplianceReview } from '@/lib/agents';
import { band } from '@/lib/band';

export async function POST(req: Request) {
  try {
    const { trialId, type, sectionsJson, contentJson } = await req.json();

    if (!trialId || !type) {
      return NextResponse.json({ error: 'Trial ID and document type are required.' }, { status: 400 });
    }

    const userEmail = 'clinical_lead@pharmacompany.com';
    const role = 'Clinical Program Lead';

    let version = '1.0';
    let docId = '';
    let changeDetails = '';

    if (type === 'PROTOCOL') {
      if (!sectionsJson) {
        return NextResponse.json({ error: 'Protocol sectionsJson is required.' }, { status: 400 });
      }

      const protocolRecord = await db.getProtocol(trialId);
      if (protocolRecord) {
        version = (parseFloat(protocolRecord.version) + 0.1).toFixed(1);
      }

      docId = `DOC-PRT-${Date.now()}`;
      await db.createDocument(
        docId,
        trialId,
        `Protocol Draft v${version}`,
        `Manual modification by Lead Clinician: Title: "${sectionsJson.title}". Exclusions updated.`,
        'PROTOCOL',
        `HASH-${Date.now()}`
      );

      await db.saveProtocol(`PRT-${Date.now()}`, trialId, docId, sectionsJson, version);
      changeDetails = `Manual protocol revision v${version} saved by Lead Clinician.`;

    } else if (type === 'SAP') {
      if (!contentJson) {
        return NextResponse.json({ error: 'SAP contentJson is required.' }, { status: 400 });
      }

      const sapRecord = await db.getSap(trialId);
      if (sapRecord) {
        version = (parseFloat(sapRecord.version) + 0.1).toFixed(1);
      }

      docId = `DOC-SAP-${Date.now()}`;
      await db.createDocument(
        docId,
        trialId,
        `Statistical Analysis Plan v${version}`,
        `Manual modification by Lead Biostatistician.`,
        'SAP',
        `HASH-SAP-${Date.now()}`
      );

      await db.saveSap(`SAP-${Date.now()}`, trialId, docId, contentJson, version);
      changeDetails = `Manual SAP revision v${version} saved by Lead Biostatistician.`;
    } else {
      return NextResponse.json({ error: 'Invalid document type. Must be PROTOCOL or SAP.' }, { status: 400 });
    }

    // 1. Create Decision Log for this manual change
    const decId = `DEC-${Date.now()}`;
    await db.createDecisionLog(
      decId,
      trialId,
      `Manual Document Update: ${type}`,
      'Clinician manual modification and override',
      'Refining clinical protocol parameters for study optimization.',
      changeDetails,
      userEmail
    );

    // 2. Log to Audit Trail
    await logAuditTrail(
      trialId,
      'DOCUMENT_UPDATE',
      userEmail,
      role,
      type === 'PROTOCOL' ? 'Protocol Draft' : 'Statistical Analysis Plan',
      changeDetails,
      'Manual edit saved.'
    );

    // 3. Send update to Band room
    try {
      const trial = await db.getTrial(trialId);
      if (trial && trial.band_room_id) {
        await band.sendMessage(
          trialId,
          trial.band_room_id,
          'Clinical Lead',
          `Manually updated ${type} document to version ${version}. Details: ${changeDetails}`
        );
      }
    } catch (err) {
      console.error('Error sending manual update message to Band:', err);
    }

    // 4. Automatically re-run Regulatory Compliance Review Auditor to update conflicts
    console.log(`[Clinician Workspace] Re-running Regulatory Auditor check for trial ${trialId}...`);
    const reviewResult = await runRegulatoryComplianceReview(trialId);

    return NextResponse.json({
      success: true,
      version,
      changeDetails,
      reviewStatus: reviewResult.status,
      conflicts: reviewResult.conflicts
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
