import { NextResponse } from 'next/server';
import { db, logAuditTrail } from '@/lib/db';
import { band } from '@/lib/band';

// ─── openFDA API Endpoints ──────────────────────────────────────────────
const FDA_LABEL_API = 'https://api.fda.gov/drug/label.json';
const FDA_EVENT_API = 'https://api.fda.gov/drug/event.json';

interface FDALabelResult {
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
    product_ndc?: string[];
    route?: string[];
    substance_name?: string[];
    application_number?: string[];
  };
  boxed_warning?: string[];
  warnings?: string[];
  contraindications?: string[];
  adverse_reactions?: string[];
  drug_interactions?: string[];
  indications_and_usage?: string[];
  dosage_and_administration?: string[];
  warnings_and_cautions?: string[];
}

interface FDAAdverseEventCount {
  term: string;
  count: number;
}

function truncateText(text: string, maxLen: number = 2000): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '\n[... truncated for brevity]';
}

function formatFDADocument(
  label: FDALabelResult,
  adverseEvents: FDAAdverseEventCount[],
  drugName: string
): string {
  const openfda = label.openfda || {};
  const sections: string[] = [];

  sections.push(`═══════════════════════════════════════════════════════════`);
  sections.push(`FDA REGULATORY COMPLIANCE DOCUMENT`);
  sections.push(`Drug: ${drugName.toUpperCase()}`);
  sections.push(`Generated: ${new Date().toISOString()}`);
  sections.push(`═══════════════════════════════════════════════════════════`);
  sections.push('');

  // Drug Identification
  sections.push(`── DRUG IDENTIFICATION ──`);
  if (openfda.brand_name?.length) sections.push(`Brand Name(s): ${openfda.brand_name.join(', ')}`);
  if (openfda.generic_name?.length) sections.push(`Generic Name(s): ${openfda.generic_name.join(', ')}`);
  if (openfda.manufacturer_name?.length) sections.push(`Manufacturer: ${openfda.manufacturer_name.join(', ')}`);
  if (openfda.route?.length) sections.push(`Route: ${openfda.route.join(', ')}`);
  if (openfda.application_number?.length) sections.push(`Application Number: ${openfda.application_number.join(', ')}`);
  if (openfda.product_ndc?.length) sections.push(`NDC: ${openfda.product_ndc.slice(0, 5).join(', ')}${openfda.product_ndc.length > 5 ? '...' : ''}`);
  sections.push('');

  // Indications
  if (label.indications_and_usage?.length) {
    sections.push(`── INDICATIONS & USAGE ──`);
    sections.push(truncateText(label.indications_and_usage.join('\n\n')));
    sections.push('');
  }

  // ⚠️ BOXED WARNING (Black Box) - The most severe FDA warning
  sections.push(`── ⚠️ BOXED WARNING (BLACK BOX) ──`);
  if (label.boxed_warning?.length) {
    sections.push(`SEVERITY: HIGHEST — FDA Black Box Warning`);
    sections.push(truncateText(label.boxed_warning.join('\n\n')));
  } else {
    sections.push('No boxed warning for this drug.');
  }
  sections.push('');

  // Contraindications
  sections.push(`── CONTRAINDICATIONS ──`);
  if (label.contraindications?.length) {
    sections.push(truncateText(label.contraindications.join('\n\n')));
  } else {
    sections.push('No contraindications listed.');
  }
  sections.push('');

  // Warnings
  sections.push(`── WARNINGS ──`);
  if (label.warnings?.length) {
    sections.push(truncateText(label.warnings.join('\n\n')));
  } else if (label.warnings_and_cautions?.length) {
    sections.push(truncateText(label.warnings_and_cautions.join('\n\n')));
  } else {
    sections.push('No warnings listed.');
  }
  sections.push('');

  // Adverse Reactions from Label
  sections.push(`── ADVERSE REACTIONS (LABEL) ──`);
  if (label.adverse_reactions?.length) {
    sections.push(truncateText(label.adverse_reactions.join('\n\n')));
  } else {
    sections.push('No adverse reactions listed in label.');
  }
  sections.push('');

  // Drug Interactions
  sections.push(`── DRUG INTERACTIONS ──`);
  if (label.drug_interactions?.length) {
    sections.push(truncateText(label.drug_interactions.join('\n\n')));
  } else {
    sections.push('No drug interactions listed.');
  }
  sections.push('');

  // Real-World Adverse Event Reports (from FAERS)
  sections.push(`── REAL-WORLD ADVERSE EVENTS (FAERS Database) ──`);
  if (adverseEvents.length > 0) {
    sections.push(`Top ${adverseEvents.length} reported adverse events from FDA Adverse Event Reporting System:`);
    sections.push('');
    for (const [i, event] of adverseEvents.entries()) {
      const bar = '█'.repeat(Math.min(Math.round(event.count / (adverseEvents[0].count / 20)), 20));
      sections.push(`  ${String(i + 1).padStart(2, ' ')}. ${event.term.padEnd(40)} ${bar} (${event.count.toLocaleString()} reports)`);
    }
  } else {
    sections.push('No adverse event data available from FAERS.');
  }
  sections.push('');

  // Dosage
  if (label.dosage_and_administration?.length) {
    sections.push(`── DOSAGE & ADMINISTRATION ──`);
    sections.push(truncateText(label.dosage_and_administration.join('\n\n'), 1500));
    sections.push('');
  }

  return sections.join('\n');
}

