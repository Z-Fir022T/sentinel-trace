import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { EmailBreachAuditResult } from '../types/threat';

interface EmailBreachViewProps {
  onSearchBreach: (query: string) => Promise<EmailBreachAuditResult | null>;
  initialQuery: string;
}

export const EmailBreachView: React.FC<EmailBreachViewProps> = ({ onSearchBreach, initialQuery }) => {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<EmailBreachAuditResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const res = await onSearchBreach(query);
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-lg bg-zinc-900 border border-zinc-800">
        <h2 className="text-lg font-semibold text-white mb-4">Email Breach Audit</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter email or domain..."
            className="flex-1 px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check'}
          </button>
        </div>
      </div>

      {result && (
        <div className={`p-5 rounded-lg border ${result.isCompromised ? 'bg-red-950 border-red-800' : 'bg-green-950 border-green-800'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-6 h-6 ${result.isCompromised ? 'text-red-400' : 'text-green-400'}`} />
            <div>
              <h3 className="font-semibold text-white mb-2">
                {result.isCompromised ? 'Email Compromised' : 'Email Secure'}
              </h3>
              <p className="text-sm text-zinc-300">Risk Score: {result.riskScore}/100</p>
              <p className="text-sm text-zinc-300">Breaches Found: {result.breachCount}</p>
              {result.exposedDataClasses.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-semibold text-white">Exposed Data:</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.exposedDataClasses.map((cls) => (
                      <span key={cls} className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
