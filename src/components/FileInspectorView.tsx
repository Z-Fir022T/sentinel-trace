import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { analyzeExcelFile } from '../utils/excelGenerator';
import { ExcelScanResult } from '../types/threat';

export const FileInspectorView: React.FC = () => {
  const [result, setResult] = useState<ExcelScanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    try {
      const res = await analyzeExcelFile(file);
      setResult(res);
    } catch (err) {
      console.error('Error analyzing file:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-8 rounded-lg bg-zinc-900 border-2 border-dashed border-zinc-700 text-center cursor-pointer hover:border-emerald-600 hover:bg-zinc-900/50 transition-all">
        <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
          id="file-input"
        />
        <label htmlFor="file-input" className="cursor-pointer">
          <p className="text-white font-semibold mb-1">Upload Excel File</p>
          <p className="text-sm text-zinc-400">Drag and drop or click to select</p>
        </label>
      </div>

      {loading && <div className="text-center text-zinc-400">Analyzing file...</div>}

      {result && (
        <div className="p-5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-zinc-400">Filename</div>
              <div className="font-semibold text-white text-sm">{result.filename}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">File Size</div>
              <div className="font-semibold text-white">{(result.fileSize / 1024).toFixed(2)} KB</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Sheets</div>
              <div className="font-semibold text-white">{result.sheetCount}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-400">Risk Rating</div>
              <div className={`font-semibold ${result.isTrackingDetected ? 'text-red-400' : 'text-green-400'}`}>
                {result.riskRating}
              </div>
            </div>
          </div>

          {result.findings.length > 0 && (
            <div className="border-t border-zinc-700 pt-4">
              <h3 className="font-semibold text-white mb-3">Findings</h3>
              <div className="space-y-2">
                {result.findings.map((f, i) => (
                  <div key={i} className="p-3 rounded-lg bg-zinc-950 border border-red-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-red-300">{f.type}</div>
                        <div className="text-xs text-zinc-400">{f.location}</div>
                        <div className="text-sm text-zinc-300 mt-1">{f.description}</div>
                      </div>
                      <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded">
                        {f.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
