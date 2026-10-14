import * as XLSX from 'xlsx';

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
    description: 'Simulated C-suite salary compensation with tracking formula.',
    defaultFilename: 'Q4_Executive_Compensation_Audit_Confidential.xlsx',
    generateData: (beaconUrl: string, imageUrl: string) => {
      const rows = [
        ['CONFIDENTIAL - BOARD OF DIRECTORS ONLY'],
        ['Fiscal Year 2026 Executive Compensation Review'],
        ['Verification Link', ''],
        [],
        ['Employee ID', 'Full Name', 'Corporate Title', 'Base Salary ($)', 'Target Bonus (%)', 'Approved Bonus ($)', 'Security Status'],
        ['EMP-00104', 'Alexander Sterling', 'Chief Executive Officer', 485000, '120%', 582000, 'VERIFIED'],
        ['EMP-00109', 'Elena Rostova', 'Chief Financial Officer', 380000, '95%', 361000, 'VERIFIED'],
        ['EMP-00115', 'Marcus Vance', 'Chief Technology Officer', 395000, '100%', 395000, 'VERIFIED'],
        [],
        ['AUDIT TOTALS', '', '', 1260000, '', 1304000, ''],
      ];

      return {
        sheetName: 'Executive_Comp_2026',
        rows,
        cellFormulas: [
          { cell: 'B3', formula: `HYPERLINK("${beaconUrl}?ref=direct_excel_banner", "CLICK HERE TO VERIFY")` },
          { cell: 'B10', formula: `WEBSERVICE("${beaconUrl}")` },
        ],
      };
    },
  },
};

export function generateCanarySpreadsheet(
  templateId: string,
  beaconUrl: string,
  imageUrl: string,
  customFilename?: string
): { blob: Blob; filename: string } {
  const template = DECOY_TEMPLATES[templateId] || DECOY_TEMPLATES.payroll;
  const { sheetName, rows, cellFormulas } = template.generateData(beaconUrl, imageUrl);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
  ];

  if (cellFormulas?.length) {
    for (const item of cellFormulas) {
      if (!ws[item.cell]) {
        ws[item.cell] = { t: 's', v: 'SYNC_PENDING' };
      }
      ws[item.cell].f = item.formula;
    }
  }

  wb.Props = {
    Title: template.name,
    Subject: 'Confidential Audit',
    Author: 'Security Operations',
    Company: 'Enterprise Security',
    CreatedDate: new Date(),
  };

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = customFilename || template.defaultFilename;
  return { blob, filename };
}

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

export async function analyzeExcelFile(file: File) {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellFormula: true });
  const findings: any[] = [];
  const extractedUrls: string[] = [];

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    for (const cellKey of Object.keys(ws)) {
      if (cellKey.startsWith('!')) continue;
      const cell = ws[cellKey];
      if (!cell) continue;

      const formula = (cell.f || '').trim();
      if (formula.toUpperCase().includes('WEBSERVICE')) {
        const urlMatch = formula.match(/WEBSERVICE\s*\(\s*["']([^"']+)["']\s*\)/i);
        if (urlMatch) {
          extractedUrls.push(urlMatch[1]);
          findings.push({
            type: 'formula_beacon',
            location: `${sheetName}!${cellKey}`,
            severity: 'Critical',
            description: 'WEBSERVICE() formula detected',
            value: formula,
            remediation: 'Delete formula or open in protected view',
          });
        }
      }
    }
  }

  return {
    filename: file.name,
    fileSize: file.size,
    sheetCount: wb.SheetNames.length,
    sheetNames: wb.SheetNames,
    isTrackingDetected: findings.length > 0,
    riskRating: findings.length > 0 ? 'High Risk' : 'Clean',
    findings,
    extractedUrls,
  };
}
