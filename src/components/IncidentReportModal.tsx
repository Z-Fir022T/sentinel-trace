import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  Server, 
  FileSpreadsheet, 
  Terminal, 
  Download, 
  Cpu, 
  Copy, 
  Check, 
  ExternalLink,
  RefreshCw,
  Sparkles,
  Globe
} from 'lucide-react';
import { CanaryAccessLog } from '../types/threat';

interface IncidentReportModalProps {
  log: CanaryAccessLog | null;
  onClose: () => void;
  onInspectIp: (ip: string) => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({ log, onClose, onInspectIp }) => {
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleGenerateAiReport = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch('/api/ai/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentType: 'Canary Spreadsheet Unauthorized Access',
          data: log,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiReport(data.summary);
      }
    } catch (err) {
      console.error('Failed to generate AI triage memo:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleExportMarkdown = () => {
    const reportText = `# SENTINELTRACE INCIDENT FORENSIC MEMO
Log Reference ID: ${log.id}
Generated: ${new Date().toISOString()}

## 1. INCIDENT TELEMETRY
- Target Canary Document: ${log.tokenName} (ID: ${log.tokenId})
- Timestamp: ${log.timestamp}
- Caller IP: ${log.ip}
- Location: ${[log.city, log.region, log.country].filter(Boolean).join(', ') || 'N/D'}
- Coordinates: ${log.latitude != null ? `${log.latitude}, ${log.longitude}` : 'N/D'}
- ISP / Autonomous System: ${log.isp} (${log.asn})
- Client Signature: ${log.clientType}
- User-Agent: ${log.userAgent}
- Threat Classification: ${log.threatLevel}
- Tor Exit Node: ${log.isTor ? 'YES' : 'NO'}
- Datacenter Egress: ${log.isDatacenter ? 'YES' : 'NO'}

## 2. HTTP REQUEST HEADERS
${JSON.stringify(log.rawHeaders, null, 2)}

## 3. SOC TRIAGE ANALYSIS
${aiReport || 'No AI memo generated yet.'}
`;

    const blob = new Blob([reportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Incident_${log.id}_${log.ip}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border ${
                log.threatLevel === 'Critical'
                  ? 'bg-red-950 text-red-400 border-red-800'
                  : 'bg-amber-950 text-amber-400 border-amber-800'
              }`}
            >
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-zinc-100 font-sans">
                  Forensic Incident Memo &middot; {log.id}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    log.threatLevel === 'Critical'
                      ? 'bg-red-900 text-red-100'
                      : 'bg-amber-900 text-amber-100'
                  }`}
                >
                  {log.threatLevel} THREAT
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                TRIGGER: {log.tokenName} &middot; {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Essential Forensics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          {/* Box 1 */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <div className="text-zinc-500 text-[10px] uppercase font-sans">Origin &amp; Geolocation (Atacante)</div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Caller IP:</span>
              <button
                onClick={() => {
                  onInspectIp(log.ip);
                  onClose();
                }}
                className="font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>{log.ip}</span>
                <ExternalLink className="w-3 h-3 text-zinc-500" />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Location:</span>
              <span className="text-zinc-200">{[log.city, log.country].filter(Boolean).join(', ') || 'Sin geolocalización'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Coordinates:</span>
              <span className="text-zinc-300">{log.latitude != null ? `${log.latitude}, ${log.longitude}` : 'N/D'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Network / ISP:</span>
              <span className="text-zinc-300 truncate max-w-[170px]" title={log.isp}>{log.isp}</span>
            </div>
          </div>

          {/* Box 2 */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
            <div className="text-zinc-500 text-[10px] uppercase font-sans">Diagnóstico del Correo Vinculado</div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Correo Auditado:</span>
              <span className="text-zinc-100 font-semibold truncate max-w-[170px]" title={log.associatedEmail}>
                {log.associatedEmail || 'Sin correo asociado'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">¿Comprometido?:</span>
              <span className={log.isEmailCompromised ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                {log.isEmailCompromised === undefined ? 'SIN CONSULTAR' : log.isEmailCompromised ? 'SÍ, COMPROMETIDO' : 'SIN BRECHAS CONOCIDAS'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Score de Riesgo:</span>
              <span className={log.isEmailCompromised ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {log.emailRiskScore != null ? `${log.emailRiskScore} / 100` : 'N/D'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Filtraciones:</span>
              <span className="text-zinc-300 truncate max-w-[170px]" title={log.emailBreachDetails?.join(', ') || ''}>
                {log.emailBreachDetails?.join(', ') || (log.isEmailCompromised === undefined ? 'N/D' : 'Ninguna')}
              </span>
            </div>
          </div>
        </div>

        {/* Raw User-Agent & Headers */}
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 font-sans font-semibold text-xs flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Captured Raw User-Agent &amp; HTTP Headers
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(log.rawHeaders, null, 2));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-sans"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Headers'}</span>
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800/80 text-zinc-300 overflow-x-auto text-[11px]">
            <p className="text-cyan-300 font-semibold mb-1">User-Agent: {log.userAgent}</p>
            <pre className="text-zinc-400 text-[10px] leading-tight">
              {JSON.stringify(log.rawHeaders, null, 2)}
            </pre>
          </div>
        </div>

        {/* AI Incident Triage Memo */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-semibold text-zinc-200 font-sans">
                SOC Incident Triage Memo &amp; Remediation Playbook
              </h4>
            </div>
            {!aiReport && (
              <button
                onClick={handleGenerateAiReport}
                disabled={loadingAi}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium transition-all disabled:opacity-50"
              >
                {loadingAi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
                <span>{loadingAi ? 'Analyzing Telemetry...' : 'Generate SOC Report'}</span>
              </button>
            )}
          </div>

          {aiReport ? (
            <div className="p-4 rounded-lg bg-zinc-900/90 border border-zinc-800/90 text-xs text-zinc-300 space-y-2 leading-relaxed whitespace-pre-wrap font-sans">
              {aiReport}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">
              Click &quot;Generate SOC Report&quot; to synthesize forensic analysis, exfiltration risk assessment, and immediate firewall/identity containment playbooks.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
          <button
            onClick={() => {
              onInspectIp(log.ip);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-medium transition-colors border border-zinc-700"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Investigate IP in Intelligence Hub</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium transition-colors border border-zinc-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Memo (.md)</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
