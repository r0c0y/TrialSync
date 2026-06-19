import { NextResponse } from 'next/server';
import { bandClient } from '@/lib/band-client';
import fs from 'fs';
import path from 'path';

function getAgentKeys(): Record<string, string | undefined> {
  const keys: Record<string, string | undefined> = {
    'Literature Scout': process.env.BAND_AGENT_SCOUT_KEY,
    'Protocol Designer': process.env.BAND_AGENT_DESIGNER_KEY,
    'Regulatory Auditor': process.env.BAND_AGENT_AUDITOR_KEY,
  };

  try {
    const keysFilePath = path.join(process.cwd(), 'agent_keys.json');
    if (fs.existsSync(keysFilePath)) {
      const persisted = JSON.parse(fs.readFileSync(keysFilePath, 'utf8'));
      Object.assign(keys, persisted);
    }
  } catch (err) {
    console.error('Error reading agent_keys.json:', err);
  }

  return keys;
}

const AGENT_NAMES: Record<string, string> = {
  'Literature Scout': 'Literature Scout',
  'Protocol Designer': 'Protocol Designer',
  'Statistical Analyst': 'Statistical Analyst',
  'Regulatory Auditor': 'Regulatory Auditor',
  'Decision Orchestrator': 'Decision Orchestrator',
};

export async function POST(req: Request) {
  try {
    const { trialId, roomId, agentName, eventType, content, recipients, metadata } = await req.json();

    if (!roomId || !agentName || !eventType) {
      return NextResponse.json({ error: 'roomId, agentName, and eventType are required' }, { status: 400 });
    }

    const displayName = AGENT_NAMES[agentName] || agentName;
    const agentKeys = getAgentKeys();

    if (eventType === 'message') {
      const agentKey = agentKeys[agentName];
      if (agentKey) {
        const { error } = await bandClient.sendAgentMessage(agentKey, roomId, content, recipients);
        if (error) {
          return NextResponse.json({ error }, { status: 500 });
        }
      } else {
        const { error } = await bandClient.sendUserMessage(roomId, `[${displayName}] ${content}`, recipients);
        if (error) {
          return NextResponse.json({ error }, { status: 500 });
        }
      }
      return NextResponse.json({ success: true });
    }

    if (eventType === 'thought' || eventType === 'tool_call' || eventType === 'tool_result' || eventType === 'task' || eventType === 'error') {
      const agentKey = agentKeys[agentName];
      if (agentKey) {
        const { error } = await bandClient.postAgentEvent(agentKey, roomId, content, eventType, metadata);
        if (error) {
          return NextResponse.json({ error }, { status: 500 });
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: `Unknown event type: ${eventType}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
