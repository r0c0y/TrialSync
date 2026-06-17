import { NextResponse } from 'next/server';
import { db, logAuditTrail } from '@/lib/db';
import { band } from '@/lib/band';

export async function POST(req: Request) {
  try {
    const { conflictId, trialId, resolutionOption, customRationale } = await req.json();

    if (!conflictId || !trialId || !resolutionOption) {
      return NextResponse.json({ error: 'Conflict ID, Trial ID, and Resolution Option are required.' }, { status: 400 });
    }

    const conflicts = await db.getConflicts(trialId);
    const conflict = conflicts.find((c) => c.id === conflictId);

    if (!conflict) {
      return NextResponse.json({ error: 'Conflict not found.' }, { status: 404 });
    }

    const userEmail = 'clinical_lead@pharmacompany.com';
    const role = 'Clinical Program Lead';

    // 1. Mark conflict as resolved in database
    await db.resolveConflict(conflictId, userEmail);

    // 2. Perform updates to Protocol or SAP document based on resolution
    let changeDetails = '';
    const protocolRecord = await db.getProtocol(trialId);
    const sapRecord = await db.getSap(trialId);

    if (resolutionOption === 'ACCEPT_RECOMMENDATION') {
      if (conflictId.includes('ALT') && protocolRecord) {
        // Resolve ALT: modify baseline ALT in exclusion criteria
        const protocol = protocolRecord.sections_json;
        protocol.exclusion_criteria = protocol.exclusion_criteria.map((c: string) => {
          if (c.toLowerCase().includes('alt')) {
            return 'Baseline ALT ≤ 40 U/L (per Evidence Brief safety signal)';
          }
          return c;
        });
        
        const docId = `DOC-PRT-${Date.now()}`;
        const version = (parseFloat(protocolRecord.version) + 0.1).toFixed(1);
        await db.createDocument(
          docId,
          trialId,
          `Protocol Draft v${version}`,
          `Updated Exclusion: Baseline ALT ≤ 40 U/L. Rationale: Resolved Safety Conflict.`,
          'PROTOCOL',
          `HASH-${Date.now()}`
        );
        await db.saveProtocol(`PRT-${Date.now()}`, trialId, docId, protocol, version);
        changeDetails = `Updated inclusion/exclusion criteria for ALT: Baseline ALT ≤ 40 U/L (Protocol v${version}).`;
      } else if (conflictId.includes('RENAL') && protocolRecord) {
        // Resolve Renal: update eGFR limit to 60
        const protocol = protocolRecord.sections_json;
        protocol.exclusion_criteria = protocol.exclusion_criteria.map((c: string) => {
          if (c.toLowerCase().includes('egfr') || c.toLowerCase().includes('renal')) {
            return 'Renal impairment defined as eGFR < 60 mL/min/1.73m²';
          }
          return c;
        });
        const docId = `DOC-PRT-${Date.now()}`;
        const version = (parseFloat(protocolRecord.version) + 0.1).toFixed(1);
        await db.createDocument(
          docId,
          trialId,
          `Protocol Draft v${version}`,
          `Updated Exclusion: Renal impairment defined as eGFR < 60. Rationale: Resolved Safety Conflict.`,
          'PROTOCOL',
          `HASH-${Date.now()}`
        );
        await db.saveProtocol(`PRT-${Date.now()}`, trialId, docId, protocol, version);
        changeDetails = `Updated inclusion/exclusion criteria for eGFR: eGFR < 60 mL/min/1.73m² (Protocol v${version}).`;
      } else if (conflictId.includes('ENDPOINT') && protocolRecord) {
        // Resolve Primary Endpoint: update from 8 weeks to 12 weeks
        const protocol = protocolRecord.sections_json;
        protocol.primary_endpoint = 'Proportion of subjects in clinical remission at Week 12';
        protocol.assumptions = protocol.assumptions.map((a: string) => {
          if (a.toLowerCase().includes('8-week')) {
            return 'Assumed 12-week endpoint provides optimal statistical power based on literature.';
          }
          return a;
        });
        const docId = `DOC-PRT-${Date.now()}`;
        const version = (parseFloat(protocolRecord.version) + 0.1).toFixed(1);
        await db.createDocument(
          docId,
          trialId,
          `Protocol Draft v${version}`,
          `Updated Primary Endpoint to Week 12. Rationale: Resolved Efficacy Conflict.`,
          'PROTOCOL',
          `HASH-${Date.now()}`
        );
        await db.saveProtocol(`PRT-${Date.now()}`, trialId, docId, protocol, version);
        changeDetails = `Updated Primary Endpoint: Proportion of subjects in clinical remission at Week 12 (Protocol v${version}).`;

        // If SAP exists and is outdated, update SAP as well
        if (sapRecord) {
          const sap = sapRecord.content_json;
          sap.endpoint_validation = 'Efficacy endpoint validated at Week 12. Sample size calculations powered at 80%.';
          const sapDocId = `DOC-SAP-${Date.now()}`;
          const sapVersion = (parseFloat(sapRecord.version) + 0.1).toFixed(1);
          await db.createDocument(
            sapDocId,
            trialId,
            `Statistical Analysis Plan v${sapVersion}`,
            `Validated primary endpoint at Week 12.`,
            'SAP',
            `HASH-SAP-${Date.now()}`
          );
          await db.saveSap(`SAP-${Date.now()}`, trialId, sapDocId, sap, sapVersion);
          changeDetails += ` Also updated Statistical Analysis Plan to v${sapVersion} to align with Week 12 endpoint.`;
        }
      }
    } else {
      changeDetails = `Ignored conflict with rationale: "${customRationale || 'Standard clinical justification.'}"`;
    }

    // 3. Create Decision Log
    const decId = `DEC-${Date.now()}`;
    await db.createDecisionLog(
      decId,
      trialId,
      `Conflict Resolution: ${conflict.type}`,
      resolutionOption === 'ACCEPT_RECOMMENDATION' ? 'Accept recommended modifications' : 'Maintain current document language',
      customRationale || 'Aligning protocol with clinical trial evidence signals.',
      changeDetails,
      userEmail
    );

    // 4. Log to Audit Trail
    await logAuditTrail(
      trialId,
      'CONFLICT_RESOLVE',
      userEmail,
      role,
      'Conflict / Decision',
      `Resolved conflict ID "${conflictId}". Details: ${changeDetails}`,
      customRationale || 'Audit compliance check resolved.'
    );

    // Send update to Band room
    try {
      const trial = await db.getTrial(trialId);
      if (trial && trial.band_room_id) {
        await band.sendMessage(
          trialId,
          trial.band_room_id,
          'Decision Orchestrator',
          `Resolved conflict: ${conflict.type} (${conflictId}). Choice: ${resolutionOption === 'ACCEPT_RECOMMENDATION' ? 'Accept Recommendation' : 'Maintain Design'}. Rationale: "${customRationale || 'Standard clinical justification.'}"`
        );
      }
    } catch (err) {
      console.error('Error sending resolve message to Band:', err);
    }

    // 5. Evaluate if all conflicts for the trial are now resolved
    const activeConflicts = await db.getConflicts(trialId);
    const openConflicts = activeConflicts.filter((c) => c.status === 'OPEN');

    if (openConflicts.length === 0) {
      await db.updateTrialStatus(trialId, 'APPROVED_REGULATORY');
      await logAuditTrail(
        trialId,
        'STATUS_UPDATE',
        'system@trialsync.com',
        'Decision Orchestrator',
        'Trial Status',
        'All conflicts resolved. Trial status updated to: APPROVED_REGULATORY.',
        'Final regulatory approval clearance.'
      );

      // Send status change to Band room
      try {
        const trial = await db.getTrial(trialId);
        if (trial && trial.band_room_id) {
          await band.sendMessage(
            trialId,
            trial.band_room_id,
            'Decision Orchestrator',
            '🎉 SUCCESS: All open conflicts resolved. Trial status has been updated to APPROVED_REGULATORY. Protocol v1.x cleared for FDA IND submission!'
          );
        }
      } catch (err) {
        console.error('Error sending all-clear message to Band:', err);
      }
    }

    return NextResponse.json({ success: true, changeDetails });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
