import { promises as dns } from 'node:dns';
import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import JSZip from 'jszip';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Disk persistence: survive restarts & adopt orphan tokens from old Excel files
const DATA_DIR = path.resolve(process.env.DATA_DIR || './data');
const DATA_FILE = path.join(DATA_DIR, 'canary_store.json');
function loadStore(): { tokens: CanaryToken[]; logs: CanaryAccessLog[] } {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return { tokens: Array.isArray(parsed.tokens) ? parsed.tokens : [], logs: Array.isArray(parsed.logs) ? parsed.logs : [] };
    }
  } catch (err) {
    console.error('[persist] Read failed:', err);
  }
  return { tokens: [], logs: [] };
}
function persistStore(tokens: CanaryToken[], logs: CanaryAccessLog[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify({ tokens, logs }, null, 2), 'utf-8');
  } catch (err) {
    console.error('[persist] Write failed:', err);
  }
}

// Global CORS headers for Microsoft Excel and external telemetry clients
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (_req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

// Download entire project as a clean .zip file
app.get('/api/project/download-zip', async (_req: Request, res: Response) => {
  try {
    const zip = new JSZip();
    const filesToInclude = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'index.html',
      '.env.example',
      'server.ts',
      'src/main.tsx',
      'src/index.css',
      'src/App.tsx',
      'src/types/threat.ts',
      'src/utils/excelGenerator.ts',
      'src/components/Header.tsx',
      'src/components/LiveLeafletMap.tsx',
      'src/components/DashboardView.tsx',
      'src/components/CanaryManagerView.tsx',
      'src/components/EmailBreachView.tsx',
      'src/components/FileInspectorView.tsx',
      'src/components/IpIntelligenceView.tsx',
      'src/components/IncidentReportModal.tsx',
    ];

    for (const relativePath of filesToInclude) {
      const fullPath = path.resolve(relativePath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath);
        zip.file(relativePath, content);
      }
    }

    zip.file(
      'README.md',
      `# SentinelTrace - Defensive Canary & Threat Triage Platform

Sistema de ciberdefensa para generar hojas de cálculo Excel trampa (honeytokens), detectar IP de atacantes, auditar correos comprometidos e inspeccionar documentos maliciosos.

## Requisitos Previos
- Node.js versión 18 o superior
- npm

## Instalación y Ejecución Rápida
\`\`\`bash
# 1. Instalar dependencias
npm install

# 2. Iniciar en modo desarrollo
npm run dev
\`\`\`
Abre en tu navegador:
\`\`\`
http://localhost:3000
\`\`\`

## Despliegue en un Servidor VPS (Producción)
1. Compilar para producción:
   \`\`\`bash
   npm run build
   \`\`\`
2. Iniciar el servidor:
   \`\`\`bash
   npm start
   \`\`\`
3. Si utilizas un dominio o IP pública fija, define en tu archivo \`.env\`:
   \`\`\`env
   APP_URL="https://tu-dominio.com"
   \`\`\`
`
    );

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="sentinel-trace-complete.zip"');
    res.status(200).send(zipBuffer);
  } catch (err: any) {
    console.error('Error generating project zip:', err);
    res.status(500).json({ success: false, error: 'Failed to generate project zip' });
  }
});

// Expose public URL config so Excel documents embed the publicly accessible Cloud Run address
app.get('/api/system/config', (req: Request, res: Response) => {
  const host = req.headers['x-forwarded-host'] || req.headers['host'] || '';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const detectedPublicUrl = host ? `${proto}://${host}` : '';
  const publicUrl = process.env.APP_URL || detectedPublicUrl || 'https://ais-pre-xy4e3ob6lmzydj3sons7rd-344108943569.us-west1.run.app';

  res.json({
    success: true,
    publicUrl,
    detectedHost: host,
    environment: process.env.NODE_ENV || 'development',
  });
});

