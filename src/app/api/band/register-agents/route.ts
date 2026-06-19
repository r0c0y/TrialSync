import { NextResponse } from 'next/server';
import { bandClient } from '@/lib/band-client';

interface RegistrationResult {
  name: string;
  agentId: string;
  apiKey: string;
  error?: string;
}

export async function POST() {
  if (!bandClient.isConfigured()) {
    return NextResponse.json({ error: 'Band User Token not configured' }, { status: 400 });
  }

  const agents = [
    { name: 'Literature Scout', description: 'Analyzes medical literature and extracts safety signals, efficacy endpoints, and population criteria from PubMed, ClinicalTrials.gov, and uploaded documents.' },
    { name: 'Protocol Designer', description: 'Drafts clinical trial protocols with inclusion/exclusion criteria, endpoint selection, and study design aligned to evidence briefs.' },
    { name: 'Regulatory Auditor', description: 'Reviews protocol and SAP against evidence safety thresholds, compliance requirements, and statistical validity to surface conflicts.' },
  ];

  const results: RegistrationResult[] = [];

  for (const agent of agents) {
    const { data, error } = await bandClient.registerAgent(agent.name, agent.description);
    if (error) {
      results.push({ name: agent.name, agentId: '', apiKey: '', error });
    } else if (data) {
      results.push({
        name: agent.name,
        agentId: data.data.agent.id,
        apiKey: data.data.credentials.api_key,
      });
    }
  }

  const successCount = results.filter(r => !r.error).length;
  const failCount = results.filter(r => r.error).length;

  // Persist keys to local agent_keys.json
  if (successCount > 0) {
    try {
      const fs = require('fs');
      const path = require('path');
      const keysFilePath = path.join(process.cwd(), 'agent_keys.json');
      let existingKeys: Record<string, string> = {};
      if (fs.existsSync(keysFilePath)) {
        existingKeys = JSON.parse(fs.readFileSync(keysFilePath, 'utf8'));
      }
      const newKeys: Record<string, string> = { ...existingKeys };
      results.forEach(r => {
        if (r.apiKey) {
          newKeys[r.name] = r.apiKey;
        }
      });
      fs.writeFileSync(keysFilePath, JSON.stringify(newKeys, null, 2));
    } catch (fsErr) {
      console.error('Failed to write agent_keys.json:', fsErr);
    }
  }

  return NextResponse.json({
    success: failCount === 0,
    message: `Registered ${successCount}/${agents.length} agents${failCount > 0 ? ` (${failCount} failed)` : ''}. Keys persisted in agent_keys.json.`,
    agents: results,
  });
}

export async function GET() {
  if (!bandClient.isConfigured()) {
    return NextResponse.json({ error: 'Band User Token not configured' }, { status: 400 });
  }

  const { data, error } = await bandClient.listMyAgents();
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ agents: data?.data || [] });
}
