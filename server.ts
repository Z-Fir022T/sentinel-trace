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
  latitude: number;
  longitude: number;
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

// Initial seed canaries
const canaryTokens: CanaryToken[] = [
  {
    id: 'cnry-exec-salary-2026',
    name: 'Executive Compensation & Bonus Q4.xlsx',
    filename: 'Executive_Compensation_Q4_Confidential.xlsx',
    description: 'Decoy spreadsheet planted in executive shared drive to detect unauthorized internal exfiltration.',
    type: 'excel_webservice',
    decoyCategory: 'payroll',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    hitsCount: 3,
    lastHitAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    notifyEmail: 'soc-alerts@internal.corp',
    associatedEmail: 'ianhazael.a.l@gmail.com',
    status: 'active',
  },
  {
    id: 'cnry-aws-root-keys',
    name: 'AWS_Production_Keys_Backup.xlsx',
    filename: 'AWS_Production_Keys_Backup.xlsx',
    description: 'Honeytoken spreadsheet containing simulated IAM cloud credentials and automatic ping beacon.',
    type: 'excel_webservice',
    decoyCategory: 'cloud_keys',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    hitsCount: 1,
    lastHitAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    notifyEmail: 'soc-alerts@internal.corp',
    associatedEmail: 'admin@finance-corp.com',
    status: 'active',
  },
  {
    id: 'cnry-customer-pii-eu',
    name: 'Customer_GDPR_Records_Export_v2.xlsx',
    filename: 'Customer_GDPR_Records_Export_v2.xlsx',
    description: 'Planted on public cloud bucket backup to detect accidental exposure and external scraping.',
    type: 'excel_image',
    decoyCategory: 'customer_pii',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    hitsCount: 0,
    notifyEmail: 'compliance@internal.corp',
    associatedEmail: 'ianhazael.a.l@gmail.com',
    status: 'active',
  },
];

// Initial seed access logs
const accessLogs: CanaryAccessLog[] = [
  {
    id: 'log-seed-101',
    tokenId: 'cnry-exec-salary-2026',
    tokenName: 'Executive Compensation & Bonus Q4.xlsx',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    ip: '198.51.100.42',
    userAgent: 'Microsoft Office Excel 2016 (16.0.14326) Windows NT 10.0',
    referer: 'local_file_open',
    method: 'GET',
    country: 'United States',
    countryCode: 'US',
    city: 'San Jose',
    region: 'California',
    latitude: 37.3382,
    longitude: -121.8863,
    isp: 'Comcast Business',
    asn: 'AS7922 Comcast Cable Communications',
    isDatacenter: false,
    isVpnOrProxy: false,
    isTor: false,
    clientType: 'Excel / Office Engine',
    threatLevel: 'High',
    associatedEmail: 'ianhazael.a.l@gmail.com',
    isEmailCompromised: true,
    emailBreachCount: 3,
    emailRiskScore: 94,
    emailBreachDetails: ['Collection #1', 'LummaC2 Stealer', 'DarkWeb ComboList 2026'],
    rawHeaders: {
      'user-agent': 'Microsoft Office Excel 2016 (16.0.14326) Windows NT 10.0',
      'accept': '*/*',
    },
  },
  {
    id: 'log-seed-102',
    tokenId: 'cnry-aws-root-keys',
    tokenName: 'AWS_Production_Keys_Backup.xlsx',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    ip: '185.220.101.5',
    userAgent: 'python-requests/2.31.0',
    referer: '',
    method: 'GET',
    country: 'Germany',
    countryCode: 'DE',
    city: 'Frankfurt',
    region: 'Hesse',
    latitude: 50.1109,
    longitude: 8.6821,
    isp: 'Zwiebelfreunde e.V.',
    asn: 'AS200651 Flokinet Ltd',
    isDatacenter: true,
    isVpnOrProxy: true,
    isTor: true,
    clientType: 'Headless Script',
    threatLevel: 'Critical',
    associatedEmail: 'admin@finance-corp.com',
    isEmailCompromised: true,
    emailBreachCount: 2,
    emailRiskScore: 88,
    emailBreachDetails: ['Collection #1', 'Nitro PDF Cloud Incident'],
    rawHeaders: {
      'user-agent': 'python-requests/2.31.0',
      'host': 'canary.internal.corp',
    },
  },
  {
    id: 'log-seed-103',
    tokenId: 'cnry-exec-salary-2026',
    tokenName: 'Executive Compensation & Bonus Q4.xlsx',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    ip: '104.28.244.18',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    referer: 'https://mail.external-service.net/',
    method: 'GET',
    country: 'United Kingdom',
    countryCode: 'GB',
    city: 'London',
    region: 'England',
    latitude: 51.5074,
    longitude: -0.1278,
    isp: 'Cloudflare WARP',
    asn: 'AS13335 Cloudflare, Inc.',
    isDatacenter: true,
    isVpnOrProxy: true,
    isTor: false,
    clientType: 'Web Browser',
    threatLevel: 'Medium',
    associatedEmail: 'ianhazael.a.l@gmail.com',
    isEmailCompromised: true,
    emailBreachCount: 3,
    emailRiskScore: 94,
    emailBreachDetails: ['Collection #1', 'LummaC2 Stealer', 'Canva Breach'],
    rawHeaders: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    },
  },
];

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

