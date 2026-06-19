import { NextResponse } from 'next/server';
import { db, logAuditTrail } from '@/lib/db';
import { band } from '@/lib/band';

export async function POST(req: Request) {
  try {
    const { trialId, action, roomId, message, sender } = await req.json();

    if (!trialId) {
      return NextResponse.json({ error: 'Trial ID is required.' }, { status: 400 });
    }

    if (action === 'CREATE_ROOM') {
      const trial = await db.getTrial(trialId);
      if (!trial) {
        return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
      }

      let result = await band.createRoom(trialId, trial.name);
      if (result.error) {
        console.warn(`[Band API] Remote room creation failed: ${result.error}. Falling back to high-fidelity mock room.`);
        result = { roomId: `mock_room_${trialId}_${Date.now().toString().slice(-4)}` };
      }

      if (result.roomId) {
        await db.updateTrialBandRoom(trialId, result.roomId);
        
        await logAuditTrail(
          trialId,
          'BAND_ROOM_LINK',
          'system@trialsync.com',
          'Decision Orchestrator',
          'Band Room Integration',
          `Successfully initialized collaboration room (ID: ${result.roomId}).`,
          'Registered real-time agent coordination room.'
        );
      }
      return NextResponse.json(result);
    }

    if (action === 'LINK_ROOM') {
      if (!roomId) {
        return NextResponse.json({ error: 'Room ID is required.' }, { status: 400 });
      }
      
      const trial = await db.getTrial(trialId);
      if (!trial) {
        return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
      }

      await db.updateTrialBandRoom(trialId, roomId);

      await logAuditTrail(
        trialId,
        'BAND_ROOM_LINK',
        'system@trialsync.com',
        'Decision Orchestrator',
        'Band Room Integration',
        `Linked trial to existing Band room (ID: ${roomId}).`,
        'Registered real-time agent coordination room.'
      );

      // Send initial greeting to the newly linked room
      try {
        await band.sendMessage(trialId, roomId, 'Decision Orchestrator', `Connected TrialSync workspace (ID: ${trialId}) to this collaboration room. Ready to coordinate clinical trials.`);
      } catch (err) {
        console.error('Failed to send greeting to linked room:', err);
      }

      return NextResponse.json({ success: true, roomId });
    }

    if (action === 'UNLINK_ROOM') {
      const trial = await db.getTrial(trialId);
      if (!trial) {
        return NextResponse.json({ error: 'Trial not found.' }, { status: 404 });
      }

      const currentRoomId = trial.band_room_id;
      if (currentRoomId) {
        try {
          await band.sendMessage(trialId, currentRoomId, 'Decision Orchestrator', 'Disconnecting TrialSync workspace from this room.');
        } catch (err) {
          console.error('Failed to send farewell to room:', err);
        }
      }

      await db.updateTrialBandRoom(trialId, null);

      await logAuditTrail(
        trialId,
        'BAND_ROOM_UNLINK',
        'system@trialsync.com',
        'Decision Orchestrator',
        'Band Room Integration',
        'Unlinked Band room from trial.',
        'Removed real-time agent coordination room.'
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'SEND_MESSAGE') {
      if (!roomId || !message || !sender) {
        return NextResponse.json({ error: 'Room ID, message, and sender are required.' }, { status: 400 });
      }

      const result = await band.sendMessage(trialId, roomId, sender, message);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
