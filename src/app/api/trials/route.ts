import { NextResponse } from 'next/server';
import { db, logAuditTrail } from '@/lib/db';

export async function GET() {
  try {
    const trials = await db.getTrials();
    return NextResponse.json(trials);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, indication } = body;

    if (!name || !indication) {
      return NextResponse.json({ error: 'Name and Indication are required.' }, { status: 400 });
    }

    const id = `TRL-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const trial = await db.createTrial(id, name, indication, 'INITIAL');

    await logAuditTrail(
      id,
      'TRIAL_CREATE',
      'clinical_lead@pharmacompany.com',
      'Clinical Program Lead',
      'Trial Record',
      `Created new trial: "${name}" for indication: "${indication}".`,
      'Initiated trial protocol design project.'
    );

    return NextResponse.json(trial);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