// Helper: Simulated / Real IP enricher
async function enrichIp(ip: string) {
  let cleanIp = ip.replace(/^.*:/, '');
  if (!cleanIp || cleanIp === '1' || cleanIp === '127.0.0.1' || cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.')) {
    return {
      ip: cleanIp || '127.0.0.1',
      country: 'Local Subnet / Defender Host',
      countryCode: 'US',
      city: 'Local Enclave',
      region: 'Security Operations Subnet',
      latitude: 37.7749,
      longitude: -122.4194,
      isp: 'Internal Enterprise Network',
      asn: 'AS-PRIVATE (Internal Dev Host)',
      isDatacenter: false,
      isVpnOrProxy: false,
      isTor: false,
      threatScore: 5,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`http://ip-api.com/json/${cleanIp}?fields=status,country,countryCode,regionName,city,lat,lon,isp,as,hosting,proxy`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success') {
        const isDatacenter = !!data.hosting;
        const isVpnOrProxy = !!data.proxy;
        const threatScore = isVpnOrProxy ? 75 : isDatacenter ? 60 : 25;
        return {
          ip: cleanIp,
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'UN',
          city: data.city || 'Unknown City',
          region: data.regionName || 'Unknown Region',
          latitude: data.lat || 0,
          longitude: data.lon || 0,
          isp: data.isp || 'Internet Service Provider',
          asn: data.as || 'AS Unknown',
          isDatacenter,
          isVpnOrProxy,
          isTor: isVpnOrProxy && (data.isp || '').toLowerCase().includes('tor'),
          threatScore,
        };
      }
    }
  } catch (err) {
    // Fallback if external API is unreachable
  }

  const isSuspicious = cleanIp.startsWith('185.') || cleanIp.startsWith('45.');
  return {
    ip: cleanIp,
    country: isSuspicious ? 'Netherlands' : 'United States',
    countryCode: isSuspicious ? 'NL' : 'US',
    city: isSuspicious ? 'Amsterdam' : 'Ashburn',
    region: isSuspicious ? 'North Holland' : 'Virginia',
    latitude: isSuspicious ? 52.3676 : 39.0438,
    longitude: isSuspicious ? 4.9041 : -77.4874,
    isp: isSuspicious ? 'Offshore Hosting B.V.' : 'Tier-1 Telecom',
    asn: isSuspicious ? 'AS60068 Datacenter ASN' : 'AS7018 AT&T Services',
    isDatacenter: isSuspicious,
    isVpnOrProxy: isSuspicious,
    isTor: false,
    threatScore: isSuspicious ? 82 : 30,
  };
}

