'use client';

import { use, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { TrialProvider, useTrial } from '@/context/TrialContext';
import WorkspaceNav from '@/components/WorkspaceNav';
import InteractiveAgentConsole from '@/components/InteractiveAgentConsole';
import WorkspaceSubnavTabs from '@/components/WorkspaceSubnavTabs';
import WorkspaceCoPilot from '@/components/WorkspaceCoPilot';

// Inner shell that consumes the TrialContext
function TrialWorkspaceLayoutInner({ children, trialId }: { children: ReactNode; trialId: string }) {
  const pathname = usePathname();
  const { data, loading, currentPipelineAgent } = useTrial();

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-muted flex items-center justify-center text-xs font-mono uppercase tracking-[0.2em]">
        Loading clinical workspace...
      </div>
    );
  }

  if (!data || !data.trial) {
    return (
      <div className="min-h-screen bg-background text-muted flex items-center justify-center text-xs font-mono uppercase tracking-[0.2em]">
        Trial project not found.
      </div>
    );
  }

  const { trial, conflicts = [] } = data;
  const openConflictsCount = conflicts.filter((c: any) => c.status === 'OPEN').length;
  const base = `/trial/${trialId}`;

  // Decide whether to show split workspace pane vs full width page
  const isDocumentPage = 
    pathname === base || 
    pathname === `${base}/evidence` || 
    pathname === `${base}/protocol` || 
    pathname === `${base}/sap` || 
    pathname === `${base}/conflicts` || 
    pathname === `${base}/coordination`;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col selection:bg-accent/15 selection:text-foreground relative">
      {/* Shared workspace nav: topbar + sub-nav tabs */}
      <WorkspaceNav
        trial={trial}
        openConflicts={openConflictsCount}
        currentPipelineAgent={currentPipelineAgent}
      />

      {isDocumentPage ? (
        <div className="flex-1 max-w-[1600px] w-full mx-auto px-8 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Side: Interactive Agent Console */}
          <div className="lg:col-span-2 flex flex-col space-y-6 lg:h-[850px] min-h-[700px]">
            <InteractiveAgentConsole />
          </div>

          {/* Right Side: Main Documents / Editing & Resolution Subpages */}
          <div className="lg:col-span-2 space-y-6 flex flex-col lg:h-[850px] min-h-[700px]">
            <WorkspaceSubnavTabs trialId={trialId} />
            <div className="flex-1 bg-surface/30 border border-border rounded-md p-6 overflow-y-auto min-h-0">
              {children}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          {children}
        </div>
      )}

      {/* Floating Workspace Co-Pilot / Sales Representative Chat Assistant */}
      <WorkspaceCoPilot />
    </div>
  );
}

export default function TrialWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: trialId } = use(params);

  return (
    <TrialProvider trialId={trialId}>
      <TrialWorkspaceLayoutInner trialId={trialId}>{children}</TrialWorkspaceLayoutInner>
    </TrialProvider>
  );
}
