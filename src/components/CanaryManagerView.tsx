import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Plus, 
  Copy, 
  Check, 
  Zap, 
  ExternalLink, 
  ShieldCheck, 
  Info, 
  Key, 
  DollarSign, 
  Users, 
  TrendingUp, 
  X,
  Radio,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { CanaryToken } from '../types/threat';
import { DECOY_TEMPLATES, generateCanarySpreadsheet, downloadBlob } from '../utils/excelGenerator';

interface CanaryManagerViewProps {
  tokens: CanaryToken[];
  onCreateToken: (tokenData: Partial<CanaryToken>) => Promise<CanaryToken | null>;
  onTriggerPing: (tokenId: string) => Promise<void>;
  onSelectTokenLogs: (tokenId: string) => void;
  appUrl: string;
}

export const CanaryManagerView: React.FC<CanaryManagerViewProps> = ({
  tokens,
  onCreateToken,
  onTriggerPing,
  onSelectTokenLogs,
  appUrl,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('payroll');
  const [trackingType, setTrackingType] = useState<'excel_webservice' | 'excel_image' | 'web_beacon'>('excel_webservice');
  const [docName, setDocName] = useState<string>('Executive_Compensation_Q4_Audit.xlsx');
  const [notifyEmail, setNotifyEmail] = useState<string>('soc-alerts@enterprise.internal');
  const [associatedEmail, setAssociatedEmail] = useState<string>('ianhazael.a.l@gmail.com');
  const [notes, setNotes] = useState<string>('Planted in finance shared drive folder.');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const getBeaconUrl = (tokenId: string) => {
    const base = appUrl || window.location.origin;
    return `${base}/api/canary/ping/${tokenId}`;
  };

  const getImageUrl = (tokenId: string) => {
    const base = appUrl || window.location.origin;
    return `${base}/api/canary/beacon.png?id=${tokenId}`;
  };

  const handleCopyFormula = (token: CanaryToken) => {
    const formula =
      token.type === 'excel_image'
        ? `=IMAGE("${getImageUrl(token.id)}")`
        : `=WEBSERVICE("${getBeaconUrl(token.id)}")`;

    navigator.clipboard.writeText(formula);
    setCopiedId(token.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadExcel = (token: CanaryToken) => {
    const beaconUrl = getBeaconUrl(token.id);
    const imageUrl = getImageUrl(token.id);
    const { blob, filename } = generateCanarySpreadsheet(token.decoyCategory, beaconUrl, imageUrl, token.filename);
    downloadBlob(blob, filename);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const template = DECOY_TEMPLATES[selectedTemplate] || DECOY_TEMPLATES.payroll;
    const created = await onCreateToken({
      name: template.name,
      filename: docName.endsWith('.xlsx') ? docName : `${docName}.xlsx`,
      description: template.description,
      type: trackingType,
      decoyCategory: selectedTemplate as any,
      notifyEmail,
      associatedEmail,
      notes,
    });

    setIsCreating(false);
    if (created) {
      setShowCreateModal(false);
      // Auto-trigger download of the newly generated document
      const beaconUrl = getBeaconUrl(created.id);
      const imageUrl = getImageUrl(created.id);
      const { blob, filename } = generateCanarySpreadsheet(created.decoyCategory, beaconUrl, imageUrl, created.filename);
      downloadBlob(blob, filename);
    }
  };

  const handleTestPing = async (tokenId: string) => {
    setTestingId(tokenId);
    await onTriggerPing(tokenId);
    setTestingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Deploy Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-zinc-900/90 border border-zinc-800">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Canary Spreadsheet Deception Manager
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Deploy decoy Excel spreadsheets embedded with silent tracking formulas. When an adversary or unauthorized user opens the file, their IP address, location, and Office user-agent are logged immediately.
          </p>
        </div>

        <button
          onClick={() => {
            const template = DECOY_TEMPLATES[selectedTemplate];
            setDocName(template.defaultFilename);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-950 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Deploy Canary Excel Document</span>
        </button>
      </div>

      {/* Real-World Testing Guide & Public Endpoint Status */}
      <div className="p-5 rounded-xl bg-zinc-950 border border-emerald-900/60 space-y-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/80 shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-100 text-sm">¿Por qué no viste reacción inmediata en tu Excel de escritorio?</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono font-bold">
                2 FACTORES TÉCNICOS IMPORTANTES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-zinc-300">
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="font-semibold text-amber-400 block mb-1">
                  1. Barra Amarilla de Excel (&quot;Vista Protegida&quot;):
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Por seguridad de Windows, cualquier archivo bajado de internet se abre con las fórmulas de red suspendidas. En la barra amarilla superior de Excel debes pulsar <strong>&quot;Habilitar edición&quot;</strong> y <strong>&quot;Habilitar contenido&quot;</strong> para que Excel ejecute la fórmula.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="font-semibold text-emerald-400 block mb-1">
                  2. ¿Debo Publicar la App? (¡SÍ!):
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Mientras la app está en modo borrador de AI Studio (<code className="text-zinc-300">ais-dev</code>), Google protege la URL con inicio de sesión. <strong>Al pulsar el botón &quot;Share&quot; o &quot;Publish&quot;</strong> arriba a la derecha en AI Studio, la app pasa a ser pública en internet (<code className="text-cyan-300">ais-pre</code>) y tu Excel podrá conectarse libremente desde cualquier PC del mundo.
                </p>
              </div>
            </div>

            {/* In-Excel direct link tip */}
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-200 text-[11px] flex items-center justify-between gap-2">
              <span>
                💡 <strong>Prueba Rápida en tu Excel:</strong> En el Excel descargado, pulsa el enlace azul en la fila 3: <em>&quot;👉 CLICK AQUÍ PARA PROBAR Y REGISTRAR EN EL NAVEGADOR&quot;</em>. Tu navegador se abrirá y registrará tu IP de inmediato.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Canaries List */}
      <div className="grid grid-cols-1 gap-4">
        {tokens.map((token) => {
          const beaconUrl = getBeaconUrl(token.id);
          const formulaCode =
            token.type === 'excel_image'
              ? `=IMAGE("${getImageUrl(token.id)}")`
              : `=WEBSERVICE("${beaconUrl}")`;

          return (
            <div
              key={token.id}
              className="p-5 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* File info */}
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-emerald-400 shrink-0">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-zinc-100 text-sm">{token.filename}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                        {token.type === 'excel_image' ? 'IMAGE BEACON' : 'WEBSERVICE FORMULA'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                        STATUS: ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">{token.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 font-mono mt-2">
                      <span>TOKEN ID: {token.id}</span>
                      <span>&middot;</span>
                      <span>MONITORED EMAIL: <span className="text-emerald-400 font-semibold">{token.associatedEmail || 'ianhazael.a.l@gmail.com'}</span></span>
                      {token.notifyEmail && (
                        <>
                          <span>&middot;</span>
                          <span>ALERT: {token.notifyEmail}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Hits Badge & Counter */}
                <div className="flex items-center gap-3 self-end md:self-center">
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono text-amber-400">
                      {token.hitsCount} {token.hitsCount === 1 ? 'Hit' : 'Hits'}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {token.lastHitAt
                        ? `Last ping: ${new Date(token.lastHitAt).toLocaleTimeString()}`
                        : 'No triggers yet'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Formula & Webhook Box */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-zinc-400 overflow-hidden text-ellipsis">
                  <span className="text-zinc-500 shrink-0">Embedded Formula:</span>
                  <span className="text-cyan-300 truncate select-all">{formulaCode}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopyFormula(token)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs transition-colors"
                  >
                    {copiedId === token.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Formula</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/60 text-xs">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Info className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Decoy Category: <span className="text-zinc-200 capitalize">{token.decoyCategory.replace('_', ' ')}</span></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestPing(token.id)}
                    disabled={testingId === token.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 transition-colors disabled:opacity-50"
                    title="Simulate someone opening this Excel document right now"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{testingId === token.id ? 'Pinging...' : 'Simulate Open'}</span>
                  </button>

                  <button
                    onClick={() => onSelectTokenLogs(token.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
                  >
                    <span>View Access Logs ({token.hitsCount})</span>
                  </button>

                  <button
                    onClick={() => handleDownloadExcel(token)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .XLSX</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Deploy New Canary Document */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">
                    Deploy Defensive Canary Spreadsheet
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Configure deceptive honeytoken data and tracking parameters
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Template Selection */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Select Decoy Content Template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.values(DECOY_TEMPLATES).map((tmpl) => {
                    const isSelected = selectedTemplate === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => {
                          setSelectedTemplate(tmpl.id);
                          setDocName(tmpl.defaultFilename);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-zinc-800/90 border-emerald-500 text-zinc-100 shadow-sm'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs text-zinc-200">{tmpl.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                            {tmpl.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 leading-tight">
                          {tmpl.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking Mechanism */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-2">
                  Tracking Trigger Mechanism
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => setTrackingType('excel_webservice')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      trackingType === 'excel_webservice'
                        ? 'bg-zinc-800 border-emerald-500 text-zinc-100'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-medium text-xs text-zinc-200">=WEBSERVICE(...) Formula (Recommended)</div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Fires an HTTP GET beacon silently when Excel opens and calculates formulas. Captures client IP &amp; User-Agent.
                    </p>
                  </div>

                  <div
                    onClick={() => setTrackingType('excel_image')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      trackingType === 'excel_image'
                        ? 'bg-zinc-800 border-emerald-500 text-zinc-100'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="font-medium text-xs text-zinc-200">=IMAGE(...) Dynamic Web Beacon</div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Fetches a transparent 1x1 GIF tracking image from our server. Supported in modern Excel 365.
                    </p>
                  </div>
                </div>
              </div>

              {/* Filename, Monitored Email & Alert Email */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Excel Filename (.xlsx)
                  </label>
                  <input
                    type="text"
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Correo a Monitorear
                  </label>
                  <input
                    type="email"
                    value={associatedEmail}
                    onChange={(e) => setAssociatedEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="ianhazael.a.l@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Alerta SOC (Destinatario)
                  </label>
                  <input
                    type="email"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="soc@company.com"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Deployment Enclave / Planted Location Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Planted on HR shared volume / executive desktop decoy"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950 transition-all disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{isCreating ? 'Arming Canary...' : 'Arm & Download .XLSX'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