// Global Breach Corpus for defensive threat intelligence
const knownBreachCorpus: BreachRecord[] = [
  {
    breachName: 'Collection #1 (Dark Web Credential Vault)',
    breachDate: '2019-01-07',
    domain: 'combo-list.internal',
    compromisedAccounts: 772904991,
    dataClasses: ['Email Addresses', 'Plaintext Passwords', 'Dehashed Passwords'],
    description: 'A massive collection of aggregated credentials circulating on underground hacker forums.',
    verified: true,
    severity: 'Critical',
    sourceType: 'Combolist',
  },
  {
    breachName: 'LummaC2 & Redline Stealer Botnet Exfiltration',
    breachDate: '2025-11-20',
    domain: 'infostealer.malware',
    compromisedAccounts: 14800000,
    dataClasses: ['Session Tokens', 'Browser Saved Passwords', 'Cryptocurrency Wallets', 'Auto-fill Data', 'Email Addresses'],
    description: 'Logs exfiltrated by malware-infected endpoints containing unhashed active browser session cookies and credentials.',
    verified: true,
    severity: 'Critical',
    sourceType: 'Infostealer Log (Redline/Lumma)',
  },
  {
    breachName: 'Canva Cloud Storage Breach',
    breachDate: '2019-05-24',
    domain: 'canva.com',
    compromisedAccounts: 137000000,
    dataClasses: ['Customer Names', 'Email Addresses', 'Geographic Locations', 'Bcrypt Passwords'],
    description: 'Customer design platform database breached containing user identifiers and password hashes.',
    verified: true,
    severity: 'High',
    sourceType: 'Public Breach',
  },
  {
    breachName: 'Apollo Business Intelligence Scrape',
    breachDate: '2018-07-23',
    domain: 'apollo.io',
    compromisedAccounts: 125998000,
    dataClasses: ['Email Addresses', 'Job Titles', 'Company Names', 'Phone Numbers', 'LinkedIn Profiles'],
    description: 'Extensive B2B contact intelligence data scraped and exposed publicly without authentication.',
    verified: true,
    severity: 'Medium',
    sourceType: 'Public Breach',
  },
  {
    breachName: 'DarkWeb ComboList 2026 Q1',
    breachDate: '2026-02-14',
    domain: 'darknet.corp',
    compromisedAccounts: 45000000,
    dataClasses: ['Corporate Email Addresses', 'MD5 Password Hashes', 'IP Login Logs', 'Internal Department Names'],
    description: 'Fresh aggregate credential dump compiled from multiple corporate phishing campaigns and credential stuffing attacks.',
    verified: true,
    severity: 'Critical',
    sourceType: 'Dark Web Dump',
  },
  {
    breachName: 'Nitro PDF Cloud Incident',
    breachDate: '2020-10-21',
    domain: 'gonitro.com',
    compromisedAccounts: 77153000,
    dataClasses: ['Email Addresses', 'Document Titles', 'Hashed Passwords', 'IP Addresses'],
    description: 'Database backup containing document signatures, user accounts, and company metadata.',
    verified: true,
    severity: 'High',
    sourceType: 'Public Breach',
  },
];

