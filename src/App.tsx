/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CanaryManagerView } from './components/CanaryManagerView';
import { EmailBreachView } from './components/EmailBreachView';
import { FileInspectorView } from './components/FileInspectorView';
import { IpIntelligenceView } from './components/IpIntelligenceView';
import { IncidentReportModal } from './components/IncidentReportModal';
import { CanaryToken, CanaryAccessLog, EmailBreachAuditResult } from './types/threat';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [tokens, setTokens] = useState<CanaryToken[]>([]);
  const [logs, setLogs] = useState<CanaryAccessLog[]>([]);
  const [selectedIp, setSelectedIp] = useState<string>('198.51.100.42');
  const [selectedLog, setSelectedLog] = useState<CanaryAccessLog | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [initialBreachQuery, setInitialBreachQuery] = useState('ianhazael.a.l@gmail.com');
  const [publicServerUrl, setPublicServerUrl] = useState<string>('');

  // Load system public config
  useEffect(() => {
    fetch('/api/system/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.publicUrl) {
          setPublicServerUrl(data.publicUrl);
        }
      })
      .catch(() => {});
  }, []);

  // Load tokens & access logs from backend
  const loadData = useCallback(async () => {
    try {
      const [tokensRes, logsRes] = await Promise.all([
        fetch('/api/canary/tokens'),
        fetch('/api/canary/logs?limit=50'),
      ]);

      if (tokensRes.ok) {
        const tokensData = await tokensRes.json();
        if (tokensData.success) {
          setTokens(tokensData.tokens);
        }
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.success) {
          setLogs(logsData.logs);
        }
      }
    } catch (err) {
      console.error('Failed to sync defensive telemetry:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Poll telemetry stream every 8 seconds for real-time detection
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle creating a new canary
  const handleCreateToken = async (tokenData: Partial<CanaryToken>): Promise<CanaryToken | null> => {
    try {
      const res = await fetch('/api/canary/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenData),
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        return data.token;
      }
    } catch (err) {
      console.error('Error creating canary token:', err);
    }
    return null;
  };

  // Play subtle high-tech SOC tone on beacon hit
  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } catch {
      // Audio autoplay policies
    }
  };

  // Trigger test ping (simulates someone opening an Excel spreadsheet)
  const handleTriggerPing = async (tokenId?: string) => {
    setIsTesting(true);
    const targetTokenId = tokenId || (tokens[0]?.id || 'cnry-exec-salary-2026');
    try {
      const res = await fetch(`/api/canary/ping/${targetTokenId}?ref=simulation_test_trigger`);
      if (res.ok) {
        playAlertSound();
        await loadData();
      }
    } catch (err) {
      console.error('Simulation trigger failed:', err);
    } finally {
      setIsTesting(false);
    }
  };

  // Check email or domain breach
  const handleSearchBreach = async (query: string): Promise<EmailBreachAuditResult | null> => {
    try {
      const res = await fetch('/api/breach/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.success) {
        return data;
      }
    } catch (err) {
      console.error('Breach lookup failed:', err);
    }
    return null;
  };

  // IP Intelligence lookup
  const handleLookupIp = async (targetIp: string) => {
    try {
      const res = await fetch(`/api/ip/lookup/${targetIp}`);
      const data = await res.json();
      if (data.success) {
        return data;
      }
    } catch (err) {
      console.error('IP lookup failed:', err);
    }
    return null;
  };

  // Switch to IP investigation tab
  const handleSelectIp = (targetIp: string) => {
    setSelectedIp(targetIp);
    setActiveTab('ip-intel');
  };

  // Switch to canaries tab filtered
  const handleSelectTokenLogs = (tokenId: string) => {
    setActiveTab('dashboard');
  };

  // Simulate an attacker opening the Excel file from a specific location
  const handleSimulateScenario = async (scenario: string, email: string) => {
    setIsTesting(true);
    try {
      const res = await fetch('/api/canary/simulate-attacker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario,
          email: email || initialBreachQuery,
          tokenId: tokens[0]?.id,
        }),
      });
      if (res.ok) {
        playAlertSound();
        await loadData();
      }
    } catch (err) {
      console.error('Failed to simulate attacker:', err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        canaryCount={tokens.length}
        totalHits={logs.length}
        onQuickTestPing={() => handleTriggerPing()}
        isTesting={isTesting}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            tokens={tokens}
            logs={logs}
            onSelectIp={handleSelectIp}
            onSelectLog={(log) => setSelectedLog(log)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onTriggerTest={() => handleTriggerPing()}
            isTesting={isTesting}
            onSimulateScenario={handleSimulateScenario}
            defaultEmail={initialBreachQuery}
          />
        )}

        {activeTab === 'canaries' && (
          <CanaryManagerView
            tokens={tokens}
            onCreateToken={handleCreateToken}
            onTriggerPing={handleTriggerPing}
            onSelectTokenLogs={handleSelectTokenLogs}
            appUrl={publicServerUrl || window.location.origin}
          />
        )}

        {activeTab === 'breaches' && (
          <EmailBreachView
            onSearchBreach={handleSearchBreach}
            initialQuery={initialBreachQuery}
          />
        )}

        {activeTab === 'inspector' && <FileInspectorView />}

        {activeTab === 'ip-intel' && (
          <IpIntelligenceView
            selectedIp={selectedIp}
            onSearchIp={handleLookupIp}
          />
        )}
      </main>

      {/* Forensic Incident Detail Modal */}
      {selectedLog && (
        <IncidentReportModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onInspectIp={handleSelectIp}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/80 py-4 px-4 mt-12 text-center text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SentinelTrace Defensive Security Suite &middot; Honeytoken Deception &amp; Identity Triage</span>
          <span className="text-zinc-600">Confidential Defense Tooling &middot; Anti-Exfiltration System</span>
        </div>
      </footer>
    </div>
  );
}
