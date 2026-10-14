import React, { useState, useEffect } from 'react';
import { Radio, Bell, BellOff, Zap, RefreshCw, Download, Crosshair } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  canaryCount: number;
  totalHits: number;
  onQuickTestPing: () => void;
  isTesting: boolean;
}

const navItems = [
  { id: 'dashboard', label: 'Panel SOC' },
  { id: 'canaries', label: 'Canaries' },
  { id: 'breaches', label: 'Correo' },
  { id: 'inspector', label: 'Inspector' },
  { id: 'ip-intel', label: 'IP Intel' },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  canaryCount,
  totalHits,
  onQuickTestPing,
  isTesting,
}) => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toISOString().slice(11, 19) + ' UTC');
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="status-ticker border-b border-zinc-800/70">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="uppercase tracking-[0.18em] font-medium">Monitoreo activo</span>
          </div>
          <div className="flex items-center gap-5">
            <span className="hidden sm:inline">
              CANARIES <span className="text-zinc-100 font-bold ml-1">{String(canaryCount).padStart(2, '0')}</span>
            </span>
            <span className="hidden sm:inline">
              HITS <span className="text-amber-400 font-bold ml-1">{String(totalHits).padStart(3, '0')}</span>
            </span>
            <span className="text-zinc-300 tabular-nums">{currentTime}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row lg:items-stretch justify-between gap-2 lg:gap-6">
        <div className="flex items-center gap-3 py-3 shrink-0">
          <div className="relative w-9 h-9 rounded-md border border-emerald-400/40 bg-emerald-950/60 flex items-center justify-center">
            <Crosshair className="w-5 h-5 text-emerald-400" strokeWidth={1.75} />
            <span className="absolute -top-px -right-px w-2 h-2 bg-emerald-400 rounded-bl-sm" />
          </div>
          <div className="leading-none">
            <h1 className="font-display font-bold text-[1.35rem] text-zinc-50 tracking-wide uppercase">
              Sentinel<span className="text-emerald-400">Trace</span>
            </h1>
            <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">
              Deception &middot; Triage &middot; v3.4
            </p>
          </div>
        </div>

        <nav className="flex items-stretch gap-1 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
          {navItems.map((item, i) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group relative flex items-center gap-2 px-3.5 whitespace-nowrap text-[13px] font-medium transition-colors ${
                  isActive ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                <span
                  className={`font-mono text-[10px] ${isActive ? 'text-emerald-400' : 'text-zinc-600 group-hover:text-zinc-400'}`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>{item.label}</span>
                <span
                  className={`absolute left-2 right-2 bottom-0 h-[2px] transition-all ${
                    isActive
                      ? 'bg-emerald-400 shadow-[0_0_10px_rgba(54,240,160,0.7)]'
                      : 'bg-transparent group-hover:bg-zinc-700'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 py-3 shrink-0">
          <a
            href="/api/project/download-zip"
            download="sentinel-trace-complete.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-medium transition-colors"
            title="Descargar el código fuente del proyecto (.ZIP)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline">Código .ZIP</span>
          </a>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Alertas de audio activas' : 'Alertas de audio silenciadas'}
            className={`p-2 rounded-md border transition-colors ${
              audioEnabled
                ? 'border-zinc-700 bg-zinc-900 text-emerald-400 hover:bg-zinc-800'
                : 'border-zinc-800 bg-zinc-950 text-zinc-600'
            }`}
          >
            {audioEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>

          <button
            onClick={onQuickTestPing}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-semibold text-xs shadow-[0_0_18px_-4px_rgba(54,240,160,0.8)] transition-all disabled:opacity-50"
            title="Simular que alguien abre un Excel canary ahora mismo"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>Probar Beacon</span>
          </button>
        </div>
      </div>
    </header>
  );
};