// In-memory threat database & canary state
export interface CanaryToken {
  id: string;
  name: string;
  filename: string;
  description: string;
  type: 'excel_webservice' | 'excel_image' | 'web_beacon' | 'hyperlink';
  decoyCategory: 'payroll' | 'credentials' | 'customer_pii' | 'merger_acquisition' | 'cloud_keys';
  createdAt: string;
  hitsCount: number;
  lastHitAt?: string;
  notifyEmail?: string;
  associatedEmail?: string; // Target email suspected of being compromised
  notes?: string;
  status: 'active' | 'paused' | 'triaged';
}

export interface CanaryAccessLog {
  id: string;
  tokenId: string;
  tokenName: string;
  timestamp: string;
  ip: string;
  userAgent: string;
  referer?: string;
  method: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  isp: string;
  asn: string;
  isDatacenter: boolean;
  isVpnOrProxy: boolean;
  isTor: boolean;
  clientType: 'Excel / Office Engine' | 'Web Browser' | 'Curl / Automated Bot' | 'Headless Script';
  threatLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  associatedEmail?: string;
  isEmailCompromised?: boolean;
  emailBreachCount?: number;
  emailRiskScore?: number;
  emailBreachDetails?: string[];
  rawHeaders: Record<string, string | string[] | undefined>;
}

export interface BreachRecord {
  breachName: string;
  breachDate: string;
  domain: string;
  compromisedAccounts: number;
  dataClasses: string[];
  description: string;
  verified: boolean;
  severity: 'Critical' | 'High' | 'Medium';
  sourceType: 'Public Breach' | 'Infostealer Log (Redline/Lumma)' | 'Dark Web Dump' | 'Combolist';
}

const { tokens: canaryTokens, logs: accessLogs } = loadStore();

// Helper: Inspect user agent for client type
function parseClientType(userAgent: string = ''): 'Excel / Office Engine' | 'Web Browser' | 'Curl / Automated Bot' | 'Headless Script' {
  const ua = userAgent.toLowerCase();
  if (ua.includes('excel') || ua.includes('office') || ua.includes('ms-office') || ua.includes('microsoft office')) {
    return 'Excel / Office Engine';
  }
  if (ua.includes('curl') || ua.includes('wget') || ua.includes('httpclient') || ua.includes('go-http-client')) {
    return 'Curl / Automated Bot';
  }
  if (ua.includes('python') || ua.includes('headless') || ua.includes('scrapy') || ua.includes('postman')) {
    return 'Headless Script';
  }
  return 'Web Browser';
}

// Helper: real IP enrichment via ip-api.com; unresolved IPs carry null coordinates (never invented)
interface IpGeo {
  ip: string;
  resolved: boolean;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  isp: string;
  asn: string;
  isDatacenter: boolean;
  isVpnOrProxy: boolean;
  isTor: boolean;
  threatScore: number;
}

function unresolvedGeo(ip: string, reason: string): IpGeo {
  return {
    ip, resolved: false, country: reason, countryCode: '', city: '', region: '',
    latitude: null, longitude: null, isp: 'Sin datos', asn: 'Sin datos',
    isDatacenter: false, isVpnOrProxy: false, isTor: false, threatScore: 0,
  };
}

