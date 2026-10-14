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

export interface EmailBreachAuditResult {
  success: boolean;
  query: string;
  isDomain: boolean;
  domain: string;
  isCompromised: boolean;
  riskScore: number;
  breachCount: number;
  breaches: any[];
  exposedDataClasses: string[];
  recommendedActions: any[];
  checkedAt: string;
}

export interface ExcelFinding {
  type: string;
  location: string;
  severity: string;
  description: string;
  value: string;
  remediation: string;
}

export interface ExcelScanResult {
  filename: string;
  fileSize: number;
  sheetCount: number;
  sheetNames: string[];
  author?: string;
  lastModifiedBy?: string;
  isTrackingDetected: boolean;
  riskRating: string;
  findings: ExcelFinding[];
  extractedUrls: string[];
}