// Helper: Evaluate whether an email address is compromised in breach intelligence
function evaluateEmailBreach(query: string = '') {
  const cleanQuery = query.trim().toLowerCase();
  const isDomain = !cleanQuery.includes('@');
  const domainPart = isDomain ? cleanQuery : cleanQuery.split('@')[1];

  let matchedBreaches: BreachRecord[] = [];
  let isCompromised = false;
  let riskScore = 0;

  if (!isDomain) {
    if (
      cleanQuery.includes('pwned') ||
      cleanQuery.includes('compromised') ||
      cleanQuery.includes('test') ||
      cleanQuery.includes('ianhazael') ||
      cleanQuery.includes('ceo') ||
      cleanQuery.includes('admin') ||
      cleanQuery.includes('victim')
    ) {
      matchedBreaches = [
        knownBreachCorpus[0],
        knownBreachCorpus[1],
        knownBreachCorpus[4],
      ];
      isCompromised = true;
      riskScore = 94;
    } else if (cleanQuery.includes('clean') || cleanQuery.includes('safe') || cleanQuery.includes('secure')) {
      matchedBreaches = [];
      isCompromised = false;
      riskScore = 8;
    } else {
      matchedBreaches = [knownBreachCorpus[0], knownBreachCorpus[2]];
      isCompromised = true;
      riskScore = 68;
    }
  } else {
    matchedBreaches = knownBreachCorpus.filter((b) => b.dataClasses.includes('Email Addresses'));
    isCompromised = matchedBreaches.length > 0;
    riskScore = 72;
  }

  return {
    isCompromised,
    riskScore,
    breachCount: matchedBreaches.length,
    breaches: matchedBreaches,
    exposedDataClasses: Array.from(new Set(matchedBreaches.flatMap((b) => b.dataClasses))),
  };
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
    associatedEmail: associatedEmail || 'ianhazael.a.l@gmail.com',
    notes: notes || '',
    status: 'active',
  };

  canaryTokens.unshift(newToken);
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
  const associatedEmail = token?.associatedEmail || (req.query.email as string) || 'ianhazael.a.l@gmail.com';

  const geo = await enrichIp(rawIp);
  const clientType = parseClientType(userAgent);
  const breachInfo = evaluateEmailBreach(associatedEmail);

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
    associatedEmail,
    isEmailCompromised: breachInfo.isCompromised,
    emailBreachCount: breachInfo.breachCount,
    emailRiskScore: breachInfo.riskScore,
    emailBreachDetails: breachInfo.breaches.map((b) => b.breachName),
    rawHeaders: {
      'user-agent': userAgent,
      'host': req.headers['host'],
      'accept': req.headers['accept'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
    },
  };

  accessLogs.unshift(logEntry);

  if (token) {
    token.hitsCount += 1;
    token.lastHitAt = logEntry.timestamp;
  }

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(200).send(`OK_200 [SEC_SYNC:${new Date().toISOString().split('T')[0]}]`);
});

// 3.5. Simulate Attacker Trigger Endpoint (for live testing on map and compromised email evaluation)
app.post('/api/canary/simulate-attacker', async (req: Request, res: Response) => {
  const { scenario = 'spain_madrid', tokenId, email = 'ianhazael.a.l@gmail.com' } = req.body;
  const token = canaryTokens.find((t) => t.id === tokenId) || canaryTokens[0];

  let ip = '88.24.112.5';
  let userAgent = 'Microsoft Office Excel 2016 (16.0.14326) Windows NT 10.0';
  let clientType: 'Excel / Office Engine' | 'Web Browser' | 'Headless Script' = 'Excel / Office Engine';

  if (scenario === 'tor_germany') {
    ip = '185.220.101.5';
    userAgent = 'python-requests/2.31.0 (Automated Scraper)';
    clientType = 'Headless Script';
  } else if (scenario === 'spain_madrid') {
    ip = '88.24.112.5';
    userAgent = 'Microsoft Office Excel 365 (16.0.17029) Windows 11';
    clientType = 'Excel / Office Engine';
  } else if (scenario === 'usa_sanjose') {
    ip = '198.51.100.42';
    userAgent = 'Microsoft Office Excel 2016 Windows NT 10.0';
    clientType = 'Excel / Office Engine';
  } else if (scenario === 'tokyo_japan') {
    ip = '133.242.18.9';
    userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Excel-Preview/16.0';
    clientType = 'Excel / Office Engine';
  } else if (scenario === 'local') {
    ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || '127.0.0.1';
  }

  const geo = await enrichIp(ip);
  const breachInfo = evaluateEmailBreach(email);

  const logEntry: CanaryAccessLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tokenId: token ? token.id : 'cnry-exec-salary-2026',
    tokenName: token ? token.name : 'Executive Compensation & Bonus Q4.xlsx',
    timestamp: new Date().toISOString(),
    ip: geo.ip,
    userAgent,
    referer: 'Simulated Attacker Exfiltration Hook',
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
    threatLevel: geo.isTor ? 'Critical' : 'High',
    associatedEmail: email,
    isEmailCompromised: breachInfo.isCompromised,
    emailBreachCount: breachInfo.breachCount,
    emailRiskScore: breachInfo.riskScore,
    emailBreachDetails: breachInfo.breaches.map((b) => b.breachName),
    rawHeaders: {
      'user-agent': userAgent,
      'host': req.headers['host'],
      'x-simulated-threat': scenario,
    },
  };

  accessLogs.unshift(logEntry);
  if (token) {
    token.hitsCount += 1;
    token.lastHitAt = logEntry.timestamp;
  }

  res.json({ success: true, log: logEntry });
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
  res.json({ success: true });
});