export async function POST(req: Request) {
  try {
    const { trialId, drugName } = await req.json();

    if (!trialId || !drugName) {
      return NextResponse.json(
        { error: 'Trial ID and drug name are required.' },
        { status: 400 }
      );
    }

    const trial = await db.getTrial(trialId);
    if (!trial) {
      return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
    }

    console.log(`[openFDA] Searching drug labels and adverse events for: "${drugName}"...`);

    // ─── 1. Query Drug Labels ───────────────────────────────────────────
    const labelSearchQuery = encodeURIComponent(
      `(openfda.brand_name:"${drugName}"+openfda.generic_name:"${drugName}")`
    );
    const labelUrl = `${FDA_LABEL_API}?search=${labelSearchQuery}&limit=3`;

    const labelRes = await fetch(labelUrl);
    let labelResults: FDALabelResult[] = [];

    if (labelRes.ok) {
      const labelData = await labelRes.json();
      labelResults = labelData.results || [];
    } else {
      // If exact match fails, try a broader search
      const broadQuery = encodeURIComponent(drugName);
      const broadUrl = `${FDA_LABEL_API}?search=${broadQuery}&limit=3`;
      const broadRes = await fetch(broadUrl);
      if (broadRes.ok) {
        const broadData = await broadRes.json();
        labelResults = broadData.results || [];
      } else {
        console.warn(`[openFDA] Drug label search returned ${broadRes.status}`);
      }
    }

    // ─── 2. Query Adverse Events (FAERS) ────────────────────────────────
    let adverseEvents: FDAAdverseEventCount[] = [];
    try {
      const aeQuery = encodeURIComponent(`patient.drug.openfda.generic_name:"${drugName}"`);
      const aeUrl = `${FDA_EVENT_API}?search=${aeQuery}&count=patient.reaction.reactionmeddrapt.exact`;

      const aeRes = await fetch(aeUrl);
      if (aeRes.ok) {
        const aeData = await aeRes.json();
        // Take top 20 adverse events
        adverseEvents = (aeData.results || []).slice(0, 20);
      } else {
        console.warn(`[openFDA] Adverse events query returned ${aeRes.status} — continuing without FAERS data.`);
      }
    } catch (aeErr) {
      console.warn('[openFDA] Error fetching adverse events, continuing:', aeErr);
    }

    // ─── 3. Process and Save Results ────────────────────────────────────
    if (labelResults.length === 0 && adverseEvents.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: `No FDA data found for drug: "${drugName}". Verify the drug name matches FDA records (brand name or generic name).`,
      });
    }

    const userEmail = 'clinical_lead@pharmacompany.com';
    const role = 'Clinical Program Lead';
    const importedDocs: {
      id: string;
      drugName: string;
      brandNames: string[];
      genericNames: string[];
      hasBoxedWarning: boolean;
      adverseEventCount: number;
    }[] = [];

    // Use the most complete label result as the primary document
    const primaryLabel = labelResults[0] || ({} as FDALabelResult);
    const brandNames = primaryLabel.openfda?.brand_name || [];
    const genericNames = primaryLabel.openfda?.generic_name || [];

    const docId = `DOC-FDA-${drugName.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}`;
    const hash = `SHA-FDA-${drugName.replace(/\s+/g, '-')}-${Date.now()}`;

    const documentContent = formatFDADocument(primaryLabel, adverseEvents, drugName);

    // Save to database
    const createdDoc = await db.createDocument(
      docId,
      trialId,
      `FDA Compliance: ${(brandNames[0] || genericNames[0] || drugName).substring(0, 60)} — Safety & Regulatory Profile`,
      documentContent,
      'FDA_COMPLIANCE',
      hash
    );

    importedDocs.push({
      id: createdDoc.id || docId,
      drugName,
      brandNames,
      genericNames,
      hasBoxedWarning: !!(primaryLabel.boxed_warning && primaryLabel.boxed_warning.length > 0),
      adverseEventCount: adverseEvents.length,
    });

    // If there are additional label results (different formulations), save them too
    for (let i = 1; i < labelResults.length; i++) {
      const label = labelResults[i];
      const altBrand = label.openfda?.brand_name?.[0] || `${drugName}-formulation-${i + 1}`;
      const altDocId = `DOC-FDA-${altBrand.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}-${i}`;
      const altHash = `SHA-FDA-${altBrand.replace(/\s+/g, '-')}-${Date.now()}-${i}`;
      const altContent = formatFDADocument(label, [], drugName);

      await db.createDocument(
        altDocId,
        trialId,
        `FDA Compliance: ${altBrand.substring(0, 60)} — Additional Formulation`,
        altContent,
        'FDA_COMPLIANCE',
        altHash
      );

      importedDocs.push({
        id: altDocId,
        drugName,
        brandNames: label.openfda?.brand_name || [],
        genericNames: label.openfda?.generic_name || [],
        hasBoxedWarning: !!(label.boxed_warning && label.boxed_warning.length > 0),
        adverseEventCount: 0,
      });
    }

    // Log to Audit Trail
    await logAuditTrail(
      trialId,
      'DOCUMENT_INGEST',
      userEmail,
      role,
      'FDA Regulatory Database',
      `Imported openFDA regulatory data for "${drugName}": ${importedDocs.length} label document(s), ${adverseEvents.length} adverse event categories from FAERS. Boxed warning: ${importedDocs.some(d => d.hasBoxedWarning) ? 'YES' : 'NO'}`,
      'openFDA Drug Label + FAERS Adverse Event integration fetch successful.'
    );

    // Notify Band room
    try {
      if (trial.band_room_id) {
        const warningAlert = importedDocs.some(d => d.hasBoxedWarning)
          ? ' ⚠️ BLACK BOX WARNING DETECTED.'
          : '';
        await band.sendMessage(
          trialId,
          trial.band_room_id,
          'openFDA Integration',
          `Imported FDA regulatory profile for "${drugName}": ${importedDocs.length} label document(s), top ${adverseEvents.length} adverse events from FAERS.${warningAlert}`
        );
      }
    } catch (err) {
      console.error('Error sending openFDA update to Band:', err);
    }

    return NextResponse.json({
      success: true,
      count: importedDocs.length,
      drugName,
      adverseEventCategories: adverseEvents.length,
      topAdverseEvents: adverseEvents.slice(0, 5).map(ae => ({
        reaction: ae.term,
        reports: ae.count,
      })),
      documents: importedDocs,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[openFDA] Route error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
