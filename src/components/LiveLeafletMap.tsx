import React, { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { CanaryAccessLog } from '../types/threat';

interface LiveLeafletMapProps {
  logs: CanaryAccessLog[];
  selectedLog: CanaryAccessLog | null;
  onSelectLog: (log: CanaryAccessLog) => void;
}

interface LookupResult {
  id: string;
  ip: string;
  ok: boolean;
  error?: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  isp: string;
  asn: string;
}

type Item = {
  id: string;
  kind: 'hit' | 'lookup';
  ip: string;
  lat: number | null;
  lng: number | null;
  tone: 'crit' | 'high' | 'ok' | 'lookup';
  place: string;
  tag: string;
  rows: [string, string][];
  note?: string;
  log?: CanaryAccessLog;
  raw: unknown;
};

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const flag = (cc?: string) =>
  cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '';

const placeOf = (r: { city?: string; region?: string; country?: string }) =>
  [r.city, r.region, r.country].filter(Boolean).join(', ') || r.country || 'Ubicación desconocida';

const toneOf = (l: CanaryAccessLog): Item['tone'] =>
  l.threatLevel === 'Critical' ? 'crit' : l.threatLevel === 'High' ? 'high' : 'ok';

const hitToItem = (l: CanaryAccessLog): Item => {
  const rows: [string, string][] = [];
  const located = l.latitude != null && l.longitude != null;
  if (located) rows.push(['Coord.', `${(l.latitude as number).toFixed(4)}, ${(l.longitude as number).toFixed(4)}`]);
  rows.push(['Red', l.isp && l.isp !== 'Sin datos' ? `${l.isp}${l.asn && l.asn !== 'Sin datos' ? ` · ${l.asn.split(' ')[0]}` : ''}` : 'Sin datos']);
  rows.push(['Archivo', l.tokenName]);
  rows.push(['Cliente', l.clientType]);
  rows.push(['Hora', new Date(l.timestamp).toLocaleString('es-MX')]);
  if (l.associatedEmail) {
    rows.push([
      'Correo',
      `${l.associatedEmail} · ${
        l.isEmailCompromised === undefined ? 'consultando…' : l.isEmailCompromised ? `en ${l.emailBreachCount ?? 0} brecha(s)` : 'sin brechas'
      }`,
    ]);
  }
  return {
    id: l.id,
    kind: 'hit',
    ip: l.ip,
    lat: l.latitude,
    lng: l.longitude,
    tone: toneOf(l),
    place: located ? `${flag(l.countryCode)} ${placeOf(l)}`.trim() : l.country || 'Sin geolocalización',
    tag: l.threatLevel,
    rows,
    note: located ? undefined : 'No se pudo ubicar esta IP en el mapa.',
    log: l,
    raw: l,
  };
};

const lookupToItem = (r: LookupResult): Item => ({
  id: r.id,
  kind: 'lookup',
  ip: r.ip,
  lat: r.latitude,
  lng: r.longitude,
  tone: 'lookup',
  place: r.ok ? `${flag(r.countryCode)} ${placeOf(r)}`.trim() : r.country || 'Sin geolocalización',
  tag: 'consulta',
  rows: r.ok
    ? [
        ['Coord.', `${r.latitude?.toFixed(4)}, ${r.longitude?.toFixed(4)}`],
        ['Red', `${r.isp}${r.asn && r.asn !== 'Sin datos' ? ` · ${r.asn.split(' ')[0]}` : ''}`],
      ]
    : [],
  note: r.ok ? undefined : r.error || 'No se pudo ubicar esta IP.',
  raw: r,
});

export const LiveLeafletMap: React.FC<LiveLeafletMapProps> = ({ logs, selectedLog, onSelectLog }) => {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const groupRef = useRef<L.FeatureGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const seenRef = useRef<string>('');

  const [tab, setTab] = useState<'hits' | 'lookups'>('hits');
  const [input, setInput] = useState('');
  const [lookups, setLookups] = useState<LookupResult[]>([]);
  const [status, setStatus] = useState<{ msg: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const hitItems = logs.map(hitToItem);
  const lookupItems = lookups.map(lookupToItem);
  const items = tab === 'hits' ? hitItems : lookupItems;
  const allMapped = [...hitItems, ...lookupItems];

  const focusItem = useCallback((id: string) => {
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

    allMapped.forEach((it) => {
      if (it.lat == null || it.lng == null) return;
      const icon = L.divIcon({
        className: '',
        html: `<div class="geo-pin ${it.tone}${it.id === activeId ? ' active' : ''}"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const rows = it.rows.map(([k, v]) => `<br><span class="k">${esc(k)}</span> ${esc(v)}`).join('');
      const marker = L.marker([it.lat, it.lng], { icon, title: it.ip })
        .bindPopup(`<b>${esc(it.place)}</b><br>${esc(it.ip)}${rows}`)
        .addTo(group);
      marker.on('click', () => focusItem(it.id));
      markersRef.current.set(it.id, marker);
    });

    // Fit only when new points appear so the 8 s polling never moves the view
    const key = allMapped.filter((i) => i.lat != null).map((i) => i.id).join('|');
    if (key && key !== seenRef.current) {
      seenRef.current = key;
      const pts = allMapped
        .filter((i) => i.lat != null && i.lng != null)
        .map((i) => [i.lat as number, i.lng as number] as [number, number]);
      if (pts.length === 1) map.flyTo(pts[0], 8, { duration: 0.8 });
      else if (pts.length > 1) map.flyToBounds(L.latLngBounds(pts).pad(0.3), { duration: 0.8, maxZoom: 8 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, lookups, activeId]);

  useEffect(() => {
    if (selectedLog) focusItem(selectedLog.id);
  }, [selectedLog, focusItem]);

  const lookupIps = async (ips: string[]) => {
    if (!ips.length) {
      setStatus({ msg: 'Escribe al menos una IP', error: true });
      return;
    }
    if (ips.length > 50) {
      setStatus({ msg: 'Máximo 50 IPs por consulta', error: true });
      return;
    }
    setBusy(true);
    setStatus({ msg: 'Consultando...' });
    const out: LookupResult[] = [];
    for (const ip of ips) {
      const id = `lk-${ip}-${Date.now()}`;
      try {
        const res = await fetch(`/api/ip/lookup/${encodeURIComponent(ip)}`);
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || `Error ${res.status}`);
        const d = data.details;
        out.push({
          id,
          ip,
          ok: d.resolved && d.latitude != null,
          error: d.resolved ? undefined : d.country,
          city: d.city, region: d.region, country: d.country, countryCode: d.countryCode,
          latitude: d.latitude, longitude: d.longitude, isp: d.isp, asn: d.asn,
        });
      } catch (e: any) {
        out.push({ id, ip, ok: false, error: e.message, city: '', region: '', country: '', countryCode: '', latitude: null, longitude: null, isp: '', asn: '' });
      }
    }
    seenRef.current = '';
    setLookups(out);
    setTab('lookups');
    setStatus(null);
    setBusy(false);
  };

  const parse = (t: string) => [...new Set(t.split(/[\s,;]+/).map((s) => s.replace(/^\[|\]$/g, '').trim()).filter(Boolean))];

  const myIp = async () => {
    setStatus({ msg: 'Detectando tu IP...' });
    try {
      const res = await fetch('/api/me');
      const data = await res.json();
      if (!res.ok || !data.ip) throw new Error(data.error || `Error ${res.status}`);
      setInput(data.ip);
      await lookupIps([data.ip]);
    } catch (e: any) {
      setStatus({ msg: e.message, error: true });
    }
  };

  const clearAll = () => {
    setInput('');
    setLookups([]);
    setStatus(null);
    setActiveId(null);
    seenRef.current = '';
    mapRef.current?.flyTo([20, -40], 2, { duration: 0.6 });
  };

  const download = (name: string, content: string, type: string) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const copyJson = async () => {
    const text = JSON.stringify(items.map((i) => i.raw), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setStatus({ msg: 'JSON copiado' });
      setTimeout(() => setStatus(null), 1500);
    } catch {
      download('ips.json', text, 'application/json');
    }
  };

  const exportCsv = () => {
    const cols = ['ip', 'place', 'lat', 'lng', 'tag'] as const;
    const cell = (v: unknown) => (v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const csv = [cols.join(','), ...items.map((i) => cols.map((c) => cell(i[c])).join(','))].join('\n');
    download(`ips-${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv');
  };

  const located = items.filter((i) => i.lat != null).length;
  const countLabel = items.length
    ? `${located} de ${items.length} localizada${items.length === 1 ? '' : 's'}`
    : tab === 'hits'
    ? 'Sin aperturas'
    : 'Sin consultas';

  return (
    <section className="geo">
      <aside className="geo-panel">
        <header className="geo-brand">
          <span className="geo-mark" aria-hidden="true" />
          <div>
            <h2>Rastreo de IP</h2>
            <p className="geo-sub">Aperturas de documentos señuelo</p>
          </div>
        </header>

        <form
          className="geo-query"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            lookupIps(parse(input));
          }}
        >
          <label htmlFor="geo-ips">
            Consultar IP <span className="geo-hint">una o varias, IPv4 o IPv6</span>
          </label>
          <textarea
            id="geo-ips"
            rows={3}
            spellCheck={false}
            value={input}
            placeholder={'8.8.8.8\n2001:4860:4860::8888'}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                lookupIps(parse(input));
              }
            }}
          />
          <div className="geo-actions">
            <button type="submit" className="geo-btn primary" disabled={busy}>Localizar</button>
            <button type="button" className="geo-btn" onClick={myIp} disabled={busy}>Mi IP</button>
            <button type="button" className="geo-btn ghost" onClick={clearAll}>Limpiar</button>
          </div>
        </form>

        <div className="geo-tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'hits'} className={tab === 'hits' ? 'on' : ''} onClick={() => setTab('hits')}>
            Aperturas ({hitItems.length})
          </button>
          <button role="tab" aria-selected={tab === 'lookups'} className={tab === 'lookups' ? 'on' : ''} onClick={() => setTab('lookups')}>
            Consultas ({lookupItems.length})
          </button>
        </div>

        <div className="geo-results-head">
          <span>{countLabel}</span>
          <div className="geo-export">
            <button type="button" className="geo-link" disabled={!items.length} onClick={copyJson}>Copiar JSON</button>
            <button type="button" className="geo-link" disabled={!items.length} onClick={exportCsv}>CSV</button>
          </div>
        </div>

        <ol className="geo-results">
          {items.length === 0 && (
            <li className="geo-empty">
              {tab === 'hits'
                ? 'Cuando alguien abra un documento canary, su IP y ubicación aparecerán aquí.'
                : 'Escribe una IP arriba para ubicarla en el mapa.'}
            </li>
          )}
          {items.map((it) => {
            const ok = it.lat != null && it.lng != null;
            return (
              <li
                key={it.id}
                className={`geo-result${ok ? '' : ' err'}${it.id === activeId ? ' active' : ''}`}
                tabIndex={ok ? 0 : undefined}
                onClick={() => ok && focusItem(it.id)}
                onKeyDown={(e) => {
                  if (ok && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    focusItem(it.id);
                  }
                }}
              >
                <div className="r-ip">
                  <span>{it.ip}</span>
                  <span className={`r-tag ${it.tone}`}>{it.tag}</span>
                </div>
                <div className="r-place">{it.place}</div>
                {it.note && <div className="r-err">{it.note}</div>}
                {it.rows.length > 0 && (
                  <dl className="r-grid">
                    {it.rows.map(([k, v]) => (
                      <React.Fragment key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                )}
                {it.log && (
                  <button
                    type="button"
                    className="geo-link r-report"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLog(it.log as CanaryAccessLog);
                    }}
                  >
                    Ver informe forense
                  </button>
                )}
              </li>
            );
          })}
        </ol>

        <footer className="geo-foot">
          <p>
            La ubicación es aproximada a nivel ciudad; no corresponde a un domicilio. VPN, proxies y redes móviles pueden mostrar la ciudad del proveedor.
          </p>
          <p className="geo-source">
            Geolocalización por <a href="https://ip-api.com" target="_blank" rel="noopener noreferrer">ip-api.com</a>.
          </p>
        </footer>
      </aside>

      <div className="geo-map-wrap">
        <div ref={mapEl} className="geo-map" role="application" aria-label="Mapa de ubicaciones" />
        {status && <div className={`geo-status${status.error ? ' error' : ''}`}>{status.msg}</div>}
      </div>
    </section>
  );
};
