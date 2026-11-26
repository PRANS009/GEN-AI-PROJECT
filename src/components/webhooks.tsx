"use client";

import { useEffect, useState } from "react";
import { Plus, Send, CheckCircle2, XCircle, ShieldCheck, Copy, Check } from "lucide-react";

interface WebhookItem {
  id: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  createdAt: string;
}

interface DeliveryItem {
  id: string;
  webhookId: string;
  event: string;
  status: "success" | "failed" | "pending";
  statusCode: number | null;
  timestamp: string;
  error?: string;
}

export function WebhooksView() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [url, setUrl] = useState("");
  const [newlyAddedSecret, setNewlyAddedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  async function fetchWebhooks() {
    try {
      const res = await fetch("/api/account/webhooks");
      const data = await res.json();
      if (data.success) {
        setWebhooks(data.data.webhooks);
        setDeliveries(data.data.deliveries);
      }
    } catch {}
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      const res = await fetch("/api/account/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewlyAddedSecret(data.data.secret);
        setUrl("");
        void fetchWebhooks();
      }
    } catch {}
  }

  async function handleSendTest() {
    setIsTesting(true);
    try {
      await fetch("/api/account/webhooks/test", { method: "POST" });
      setTimeout(() => {
        void fetchWebhooks();
        setIsTesting(false);
      }, 1000);
    } catch {
      setIsTesting(false);
    }
  }

  return (
    <div className="page space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Webhook Subscriptions</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Receive real-time signed event notifications whenever SQL is generated, executed, or lessons/challenges are completed.
        </p>
      </div>

      {/* Secret Reveal Banner */}
      {newlyAddedSecret && (
        <div className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
            <ShieldCheck className="h-4 w-4" />
            <span>Webhook Registered Successfully!</span>
          </div>
          <p className="text-xs text-[var(--ink)]">
            Use this shared signing secret to verify the <code className="text-[var(--accent)]">X-Studio-Signature</code> HMAC header on incoming requests.
          </p>
          <div className="flex items-center gap-2 font-mono text-xs bg-[var(--surface)] border border-[var(--line)] p-2.5 rounded text-[var(--ink)]">
            <span className="truncate flex-1">{newlyAddedSecret}</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newlyAddedSecret);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="flex items-center gap-1 bg-[#09664f] hover:bg-[#07523f] text-white px-2.5 py-1 rounded text-xs"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy Secret"}
            </button>
          </div>
        </div>
      )}

      {/* Register Endpoint Card */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[var(--ink)]">Register Webhook Endpoint</h2>
        <form onSubmit={handleRegister} className="flex gap-3">
          <input
            type="url"
            placeholder="https://your-server.com/api/webhook"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-mono"
          />
          <button
            type="submit"
            disabled={!url.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-[#09664f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#07523f] disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Subscribe
          </button>
        </form>
      </div>

      {/* Endpoints & Delivery Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subscribed Webhooks */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <span className="font-semibold text-xs text-[var(--ink)]">Active Webhooks ({webhooks.length})</span>
            {webhooks.length > 0 && (
              <button
                onClick={handleSendTest}
                disabled={isTesting}
                className="flex items-center gap-1 text-xs text-[var(--accent)] hover:underline font-medium"
              >
                <Send className="h-3 w-3" /> {isTesting ? "Sending..." : "Send Test Event"}
              </button>
            )}
          </div>
          {webhooks.length === 0 ? (
            <p className="text-xs text-[var(--muted)] py-4 text-center">No active webhook endpoints registered.</p>
          ) : (
            <div className="space-y-2">
              {webhooks.map((w) => (
                <div key={w.id} className="rounded-lg border border-[var(--line)] p-3 bg-[var(--bg)] text-xs font-mono">
                  <p className="truncate text-[var(--ink)] font-medium mb-1">{w.url}</p>
                  <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
                    <span>{w.events.length} events subscribed</span>
                    <span className="text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deliveries Log */}
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 space-y-3">
          <span className="font-semibold text-xs text-[var(--ink)] border-b border-[var(--line)] pb-2 block">
            Recent Delivery History ({deliveries.length})
          </span>
          {deliveries.length === 0 ? (
            <p className="text-xs text-[var(--muted)] py-4 text-center">No webhook delivery logs recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {deliveries.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--line)] p-2 text-xs font-mono bg-[var(--bg)]"
                >
                  <div className="flex items-center gap-2 truncate">
                    {d.status === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
                    )}
                    <span className="truncate text-[var(--ink)]">{d.event}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[var(--muted)]">
                    <span>{d.statusCode ? `HTTP ${d.statusCode}` : "ERR"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
