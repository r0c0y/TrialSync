'use client';

import { useTrial } from '@/context/TrialContext';
import BandOrchestrationPanel from '@/components/BandOrchestrationPanel';
import { Activity, ExternalLink, AlertTriangle, Radio } from 'lucide-react';

export default function CoordinationPage() {
  const {
    data,
    wsUrl,
    bandConnected,
    bandRooms,
    fetchingRooms,
    selectedRoomId,
    setSelectedRoomId,
    bandError,
    linking,
    testSending,
    handleCreateBandRoom,
    handleLinkBandRoom,
    handleUnlinkBandRoom,
    handleSendTestMessage,
  } = useTrial();

  if (!data) return null;
  const { trial } = data;

  return (
    <div className="space-y-6 flex flex-col h-full min-h-[650px]">
      <div className="border-b border-border pb-5 shrink-0">
        <h2 className="text-lg font-bold text-foreground mb-1">Band.ai Integration & Live Coordination</h2>
        <p className="text-xs text-muted">Link this clinical workspace to a Band.ai room to sync agent logs and notifications in real time.</p>
      </div>

      {/* Live message board panel - Full Width at Top */}
      <div className="flex-1 min-h-[420px] h-[480px]">
        <BandOrchestrationPanel
          roomId={trial.band_room_id || null}
          wsUrl={wsUrl}
          connected={bandConnected}
          agentStatus={{}}
        />
      </div>

      {/* Connection status and controls card - Full Width Below Container */}
      <div className="p-5 rounded-xl border border-border bg-surface/10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg border shrink-0 ${trial.band_room_id ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-surface border-border text-muted'}`}>
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-foreground">Band.ai Integration Connection</h3>
              {trial.band_room_id ? (
                <span className="text-[9px] font-mono font-bold uppercase text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Connected
                </span>
              ) : (
                <span className="text-[9px] font-mono font-bold uppercase text-muted bg-surface/60 px-2 py-0.5 rounded border border-border">
                  Disconnected
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              {trial.band_room_id 
                ? `Active room ID: ${trial.band_room_id}. Broadcasts agent thoughts, tools, and regulatory flags.`
                : "Connect this trial workspace to a collaboration room to stream real-time agent designs."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end lg:self-auto shrink-0 flex-wrap">
          {trial.band_room_id ? (
            <>
              <a
                href={`https://app.band.ai/chats/${trial.band_room_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Open Band Chat <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={handleSendTestMessage}
                disabled={testSending}
                className="px-3 py-2 rounded border border-border bg-background hover:bg-surface text-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                {testSending ? 'Testing...' : 'Test Ping'}
              </button>
              <button
                onClick={handleUnlinkBandRoom}
                disabled={linking}
                className="px-3 py-2 rounded border border-red-500/20 hover:border-red-500/30 bg-background hover:bg-red-500/5 text-muted hover:text-red-500 text-xs font-semibold transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCreateBandRoom}
                disabled={linking}
                className="px-4 py-2 rounded bg-foreground hover:bg-accent text-background hover:text-accent-foreground text-xs font-semibold transition-colors cursor-pointer"
              >
                {linking ? 'Creating Room...' : 'Create Collaboration Room'}
              </button>

              <div className="flex items-center gap-2 border-l border-border pl-4">
                <select
                  value={selectedRoomId}
                  onChange={(e) => setSelectedRoomId(e.target.value)}
                  disabled={fetchingRooms || bandRooms.length === 0}
                  className="bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none disabled:opacity-50"
                >
                  <option value="">
                    {fetchingRooms
                      ? 'Loading rooms...'
                      : bandRooms.length === 0
                      ? 'No rooms found'
                      : 'Link existing room...'}
                  </option>
                  {bandRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleLinkBandRoom(selectedRoomId)}
                  disabled={linking || !selectedRoomId}
                  className="px-3 py-1.5 rounded bg-background hover:bg-surface border border-border text-foreground text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Link
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {bandError && (
        <div className="p-3 rounded border border-amber-500/20 bg-amber-500/5 text-amber-600 text-[10px] leading-relaxed shrink-0 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-[11px] text-amber-700 block mb-0.5">Band API Notice</strong>
            <p>{bandError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
