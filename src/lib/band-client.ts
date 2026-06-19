const BAND_BASE = process.env.BAND_BASE_URL || 'https://app.band.ai';
const BAND_USER_KEY = process.env.BAND_USER_TOKEN || '';
const BAND_USER_KEY_2 = process.env.BAND_USER_TOKEN_2 || '';

function headers(key: string) {
  return { 'X-API-Key': key, 'Content-Type': 'application/json' };
}

async function api<T>(path: string, options?: RequestInit): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(`${BAND_BASE}${path}`, options);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = body.error?.message || body.error?.code || `HTTP ${res.status}`;
      return { error: msg };
    }
    return { data: body as T };
  } catch (err: any) {
    return { error: err.message };
  }
}

export interface BandAgent {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  inserted_at: string;
}

export interface BandAgentCredentials {
  api_key: string;
}

export interface BandRoom {
  id: string;
  title: string | null;
  inserted_at: string;
  updated_at: string;
  task_id: string | null;
}

export interface BandParticipant {
  id: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  status: string;
  type: 'User' | 'Agent';
  handle: string | null;
}

export interface BandMessage {
  id: string;
  content: string;
  sender_type: 'User' | 'Agent';
  sender_id: string;
  sender_name: string;
  message_type: string;
  mentions?: string[];
  inserted_at: string;
}

export interface BandEvent {
  id: string;
  content: string;
  message_type: 'tool_call' | 'tool_result' | 'thought' | 'error' | 'task';
  metadata?: Record<string, any>;
  sender_name: string;
  sender_type: 'User' | 'Agent';
  inserted_at: string;
}

export const bandClient = {
  get key() { return BAND_USER_KEY; },
  get key2() { return BAND_USER_KEY_2; },
  get baseUrl() { return BAND_BASE; },

  isConfigured: () => !!BAND_USER_KEY,

  healthCheck: async () => {
    return api<{ status: string }>('/api/v1/health', {
      headers: headers(BAND_USER_KEY),
    });
  },

  registerAgent: async (name: string, description: string) => {
    return api<{ data: { agent: BandAgent; credentials: BandAgentCredentials } }>('/api/v1/me/agents/register', {
      method: 'POST',
      headers: headers(BAND_USER_KEY),
      body: JSON.stringify({ agent: { name, description } }),
    });
  },

  listMyAgents: async () => {
    return api<{ data: BandAgent[] }>('/api/v1/me/agents', {
      headers: headers(BAND_USER_KEY),
    });
  },

  createRoom: async (title?: string) => {
    return api<{ data: BandRoom }>('/api/v1/me/chats', {
      method: 'POST',
      headers: headers(BAND_USER_KEY),
      body: JSON.stringify({ chat: { title: title || null } }),
    });
  },

  getRooms: async () => {
    return api<{ data: BandRoom[] }>('/api/v1/me/chats', {
      headers: headers(BAND_USER_KEY),
    });
  },

  getRoomMessages: async (roomId: string) => {
    return api<{ data: BandMessage[] }>(`/api/v1/me/chats/${roomId}/messages`, {
      headers: headers(BAND_USER_KEY),
    });
  },

  sendUserMessage: async (roomId: string, content: string, recipients?: string) => {
    const body: any = { message: { content } };
    if (recipients) body.message.recipients = recipients;
    return api<{ data: BandMessage }>(`/api/v1/me/chats/${roomId}/messages`, {
      method: 'POST',
      headers: headers(BAND_USER_KEY),
      body: JSON.stringify(body),
    });
  },

  addParticipant: async (roomId: string, participantId: string, role: 'owner' | 'admin' | 'member' = 'member') => {
    return api<{ data: BandParticipant }>(`/api/v1/me/chats/${roomId}/participants`, {
      method: 'POST',
      headers: headers(BAND_USER_KEY),
      body: JSON.stringify({ participant: { participant_id: participantId, role } }),
    });
  },

  listParticipants: async (roomId: string) => {
    return api<{ data: BandParticipant[] }>(`/api/v1/me/chats/${roomId}/participants`, {
      headers: headers(BAND_USER_KEY),
    });
  },

  sendAgentMessage: async (agentKey: string, roomId: string, content: string, recipients?: string) => {
    const body: any = { content };
    if (recipients) body.recipients = recipients;
    return api<{ data: BandMessage }>(`/api/v1/agent/chats/${roomId}/messages`, {
      method: 'POST',
      headers: headers(agentKey),
      body: JSON.stringify(body),
    });
  },

  postAgentEvent: async (
    agentKey: string,
    roomId: string,
    content: string,
    messageType: 'tool_call' | 'tool_result' | 'thought' | 'error' | 'task',
    metadata?: Record<string, any>,
  ) => {
    const body: any = { content, message_type: messageType };
    if (metadata) body.metadata = metadata;
    return api<{ data: BandEvent }>(`/api/v1/agent/chats/${roomId}/events`, {
      method: 'POST',
      headers: headers(agentKey),
      body: JSON.stringify(body),
    });
  },

  getWebSocketUrl: () => {
    return `${BAND_BASE.replace('https://', 'wss://')}/api/v1/socket/websocket?api_key=${encodeURIComponent(BAND_USER_KEY)}&vsn=2.0.0`;
  },

  getAgentWebSocketUrl: (agentKey: string) => {
    return `${BAND_BASE.replace('https://', 'wss://')}/api/v1/socket/websocket?api_key=${encodeURIComponent(agentKey)}&vsn=2.0.0`;
  },
};