async function enrichIp(ip: string): Promise<IpGeo> {
  const cleanIp = ip.replace(/^::ffff:/, '').replace(/^\[|\]$/g, '');
  const isPrivate =
    !cleanIp || cleanIp === '::1' || cleanIp === '127.0.0.1' ||
    /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|fc|fd)/i.test(cleanIp);
  if (isPrivate) return unresolvedGeo(cleanIp || 'desconocida', 'Red privada o local');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,country,countryCode,regionName,city,lat,lon,isp,as,hosting,proxy`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data?.status === 'success') {
        const isDatacenter = !!data.hosting;
        const isVpnOrProxy = !!data.proxy;
        return {
          ip: cleanIp,
          resolved: true,
          country: data.country || '',
          countryCode: data.countryCode || '',
          city: data.city || '',
          region: data.regionName || '',
          latitude: typeof data.lat === 'number' ? data.lat : null,
          longitude: typeof data.lon === 'number' ? data.lon : null,
          isp: data.isp || 'Sin datos',
          asn: data.as || 'Sin datos',
          isDatacenter,
          isVpnOrProxy,
          isTor: isVpnOrProxy && /\btor\b/i.test(data.isp || ''),
          threatScore: isVpnOrProxy ? 75 : isDatacenter ? 60 : 25,
        };
      }
    }
  } catch {
    // network failure -> unresolved below
  }
  return unresolvedGeo(cleanIp, 'No se pudo geolocalizar');
}

// Helper: real breach lookup via XposedOrNot (free, keyless; email only)
interface BreachCheck {
  ok: boolean;
  error?: string;
  isCompromised: boolean;
  riskScore: number;
  breachCount: number;
  breaches: BreachRecord[];
  exposedDataClasses: string[];
}

async function checkEmailBreaches(email: string): Promise<BreachCheck> {
  const empty: BreachCheck = { ok: false, isCompromised: false, riskScore: 0, breachCount: 0, breaches: [], exposedDataClasses: [] };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(
      `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`,
      { signal: controller.signal },
    );
    clearTimeout(timeout);
    if (!res.ok) return { ...empty, error: `XposedOrNot respondió ${res.status}` };
    const data = await res.json();
    const details: any[] = data?.ExposedBreaches?.breaches_details || [];
    const riskScore = Number(data?.BreachMetrics?.risk?.[0]?.risk_score ?? 0);
    const breaches: BreachRecord[] = details.map((b) => {
      const classes = String(b.xposed_data || '').split(';').map((x) => x.trim()).filter(Boolean);
      const stealer = /stealer|redline|lumma|raccoon|vidar/i.test(`${b.breach} ${b.details}`);
      return {
        breachName: b.breach,
        breachDate: b.added ? String(b.added).slice(0, 10) : String(b.xposed_date || ''),
        domain: b.domain || '',
        compromisedAccounts: Number(b.xposed_records) || 0,
        dataClasses: classes,
        description: b.details || '',
        verified: b.verified === 'Yes',
        severity: classes.some((c) => /password/i.test(c)) ? 'Critical' : classes.length > 4 ? 'High' : 'Medium',
        sourceType: stealer ? 'Infostealer Log (Redline/Lumma)' : 'Public Breach',
      };
    });
    return {
      ok: true,
      isCompromised: breaches.length > 0,
      riskScore: breaches.length ? riskScore : 0,
      breachCount: breaches.length,
      breaches,
      exposedDataClasses: Array.from(new Set(breaches.flatMap((b) => b.dataClasses))),
    };
  } catch (err: any) {
    return { ...empty, error: err?.name === 'AbortError' ? 'Tiempo de espera agotado' : 'No se pudo consultar XposedOrNot' };
  }
}

// 1x1 transparent GIF buffer for invisible pixel beacons
const TRANSPARENT_1PX_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

// ---------------- API ROUTES ----------------

// 1. Get Canary Tokens
app.get('/api/canary/tokens', (_req: Request, res: Response) => {
  res.json({
    success: true,
    tokens: canaryTokens,
    totalHits: canaryTokens.reduce((acc, t) => acc + t.hitsCount, 0),
  });
});

// 2. Create New Canary Token
app.post('/api/canary/create', (req: Request, res: Response) => {
  const { name, filename, description, type, decoyCategory, notifyEmail, associatedEmail, notes } = req.body;

  if (!name || !filename) {
    res.status(400).json({ success: false, error: 'Name and filename are required.' });
    return;
  }

  const newToken: CanaryToken = {
    id: `cnry-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    filename: filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
    description: description || 'Defensive Excel canary document',
    type: type || 'excel_webservice',
    decoyCategory: decoyCategory || 'payroll',
    createdAt: new Date().toISOString(),
    hitsCount: 0,
    notifyEmail: notifyEmail || '',
    associatedEmail: associatedEmail || '',
    notes: notes || '',
    status: 'active',
  };

  canaryTokens.unshift(newToken);
  persistStore(canaryTokens, accessLogs);
  res.json({ success: true, token: newToken });
});

