import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Search, 
  ShieldAlert, 
  MapPin, 
  Server, 
  Terminal, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Lock, 
  AlertTriangle,
  CheckCircle2,
  Share2
} from 'lucide-react';

interface IpIntelligenceViewProps {
  selectedIp: string;
  onSearchIp: (ip: string) => Promise<any>;
}

export const IpIntelligenceView: React.FC<IpIntelligenceViewProps> = ({ selectedIp, onSearchIp }) => {
  const [ip, setIp] = useState<string>(selectedIp || '198.51.100.42');
  const [loading, setLoading] = useState(false);
  const [ipData, setIpData] = useState<any>(null);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);

  useEffect(() => {
    if (selectedIp) {
      setIp(selectedIp);
      fetchIpData(selectedIp);
    } else {
      fetchIpData(ip);
    }
  }, [selectedIp]);

  const fetchIpData = async (targetIp: string) => {
    setLoading(true);
    const data = await onSearchIp(targetIp);
    setIpData(data);
    setLoading(false);
  };

  const copyToClipboard = (text: string, actionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAction(actionId);
    setTimeout(() => setCopiedAction(null), 2000);
  };

  const sampleIps = [
    { label: '198.51.100.42 (San Jose Comcast)', ip: '198.51.100.42' },
    { label: '185.220.101.5 (Tor Exit Node Frankfurt)', ip: '185.220.101.5' },
    { label: '104.28.244.18 (Cloudflare WARP London)', ip: '104.28.244.18' },
    { label: '127.0.0.1 (Defender Local Subnet)', ip: '127.0.0.1' },
  ];

  const iptablesCommand = ipData ? `sudo iptables -A INPUT -s ${ipData.ip} -j DROP` : '';
  const ufwCommand = ipData ? `sudo ufw deny from ${ipData.ip}` : '';

  return (
    <div className="space-y-6">
      {/* Top Search Card */}
      <div className="p-6 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            IP Threat Intelligence &amp; Geolocation Deep-Dive
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Investigate any caller IP address captured by canary spreadsheets. Evaluate ASN reputation, Tor exit node membership, VPN/proxy tunnels, and generate instant perimeter firewall blocks.
          </p>
        </div>

        {/* Search input */}
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <Server className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Enter IP address (e.g. 198.51.100.42)..."
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchIpData(ip)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-zinc-950 border border-zinc-700/80 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <button
            onClick={() => fetchIpData(ip)}
            disabled={loading || !ip}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 transition-all disabled:opacity-50 shrink-0"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{loading ? 'Resolving IP...' : 'Investigate IP'}</span>
          </button>
        </div>

        {/* Quick Sample Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
          <span className="text-zinc-500 text-[11px] font-mono">Captured Incident IPs:</span>
          {sampleIps.map((s) => (
            <button
              key={s.ip}
              onClick={() => {
                setIp(s.ip);
                fetchIpData(s.ip);
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-[11px] transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* IP Investigation Results */}
      {ipData && (
        <div className="space-y-6">
          {/* Main IP Overview Header Card */}
          <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400">
                <Globe className="w-7 h-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-mono text-xl font-bold text-zinc-100">{ipData.ip}</h3>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-xs font-mono font-medium">
                    {ipData.details.asn}
                  </span>
                  {ipData.details.isTor && (
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 text-xs font-mono font-bold animate-pulse">
                      TOR EXIT NODE
                    </span>
                  )}
                  {ipData.details.isDatacenter && (
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 text-xs font-mono font-medium">
                      DATACENTER HOSTING
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {ipData.details.city}, {ipData.details.region}, {ipData.details.country} ({ipData.details.countryCode})
                  </span>
                  <span className="text-zinc-600">&middot;</span>
                  <span className="font-mono text-[11px] text-zinc-500">
                    LAT: {ipData.details.latitude}, LON: {ipData.details.longitude}
                  </span>
                </div>
              </div>
            </div>

            {/* Threat Gauge */}
            <div className="flex items-center gap-4 bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 shrink-0">
              <div className="text-right font-mono">
                <div className="text-[10px] text-zinc-400 uppercase">Threat &amp; Anomaly Score</div>
                <div
                  className={`text-2xl font-bold ${
                    ipData.details.threatScore > 70
                      ? 'text-red-400'
                      : ipData.details.threatScore > 40
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {ipData.details.threatScore} / 100
                </div>
              </div>
              <div
                className={`p-2.5 rounded-lg border ${
                  ipData.details.threatScore > 70
                    ? 'bg-red-950/60 border-red-800 text-red-400'
                    : 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                }`}
              >
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Deep Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
            {/* Column 1: Network & ISP */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
              <div className="text-zinc-400 font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 font-sans">
                <Server className="w-4 h-4 text-emerald-400" />
                Network Infrastructure
              </div>
              <div className="space-y-1.5 pt-1">
                <div>
                  <span className="text-zinc-500">ISP / Carrier:</span>
                  <p className="text-zinc-200 font-sans font-medium">{ipData.details.isp}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Autonomous System:</span>
                  <p className="text-zinc-300">{ipData.details.asn}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Reverse DNS PTR:</span>
                  <p className="text-cyan-300 truncate">{ipData.reverseDns}</p>
                </div>
              </div>
            </div>

            {/* Column 2: Threat Classifications */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
              <div className="text-zinc-400 font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 font-sans">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                Security Flags &amp; Tunnels
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Tor Anonymizer:</span>
                  <span className={ipData.details.isTor ? 'text-red-400 font-bold' : 'text-zinc-500'}>
                    {ipData.details.isTor ? 'DETECTED' : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">VPN / Commercial Proxy:</span>
                  <span className={ipData.details.isVpnOrProxy ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                    {ipData.details.isVpnOrProxy ? 'ACTIVE' : 'None'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Datacenter / Cloud VM:</span>
                  <span className={ipData.details.isDatacenter ? 'text-purple-400 font-bold' : 'text-zinc-500'}>
                    {ipData.details.isDatacenter ? 'YES' : 'NO'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Open Service Ports:</span>
                  <span className="text-zinc-300">[80, 443]</span>
                </div>
              </div>
            </div>

            {/* Column 3: WHOIS & Routing */}
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2.5">
              <div className="text-zinc-400 font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 font-sans">
                <Terminal className="w-4 h-4 text-cyan-400" />
                WHOIS &amp; Registry
              </div>
              <div className="space-y-1.5 pt-1">
                <div>
                  <span className="text-zinc-500">Allocated NetRange:</span>
                  <p className="text-zinc-300">{ipData.whois?.netRange}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Registry Org:</span>
                  <p className="text-zinc-300 truncate">{ipData.whois?.org}</p>
                </div>
                <div>
                  <span className="text-zinc-500">Abuse Reporting Email:</span>
                  <p className="text-emerald-400 truncate">{ipData.whois?.abuseContact}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Immediate Perimeter Containment Commands */}
          <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Defensive Containment Commands (Perimeter Isolation)
              </h4>
              <span className="text-[11px] text-zinc-500 font-mono">SOC AUTOMATION READY</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
              {/* Linux iptables */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
                <div className="overflow-hidden">
                  <div className="text-[10px] text-zinc-500 font-sans">Linux iptables Drop Rule:</div>
                  <code className="text-amber-300 truncate block mt-0.5">{iptablesCommand}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(iptablesCommand, 'iptables')}
                  className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0 transition-colors"
                >
                  {copiedAction === 'iptables' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Ubuntu UFW */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
                <div className="overflow-hidden">
                  <div className="text-[10px] text-zinc-500 font-sans">Ubuntu UFW Deny Rule:</div>
                  <code className="text-cyan-300 truncate block mt-0.5">{ufwCommand}</code>
                </div>
                <button
                  onClick={() => copyToClipboard(ufwCommand, 'ufw')}
                  className="p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 shrink-0 transition-colors"
                >
                  {copiedAction === 'ufw' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
