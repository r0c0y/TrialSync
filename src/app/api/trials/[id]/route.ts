import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';
import { band } from '@/lib/band';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: trialId } = await params;
    const trial = await db.getTrial(trialId);

    if (!trial) {
      return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
    }

    const documents = await db.getDocuments(trialId);
    const evidenceBrief = await db.getEvidenceBrief(trialId);
    const protocol = await db.getProtocol(trialId);
    const sap = await db.getSap(trialId);
    const conflicts = await db.getConflicts(trialId);
    const decisionLogs = await db.getDecisionLogs(trialId);
    const auditTrail = await db.getAuditTrail(trialId);
    const agentProgress = await db.getAgentProgress(trialId);
    const cacheStats = await cache.stats();
    const wsUrl = band.getWebSocketUrl();

    return NextResponse.json({
      trial,
      documents,
      evidenceBrief,
      protocol,
      sap,
      conflicts,
      decisionLogs,
      auditTrail,
      agentProgress,
      cacheStats,
      wsUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
