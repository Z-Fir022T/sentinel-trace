import React from 'react';
import { Shield, Bell, AlertTriangle } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  canaryCount: number;
  totalHits: number;
  onQuickTestPing: () => void;
  isTesting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  canaryCount,
  totalHits,
  onQuickTestPing,
  isTesting,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'canaries', label: 'Canaries', icon: '🐦' },
    { id: 'breaches', label: 'Breaches', icon: '⚠️' },
    { id: 'inspector', label: 'File Inspector', icon: '🔍' },
    { id: 'ip-intel', label: 'IP Intel', icon: '🌍' },
  ];

  return (
    <header className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 border-b border-zinc-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-emerald-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">SentinelTrace</h1>
              <p className="text-xs text-zinc-400">Defensive Canary & Threat Triage</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-zinc-400">Canaries</div>
              <div className="text-xl font-bold text-emerald-400">{canaryCount}</div>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-400">Hits</div>
              <div className="text-xl font-bold text-orange-400">{totalHits}</div>
            </div>
            <button
              onClick={onQuickTestPing}
              disabled={isTesting}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2"
            >
              <Bell className="w-4 h-4" />
              {isTesting ? 'Testing...' : 'Quick Ping'}
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
