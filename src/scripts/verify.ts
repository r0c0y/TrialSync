import { initDb, db } from '../lib/db';
import { runLiteratureScout, runProtocolDesigner, runStatisticalAnalyst, runRegulatoryComplianceReview } from '../lib/agents';

async function main() {
  console.log('🧪 Starting TrialSync Multi-Agent Integration Tests...');

  // Initialize DB
  await initDb();

  const trialId = `TEST-TRL-${Date.now()}`;
  console.log(`\n1. Creating test trial project: ${trialId}`);
  await db.createTrial(trialId, 'Test Crohn\'s Study', 'Crohn\'s Disease', 'INITIAL');

  const trial = await db.getTrial(trialId);
  if (!trial) throw new Error('Failed to retrieve created trial.');
  console.log('✓ Trial project created successfully.');

  // Test Band room linking database actions
  console.log('\n1.5. Testing Band.ai room linking operations...');
  const testRoomId = 'chat_room_mock_12345';
  await db.updateTrialBandRoom(trialId, testRoomId);
  const trialWithRoom = await db.getTrial(trialId);
  if (trialWithRoom.band_room_id === testRoomId) {
    console.log('✓ Successfully linked and persisted Band room ID.');
  } else {
    throw new Error('Failed to persist Band room ID.');
  }

  await db.updateTrialBandRoom(trialId, null);
  const trialWithoutRoom = await db.getTrial(trialId);
  if (trialWithoutRoom.band_room_id === null || trialWithoutRoom.band_room_id === undefined) {
    console.log('✓ Successfully unlinked Band room ID.');
  } else {
    throw new Error('Failed to clear Band room ID.');
  }

  // Restore the testRoomId for agent run notifications test
  await db.updateTrialBandRoom(trialId, testRoomId);

  // Check state lock on Regulatory Agent before files/documents are ready
  console.log('\n2. Verifying Regulatory Agent state locks...');
  const initialReview = await runRegulatoryComplianceReview(trialId);
  if (initialReview.status === 'BLOCKED') {
    console.log('✓ Regulatory Agent successfully blocked execution (State Lock Active).');
  } else {
    throw new Error('Regulatory Agent did not enforce state lock.');
  }

  // Run Literature Scout
  console.log('\n3. Running Literature Scout Agent...');
  const papers = [
    'Smith et al. 2023: Zylastin-B showed hepatotoxicity (3%) in Crohn patients with baseline ALT > 40 U/L. Contraindicated for ALT > 40.',
    'Doe et al. 2024: Zylastin-B clinical remission was significant at 12 weeks with 65% response rate. 8-week endpoint is noisy.',
    'Johnson et al. 2025: Borderline renal safety signal in eGFR < 60 mL/min/1.73m2. Exclude eGFR < 60.'
  ];
  const brief = await runLiteratureScout(trialId, papers);
  if (brief && brief.safety_signals.length > 0) {
    console.log(`✓ Scout complete. Safety signals extracted: ${brief.safety_signals.length}`);
  } else {
    throw new Error('Literature Scout failed to extract signals.');
  }

  // Run Protocol Designer with Conflict
  console.log('\n4. Running Protocol Designer Agent (Simulating Design Error)...');
  const protocol = await runProtocolDesigner(trialId, true); // introduceConflict: true
  if (protocol && protocol.exclusion_criteria.length > 0) {
    console.log(`✓ Protocol drafted with title: "${protocol.title}"`);
    console.log(`  Exclusions: ${JSON.stringify(protocol.exclusion_criteria)}`);
  } else {
    throw new Error('Protocol Designer failed.');
  }

  // Run Statistical Analyst
  console.log('\n5. Running Statistical Analyst Agent...');
  const sap = await runStatisticalAnalyst(trialId);
  if (sap && sap.power_calculation) {
    console.log(`✓ SAP drafted. Sample size calculated: ${sap.power_calculation.calculated_sample_size}`);
    console.log(`  Validation note: ${sap.endpoint_validation}`);
  } else {
    throw new Error('Statistical Agent failed.');
  }

  // Run Regulatory Reviewer (Expect Conflicts)
  console.log('\n6. Running Regulatory Compliance Agent Consistency Check...');
  const reviewResult = await runRegulatoryComplianceReview(trialId);
  console.log(`✓ Regulatory Review Status: ${reviewResult.status}`);
  if (reviewResult.conflicts && reviewResult.conflicts.length > 0) {
    console.log(`✓ Successfully detected ${reviewResult.conflicts.length} consistency conflicts:`);
    reviewResult.conflicts.forEach((c: any, index: number) => {
      console.log(`  [${index + 1}] Mismatch: ${c.position_a} VS ${c.position_b}`);
      console.log(`      Rec: ${c.recommendation}`);
    });
  } else {
    throw new Error('Regulatory review failed to detect simulated conflicts.');
  }

  console.log('\n🎉 ALL TrialSync multi-agent integration tests PASSED successfully!');
}

main().catch((err) => {
  console.error('\n❌ TrialSync Integration Tests FAILED:', err);
  process.exit(1);
});
