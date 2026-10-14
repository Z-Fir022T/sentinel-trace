import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Globe, 
  MapPin, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  ExternalLink, 
  RefreshCw, 
  Crosshair,
  Mail,
  FileSpreadsheet
} from 'lucide-react';
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
  const circlesRef = useRef<L.Circle[]>([]);
  const [testEmail, setTestEmail] = useState<string>(defaultEmail || 'ianhazael.a.l@gmail.com');
  const [activeScenario, setActiveScenario] = useState<string>('spain_madrid');
  const [selectedMarker, setSelectedMarker] = useState<CanaryAccessLog | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Center on Europe/Atlantic view initially
    const map = L.map(mapContainerRef.current, {
      center: [30, 0],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 18,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark-themed high contrast tiles for cyber defense SOC
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
      className: 'osm-dark-tiles',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers whenever logs change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers & circles
    markersRef.current.forEach((m) => m.remove());
    circlesRef.current.forEach((c) => c.remove());
    markersRef.current = [];
    circlesRef.current = [];

    logs.forEach((log) => {
      if (!log.latitude || !log.longitude) return;

      const isCrit = log.threatLevel === 'Critical';
      const isHigh = log.threatLevel === 'High';
      const isCompromised = log.isEmailCompromised;

      const markerColor = isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#10b981';
      const circleColor = isCrit ? '#dc2626' : isHigh ? '#d97706' : '#059669';
      const pulseClass = isCrit ? 'pulse-red' : isHigh ? 'pulse-amber' : 'pulse-emerald';

      // Accuracy circle (50km radius for IP geolocation margin of error)
      const circle = L.circle([log.latitude, log.longitude], {
        radius: 50000,
        color: circleColor,
        weight: 1.5,
        opacity: 0.25,
        fillColor: circleColor,
        fillOpacity: 0.08,
        dashArray: '5, 5',
      }).addTo(map);

      // Custom HTML Marker with pulsing aura
      const customIcon = L.divIcon({
        className: 'custom-canary-pin',
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: ${markerColor}; opacity: 0.3;" class="${pulseClass}"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: ${markerColor}; border: 2.5px solid #09090b; box-shadow: 0 0 12px ${markerColor}, inset 0 0 6px ${markerColor};"></div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14],
      });

      const marker = L.marker([log.latitude, log.longitude], { icon: customIcon }).addTo(map);

      // Enhanced Popup Content
      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; color: #f4f4f5; background: #09090b; padding: 8px; min-width: 260px; border-radius: 6px; border: 1px solid #27272a;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px solid #27272a; padding-bottom: 6px;">
            <span style="font-weight: 700; color: #10b981; font-size: 13px;">📊 INCIDENT ALERT</span>
            <span style="font-size: 10px; background: ${isCrit ? '#7f1d1d' : isHigh ? '#92400e' : '#064e3b'}; color: ${isCrit ? '#fca5a5' : isHigh ? '#fbbf24' : '#6ee7b7'}; padding: 2px 8px; border-radius: 3px; font-weight: bold; border: 1px solid ${isCrit ? '#dc2626' : isHigh ? '#d97706' : '#059669'};">
              ${log.threatLevel}
            </span>
          </div>

          <div style="margin-bottom: 6px;">
            <span style="color: #a1a1aa; font-size: 10px; display: block; margin-bottom: 2px;">📍 LOCATION</span>
            <div style="font-weight: 600; color: #fff; font-size: 12px;">${log.city}, ${log.country}</div>
            <div style="font-size: 10px; color: #71717a; margin-top: 1px;">${log.latitude?.toFixed(4)}, ${log.longitude?.toFixed(4)}</div>
          </div>

          <div style="margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px solid #27272a;">
            <span style="color: #a1a1aa; font-size: 10px; display: block; margin-bottom: 2px;">🎯 ATTACKER IP</span>
            <div style="font-family: 'Courier New', monospace; font-weight: bold; color: #38bdf8; font-size: 13px;">${log.ip}</div>
            <div style="color: #71717a; font-size: 10px;">${log.isp} (${log.asn})</div>
          </div>

          <div style="margin-bottom: 6px;">
            <span style="color: #a1a1aa; font-size: 10px; display: block; margin-bottom: 2px;">📄 TARGET DOCUMENT</span>
            <div style="font-weight: 500; color: #e4e4e7; font-size: 11px;">${log.tokenName}</div>
          </div>

          <div style="margin: 8px 0; padding: 8px; border-radius: 4px; background: ${isCompromised ? 'rgba(127, 29, 29, 0.5)' : 'rgba(6, 78, 59, 0.5)'}; border-left: 3px solid ${isCompromised ? '#dc2626' : '#059669'};">
            <span style="font-size: 10px; color: ${isCompromised ? '#fca5a5' : '#6ee7b7'}; font-weight: bold; display: block; margin-bottom: 3px;">
              ${isCompromised ? '🚨 EMAIL COMPROMISED' : '✅ EMAIL CLEAN'}
            </span>
            <div style="font-family: monospace; font-size: 10px; color: #fff;">${log.associatedEmail || 'N/A'}</div>
            ${
              isCompromised
                ? `<div style="font-size: 9px; color: #fca5a5; margin-top: 3px;">Found in ${log.emailBreachCount || 3} breach(es)</div>`
                : ''
            }
          </div>

          <div style="font-size: 9px; color: #71717a; text-align: right;">
            ${new Date(log.timestamp).toLocaleString()} · ${log.clientType}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'dark-cyber-popup',
        maxWidth: 300,
        minWidth: 260,
      });

      marker.on('click', () => {
        onSelectLog(log);
        setSelectedMarker(log);
        marker.openPopup();
      });

      markersRef.current.push(marker);
      circlesRef.current.push(circle);
    });
  }, [logs, onSelectLog]);

  // Fly to selected log with enhanced animation
  useEffect(() => {
    if (!selectedLog || !mapInstanceRef.current) return;
    if (selectedLog.latitude && selectedLog.longitude) {
      const map = mapInstanceRef.current;
      const targetZoom = 10;
      const animOptions = {
        duration: 1.2,
        easeLinearity: 0.25,
      };

      map.flyTo([selectedLog.latitude, selectedLog.longitude], targetZoom, animOptions);

      // Open popup after animation settles
      setTimeout(() => {
        const selectedMarker = markersRef.current.find(
          (m) => m.getLatLng().lat === selectedLog.latitude &&
                 m.getLatLng().lng === selectedLog.longitude
        );
        if (selectedMarker) {
          selectedMarker.openPopup();
        }
      }, 1300);
    }
  }, [selectedLog]);

  const handleSimulate = async (scenario: string) => {
    setActiveScenario(scenario);
    await onSimulateScenario(scenario, testEmail);
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
      {/* Title & Technical Clarification Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold text-zinc-100">
              Mapa en Vivo: Localización del Atacante e IP al Abrir el Excel
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-medium">
              TELEMETRÍA EN DIRECTO
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
            Cuando alguien abre el archivo Excel con la fórmula trampa <code className="text-cyan-300 font-mono">=WEBSERVICE(...)</code>, el sistema captura en tiempo real su <strong className="text-zinc-200">dirección IP pública</strong>, la proyecta en este mapa con su <strong className="text-zinc-200">ciudad/país</strong>, y audita inmediatamente si el correo de la víctima está comprometido en bases de datos de hackers.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 shrink-0 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
          <span className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping inline-block" />
            Atacante Tor / Script
          </span>
          <span className="flex items-center gap-1.5 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            Apertura Excel Remota
          </span>
        </div>
      </div>

      {/* Simulator Control Bar (Directly addresses the user's workflow!) */}
      <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
          <span className="font-semibold text-zinc-300 shrink-0 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-emerald-400" />
            Correo a Monitorear:
          </span>
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-xs focus:outline-none focus:border-emerald-500 w-full sm:w-64"
            placeholder="ianhazael.a.l@gmail.com"
          />
        </div>

        {/* Scenario buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-zinc-500 font-mono text-[11px] hidden xl:inline">Simular que el atacante abre el Excel:</span>
          <button
            onClick={() => handleSimulate('spain_madrid')}
            disabled={isSimulating}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            title="Simula un atacante abriendo el Excel desde Madrid, España"
          >
            <span>🇪🇸 España</span>
          </button>

          <button
            onClick={() => handleSimulate('tor_germany')}
            disabled={isSimulating}
            className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            title="Simula un atacante usando la red Tor desde Frankfurt, Alemania"
          >
            <span>🇩🇪 Tor (Alemania)</span>
          </button>

          <button
            onClick={() => handleSimulate('usa_sanjose')}
            disabled={isSimulating}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            title="Simula apertura en Silicon Valley / EE.UU."
          >
            <span>🇺🇸 EE.UU.</span>
          </button>

          <button
            onClick={() => handleSimulate('local')}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-950 disabled:opacity-50"
            title="Captura tu propia IP real ahora mismo para probar la localización"
          >
            {isSimulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5" />}
            <span>Probar con mi IP Real</span>
          </button>
        </div>
      </div>

      {/* Real Interactive Leaflet Map Container */}
      <div className="relative w-full h-[400px] sm:h-[460px] rounded-xl overflow-hidden border border-zinc-800">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* HUD Overlay with recent hit summary */}
        {logs.length > 0 && (
          <div className="absolute top-3 right-3 z-10 p-3 rounded-xl bg-zinc-950/90 border border-zinc-800/90 shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-1.5 pointer-events-auto">
            <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400 border-b border-zinc-800 pb-1">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ÚLTIMA APERTURA
              </span>
              <span>{new Date(logs[0].timestamp).toLocaleTimeString()}</span>
            </div>

            <div className="font-mono text-zinc-200 font-bold text-sm">
              IP: {logs[0].ip}
            </div>

            <div className="text-zinc-400 text-xs flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{logs[0].city}, {logs[0].country}</span>
            </div>

            <div className="text-[11px] text-zinc-400 font-sans truncate" title={logs[0].tokenName}>
              Archivo: {logs[0].tokenName}
            </div>

            {/* Email compromise indicator */}
            <div
              className={`p-2 rounded-lg text-[11px] font-mono mt-1 border ${
                logs[0].isEmailCompromised
                  ? 'bg-red-950/60 border-red-800/80 text-red-200'
                  : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
              }`}
            >
              <div className="font-bold flex items-center gap-1">
                {logs[0].isEmailCompromised ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{logs[0].isEmailCompromised ? 'CORREO COMPROMETIDO' : 'CORREO PROTEGIDO'}</span>
              </div>
              <div className="truncate text-zinc-300 mt-0.5">{logs[0].associatedEmail}</div>
            </div>
          </div>
        )}
      </div>

      {/* Pedagogical SOC Explanation: ¿Es posible o no? */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 space-y-2 leading-relaxed">
        <h4 className="font-semibold text-zinc-100 flex items-center gap-2 text-sm">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          Respuesta técnica: ¿Cómo sabemos si el mail está comprometido y la IP de quien tiene el archivo?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-zinc-400">
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <span className="font-semibold text-emerald-400 block font-sans">
              1. Localización e IP del Atacante (100% posible):
            </span>
            <p className="text-[11px]">
              Al abrir el Excel en su ordenador, la fórmula integrada <code className="text-cyan-300 font-mono">=WEBSERVICE(&quot;https://...&quot;)</code> conecta de forma invisible a este servidor. En ese milisegundo capturamos su <strong>dirección IP real</strong>, su proveedor de internet (ISP) y sus <strong>coordenadas geográficas</strong> exactas mostradas en el mapa.
            </p>
          </div>
          <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-1">
            <span className="font-semibold text-amber-400 block font-sans">
              2. Saber si el Correo está comprometido:
            </span>
            <p className="text-[11px]">
              Al crear el Excel, se vincula al correo que sospechas que fue hackeado (ej. <code className="text-emerald-300 font-mono">{testEmail}</code>). Cuando el atacante que robó ese correo abre el archivo, el sistema audita automáticamente el correo en bases de datos de brechas y malware (Redline / Lumma Stealer) para confirmar si sus credenciales fueron filtradas en la Dark Web.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
