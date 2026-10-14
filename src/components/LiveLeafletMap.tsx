import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CanaryAccessLog } from '../types/threat';

interface LiveLeafletMapProps {
  logs: CanaryAccessLog[];
  selectedLog: CanaryAccessLog | null;
  onSelectLog: (log: CanaryAccessLog) => void;
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const flag = (cc?: string | null) =>
  cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '';

const placeOf = (l: CanaryAccessLog) =>
  [l.city, l.region, l.country].filter(Boolean).join(', ') || l.country || 'Ubicación desconocida';

const toneOf = (l: CanaryAccessLog) => (l.threatLevel === 'Critical' ? 'crit' : l.threatLevel === 'High' ? 'high' : 'ok');
const isLocated = (l: CanaryAccessLog) => l.latitude != null && l.longitude != null;

const emailLine = (l: CanaryAccessLog) =>
  l.associatedEmail
    ? `${l.associatedEmail} · ${
        l.isEmailCompromised === undefined ? 'consultando…' : l.isEmailCompromised ? `comprometido (${l.emailBreachCount ?? 0} brechas)` : 'sin brechas'
      }`
    : '';

const rowsOf = (l: CanaryAccessLog): [string, string][] => {
  const rows: [string, string][] = [];
  if (isLocated(l)) rows.push(['Coord.', `${(l.latitude as number).toFixed(4)}, ${(l.longitude as number).toFixed(4)}`]);
  if (l.isp && l.isp !== 'Sin datos') rows.push(['Red', `${l.isp}${l.asn && l.asn !== 'Sin datos' ? ` · ${l.asn.split(' ')[0]}` : ''}`]);
  rows.push(['Archivo', l.tokenName]);
  rows.push(['Cliente', l.clientType]);
  rows.push(['Hora', new Date(l.timestamp).toLocaleString('es-MX')]);
  const mail = emailLine(l);
  if (mail) rows.push(['Correo', mail]);
  return rows;
};

export const LiveLeafletMap: React.FC<LiveLeafletMapProps> = ({ logs, selectedLog, onSelectLog }) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupRef = useRef<L.FeatureGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const seenRef = useRef<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const focusLog = useCallback((id: string) => {
    const map = mapRef.current;
    const marker = markersRef.current.get(id);
    if (!map || !marker) return;
    setActiveId(id);
    map.flyTo(marker.getLatLng(), 10, { duration: 0.8 });
    marker.openPopup();
  }, []);

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { worldCopyJump: true, zoomControl: true }).setView([20, -40], 2);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: 'tiles-dark',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    groupRef.current = L.featureGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const group = groupRef.current;
    const map = mapRef.current;
    if (!group || !map) return;
    group.clearLayers();
    markersRef.current.clear();

    logs.filter(isLocated).forEach((l) => {
      const icon = L.divIcon({
        className: '',
        html: `<div class="geo-pin ${toneOf(l)}${l.id === activeId ? ' active' : ''}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const rows = rowsOf(l).map(([k, v]) => `<br><span class="k">${esc(k)}</span> ${esc(v)}`).join('');
      const marker = L.marker([l.latitude as number, l.longitude as number], { icon, title: l.ip })
        .bindPopup(`<b>${esc(flag(l.countryCode))} ${esc(placeOf(l))}</b><br>${esc(l.ip)}${rows}`)
        .addTo(group);
      marker.on('click', () => {
        setActiveId(l.id);
        marker.openPopup();
      });
      markersRef.current.set(l.id, marker);
    });

    // Fit only when new points appear so the 8 s polling never moves the view
    const key = logs.filter(isLocated).map((l) => l.id).join('|');
    if (key && key !== seenRef.current) {
      seenRef.current = key;
      const pts = logs.filter(isLocated).map((l) => [l.latitude as number, l.longitude as number] as [number, number]);
      if (pts.length === 1) map.flyTo(pts[0], 8, { duration: 0.8 });
      else map.flyToBounds(L.latLngBounds(pts).pad(0.3), { duration: 0.8, maxZoom: 8 });
    }
  }, [logs, activeId]);

  useEffect(() => {
    if (selectedLog) focusLog(selectedLog.id);
  }, [selectedLog, focusLog]);

  const located = logs.filter(isLocated).length;

  return (
    <section className="geo">
      <aside className="geo-panel">
        <header className="geo-brand">
          <span className="geo-mark" aria-hidden="true" />
          <div>
            <h2>Mapa en vivo</h2>
            <p className="geo-sub">Dónde se abre cada documento señuelo</p>
          </div>
        </header>

        <div className="geo-results-head">
          <span>{logs.length ? `${located} de ${logs.length} localizada${logs.length === 1 ? '' : 's'}` : 'Sin aperturas'}</span>
        </div>

        <ol className="geo-results">
          {logs.length === 0 && (
            <li className="geo-empty">Cuando alguien abra un documento canary, su IP y ubicación aparecerán aquí.</li>
          )}
          {logs.map((l) => {
            const ok = isLocated(l);
            return (
              <li
                key={l.id}
                className={`geo-result${ok ? '' : ' err'}${l.id === activeId ? ' active' : ''}`}
                tabIndex={ok ? 0 : undefined}
                onClick={() => ok && focusLog(l.id)}
                onKeyDown={(e) => {
                  if (ok && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    focusLog(l.id);
                  }
                }}
              >
                <div className="r-ip">
                  <span>{l.ip}</span>
                  <span className={`r-tag ${toneOf(l)}`}>{l.threatLevel}</span>
                </div>
                {ok ? (
                  <div className="r-place">{`${flag(l.countryCode)} ${placeOf(l)}`.trim()}</div>
                ) : (
                  <div className="r-err">{l.country || 'No se pudo ubicar esta IP en el mapa.'}</div>
                )}
                <dl className="r-grid">
                  {rowsOf(l).map(([k, v]) => (
                    <React.Fragment key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </React.Fragment>
                  ))}
                </dl>
                <button
                  type="button"
                  className="geo-link r-report"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectLog(l);
                  }}
                >
                  Ver informe forense
                </button>
              </li>
            );
          })}
        </ol>

        <footer className="geo-foot">
          <p>
            La ubicación es aproximada a nivel ciudad; no corresponde a un domicilio. VPN, proxies y redes móviles pueden mostrar la ciudad del proveedor.
          </p>
        </footer>
      </aside>

      <div className="geo-map-wrap">
        <div ref={mapEl} className="geo-map" role="application" aria-label="Mapa de ubicaciones" />
      </div>
    </section>
  );
};
