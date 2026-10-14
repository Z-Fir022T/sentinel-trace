import React from 'react';
import { CanaryToken, CanaryAccessLog } from '../types/threat';
import { LiveLeafletMap } from './LiveLeafletMap';

interface DashboardViewProps {
  tokens: CanaryToken[];
  logs: CanaryAccessLog[];
  onSelectIp: (ip: string) => void;
  onSelectLog: (log: CanaryAccessLog) => void;
  onNavigateTab: (tab: string) => void;
  onTriggerTest: () => void;
  isTesting: boolean;
  onSimulateScenario: (scenario: string, email: string) => Promise<void>;
  defaultEmail: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tokens,
  logs,
  onSelectIp,
  onSelectLog,
  onNavigateTab,
  onTriggerTest,
  isTesting,
  onSimulateScenario,
  defaultEmail,
}) => {
  const recentLogs = logs.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="text-sm text-zinc-400">Total Tokens</div>
          <div className="text-3xl font-bold text-emerald-400">{tokens.length}</div>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="text-sm text-zinc-400">Total Hits</div>
          <div className="text-3xl font-bold text-orange-400">{logs.length}</div>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="text-sm text-zinc-400">Active Threats</div>
          <div className="text-3xl font-bold text-red-400">{logs.filter(l => l.threatLevel === 'Critical').length}</div>
        </div>
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="text-sm text-zinc-400">Compromised</div>
          <div className="text-3xl font-bold text-red-500">{logs.filter(l => l.isEmailCompromised).length}</div>
        </div>
      </div>

      <LiveLeafletMap
        logs={logs}
        selectedLog={logs[0] || null}
        onSelectLog={onSelectLog}
        onSimulateScenario={onSimulateScenario}
        isSimulating={isTesting}
        defaultEmail={defaultEmail}
      />

      <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {recentLogs.map((log) => (
            <div key={log.id} className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer hover:bg-zinc-900" onClick={() => onSelectLog(log)}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-white">{log.tokenName}</div>
                  <div className="text-xs text-zinc-400">{log.city}, {log.country} · {log.ip}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${log.threatLevel === 'Critical' ? 'bg-red-900 text-red-200' : 'bg-orange-900 text-orange-200'}`}>
                  {log.threatLevel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
