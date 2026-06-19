import { NextResponse } from 'next/server';
import { db, logAuditTrail } from '@/lib/db';

export async function GET() {
  try {
    const trials = await db.getTrials();
    // Enrich each trial with conflict count and recent audit trail for dashboard activity feed
    const enriched = await Promise.all(trials.map(async (trial: any) => {
      const [conflicts, auditTrail] = await Promise.all([
        db.getConflicts(trial.id),
        db.getAuditTrail(trial.id).catch(() => []),
      ]);
      // Return latest 5 events per trial for the activity sidebar
      const recentEvents = [...auditTrail]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      return {
        ...trial,
        individual_conflict_count: conflicts.length,
        auditTrail: recentEvents,
      };
    }));
    return NextResponse.json(enriched);
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
