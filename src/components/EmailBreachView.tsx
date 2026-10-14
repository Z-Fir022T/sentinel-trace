import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Key, 
  Lock, 
  Database, 
  Download, 
  ExternalLink, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  Fingerprint, 
  FileText,
  Mail,
  Building
} from 'lucide-react';
import { EmailBreachAuditResult, BreachRecord } from '../types/threat';

interface EmailBreachViewProps {
  onSearchBreach: (query: string) => Promise<EmailBreachAuditResult | null>;
  initialQuery?: string;
}

export const EmailBreachView: React.FC<EmailBreachViewProps> = ({ onSearchBreach, initialQuery }) => {
  const [query, setQuery] = useState<string>(initialQuery || 'ianhazael.a.l@gmail.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailBreachAuditResult | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});

  const handleSearch = async (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q) return;
    setLoading(true);
    const data = await onSearchBreach(q);
    setResult(data);
    setLoading(false);
  };

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const sampleQueries = [
    { label: 'ianhazael.a.l@gmail.com', query: 'ianhazael.a.l@gmail.com' },
    { label: 'ceo@corporate.internal', query: 'ceo@corporate.internal' },
    { label: 'admin@infostealer-test.com', query: 'admin@infostealer-test.com' },
    { label: 'clean-audit@secure.corp', query: 'clean-audit@secure.corp' },
  ];

  const handleExportJson = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Breach_Audit_${result.query.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Panel */}
      <div className="p-6 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              Compromised Email &amp; Domain Threat Auditor
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Audit corporate email addresses and enterprise domains against darkweb credential vaults, infostealer botnet logs (Lumma/Redline), and known commercial database breaches.
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Enter email address (e.g. user@company.com) or domain..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-zinc-950 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading || !query}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 transition-all disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{loading ? 'Auditing Vaults...' : 'Audit Compromise Status'}</span>
          </button>
        </div>

        {/* Quick Demo Samples */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-zinc-500 text-[11px] font-mono">Quick Triage Samples:</span>
          {sampleQueries.map((sample) => (
            <button
              key={sample.query}
              onClick={() => {
                setQuery(sample.query);
                handleSearch(sample.query);
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[11px] transition-colors"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Status Verdict Banner */}
          <div
            className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              result.isCompromised
                ? 'bg-gradient-to-r from-red-950/40 via-red-900/20 to-zinc-900 border-red-800/80'
                : 'bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-zinc-900 border-emerald-800/80'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl border shrink-0 ${
                  result.isCompromised
                    ? 'bg-red-950 text-red-400 border-red-700/60 animate-pulse'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-700/60'
                }`}
              >
                {result.isCompromised ? <AlertTriangle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-zinc-400">TARGET IDENTIFIER:</span>
                  <span className="font-mono font-bold text-sm text-zinc-100">{result.query}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold font-mono ${
                      result.isCompromised
                        ? 'bg-red-900 text-red-100 border border-red-700'
                        : 'bg-emerald-900 text-emerald-100 border border-emerald-700'
                    }`}
                  >
                    {result.isCompromised ? 'CRITICAL COMPROMISE DETECTED' : 'CLEAN / NO KNOWN EXPOSURE'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                  {result.isCompromised
                    ? `Account credentials and identity hashes were discovered in ${result.breachCount} known threat dumps or stealer botnet logs. Immediate password rotation and session termination recommended.`
                    : 'Zero appearances discovered across verified darkweb vaults, credential stuffing combolists, and infostealer malware dumps.'}
                </p>
              </div>
            </div>

            {/* Risk Gauge */}
            <div className="flex items-center gap-4 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800 shrink-0">
              <div className="text-right">
                <div className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Compromise Risk Score</div>
                <div
                  className={`text-2xl font-bold font-mono ${
                    result.riskScore > 70
                      ? 'text-red-400'
                      : result.riskScore > 30
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {result.riskScore} <span className="text-xs text-zinc-500 font-sans">/ 100</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-zinc-800 flex items-center justify-center relative">
                <div
                  className={`w-8 h-8 rounded-full ${
                    result.riskScore > 70 ? 'bg-red-500/20' : 'bg-emerald-500/20'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Exposed Data Classes */}
          {result.isCompromised && (
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-amber-400" />
                  Exposed Data Categories &amp; Compromised Fields
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {result.exposedDataClasses.length} distinct data classes exposed
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {result.exposedDataClasses.map((item) => {
                  const isPassword = item.toLowerCase().includes('password');
                  const isToken = item.toLowerCase().includes('token') || item.toLowerCase().includes('session');
                  return (
                    <span
                      key={item}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${
                        isPassword || isToken
                          ? 'bg-red-950/80 text-red-300 border-red-800/80'
                          : 'bg-zinc-950 text-zinc-300 border-zinc-800'
                      }`}
                    >
                      {item}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Breached Databases Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Discovered Breach Sources &amp; Exfiltration Events ({result.breaches.length})
              </h3>
              <button
                onClick={handleExportJson}
                className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit JSON</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.breaches.map((breach, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3 hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-zinc-100 text-sm flex items-center gap-2">
                        {breach.breachName}
                      </h4>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                        Breach Date: {breach.breachDate} &middot; Accounts: {breach.compromisedAccounts.toLocaleString()}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${
                        breach.severity === 'Critical'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {breach.severity}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {breach.description}
                  </p>

                  <div className="pt-2 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-zinc-500 font-mono">
                      Type: <span className="text-cyan-300">{breach.sourceType}</span>
                    </span>
                    <span className="text-emerald-400 font-mono font-medium">
                      VERIFIED THREAT ENTRY
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Defensive Incident Remediation Playbook */}
          <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Mandatory SOC Incident Response Checklist
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Follow these prioritized steps to prevent Business Email Compromise (BEC) and session hijacking:
                </p>
              </div>
              <div className="text-xs text-zinc-400 font-mono">
                COMPLETED: {Object.values(completedTasks).filter(Boolean).length} / {result.recommendedActions.length}
              </div>
            </div>

            <div className="space-y-2.5">
              {result.recommendedActions.map((action) => {
                const isDone = !!completedTasks[action.id];
                return (
                  <div
                    key={action.id}
                    onClick={() => toggleTask(action.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isDone
                        ? 'bg-zinc-950/60 border-zinc-800/60 opacity-60'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="mt-0.5 text-emerald-400 shrink-0">
                      {isDone ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5 text-zinc-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-semibold ${isDone ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                          {action.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 font-mono">
                          {action.category}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            action.priority === 'Critical' || action.priority === 'Immediate'
                              ? 'text-red-400 bg-red-950/80 border border-red-800'
                              : 'text-amber-400 bg-amber-950/80 border border-amber-800'
                          }`}
                        >
                          {action.priority}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDone ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        {action.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