// 3. Canary Ping / Webhook Trigger (Handles Excel =WEBSERVICE(...) calls or curl)
app.all(['/api/canary/ping/:tokenId', '/api/canary/ping'], async (req: Request, res: Response) => {
  const tokenId = req.params.tokenId || (req.query.token as string) || 'generic-test-token';
  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const userAgent = req.headers['user-agent'] || 'Unknown Client';
  const referer = (req.headers['referer'] as string) || (req.query.ref as string) || 'Direct Spreadsheet Query';
  const token = canaryTokens.find((t) => t.id === tokenId);
  const tokenName = token ? token.name : `Canary Beacon (${tokenId})`;
  const associatedEmail = token?.associatedEmail || (req.query.email as string) || '';

  const geo = await enrichIp(rawIp);
  const clientType = parseClientType(userAgent);

  let threatLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (geo.isTor || clientType === 'Headless Script') {
    threatLevel = 'Critical';
  } else if (geo.isDatacenter || geo.isVpnOrProxy || clientType === 'Curl / Automated Bot') {
    threatLevel = 'High';
  } else if (clientType === 'Excel / Office Engine') {
    threatLevel = 'High'; // Office beacon fired! Unauthorized access to decoy spreadsheet!
  } else {
    threatLevel = 'Medium';
  }

  const logEntry: CanaryAccessLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tokenId,
    tokenName,
    timestamp: new Date().toISOString(),
    ip: geo.ip,
    userAgent,
    referer,
    method: req.method,
    country: geo.country,
    countryCode: geo.countryCode,
    city: geo.city,
    region: geo.region,
    latitude: geo.latitude,
    longitude: geo.longitude,
    isp: geo.isp,
    asn: geo.asn,
    isDatacenter: geo.isDatacenter,
    isVpnOrProxy: geo.isVpnOrProxy,
    isTor: geo.isTor,
    clientType,
    threatLevel,
    associatedEmail: associatedEmail || undefined,
    rawHeaders: {
      'user-agent': userAgent,
      'host': req.headers['host'],
      'accept': req.headers['accept'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
    },
  };

  accessLogs.unshift(logEntry);
  persistStore(canaryTokens, accessLogs);

  if (token) {
    token.hitsCount += 1;
    token.lastHitAt = logEntry.timestamp;
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(200).send(`OK_200 [SEC_SYNC:${new Date().toISOString().split('T')[0]}]`);

  // Breach lookup runs after the response so the Excel call is never delayed
  if (associatedEmail.includes('@')) {
    void checkEmailBreaches(associatedEmail).then((b) => {
      if (!b.ok) return;
      logEntry.isEmailCompromised = b.isCompromised;
      logEntry.emailBreachCount = b.breachCount;
      logEntry.emailRiskScore = b.riskScore;
      logEntry.emailBreachDetails = b.breaches.map((x) => x.breachName);
    });
  }
});

// 4. Transparent 1x1 GIF Image Beacon (for `=IMAGE("...")` in Excel 365 or HTML tracking)
app.get(['/api/canary/beacon.png', '/api/canary/beacon.gif'], async (req: Request, res: Response) => {
  const tokenId = (req.query.id as string) || (req.query.token as string) || 'image-beacon-token';
  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    '127.0.0.1';

  const userAgent = req.headers['user-agent'] || 'Unknown Office Renderer';
  const token = canaryTokens.find((t) => t.id === tokenId);
  const tokenName = token ? token.name : `Image Canary (${tokenId})`;

  const geo = await enrichIp(rawIp);
  const clientType = parseClientType(userAgent);

  const logEntry: CanaryAccessLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tokenId,
    tokenName,
    timestamp: new Date().toISOString(),
    ip: geo.ip,
    userAgent,
    referer: req.headers['referer'] || 'Excel Image Fetch',
    method: 'GET',
    country: geo.country,
    countryCode: geo.countryCode,
    city: geo.city,
    region: geo.region,
    latitude: geo.latitude,
    longitude: geo.longitude,
    isp: geo.isp,
    asn: geo.asn,
    isDatacenter: geo.isDatacenter,
    isVpnOrProxy: geo.isVpnOrProxy,
    isTor: geo.isTor,
    clientType,
    threatLevel: 'High',
    rawHeaders: {
      'user-agent': userAgent,
    },
  };

  accessLogs.unshift(logEntry);
  persistStore(canaryTokens, accessLogs);
  if (token) {
    token.hitsCount += 1;
    token.lastHitAt = logEntry.timestamp;
  }

  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Content-Length', TRANSPARENT_1PX_GIF.length.toString());
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.status(200).end(TRANSPARENT_1PX_GIF);
});

