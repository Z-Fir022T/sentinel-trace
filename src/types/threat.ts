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

export interface EmailBreachAuditResult {
  success: boolean;
  query: string;
  isDomain: boolean;
  domain: string;
  isCompromised: boolean;
  riskScore: number;
  breachCount: number;
  breaches: BreachRecord[];
  exposedDataClasses: string[];
  recommendedActions: {
    id: string;
    title: string;
    detail: string;
    priority: string;
    category: string;
  }[];
  checkedAt: string;
}

export interface ExcelFinding {
  type: 'formula_beacon' | 'image_beacon' | 'hyperlink' | 'hidden_sheet' | 'suspicious_macro_indicator' | 'metadata_leak';
  location: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
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
  riskRating: 'Clean' | 'Low Risk' | 'Medium Risk' | 'High Risk - Tracking Active' | 'Critical';
  findings: ExcelFinding[];
  extractedUrls: string[];
}
