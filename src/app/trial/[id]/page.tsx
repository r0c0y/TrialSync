'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TrialRootPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/trial/${id}/evidence`);
  }, [id, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow mx-auto mb-3" />
        <span className="font-mono text-xs text-muted uppercase tracking-[0.2em]">Entering Workspace...</span>
      </div>
    </div>
  );
}
