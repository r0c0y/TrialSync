import { NextResponse } from 'next/server';
import { runRegulatoryComplianceReview } from '@/lib/agents';

export async function POST(req: Request) {
  try {
    const { trialId } = await req.json();

    if (!trialId) {
      return NextResponse.json({ error: 'Trial ID is required.' }, { status: 400 });
    }

    const result = await runRegulatoryComplianceReview(trialId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
