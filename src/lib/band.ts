import { logAuditTrail } from './db';

const BAND_BASE_URL = process.env.BAND_BASE_URL || 'https://app.band.ai';
const BAND_USER_TOKEN = process.env.BAND_USER_TOKEN || '';

export interface BandRoom {
  id: string;
  name: string;
  inserted_at: string;
}

export const band = {
  // Check if Band is configured
  isConfigured: () => {
    return !!BAND_USER_TOKEN;
  },

  // Get User Token
  getToken: () => BAND_USER_TOKEN,

  // Fetch all chat rooms for the human user
  getRooms: async (): Promise<{ rooms: BandRoom[]; error?: string }> => {
    if (!BAND_USER_TOKEN) {
      return { rooms: [], error: 'Band User Token is not configured in .env' };
    }

    try {
      const res = await fetch(`${BAND_BASE_URL}/api/v1/me/chats`, {
        method: 'GET',
        headers: {
          'X-API-Key': BAND_USER_TOKEN,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.code === 'plan_required') {
          return {
            rooms: [],
            error: 'Subscription Plan Limit: Human API access requires a Band Pro or Enterprise plan. Please apply promo code "BANDHACK26" on the Band dashboard to unlock.',
          };
        }
        return { rooms: [], error: data.error?.message || 'Failed to fetch Band rooms.' };
      }

      return { rooms: data.chats || [] };
    } catch (err: any) {
      return { rooms: [], error: err.message };
    }
  },

  // Create a collaborative room in Band for a trial
  createRoom: async (trialId: string, name: string): Promise<{ roomId?: string; error?: string }> => {
    if (!BAND_USER_TOKEN) {
      return { error: 'Band User Token is not configured in .env' };
    }

    try {
      const res = await fetch(`${BAND_BASE_URL}/api/v1/me/chats`, {
        method: 'POST',
        headers: {
          'X-API-Key': BAND_USER_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat: {
            name: `TrialSync: ${name} (${trialId})`,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: data.error?.message || 'Failed to create Band room.' };
      }

      const roomId = data.chat?.id;

      await logAuditTrail(
        trialId,
        'BAND_ROOM_CREATE',
        'system@trialsync.com',
        'Decision Orchestrator',
        'Band Room Integration',
        `Successfully initialized remote Band room (ID: ${roomId}) for clinical trial coordination.`,
        'Registered real-time agent coordination room.'
      );

      return { roomId };
    } catch (err: any) {
      return { error: err.message };
    }
  },

  // Send a message to a Band room representing agent status or conflict alerts
  sendMessage: async (trialId: string, roomId: string, sender: string, content: string): Promise<{ success: boolean; error?: string }> => {
    if (!BAND_USER_TOKEN) {
      return { success: false, error: 'Band User Token is not configured in .env' };
    }

    try {
      const res = await fetch(`${BAND_BASE_URL}/api/v1/me/chats/${roomId}/messages`, {
        method: 'POST',
        headers: {
          'X-API-Key': BAND_USER_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            content: `[${sender}] ${content}`,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error?.message || 'Failed to send message to Band.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // Get WebSocket URL for Phoenix channel subscription
  getWebSocketUrl: () => {
    return `${BAND_BASE_URL.replace('https://', 'wss://')}/api/v1/socket/websocket?api_key=${encodeURIComponent(BAND_USER_TOKEN)}&vsn=2.0.0`;
  },
};