// 5. Get Access Logs
app.get('/api/canary/logs', (req: Request, res: Response) => {
  const { tokenId, limit, threatLevel } = req.query;
  let filtered = [...accessLogs];

  if (tokenId && typeof tokenId === 'string') {
    filtered = filtered.filter((l) => l.tokenId === tokenId);
  }

  if (threatLevel && typeof threatLevel === 'string') {
    filtered = filtered.filter((l) => l.threatLevel.toLowerCase() === threatLevel.toLowerCase());
  }

  const max = limit ? parseInt(limit as string, 10) : 50;
  res.json({
    success: true,
    logs: filtered.slice(0, max),
    totalCount: accessLogs.length,
  });
});

// 6. Clear Logs or Remove Specific Log
app.post('/api/canary/logs/clear', (req: Request, res: Response) => {
  const { id } = req.body;
  if (id) {
    const index = accessLogs.findIndex((l) => l.id === id);
    if (index !== -1) {
      accessLogs.splice(index, 1);
    }
  } else {
    accessLogs.length = 0;
  }
  persistStore(canaryTokens, accessLogs);
  res.json({ success: true });
});

// 6.5 Caller's own IP, geolocated
app.get('/api/me', async (req: Request, res: Response) => {
  const rawIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    (req.headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    '';
  const geo = await enrichIp(rawIp);
  if (!geo.resolved) {
    res.status(422).json({ success: false, ip: geo.ip, error: geo.country });
    return;
  }
  res.json({ success: true, ip: geo.ip });
});

// 7. IP Intelligence Inspection Endpoint (real geolocation + real reverse DNS)
app.get('/api/ip/lookup/:ip', async (req: Request, res: Response) => {
  const targetIp = req.params.ip;
  if (!/^[0-9a-fA-F:.]{2,45}$/.test(targetIp)) {
    res.status(400).json({ success: false, error: 'IP inválida.' });
    return;
  }
  const enriched = await enrichIp(targetIp);
  let reverseDns: string | null = null;
  try {
    reverseDns = (await dns.reverse(targetIp))[0] || null;
  } catch {
    reverseDns = null;
  }
  res.json({ success: true, ip: targetIp, details: enriched, reverseDns });
});

// 8. Compromised email scanner (real data: XposedOrNot; email only, domain search needs a paid key)
app.post('/api/breach/check', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ success: false, error: 'Falta el correo a consultar.' });
    return;
  }
  const cleanQuery = query.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanQuery)) {
    res.status(400).json({ success: false, error: 'Ingresa un correo completo (usuario@dominio). La búsqueda por dominio requiere una API de pago.' });
    return;
  }

  const result = await checkEmailBreaches(cleanQuery);
  if (!result.ok) {
    res.status(502).json({ success: false, error: result.error || 'Servicio de brechas no disponible.' });
    return;
  }

  const recommendedActions = result.isCompromised
    ? [
        { id: 'act-1', title: 'Cambiar contraseña y cerrar sesiones activas', detail: 'Restablece la contraseña del correo y revoca tokens y sesiones abiertas en el proveedor (Google Workspace / Microsoft 365).', priority: 'Immediate', category: 'Identity Access' },
        { id: 'act-2', title: 'Activar MFA resistente a phishing', detail: 'Usa llaves FIDO2/passkeys en lugar de SMS o notificaciones push.', priority: 'High', category: 'Authentication' },
        { id: 'act-3', title: 'Revisar reglas de reenvío del buzón', detail: 'Busca reenvíos externos o filtros de borrado ocultos, típicos de un compromiso de correo empresarial.', priority: 'High', category: 'Mail Security' },
        ...(result.breaches.some((b) => b.sourceType.startsWith('Infostealer'))
          ? [{ id: 'act-4', title: 'Revisar el equipo por malware infostealer', detail: 'Una de las brechas es de tipo infostealer: analiza el equipo con EDR y cambia todas las credenciales guardadas en el navegador.', priority: 'Critical', category: 'Endpoint Security' }]
          : []),
      ]
    : [];

  res.json({
    success: true,
    query: cleanQuery,
    isDomain: false,
    domain: cleanQuery.split('@')[1],
    isCompromised: result.isCompromised,
    riskScore: result.riskScore,
    breachCount: result.breachCount,
    breaches: result.breaches,
    exposedDataClasses: result.exposedDataClasses,
    recommendedActions,
    source: 'XposedOrNot',
    checkedAt: new Date().toISOString(),
  });
});

