"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Code2,
  GraduationCap,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ActivityItem {
  id: string;
  event_type: string;
  module: string;
  action: string;
  status: "success" | "failure";
  description: string;
  duration_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface SummaryData {
  totalActivities: number;
  queriesExecuted: number;
  queriesSucceeded: number;
  queriesFailed: number;
  aiRequests: number;
  lessonsCompleted: number;
  challengesSolved: number;
  lastActiveAt: string | null;
}

const MODULES = [
  "all",
  "auth",
  "ai",
  "sql",
  "explorer",
  "learning",
  "challenges",
  "api_keys",
  "webhooks",
];

export function ActivityHistoryView({ signedIn }: { signedIn: boolean }) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 15;

  useEffect(() => {
    if (!signedIn) {
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (search.trim()) params.set("search", search.trim());
    if (moduleFilter !== "all") params.set("module", moduleFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (fromDate) params.set("from", new Date(fromDate).toISOString());
    if (toDate) params.set("to", new Date(`${toDate}T23:59:59`).toISOString());

    Promise.all([
      fetch(`/api/v1/activity?${params.toString()}`, { signal: controller.signal }).then((r) =>
        r.json().then((j) => ({ ok: r.ok, json: j })),
      ),
      fetch("/api/v1/activity/summary", { signal: controller.signal }).then((r) => r.json()),
    ])
      .then(([act, sumJson]) => {
        if (controller.signal.aborted) return;
        if (!act.ok || !act.json.success) {
          setError(act.json.error?.message || "Failed to load activity history");
        } else {
          setError(null);
          setItems(act.json.data.items);
          setTotal(act.json.data.total);
        }
        if (sumJson.success) setSummary(sumJson.data);
        setLoading(false);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Could not load activity logs");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [signedIn, page, search, moduleFilter, statusFilter, fromDate, toDate]);

  if (!signedIn) {
    return (
      <div className="page">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center space-y-4 max-w-lg mx-auto mt-8">
          <Activity className="h-10 w-10 text-[var(--accent)] mx-auto" />
          <h1 className="text-xl font-bold text-[var(--ink)]">Personal Activity History</h1>
          <p className="text-sm text-[var(--muted)]">
            Sign in to view your persistent SQL execution history, AI requests, lesson completions, and security audit trail.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-[#09664f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#07523f]"
          >
            Sign in to continue
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="page space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">Activity History</h1>
          <p className="text-sm text-[var(--muted)]">
            Persistent audit trail of your queries, AI interactions, lessons, and challenges.
          </p>
        </div>
        {summary?.lastActiveAt && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-mono bg-[var(--surface)] border border-[var(--line)] px-3 py-1.5 rounded-lg">
            <Clock className="h-3.5 w-3.5 text-[var(--accent)]" />
            <span>Last active: {new Date(summary.lastActiveAt).toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Summary KPIs */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Total Queries</span>
              <Code2 className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
              {summary.queriesExecuted}
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              {summary.queriesSucceeded} passed · {summary.queriesFailed} failed
            </span>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>AI Requests</span>
              <Sparkles className="h-4 w-4 text-sky-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
              {summary.aiRequests}
            </div>
            <span className="text-[11px] text-[var(--muted)]">Generate, Explain, Fix, Optimize</span>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Completed Lessons</span>
              <GraduationCap className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
              {summary.lessonsCompleted}
            </div>
            <span className="text-[11px] text-[var(--muted)]">Curriculum progress</span>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Solved Challenges</span>
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
              {summary.challengesSolved}
            </div>
            <span className="text-[11px] text-[var(--muted)]">Automated test passes</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="h-4 w-4 text-[var(--muted)] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search description, event, or action..."
            className="w-full rounded-lg border border-[var(--line)] bg-[var(--bg)] pl-9 pr-3 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => {
            setPage(1);
            setModuleFilter(e.target.value);
          }}
          aria-label="Filter by module"
          className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--ink)]"
        >
          {MODULES.map((m) => (
            <option key={m} value={m}>
              {m === "all" ? "All Modules" : m}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          aria-label="Filter by status"
          className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--ink)]"
        >
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="failure">Failure</option>
        </select>

        <div className="flex gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setPage(1);
              setFromDate(e.target.value);
            }}
            aria-label="From date"
            className="w-1/2 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-xs text-[var(--ink)]"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setPage(1);
              setToDate(e.target.value);
            }}
            aria-label="To date"
            className="w-1/2 rounded-lg border border-[var(--line)] bg-[var(--bg)] px-2 py-1.5 text-xs text-[var(--ink)]"
          />
        </div>
      </div>

      {/* Timeline List */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--line)] bg-[var(--bg)] flex items-center justify-between text-xs font-semibold text-[var(--ink)]">
          <span>Activity Timeline ({total} events)</span>
          <span>
            Page {page} of {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-12 rounded-lg bg-[var(--bg)] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-red-600 dark:text-red-400">{error}</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--muted)]">
            No activity records match the selected filters.
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-[var(--bg)] transition-colors"
              >
                <div className="flex items-start gap-3">
                  {item.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-[var(--ink)]">{item.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-mono text-[var(--muted)]">
                      <span className="rounded bg-[var(--tint)] text-[var(--accent)] px-1.5 py-0.5">
                        {item.module}
                      </span>
                      <span>{item.event_type}</span>
                      {item.duration_ms !== null && <span>· {item.duration_ms}ms</span>}
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono text-[var(--muted)]">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-[var(--line)] bg-[var(--bg)] flex items-center justify-between text-xs">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="flex items-center gap-1 px-3 py-1 rounded border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Previous
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="flex items-center gap-1 px-3 py-1 rounded border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] disabled:opacity-40"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
