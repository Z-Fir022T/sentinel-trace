import * as XLSX from 'xlsx';
import { ExcelScanResult, ExcelFinding } from '../types/threat';

export interface DecoyTemplateConfig {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultFilename: string;
  generateData: (beaconUrl: string, imageUrl: string) => {
    sheetName: string;
    rows: any[][];
    cellFormulas?: { cell: string; formula: string }[];
  };
}

export const DECOY_TEMPLATES: Record<string, DecoyTemplateConfig> = {
  payroll: {
    id: 'payroll',
    name: 'Executive Compensation & Q4 Bonuses',
    category: 'Payroll & HR',
    description: 'High-attractiveness honeytoken containing simulated C-suite salary compensation, stock grants, and tracking formula.',
    defaultFilename: 'Q4_Executive_Compensation_Audit_Confidential.xlsx',
    generateData: (beaconUrl: string, imageUrl: string) => {
      const rows = [
        ['CONFIDENTIAL - BOARD OF DIRECTORS ONLY - DO NOT DISTRIBUTE'],
        ['Fiscal Year 2026 Executive Performance & Retention Compensation Review'],
        ['ENLACE DE VERIFICACIÓN / AUDITORÍA EN DIRECTO:', ''], // Cell B3 will hold HYPERLINK
        ['AVISO DE SEGURIDAD: En caso de aparecer la barra amarilla de Microsoft Excel "Vista Protegida", pulse "Habilitar edición".'],
        [],
        ['Employee ID', 'Full Name', 'Corporate Title', 'Base Salary ($)', 'Target Bonus (%)', 'Approved Bonus ($)', 'Equity Grant (RSU)', 'Security Verification Status'],
        ['EMP-00104', 'Alexander Sterling', 'Chief Executive Officer', 485000, '120%', 582000, '45,000 RSUs', 'VERIFIED_ACTIVE'],
        ['EMP-00109', 'Elena Rostova', 'Chief Financial Officer', 380000, '95%', 361000, '28,000 RSUs', 'VERIFIED_ACTIVE'],
        ['EMP-00115', 'Marcus Vance', 'Chief Technology Officer', 395000, '100%', 395000, '32,500 RSUs', 'VERIFIED_ACTIVE'],
        ['EMP-00122', 'Sarah Jenkins', 'SVP Global Sales', 320000, '115%', 368000, '22,000 RSUs', 'VERIFIED_ACTIVE'],
        ['EMP-00138', 'David Chen', 'General Counsel', 340000, '80%', 272000, '18,000 RSUs', 'VERIFIED_ACTIVE'],
        [],
        ['AUDIT TOTALS', '', '', 1920000, '', 1978000, '145,500 RSUs', ''],
        [],
        ['NOTE: Compensation review is cross-referenced with internal compliance telemetry.'],
        ['System Telemetry Checksum', ''], // Cell B16
        ['Compliance Seal Beacon', ''],    // Cell B17
      ];

      return {
        sheetName: 'Executive_Comp_2026',
        rows,
        cellFormulas: [
          { cell: 'B3', formula: `HYPERLINK("${beaconUrl}?ref=direct_excel_banner", "👉 CLICK AQUÍ PARA PROBAR Y REGISTRAR APERTURA EN EL NAVEGADOR")` },
          { cell: 'B16', formula: `WEBSERVICE("${beaconUrl}")` },
          { cell: 'B17', formula: `IMAGE("${imageUrl}")` },
          { cell: 'H7', formula: `HYPERLINK("${beaconUrl}?ref=executive_salary_audit", "VERIFIED_ACTIVE [Audit Link]")` },
          { cell: 'H8', formula: `HYPERLINK("${beaconUrl}?ref=cfo_salary_audit", "VERIFIED_ACTIVE [Audit Link]")` },
        ],
      };
    },
  },

  cloud_keys: {
    id: 'cloud_keys',
    name: 'AWS & Azure Root Infrastructure Keys',
    category: 'Cloud Credentials',
    description: 'Targeted at automated scripts and threat actors seeking IAM access keys or database credentials.',
    defaultFilename: 'Cloud_Production_Root_Access_Credentials.xlsx',
    generateData: (beaconUrl: string, imageUrl: string) => {
      const rows = [
        ['PRODUCTION CLOUD ASSET CREDENTIAL REPOSITORY - RESTRICTED ACCESS'],
        ['Security Operations Notice: Any unauthorized access to this sheet is audited.'],
        [],
        ['Environment', 'Cloud Provider', 'IAM Access Key ID', 'Secret Access Key / Connection String', 'Region', 'Status Check'],
        ['Production Primary', 'Amazon Web Services', 'AKIAZ7TESTHONEYTOKEN99', 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', 'us-east-1', 'ONLINE'],
        ['Database Primary Cluster', 'AWS RDS Aurora Postgres', 'db_prod_admin', 'postgres://dbadmin:H0neyP0t_SecP@ss2026!@prod-db.internal:5432/core', 'us-east-1', 'ONLINE'],
        ['Analytics BigQuery', 'Google Cloud Platform', 'sa-bi-analytics@prod.iam', '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----', 'global', 'ONLINE'],
        ['Kubernetes Cluster EKS', 'AWS EKS Kubeconfig', 'eks-admin-token-cluster-01', 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.dummyHoneyTokenPayloadForDefensiveAudit', 'us-west-2', 'ONLINE'],
        [],
        ['Health Check Pingback Status:', ''], // Cell B10
        ['Image Beacon Validation:', ''],     // Cell B11
      ];

      return {
        sheetName: 'Prod_Cloud_Secrets',
        rows,
        cellFormulas: [
          { cell: 'B10', formula: `WEBSERVICE("${beaconUrl}")` },
          { cell: 'B11', formula: `IMAGE("${imageUrl}")` },
          { cell: 'F5', formula: `HYPERLINK("${beaconUrl}?ref=aws_primary_cluster", "ONLINE [Verify Ping]")` },
        ],
      };
    },
  },

  customer_pii: {
    id: 'customer_pii',
    name: 'Customer PII & High-Net-Worth Accounts',
    category: 'Compliance & GDPR',
    description: 'Decoy database export designed to trigger upon exfiltration of sensitive user databases.',
    defaultFilename: 'Customer_VIP_Accounts_PII_Export.xlsx',
    generateData: (beaconUrl: string, imageUrl: string) => {
      const rows = [
        ['INTERNAL AUDIT ONLY - CUSTOMER VIP RELATIONSHIPS & PAYMENT DATA'],
        [],
        ['Customer ID', 'Full Name', 'Primary Email', 'Billing Address', 'Masked Card Number', 'Annual Balance ($)', 'Sync Verification'],
        ['CUST-88192', 'Victoria Sterling', 'v.sterling@private-wealth.org', '742 Evergreen Terrace, Springfield, OR', '4111-XXXX-XXXX-9842', 245000, 'SYNC_OK'],
        ['CUST-88193', 'Julian Thorne', 'jthorne@vanguard-corp.eu', '14 Kensington Square, London, W8 5HP', '5424-XXXX-XXXX-1120', 189500, 'SYNC_OK'],
        ['CUST-88194', 'Claire DuPont', 'claire.dupont@elysee-finance.fr', '28 Rue de la Paix, 75002 Paris', '3782-XXXXXX-00192', 412000, 'SYNC_OK'],
        ['CUST-88195', 'Kenji Takahashi', 'k.takahashi@tokyo-ventures.jp', 'Minato-ku, Roppongi 6-10-1, Tokyo', '4024-XXXX-XXXX-3341', 310000, 'SYNC_OK'],
        [],
        ['Telemetry Token Status: ', ''], // Cell B9
        ['Validation Image: ', ''],       // Cell B10
      ];

      return {
        sheetName: 'Customer_Accounts',
        rows,
        cellFormulas: [
          { cell: 'B9', formula: `WEBSERVICE("${beaconUrl}")` },
          { cell: 'B10', formula: `IMAGE("${imageUrl}")` },
          { cell: 'G4', formula: `HYPERLINK("${beaconUrl}?ref=customer_ledger_sync", "SYNC_OK [Check Ledger]")` },
        ],
      };
    },
  },

  merger_acquisition: {
    id: 'merger_acquisition',
    name: 'Project Titan - M&A Acquisition Valuation',
    category: 'Corporate Confidential',
    description: 'Strategic deal document with decoy valuation models and embedded telemetry trigger.',
    defaultFilename: 'Project_Titan_Confidential_MA_Valuation_Model.xlsx',
    generateData: (beaconUrl: string, imageUrl: string) => {
      const rows = [
        ['PROJECT TITAN - PRIVILEGED ACQUISITION TARGET EVALUATION MODEL'],
        ['Strict Non-Disclosure Notice: Unauthorized distribution triggers automated compliance logging.'],
        [],
        ['Metric / Financial Item', 'Target Company A ($M)', 'Target Company B ($M)', 'Synergy Potential', 'Regulatory Risk'],
        ['Enterprise Valuation', '$420.00', '$310.50', 'High (+$45M EBITDA)', 'Low (DoJ/FTC Approval Expected)'],
        ['FY2025 Revenue', '$88.50', '$62.20', 'Cross-sell across EMEA', 'None'],
        ['Projected EBITDA Margin', '28.4%', '24.1%', '+320 bps operational optimization', 'Low'],
        ['Cash on Balance Sheet', '$42.10', '$18.90', 'Immediate liquidity injection', 'None'],
        [],
        ['Data Feed Live Anchor:', ''], // Cell B10
        ['Image Security Pixel:', ''],  // Cell B11
      ];

      return {
        sheetName: 'MA_Valuation',
        rows,
        cellFormulas: [
          { cell: 'B10', formula: `WEBSERVICE("${beaconUrl}")` },
          { cell: 'B11', formula: `IMAGE("${imageUrl}")` },
          { cell: 'E5', formula: `HYPERLINK("${beaconUrl}?ref=project_titan_ftc_dossier", "Low (DoJ/FTC Approval) [Dossier]")` },
        ],
      };
    },
  },
};

/**
 * Generate a real, downloadable .xlsx binary file containing the decoy data and embedded tracking formula
 */
export function generateCanarySpreadsheet(
  templateId: string,
  beaconUrl: string,
  imageUrl: string,
  customFilename?: string
): { blob: Blob; filename: string } {
  const template = DECOY_TEMPLATES[templateId] || DECOY_TEMPLATES.payroll;
  const { sheetName, rows, cellFormulas } = template.generateData(beaconUrl, imageUrl);

  // Create new workbook
  const wb = XLSX.utils.book_new();

  // Create worksheet from 2D array
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for realistic appearance
  ws['!cols'] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
    { wch: 26 },
  ];

  // Embed tracking formulas into specific cells
  if (cellFormulas && cellFormulas.length > 0) {
    for (const item of cellFormulas) {
      if (!ws[item.cell]) {
        ws[item.cell] = { t: 's', v: 'SYNC_PENDING' };
      }
      ws[item.cell].f = item.formula;
    }
  }

  // Set workbook author and title metadata
  wb.Props = {
    Title: template.name,
    Subject: 'Confidential Internal Financial & Infrastructure Audit',
    Author: 'Corporate Financial Controls & Security Compliance',
    Company: 'Internal Enterprise Security Operations',
    CreatedDate: new Date(),
  };

  // Append sheet
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate binary array
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const filename = customFilename || template.defaultFilename;
  return { blob, filename };
}

/**
 * Download a generated Blob to the user's browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Defensive Inspector: Analyze any uploaded Excel file for tracking formulas, web queries, macros, or outbound beacons
 */
export async function analyzeExcelFile(file: File): Promise<ExcelScanResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellFormula: true });

  const findings: ExcelFinding[] = [];
  const extractedUrls: string[] = [];

  // 1. Inspect workbook metadata
  if (wb.Props) {
    if (wb.Props.Author) {
      findings.push({
        type: 'metadata_leak',
        location: 'Workbook Metadata: Author',
        severity: 'Low',
        description: `Author metadata found: "${wb.Props.Author}"`,
        value: wb.Props.Author,
        remediation: 'Scrub personal document metadata prior to public distribution.',
      });
    }
    if (wb.Props.Company) {
      findings.push({
        type: 'metadata_leak',
        location: 'Workbook Metadata: Company',
        severity: 'Low',
        description: `Company metadata found: "${wb.Props.Company}"`,
        value: wb.Props.Company,
        remediation: 'Clear organization information in document properties.',
      });
    }
  }

  // 2. Scan every worksheet and cell
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    for (const cellKey of Object.keys(ws)) {
      if (cellKey.startsWith('!')) continue; // skip sheet metadata keys

      const cell = ws[cellKey];
      if (!cell) continue;

      const formula = (cell.f || '').trim();
      const stringValue = String(cell.v || '');

      // Check for WEBSERVICE beacon (primary Excel tracking mechanism)
      if (formula.toUpperCase().includes('WEBSERVICE')) {
        const urlMatch = formula.match(/WEBSERVICE\s*\(\s*["']([^"']+)["']\s*\)/i);
        const url = urlMatch ? urlMatch[1] : formula;
        if (urlMatch) extractedUrls.push(url);

        findings.push({
          type: 'formula_beacon',
          location: `${sheetName}!${cellKey}`,
          severity: 'Critical',
          description: 'Active outbound HTTP beacon detected via WEBSERVICE() formula! Opening this spreadsheet will ping an external server with your IP and User-Agent.',
          value: formula,
          remediation: 'Delete this formula or open spreadsheet in protected view with external data connections disabled.',
        });
      }

      // Check for IMAGE formula with external HTTP(S) url
      if (formula.toUpperCase().includes('IMAGE(') && (formula.includes('http://') || formula.includes('https://'))) {
        const urlMatch = formula.match(/IMAGE\s*\(\s*["']([^"']+)["']\s*\)/i);
        const url = urlMatch ? urlMatch[1] : formula;
        if (urlMatch) extractedUrls.push(url);

        findings.push({
          type: 'image_beacon',
          location: `${sheetName}!${cellKey}`,
          severity: 'High',
          description: 'Dynamic web image beacon detected via IMAGE() formula. When rendered, your network IP is transmitted to the remote host.',
          value: formula,
          remediation: 'Inspect the destination URL and disable automatic image downloads.',
        });
      }

      // Check for HYPERLINK formula pointing to external tracking endpoints
      if (formula.toUpperCase().includes('HYPERLINK(')) {
        findings.push({
          type: 'hyperlink',
          location: `${sheetName}!${cellKey}`,
          severity: 'Medium',
          description: 'External hyperlink embedded in formula. Clicking will navigate to external destination.',
          value: formula,
          remediation: 'Verify link destination before clicking.',
        });
      }

      // Check for raw tracking URLs in cell text values
      if (
        (stringValue.includes('http://') || stringValue.includes('https://')) &&
        (stringValue.includes('/canary/') || stringValue.includes('/ping') || stringValue.includes('/beacon') || stringValue.includes('/track'))
      ) {
        extractedUrls.push(stringValue);
        findings.push({
          type: 'hyperlink',
          location: `${sheetName}!${cellKey}`,
          severity: 'High',
          description: 'Suspicious tracking or beacon URL discovered inside text cell contents.',
          value: stringValue,
          remediation: 'Inspect hostname reputation using SentinelTrace IP/Domain tool.',
        });
      }
    }
  }

  // Determine Overall Risk Rating
  const hasCritical = findings.some((f) => f.severity === 'Critical');
  const hasHigh = findings.some((f) => f.severity === 'High');
  const hasMedium = findings.some((f) => f.severity === 'Medium');

  let riskRating: 'Clean' | 'Low Risk' | 'Medium Risk' | 'High Risk - Tracking Active' | 'Critical' = 'Clean';
  if (hasCritical) {
    riskRating = 'Critical';
  } else if (hasHigh) {
    riskRating = 'High Risk - Tracking Active';
  } else if (hasMedium) {
    riskRating = 'Medium Risk';
  } else if (findings.length > 0) {
    riskRating = 'Low Risk';
  }

  return {
    filename: file.name,
    fileSize: file.size,
    sheetCount: wb.SheetNames.length,
    sheetNames: wb.SheetNames,
    author: wb.Props?.Author,
    lastModifiedBy: wb.Props?.LastAuthor,
    isTrackingDetected: hasCritical || hasHigh,
    riskRating,
    findings,
    extractedUrls,
  };
}