// 9. AI Triage / Threat Summary
app.post('/api/ai/triage', async (req: Request, res: Response) => {
  const { incidentType, data } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a Senior Cyber Incident Response & SOC Threat Analyst.
Analyze the following defensive cybersecurity telemetry:
Incident Type: ${incidentType || 'Defensive Canary Document Triggered'}
Details: ${JSON.stringify(data, null, 2)}

Provide a concise, professional SOC investigation report containing:
1. Threat Level & Executive Summary
2. Potential Exfiltration Vector (e.g. Office beacon, macro, external query, stolen credential)
3. Immediate Containment Steps (firewall block, identity isolation, password reset)
4. Forensic Evidence Collection Advice

Format cleanly with clear headings and bullet points.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({
        success: true,
        summary: response.text,
        poweredBy: 'gemini-2.5-flash',
      });
      return;
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to defensive analyst engine:', err?.message);
    }
  }

  const summary = `### DEFENSIVE INCIDENT INVESTIGATION MEMO
**Classification**: PRIVILEGED DATA ACCESS DETECTED
**Target Document**: ${data?.tokenName || 'N/D'}
**Triggering Entity**: IP ${data?.ip || 'N/D'} (${data?.country || 'N/D'} · ${data?.isp || 'N/D'})
**Client Signature**: ${data?.clientType || 'N/D'}

#### 1. Executive Summary
A defensive honeytoken spreadsheet containing canary tracking formulas was accessed outside authorized network boundaries. The caller client executed outbound HTTP web query hooks, confirming document opening and potential exfiltration attempt.

#### 2. Risk Assessment
- **Exfiltration Probability**: HIGH. Decoy files are only accessed if an attacker has gained unauthorized read access to the file share or exported email attachments.
- **Identity Exposure**: Verify if caller IP corresponds to internal VPN egress or external adversary infrastructure.

#### 3. Immediate SOC Playbook Actions
1. **Network Containment**: Temporarily null-route or block inbound traffic from ${data?.ip || 'the flagged IP'} on perimeter firewalls.
2. **Access Isolation**: Identify user accounts with read permissions to "${data?.tokenName || 'the canary file'}" over the last 48 hours.
3. **Endpoint Triage**: Check host event logs (Event ID 4663 / File System Access) on the file server hosting the canary document.`;

  res.json({
    success: true,
    summary,
    poweredBy: 'SentinelTrace Rule-Based Defense Engine',
  });
});

// Vite middleware in dev or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SentinelTrace] Defensive SOC Server online at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
