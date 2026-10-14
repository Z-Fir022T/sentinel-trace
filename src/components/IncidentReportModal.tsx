import React from 'react';
import { X } from 'lucide-react';
import { CanaryAccessLog } from '../types/threat';

interface IncidentReportModalProps {
  log: CanaryAccessLog;
  onClose: () => void;
  onInspectIp: (ip: string) => void;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({ log, onClose, onInspectIp }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-zinc-800 bg-zinc-900">
          <h2 className="text-xl font-bold text-white">Incident Report</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-zinc-400 mb-1">Token Name</div>
              <div className="font-semibold text-white">{log.tokenName}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 mb-1">Threat Level</div>
              <div className={`font-semibold ${log.threatLevel === 'Critical' ? 'text-red-400' : 'text-orange-400'}`}>
                {log.threatLevel}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-400 mb-1">Attacker IP</div>
              <button
                onClick={() => onInspectIp(log.ip)}
                className="font-mono text-emerald-400 hover:underline"
              >
                {log.ip}
              </button>
            </div>
            <div>
              <div className="text-xs text-zinc-400 mb-1">Client Type</div>
              <div className="font-semibold text-white">{log.clientType}</div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <h3 className="font-semibold text-white mb-3">Geolocation</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-zinc-400">Country:</span>
                <span className="ml-2 text-white">{log.country}</span>
              </div>
              <div>
                <span className="text-zinc-400">City:</span>
                <span className="ml-2 text-white">{log.city}</span>
              </div>
              <div>
                <span className="text-zinc-400">ISP:</span>
                <span className="ml-2 text-white">{log.isp}</span>
              </div>
              <div>
                <span className="text-zinc-400">ASN:</span>
                <span className="ml-2 font-mono text-white">{log.asn}</span>
              </div>
            </div>
          </div>

          {log.isEmailCompromised && (
            <div className="border-t border-zinc-800 pt-4 bg-red-950/30 p-4 rounded-lg border border-red-800">
              <h3 className="font-semibold text-red-300 mb-2">🚨 Email Compromised</h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-zinc-400">Email:</span>
                  <span className="ml-2 text-white font-mono">{log.associatedEmail}</span>
                </div>
                <div>
                  <span className="text-zinc-400">Risk Score:</span>
                  <span className="ml-2 text-red-300 font-semibold">{log.emailRiskScore}/100</span>
                </div>
                <div>
                  <span className="text-zinc-400">Breaches:</span>
                  <span className="ml-2 text-red-300">{log.emailBreachCount} found</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-zinc-800 pt-4">
            <h3 className="font-semibold text-white mb-2">Request Details</h3>
            <div className="text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-800 font-mono text-zinc-400 overflow-x-auto">
              <pre>{JSON.stringify(log, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
