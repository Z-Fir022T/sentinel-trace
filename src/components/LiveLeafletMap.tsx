import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Globe, Crosshair } from 'lucide-react';
import { CanaryAccessLog } from '../types/threat';

interface LiveLeafletMapProps {
  logs: CanaryAccessLog[];
  selectedLog: CanaryAccessLog | null;
  onSelectLog: (log: CanaryAccessLog) => void;
  onSimulateScenario: (scenario: string, email: string) => Promise<void>;
  isSimulating: boolean;
  defaultEmail: string;
}

export const LiveLeafletMap: React.FC<LiveLeafletMapProps> = ({
  logs,
  selectedLog,
  onSelectLog,
  onSimulateScenario,
  isSimulating,
  defaultEmail,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [testEmail, setTestEmail] = useState<string>(defaultEmail || 'security@corp.com');

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [30, 0],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    mapInstanceRef.current = map;
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    logs.forEach((log) => {
      if (!log.latitude || !log.longitude) return;

      const isCrit = log.threatLevel === 'Critical';
      const isHigh = log.threatLevel === 'High';
      const markerColor = isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#10b981';

      const customIcon = L.divIcon({
        className: 'custom-canary-pin',
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: ${markerColor}; opacity: 0.35;"></div>
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${markerColor}; border: 2px solid #09090b; box-shadow: 0 0 10px ${markerColor};"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      const marker = L.marker([log.latitude, log.longitude], { icon: customIcon }).addTo(map);

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; color: #f4f4f5; background: #09090b; padding: 8px; min-width: 240px; border-radius: 6px;">
          <div style="font-weight: 700; color: #10b981; margin-bottom: 8px;">EXCEL OPENED</div>
          <div>📍 Location: <strong>${log.city}, ${log.country}</strong></div>
          <div>🎯 IP: <strong style="color: #38bdf8; font-family: monospace;">${log.ip}</strong></div>
          <div>Threat: <strong>${log.threatLevel}</strong></div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => onSelectLog(log));
      markersRef.current.push(marker);
    });
  }, [logs, onSelectLog]);

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-400" />
          Live Map: Attacker Location
        </h3>
      </div>

      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row items-center gap-3 text-xs">
        <span className="font-semibold text-zinc-300">Test Email:</span>
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-xs w-64"
        />
        <div className="flex gap-2">
          <button
            onClick={() => onSimulateScenario('spain_madrid', testEmail)}
            disabled={isSimulating}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 disabled:opacity-50"
          >
            🇪🇸 Spain
          </button>
          <button
            onClick={() => onSimulateScenario('tor_germany', testEmail)}
            disabled={isSimulating}
            className="px-2.5 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 disabled:opacity-50"
          >
            🇩🇪 Tor
          </button>
          <button
            onClick={() => onSimulateScenario('local', testEmail)}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>My IP</span>
          </button>
        </div>
      </div>

      <div className="relative w-full h-[420px] rounded-xl overflow-hidden border border-zinc-800">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
