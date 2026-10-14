import React, { useState } from 'react';
import { 
  ShieldAlert, 
  FileSpreadsheet, 
  Globe, 
  AlertTriangle, 
  Zap, 
  Search, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  Activity, 
  MapPin, 
  Download,
  Flame,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CanaryToken, CanaryAccessLog } from '../types/threat';
import { LiveLeafletMap } from './LiveLeafletMap';

interface DashboardViewProps {
  tokens: CanaryToken[];
  logs: CanaryAccessLog[];
  onSelectIp: (ip: string) => void;
  onSelectLog: (log: CanaryAccessLog) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tokens,
  logs,
  onSelectIp,
  onSelectLog,
  onNavigateTab,
}) => {
  const [filterThreat, setFilterThreat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const totalHits = logs.length;
  const criticalCount = logs.filter((l) => l.threatLevel === 'Critical' || l.threatLevel === 'High').length;
  const activeCanaryCount = tokens.filter((t) => t.status === 'active').length;
  const officeEngineCount = logs.filter((l) => l.clientType === 'Excel / Office Engine').length;

  const filteredLogs = logs.filter((l) => {
    const matchesThreat = filterThreat === 'all' || l.threatLevel.toLowerCase() === filterThreat.toLowerCase();
    const matchesSearch =
      l.ip.includes(searchQuery) ||
      l.tokenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.clientType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesThreat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Threat Alert Banner if critical hits detected */}
      {criticalCount > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-red-900/20 to-zinc-900 border border-red-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-950 border border-red-700/50 text-red-400 animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-red-200">
                  {criticalCount} Elevated Canary Exfiltration Alerts Detected
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-red-900/80 text-red-300 font-mono font-medium">
                  SOC PRIORITY 1
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Defensive honeytoken spreadsheets were opened from external addresses. Outbound telemetry received.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterThreat('critical')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-900/70 hover:bg-red-800 text-red-100 border border-red-700/60 transition-colors"
            >
              Filter Critical
            </button>
            <button
              onClick={() => onNavigateTab('breaches')}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-1"
            >
              <span>Check Compromised Mails</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium tracking-wide uppercase">Active Canaries</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{activeCanaryCount}</span>
            <span className="text-xs text-emerald-400 font-mono">/ {tokens.length} deployed</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            Decoy Excel workbooks armed with telemetry formulas
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500/50" />
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium tracking-wide uppercase">Total Access Hits</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{totalHits}</span>
            <span className="text-xs text-zinc-400 font-mono">telemetry pings</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            Outbound web requests captured by canary webhooks
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500/50" />
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium tracking-wide uppercase">Office Engine Hits</span>
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">{officeEngineCount}</span>
            <span className="text-xs text-zinc-400 font-mono">genuine Excel opens</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            Triggered natively inside Microsoft Excel application
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500/50" />
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 relative overflow-hidden group">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-medium tracking-wide uppercase">High Severity IPs</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-red-400">{criticalCount}</span>
            <span className="text-xs text-zinc-400 font-mono">anomalous origins</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2">
            Tor exit nodes, headless scrapers, or untrusted ASNs
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500/50" />
        </div>
      </div>

      {/* Live Interactive Leaflet Map for Real Attacker Geolocation & Compromised Email Status */}
      <LiveLeafletMap logs={logs} selectedLog={null} onSelectLog={onSelectLog} />

      {/* Live Exfiltration Stream & Access Log Table */}
      <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Live Access & Telemetry Stream
            </h3>
            <p className="text-xs text-zinc-400">
              Real-time audit log of external entities executing canary formulas inside opened spreadsheets
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search IP, document, country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 w-48 sm:w-64"
              />
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-zinc-950 rounded-lg border border-zinc-800 text-xs">
              <button
                onClick={() => setFilterThreat('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterThreat === 'all' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All ({logs.length})
              </button>
              <button
                onClick={() => setFilterThreat('critical')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterThreat === 'critical' ? 'bg-red-950/80 text-red-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Critical
              </button>
              <button
                onClick={() => setFilterThreat('high')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterThreat === 'high' ? 'bg-amber-950/80 text-amber-300 font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                High
              </button>
            </div>
          </div>
        </div>

        {/* Access Log Table */}
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider font-mono border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">Target Canary Spreadsheet</th>
                <th className="py-2.5 px-3">Triggering IP & ASN</th>
                <th className="py-2.5 px-3">Origin Location</th>
                <th className="py-2.5 px-3">Client Signature</th>
                <th className="py-2.5 px-3">Threat Rating</th>
                <th className="py-2.5 px-3 text-right">SOC Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500 font-sans">
                    No access logs match current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isCrit = log.threatLevel === 'Critical';
                  const isHigh = log.threatLevel === 'High';
                  const isOffice = log.clientType === 'Excel / Office Engine';

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-3 text-zinc-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-zinc-500" />
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-[10px] text-zinc-600">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Target File */}
                      <td className="py-3 px-3 font-sans">
                        <div className="font-medium text-zinc-200 flex items-center gap-1.5">
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[220px]" title={log.tokenName}>
                            {log.tokenName}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                          ID: {log.tokenId}
                        </div>
                      </td>

                      {/* IP & ASN */}
                      <td className="py-3 px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIp(log.ip);
                          }}
                          className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
                          title="Click to deep-dive IP intelligence"
                        >
                          <span>{log.ip}</span>
                          <ExternalLink className="w-3 h-3 text-zinc-500" />
                        </button>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[180px]" title={log.asn}>
                          {log.asn}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-1.5 text-zinc-200">
                          <span>{log.countryCode === 'US' ? '🇺🇸' : log.countryCode === 'DE' ? '🇩🇪' : log.countryCode === 'GB' ? '🇬🇧' : '🌐'}</span>
                          <span>{[log.city, log.country].filter(Boolean).join(', ') || 'Sin geolocalización'}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          ISP: {log.isp}
                        </div>
                      </td>

                      {/* Client Signature */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium font-sans ${
                            isOffice
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                              : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                          }`}
                        >
                          {log.clientType}
                        </span>
                        {log.isTor && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-red-950 text-red-300 border border-red-800 font-mono">
                            TOR
                          </span>
                        )}
                        {log.isDatacenter && !log.isTor && (
                          <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                            DC
                          </span>
                        )}
                      </td>

                      {/* Threat Level */}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isCrit
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : isHigh
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {log.threatLevel}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLog(log);
                          }}
                          className="px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors border border-zinc-700"
                        >
                          Forensics
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIp(log.ip);
                          }}
                          className="px-2.5 py-1 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-medium transition-colors border border-zinc-700"
                        >
                          Triage IP
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Launchpad Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Action Card 1: Canary Deploy */}
        <div
          onClick={() => onNavigateTab('canaries')}
          className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition-all hover:bg-zinc-900 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-300">
            Deploy Honeytoken Excel
          </h4>
          <p className="text-xs text-zinc-400 mt-1">
            Generate authentic executive compensation or cloud credential spreadsheets with embedded tracking formulas.
          </p>
        </div>

        {/* Action Card 2: Email Breach Scanner */}
        <div
          onClick={() => onNavigateTab('breaches')}
          className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 cursor-pointer transition-all hover:bg-zinc-900 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/40 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
          </div>
          <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-amber-300">
            Check If Mail Is Compromised
          </h4>
          <p className="text-xs text-zinc-400 mt-1">
            Audit company emails and domains against darkweb dumps, Lumma stealer logs, and credential breaches.
          </p>
        </div>

        {/* Action Card 3: Spreadsheet Inspector */}
        <div
          onClick={() => onNavigateTab('inspector')}
          className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/50 cursor-pointer transition-all hover:bg-zinc-900 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="p-2 rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />
          </div>
          <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-cyan-300">
            Inspect Excel For Beacons
          </h4>
          <p className="text-xs text-zinc-400 mt-1">
            Upload any spreadsheet to detect hidden external web queries, tracking pixels, or outbound IP beacons.
          </p>
        </div>
      </div>
    </div>
  );
};
