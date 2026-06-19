'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileSearch, FileText, LineChart, ShieldCheck, Activity } from 'lucide-react';
import { useTrial } from '@/context/TrialContext';

export default function WorkspaceSubnavTabs({ trialId }: { trialId: string }) {
  const pathname = usePathname();
  const { data } = useTrial();

  const protocol = data?.protocol || null;
  const sap = data?.sap || null;
  const conflicts = data?.conflicts || [];
  const openConflicts = conflicts.filter((c: any) => c.status === 'OPEN');

  const base = `/trial/${trialId}`;

  const tabs = [
    {
      id: 'evidence',
      label: 'Evidence',
      href: `${base}/evidence`,
      icon: FileSearch,
      enabled: true,
    },
    {
      id: 'protocol',
      label: 'Protocol',
      href: `${base}/protocol`,
      icon: FileText,
      enabled: !!protocol,
    },
    {
      id: 'sap',
      label: 'SAP',
      href: `${base}/sap`,
      icon: LineChart,
      enabled: !!sap,
    },
    {
      id: 'conflicts',
      label: 'Conflicts Hub',
      href: `${base}/conflicts`,
      icon: ShieldCheck,
      enabled: conflicts.length > 0,
      showDot: openConflicts.length > 0,
    },
    {
      id: 'coordination',
      label: 'Band',
      href: `${base}/coordination`,
      icon: Activity,
      enabled: true,
    },
  ];

  return (
    <div className="flex items-center gap-2 border-b border-border">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.href;
        
        if (!tab.enabled) {
          return (
            <button
              key={tab.id}
              disabled
              className="pb-4 px-2 font-mono text-[9px] font-bold tracking-wider uppercase border-b-2 border-transparent text-muted opacity-30 cursor-not-allowed flex items-center gap-1.5"
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        }

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`pb-4 px-2 font-mono text-[9px] font-bold tracking-wider uppercase border-b-2 transition-colors flex items-center gap-1.5 relative ${
              active 
                ? 'border-accent text-foreground' 
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {tab.label}
            {tab.showDot && (
              <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
