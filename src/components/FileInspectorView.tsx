import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  FileCheck, 
  FileX, 
  Eye, 
  Code, 
  UserCheck, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ExcelScanResult } from '../types/threat';
import { analyzeExcelFile } from '../utils/excelGenerator';

export const FileInspectorView: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ExcelScanResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (file: File) => {
    setIsScanning(true);
    try {
      const result = await analyzeExcelFile(file);
      setScanResult(result);
    } catch (err) {
      console.error('Failed to parse file:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-6 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
        <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-400" />
          Defensive Excel Beacon &amp; Tracker Inspector
        </h2>
        <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
          Upload any received Excel spreadsheet (.xlsx, .xls, .csv) to detect whether it contains hidden tracking formulas (<code className="text-cyan-300 font-mono">=WEBSERVICE</code>, <code className="text-cyan-300 font-mono">=IMAGE</code>), outbound web queries, hidden worksheets, or external exfiltration hooks designed to log your IP.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`p-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer ${
          dragOver
            ? 'border-emerald-500 bg-emerald-950/20'
            : 'border-zinc-700/80 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900'
        }`}
      >
        <div className="p-3 rounded-full bg-zinc-800 text-emerald-400">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-200">
            Drag &amp; drop an Excel spreadsheet here, or browse files
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            Supports .xlsx, .xls, .xlsm, .csv files (Scanned locally in memory, no data leaves your browser)
          </p>
        </div>

        <input
          type="file"
          id="excel-file-input"
          accept=".xlsx,.xls,.xlsm,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />
        <label
          htmlFor="excel-file-input"
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer border border-zinc-700 transition-colors"
        >
          Select Spreadsheet File
        </label>

      </div>

      {/* Loading state */}
      {isScanning && (
        <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
          <p className="text-xs text-zinc-300 font-mono">Deconstructing spreadsheet XML and auditing formulas for outbound sockets...</p>
        </div>
      )}

      {/* Scan Results View */}
      {scanResult && !isScanning && (
        <div className="space-y-6">
          {/* Main Verdict Card */}
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              scanResult.isTrackingDetected
                ? 'bg-gradient-to-r from-red-950/40 via-red-900/20 to-zinc-900 border-red-800/80'
                : 'bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-zinc-900 border-emerald-800/80'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl border shrink-0 ${
                  scanResult.isTrackingDetected
                    ? 'bg-red-950 text-red-400 border-red-700/60 animate-pulse'
                    : 'bg-emerald-950 text-emerald-400 border-emerald-700/60'
                }`}
              >
                {scanResult.isTrackingDetected ? <AlertTriangle className="w-7 h-7" /> : <CheckCircle2 className="w-7 h-7" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-zinc-100 text-sm font-sans">{scanResult.filename}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      scanResult.isTrackingDetected
                        ? 'bg-red-900 text-red-100 border border-red-700'
                        : 'bg-emerald-900 text-emerald-100 border border-emerald-700'
                    }`}
                  >
                    VERDICT: {scanResult.riskRating.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                  {scanResult.isTrackingDetected
                    ? 'WARNING: This document contains active tracking formulas that transmit your IP address to an external server when opened in Microsoft Excel. Do NOT open in standard calculation mode.'
                    : 'No tracking formulas, external web beacons, or suspicious exfiltration URLs were discovered. The document appears safe.'}
                </p>
              </div>
            </div>

            {/* Document Metadata stats */}
            <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 font-mono text-xs space-y-1 text-zinc-400 shrink-0">
              <div>SHEETS: <span className="text-zinc-200">{scanResult.sheetCount}</span></div>
              <div>FILE SIZE: <span className="text-zinc-200">{(scanResult.fileSize / 1024).toFixed(1)} KB</span></div>
              {scanResult.author && <div>AUTHOR: <span className="text-zinc-200">{scanResult.author}</span></div>}
            </div>
          </div>

          {/* Extracted Outbound URLs & Endpoints */}
          {scanResult.extractedUrls.length > 0 && (
            <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-amber-400" />
                Detected Outbound Beacon Destinations (Destination URLs)
              </span>
              <div className="space-y-1.5 pt-1">
                {scanResult.extractedUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-red-400 flex items-center justify-between gap-3 overflow-hidden"
                  >
                    <span className="truncate select-all">{url}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 shrink-0">
                      IP LOGGER TARGET
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Findings Table */}
          <div className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Detailed Forensic Audit Breakdown ({scanResult.findings.length} findings)
            </h3>

            {scanResult.findings.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400">
                Clean spreadsheet. No outbound network calls detected.
              </div>
            ) : (
              <div className="space-y-3">
                {scanResult.findings.map((finding, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            finding.severity === 'Critical'
                              ? 'bg-red-950 text-red-300 border border-red-800'
                              : finding.severity === 'High'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {finding.severity}
                        </span>
                        <span className="font-mono text-xs text-zinc-300 font-semibold">
                          Location: {finding.location}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono capitalize">
                        Type: {finding.type.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      {finding.description}
                    </p>

                    <div className="p-2 rounded bg-zinc-900/90 border border-zinc-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                      <code>{finding.value}</code>
                    </div>

                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 pt-1 font-sans">
                      <span className="text-zinc-500 font-mono">Remediation:</span>
                      <span>{finding.remediation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
