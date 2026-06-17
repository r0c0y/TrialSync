import { NextResponse } from 'next/server';
import { runStatisticalAnalyst } from '@/lib/agents';

export async function POST(req: Request) {
  try {
    const { trialId } = await req.json();

    if (!trialId) {
      return NextResponse.json({ error: 'Trial ID is required.' }, { status: 400 });
    }

    const sap = await runStatisticalAnalyst(trialId);
    return NextResponse.json({ success: true, sap });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
