import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface IpIntelligenceViewProps {
  selectedIp: string;
  onSearchIp: (ip: string) => Promise<any>;
}

export const IpIntelligenceView: React.FC<IpIntelligenceViewProps> = ({ selectedIp, onSearchIp }) => {
  const [ip, setIp] = useState(selectedIp);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    const res = await onSearchIp(ip);
    setResult(res);
    setLoading(false);
  };

  useEffect(() => {
    if (selectedIp) {
      setIp(selectedIp);
      handleSearch();
    }
  }, [selectedIp]);

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-lg bg-zinc-900 border border-zinc-800">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" />
          IP Intelligence Lookup
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter IP address..."
            className="flex-1 px-4 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white font-mono text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Lookup'}
          </button>
        </div>
      </div>

      {result && result.details && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <h3 className="font-semibold text-white mb-3">Geolocation</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-zinc-400">Country:</span>
                <span className="ml-2 text-white font-mono">{result.details.country}</span>
              </div>
              <div>
                <span className="text-zinc-400">City:</span>
                <span className="ml-2 text-white font-mono">{result.details.city}</span>
              </div>
              <div>
                <span className="text-zinc-400">Latitude:</span>
                <span className="ml-2 text-white font-mono">{result.details.latitude.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-zinc-400">Longitude:</span>
                <span className="ml-2 text-white font-mono">{result.details.longitude.toFixed(4)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <h3 className="font-semibold text-white mb-3">Network Info</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-zinc-400">ISP:</span>
                <span className="ml-2 text-white">{result.details.isp}</span>
              </div>
              <div>
                <span className="text-zinc-400">ASN:</span>
                <span className="ml-2 text-white font-mono">{result.details.asn}</span>
              </div>
              <div>
                <span className="text-zinc-400">Datacenter:</span>
                <span className={`ml-2 font-semibold ${result.details.isDatacenter ? 'text-red-400' : 'text-green-400'}`}>
                  {result.details.isDatacenter ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">VPN/Proxy:</span>
                <span className={`ml-2 font-semibold ${result.details.isVpnOrProxy ? 'text-red-400' : 'text-green-400'}`}>
                  {result.details.isVpnOrProxy ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
