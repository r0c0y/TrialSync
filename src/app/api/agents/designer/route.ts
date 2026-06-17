import { NextResponse } from 'next/server';
import { runProtocolDesigner } from '@/lib/agents';

export async function POST(req: Request) {
  try {
    const { trialId, introduceConflict } = await req.json();

    if (!trialId) {
      return NextResponse.json({ error: 'Trial ID is required.' }, { status: 400 });
    }

    const protocol = await runProtocolDesigner(trialId, !!introduceConflict);
    return NextResponse.json({ success: true, protocol });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
