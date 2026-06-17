import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runLiteratureScout } from '@/lib/agents';

export async function POST(req: Request) {
  try {
    const { trialId } = await req.json();

    if (!trialId) {
      return NextResponse.json({ error: 'Trial ID is required.' }, { status: 400 });
    }

    const docs = await db.getDocuments(trialId);
    const literatureDocs = docs.filter((d) => d.type === 'LITERATURE');

    if (literatureDocs.length === 0) {
      return NextResponse.json(
        { error: 'No literature documents found. Please upload at least one paper.' },
        { status: 400 }
      );
    }

    const contents = literatureDocs.map((d) => d.content);
    const evidenceBrief = await runLiteratureScout(trialId, contents);

    return NextResponse.json({ success: true, evidenceBrief });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
