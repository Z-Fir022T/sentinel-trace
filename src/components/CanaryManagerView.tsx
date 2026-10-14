import React, { useState } from 'react';
import { CanaryToken } from '../types/threat';
import { Download, Plus } from 'lucide-react';

interface CanaryManagerViewProps {
  tokens: CanaryToken[];
  onCreateToken: (data: any) => Promise<CanaryToken | null>;
  onTriggerPing: (id: string) => Promise<void>;
  onSelectTokenLogs: () => void;
  appUrl: string;
}

export const CanaryManagerView: React.FC<CanaryManagerViewProps> = ({
  tokens,
  onCreateToken,
  onTriggerPing,
  appUrl,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', filename: '', description: '' });

  const handleCreate = async () => {
    if (!formData.name || !formData.filename) return;
    await onCreateToken(formData);
    setFormData({ name: '', filename: '', description: '' });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Canary Tokens</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Token
        </button>
      </div>

      {showForm && (
        <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <input
            type="text"
            placeholder="Token name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 mb-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm"
          />
          <input
            type="text"
            placeholder="Filename"
            value={formData.filename}
            onChange={(e) => setFormData({ ...formData, filename: e.target.value })}
            className="w-full px-3 py-2 mb-2 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm"
          />
          <input
            type="text"
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 mb-3 rounded-lg bg-zinc-950 border border-zinc-700 text-white text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg bg-zinc-800 text-white text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {tokens.map((token) => (
          <div key={token.id} className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-white">{token.name}</h3>
                <p className="text-xs text-zinc-400">{token.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-400">{token.hitsCount}</div>
                <div className="text-xs text-zinc-400">hits</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => onTriggerPing(token.id)}
                className="px-3 py-1 rounded-lg bg-zinc-800 text-white text-sm hover:bg-zinc-700"
              >
                Test Ping
              </button>
              <a
                href={`${appUrl}/api/canary/ping/${token.id}`}
                download={token.filename}
                className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-500 flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
