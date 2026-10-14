import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

app.get('/api/system/config', (req: Request, res: Response) => {
  const host = req.headers['x-forwarded-host'] || req.headers['host'] || '';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const detectedPublicUrl = host ? `${proto}://${host}` : '';
  const publicUrl = process.env.APP_URL || detectedPublicUrl || 'http://localhost:3000';

  res.json({
    success: true,
    publicUrl,
    detectedHost: host,
    environment: process.env.NODE_ENV || 'development',
  });
});

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
  associatedEmail?: string;
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
];

const accessLogs: CanaryAccessLog[] = [];

function parseClientType(userAgent: string = ''): 'Excel / Office Engine' | 'Web Browser' | 'Curl / Automated Bot' | 'Headless Script' {
  const ua = userAgent.toLowerCase();
  if (ua.includes('excel') || ua.includes('office')) return 'Excel / Office Engine';
  if (ua.includes('curl') || ua.includes('wget')) return 'Curl / Automated Bot';
  if (ua.includes('python') || ua.includes('headless')) return 'Headless Script';
  return 'Web Browser';
}

async function enrichIp(ip: string) {
  let cleanIp = ip.replace(/^.*:/, '');
  if (!cleanIp || cleanIp === '1' || cleanIp === '127.0.0.1' || cleanIp.startsWith('10.') || cleanIp.startsWith('192.168.')) {
    return {
      ip: cleanIp || '127.0.0.1',
      country: 'Local Subnet',
      countryCode: 'US',
      city: 'Local',
      region: 'Local',
      latitude: 37.7749,
      longitude: -122.4194,
      isp: 'Internal Network',
      asn: 'AS-PRIVATE',
      isDatacenter: false,
      isVpnOrProxy: false,
      isTor: false,
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
      if (data?.status === 'success') {
        return {
          ip: cleanIp,
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'UN',
          city: data.city || 'Unknown',
          region: data.regionName || 'Unknown',
          latitude: data.lat || 0,
          longitude: data.lon || 0,
          isp: data.isp || 'ISP',
          asn: data.as || 'AS Unknown',
          isDatacenter: !!data.hosting,
          isVpnOrProxy: !!data.proxy,
          isTor: !!data.proxy && (data.isp || '').toLowerCase().includes('tor'),
        };
      }
    }
  } catch (err) {}

  return {
    ip: cleanIp,
    country: 'Unknown',
    countryCode: 'UN',
    city: 'Unknown',
    region: 'Unknown',
    latitude: 0,
    longitude: 0,
    isp: 'Unknown ISP',
    asn: 'AS Unknown',
    isDatacenter: false,
    isVpnOrProxy: false,
    isTor: false,
  };
}

const TRANSPARENT_1PX_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

app.get('/api/canary/tokens', (_req: Request, res: Response) => {
  res.json({
    success: true,
    tokens: canaryTokens,
    totalHits: canaryTokens.reduce((acc, t) => acc + t.hitsCount, 0),
  });
});

app.post('/api/canary/create', (req: Request, res: Response) => {
  const { name, filename, description, type, decoyCategory, notifyEmail, associatedEmail } = req.body;
  if (!name || !filename) {
    res.status(400).json({ success: false, error: 'Name and filename required.' });
    return;
  }

  const newToken: CanaryToken = {
    id: `cnry-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    filename: filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
    description: description || 'Defensive canary',
    type: type || 'excel_webservice',
    decoyCategory: decoyCategory || 'payroll',
    createdAt: new Date().toISOString(),
    hitsCount: 0,
    notifyEmail: notifyEmail || '',
    associatedEmail: associatedEmail || 'security@corp.com',
    status: 'active',
  };

  canaryTokens.unshift(newToken);
  res.json({ success: true, token: newToken });
});

app.all(['/api/canary/ping/:tokenId', '/api/canary/ping'], async (req: Request, res: Response) => {
  const tokenId = req.params.tokenId || (req.query.token as string) || 'generic-token';
  const rawIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const token = canaryTokens.find((t) => t.id === tokenId);

  const geo = await enrichIp(rawIp);
  const clientType = parseClientType(userAgent);

  const logEntry: CanaryAccessLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tokenId,
    tokenName: token?.name || `Token (${tokenId})`,
    timestamp: new Date().toISOString(),
    ip: geo.ip,
    userAgent,
    referer: (req.headers['referer'] as string) || 'Direct',
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
    threatLevel: 'Medium',
    associatedEmail: token?.associatedEmail,
    isEmailCompromised: false,
    emailBreachCount: 0,
    emailRiskScore: 0,
    rawHeaders: { 'user-agent': userAgent },
  };

  accessLogs.unshift(logEntry);
  if (token) {
    token.hitsCount += 1;
    token.lastHitAt = logEntry.timestamp;
  }

  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send('OK_200');
});

app.get('/api/canary/logs', (req: Request, res: Response) => {
  const { limit } = req.query;
  const max = limit ? parseInt(limit as string, 10) : 50;
  res.json({
    success: true,
    logs: accessLogs.slice(0, max),
    totalCount: accessLogs.length,
  });
});

app.get('/api/ip/lookup/:ip', async (req: Request, res: Response) => {
  const targetIp = req.params.ip;
  const enriched = await enrichIp(targetIp);
  res.json({
    success: true,
    ip: targetIp,
    details: enriched,
  });
});

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
    console.log(`[SentinelTrace] Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
