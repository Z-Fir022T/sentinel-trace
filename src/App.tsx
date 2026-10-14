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
  const [initialBreachQuery, setInitialBreachQuery] = useState('security@corp.com');
  const [publicServerUrl, setPublicServerUrl] = useState<string>('');

  useEffect(() => {
    fetch('/api/system/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.publicUrl) setPublicServerUrl(data.publicUrl);
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [tokensRes, logsRes] = await Promise.all([
        fetch('/api/canary/tokens'),
        fetch('/api/canary/logs?limit=50'),
      ]);
      if (tokensRes.ok) {
        const tokensData = await tokensRes.json();
        if (tokensData.success) setTokens(tokensData.tokens);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.success) setLogs(logsData.logs);
      }
    } catch (err) {
      console.error('Failed to sync data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [loadData]);

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
      if (res.ok) await loadData();
    } catch (err) {
      console.error('Failed to simulate:', err);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSearchBreach = async (query: string): Promise<EmailBreachAuditResult | null> => {
    try {
      const res = await fetch('/api/breach/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.success) return data;
    } catch (err) {
      console.error('Breach lookup failed:', err);
    }
    return null;
  };

  const handleLookupIp = async (targetIp: string) => {
    try {
      const res = await fetch(`/api/ip/lookup/${targetIp}`);
      const data = await res.json();
      if (data.success) return data;
    } catch (err) {
      console.error('IP lookup failed:', err);
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        canaryCount={tokens.length}
        totalHits={logs.length}
        onQuickTestPing={() => handleSimulateScenario('local', initialBreachQuery)}
        isTesting={isTesting}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            tokens={tokens}
            logs={logs}
            onSelectIp={(ip) => { setSelectedIp(ip); setActiveTab('ip-intel'); }}
            onSelectLog={(log) => setSelectedLog(log)}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onTriggerTest={() => handleSimulateScenario('local', initialBreachQuery)}
            isTesting={isTesting}
            onSimulateScenario={handleSimulateScenario}
            defaultEmail={initialBreachQuery}
          />
        )}

        {activeTab === 'canaries' && (
          <CanaryManagerView
            tokens={tokens}
            onCreateToken={handleCreateToken}
            onTriggerPing={async (id) => handleSimulateScenario('local', initialBreachQuery)}
            onSelectTokenLogs={() => setActiveTab('dashboard')}
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

      {selectedLog && (
        <IncidentReportModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onInspectIp={(ip) => { setSelectedIp(ip); setActiveTab('ip-intel'); }}
        />
      )}
    </div>
  );
}
