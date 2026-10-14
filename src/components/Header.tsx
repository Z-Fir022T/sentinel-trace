import React, { useState, useEffect } from 'react';
import { ShieldAlert, Radio, Bell, BellOff, Zap, RefreshCw, Terminal, ExternalLink, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  canaryCount: number;
  totalHits: number;
  onQuickTestPing: () => void;
  isTesting: boolean;
}

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
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'SOC Dashboard' },
    { id: 'canaries', label: 'Canary Documents' },
    { id: 'breaches', label: 'Compromised Mail Audit' },
    { id: 'inspector', label: 'Excel Beacon Inspector' },
    { id: 'ip-intel', label: 'IP Intelligence' },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/95 sticky top-0 z-40 backdrop-blur">
      {/* Top operational status strip */}
      <div className="px-4 py-1.5 bg-zinc-900/80 border-b border-zinc-800/60 flex flex-wrap items-center justify-between text-xs text-zinc-400 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono uppercase font-semibold tracking-wider">DEFENSIVE MONITORING ACTIVE</span>
          </div>
          <span className="text-zinc-600 hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-1 font-mono text-zinc-400">
            <Terminal className="w-3.5 h-3.5 text-zinc-500" />
            <span>ENCLAVE: SEC-OPS-NODE-01</span>
          </div>
        </div>

        <div className="flex items-center gap-4 font-mono">
          <span className="text-zinc-400">{currentTime}</span>
          <span className="text-zinc-600 hidden md:inline">|</span>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-zinc-400">ACTIVE CANARIES: <span className="text-zinc-100 font-bold">{canaryCount}</span></span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400">HITS: <span className="text-amber-400 font-bold">{totalHits}</span></span>
          </div>
        </div>
      </div>

      {/* Main navigation & actions bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm shadow-emerald-500/10">
            <ShieldAlert className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-zinc-100 tracking-tight flex items-center gap-2">
                SentinelTrace
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-mono font-medium">
                  DEFENSE v3.4
                </span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              Canary Spreadsheet Deception &middot; IP Tracking &middot; Mail Breach Auditing
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <nav className="flex items-center gap-1 overflow-x-auto p-1 bg-zinc-900/90 rounded-lg border border-zinc-800">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-emerald-400 shadow-sm font-semibold border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Quick actions */}
        <div className="flex items-center gap-2">
          <a
            href="/api/project/download-zip"
            download="sentinel-trace-complete.zip"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-xs transition-colors shadow-sm"
            title="Descargar todo el código fuente del proyecto en un archivo .ZIP listo para usar"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-sans">Descargar Proyecto (.ZIP)</span>
          </a>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Audio alerts enabled' : 'Audio alerts muted'}
            className={`p-2 rounded-lg border text-xs transition-colors ${
              audioEnabled
                ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-zinc-100'
                : 'border-zinc-800 bg-zinc-950 text-zinc-600'
            }`}
          >
            {audioEnabled ? <Bell className="w-4 h-4 text-emerald-400" /> : <BellOff className="w-4 h-4" />}
          </button>

          <button
            onClick={onQuickTestPing}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm shadow-emerald-900/40 transition-all disabled:opacity-50"
            title="Simulate an unauthorized entity opening an Excel canary file right now to test tracking"
          >
            {isTesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>Test Beacon Ping</span>
          </button>
        </div>
      </div>
    </header>
  );
};
