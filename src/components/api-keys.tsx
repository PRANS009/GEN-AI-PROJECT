"use client";

import { useEffect, useState } from "react";
import { Plus, Copy, Check, Trash2, RefreshCw, ShieldCheck } from "lucide-react";

interface KeyItem {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export function ApiKeysView() {
  const [keys, setKeys] = useState<KeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/account/keys");
      const data = await res.json();
      if (data.success) {
        setKeys(data.data);
      }
    } catch {}
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/account/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewlyCreatedKey(data.data.rawKey);
        setNewKeyName("");
        void fetchKeys();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm("Are you sure you want to revoke this API key? This action is immediate and cannot be undone.")) return;
    await fetch("/api/account/keys/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "revoke" }),
    });
    void fetchKeys();
  }

  async function handleRotateKey(id: string) {
    const res = await fetch("/api/account/keys/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "rotate" }),
    });
    const data = await res.json();
    if (data.success) {
      setNewlyCreatedKey(data.data.rawKey);
      void fetchKeys();
    }
  }

  function copySecret(secret: string) {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="page space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">API Key Management</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Generate scoped developer API keys to integrate SQL Studio AI into external applications, scripts, and CI pipelines.
        </p>
      </div>

      {/* Secret Reveal Banner */}
      {newlyCreatedKey && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <ShieldCheck className="h-4 w-4" />
            <span>New API Key Generated!</span>
          </div>
          <p className="text-xs text-neutral-300">
            Copy this secret now. For security reasons, the full key is never stored in plain text and cannot be viewed again.
          </p>
          <div className="flex items-center gap-2 font-mono text-xs bg-neutral-900 border border-neutral-700 p-2.5 rounded text-neutral-100">
            <span className="truncate flex-1">{newlyCreatedKey}</span>
            <button
              onClick={() => copySecret(newlyCreatedKey)}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-xs"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy Secret"}
            </button>
          </div>
        </div>
      )}

      {/* Create New Key Card */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-neutral-200">Create New Developer Key</h2>
        <form onSubmit={handleCreateKey} className="flex gap-3">
          <input
            type="text"
            placeholder="Key Name (e.g. Production CI / Backend Agent)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="flex-1 rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={loading || !newKeyName.trim()}
            className="flex items-center gap-1.5 rounded bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Key
          </button>
        </form>
      </div>

      {/* Keys Table */}
      <div className="rounded-lg border border-neutral-800 bg-neutral-950 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-800 font-semibold text-xs text-neutral-300">
          Active & Revoked Developer Keys
        </div>
        {keys.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-500">
            No API keys created yet. Generate one above to begin external integration.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-neutral-800 text-neutral-400 bg-neutral-900/50">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Name</th>
                  <th className="py-2.5 px-4 font-semibold">Prefix</th>
                  <th className="py-2.5 px-4 font-semibold">Scopes</th>
                  <th className="py-2.5 px-4 font-semibold">Created</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800 text-neutral-200">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-neutral-900/40">
                    <td className="py-2.5 px-4 font-sans font-medium text-neutral-100">{k.name}</td>
                    <td className="py-2.5 px-4 text-neutral-400">{k.prefix}...</td>
                    <td className="py-2.5 px-4">
                      <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300">
                        {k.scopes.length} scopes
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-neutral-400">
                      {new Date(k.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-4">
                      {k.revokedAt ? (
                        <span className="text-red-400">Revoked</span>
                      ) : (
                        <span className="text-emerald-400">Active</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {!k.revokedAt && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRotateKey(k.id)}
                            className="text-neutral-400 hover:text-sky-400 p-1"
                            title="Rotate Key"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="text-neutral-400 hover:text-red-400 p-1"
                            title="Revoke Key"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