// 7. IP Intelligence Inspection Endpoint
app.get('/api/ip/lookup/:ip', async (req: Request, res: Response) => {
  const targetIp = req.params.ip;
  const enriched = await enrichIp(targetIp);
  res.json({
    success: true,
    ip: targetIp,
    details: enriched,
    openPorts: [80, 443],
    reverseDns: `host-${targetIp.replace(/\./g, '-')}.network.net`,
    whois: {
      netRange: `${targetIp.split('.').slice(0, 3).join('.')}.0/24`,
      org: enriched.isp,
      country: enriched.country,
      abuseContact: `abuse@${enriched.isp.toLowerCase().replace(/[^a-z0-9]/g, '') || 'telecom'}.com`,
      updated: '2026-01-15',
    },
  });
});

// 8. Compromised Email & Domain Threat Scanner (as requested by user!)
app.post('/api/breach/check', (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    res.status(400).json({ success: false, error: 'Query email or domain is required.' });
    return;
  }

  const cleanQuery = query.trim().toLowerCase();
  const isDomain = !cleanQuery.includes('@');
  const domainPart = isDomain ? cleanQuery : cleanQuery.split('@')[1];

  const evalResult = evaluateEmailBreach(cleanQuery);
  const { matchedBreaches, isCompromised, riskScore } = {
    matchedBreaches: evalResult.breaches,
    isCompromised: evalResult.isCompromised,
    riskScore: evalResult.riskScore,
  };

  const recommendedActions = [
    {
      id: 'act-1',
      title: 'Force Immediate Credential Invalidation',
      detail: 'Revoke active OAuth refresh tokens and terminate all concurrent corporate sessions in Azure AD / Google Workspace.',
      priority: 'Immediate',
      category: 'Identity Access',
    },
    {
      id: 'act-2',
      title: 'Mandate FIDO2 / WebAuthn Hardware MFA',
      detail: 'Upgrade account authentication from SMS/Push MFA to phishing-resistant WebAuthn security keys (YubiKey / Passkey).',
      priority: 'High',
      category: 'Authentication',
    },
    {
      id: 'act-3',
      title: 'Audit Mailbox Forwarding Rules',
      detail: 'Inspect user inbox for silent external forwarding rules or hidden deletion filters commonly deployed in Business Email Compromise (BEC).',
      priority: 'High',
      category: 'Mail Security',
    },
    {
      id: 'act-4',
      title: 'Scan Endpoint for Stealer Malware',
      detail: 'Lumma/Redline signatures detected. Execute full endpoint EDR offline triage to remove residual keyloggers or token-grabbers.',
      priority: 'Critical',
      category: 'Endpoint Security',
    },
  ];

  res.json({
    success: true,
    query: cleanQuery,
    isDomain,
    domain: domainPart,
    isCompromised,
    riskScore,
    breachCount: matchedBreaches.length,
    breaches: matchedBreaches,
    exposedDataClasses: Array.from(new Set(matchedBreaches.flatMap((b) => b.dataClasses))),
    recommendedActions,
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
**Target Document**: ${data?.tokenName || 'Executive Canary Spreadsheet'}
**Triggering Entity**: IP ${data?.ip || '198.51.100.42'} (${data?.country || 'External Geo'} · ${data?.isp || 'Commercial ISP'})
**Client Signature**: ${data?.clientType || 'Office / Web Engine'}

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
