import React from 'react';
import {
  Compass,
  UserCheck,
  Globe2,
  Mail,
  Contact,
  Network,
  FolderLock,
  Scale,
} from 'lucide-react';

export type TabKey =
  | 'search'
  | 'usernames'
  | 'domains'
  | 'emails'
  | 'contacts'
  | 'graph'
  | 'cases'
  | 'compliance';

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  counts: {
    usernames: number;
    dnsRecords: number;
    contacts: number;
    cases: number;
  };
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  counts,
}) => {
  const tabs = [
    {
      key: 'search' as TabKey,
      label: 'Investigation Console',
      icon: Compass,
      desc: 'Target intake & multi-probe',
    },
    {
      key: 'usernames' as TabKey,
      label: 'Username Discovery',
      icon: UserCheck,
      count: counts.usernames > 0 ? counts.usernames : undefined,
      desc: 'Maigret / Sherlock engine',
    },
    {
      key: 'domains' as TabKey,
      label: 'Domain & Infrastructure',
      icon: Globe2,
      count: counts.dnsRecords > 0 ? counts.dnsRecords : undefined,
      desc: 'DNS DoH, RDAP & assets',
    },
    {
      key: 'emails' as TabKey,
      label: 'Email Intelligence',
      icon: Mail,
      desc: 'Deliverability & footprint',
    },
    {
      key: 'contacts' as TabKey,
      label: 'Verified Contacts',
      icon: Contact,
      count: counts.contacts > 0 ? counts.contacts : undefined,
      desc: 'Unmasked authorized directory',
    },
    {
      key: 'graph' as TabKey,
      label: 'Entity Graph',
      icon: Network,
      desc: 'Interactive correlation map',
    },
    {
      key: 'cases' as TabKey,
      label: 'Cases & Locker',
      icon: FolderLock,
      count: counts.cases > 0 ? counts.cases : undefined,
      desc: 'Saved dossiers & evidence',
    },
    {
      key: 'compliance' as TabKey,
      label: 'Ethics & Compliance',
      icon: Scale,
      desc: 'Privacy & verification policy',
    },
  ];

  return (
    <nav className="border-b border-slate-800 bg-slate-900/60 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 px-4 lg:px-8 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
