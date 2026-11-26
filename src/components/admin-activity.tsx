"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Activity,
  Code2,
  Sparkles,
  Download,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  X,
} from "lucide-react";

interface DailyPoint {
  date: string;
  total: number;
  sql: number;
  ai: number;
  failures: number;
  activeUsers: number;
}

interface AnalyticsData {
  totalUsers: number;
  dau: number;
  wau: number;
  mau: number;
  totalActivities: number;
  totalSql: number;
  sqlSuccess: number;
  sqlFailed: number;
  totalAi: number;
  apiRequests: number;
  totalSuccess: number;
  totalFailure: number;
  lessonCompletions: number;
  challengeCompletions: number;
  moduleDistribution: { module: string; count: number }[];
  dailySeries: DailyPoint[];
  recentErrors: ActivityRow[];
}

interface AdminUser {
  id: string;
  email: string | null;
  display_name: string;
  role: string;
  created_at: string;
  last_login_at: string | null;
  last_active_at: string | null;
  total_activities: number;
  sql_queries: number;
  ai_requests: number;
  lessons_completed: number;
  challenges_solved: number;
}

interface ActivityRow {
  id: string;
  user_id: string | null;
  user_email?: string | null;
  user_name?: string | null;
  event_type: string;
  module: string;
  action: string;
  status: "success" | "failure";
  description: string;
  duration_ms: number | null;
  created_at: string;
}

export function AdminActivityDashboard() {
  const [days, setDays] = useState(14);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedUserLogs, setSelectedUserLogs] = useState<ActivityRow[]>([]);
  const [logs, setLogs] = useState<ActivityRow[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [logSearch, setLogSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    const controller = new AbortController();
    const logParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (logSearch.trim()) logParams.set("search", logSearch.trim());
    if (moduleFilter !== "all") logParams.set("module", moduleFilter);
    if (statusFilter !== "all") logParams.set("status", statusFilter);

    const userParams = new URLSearchParams();
    if (userSearch.trim()) userParams.set("search", userSearch.trim());

    Promise.all([
      fetch(`/api/v1/admin/analytics?days=${days}`, { signal: controller.signal }).then((r) =>
        r.json().then((j) => ({ ok: r.ok, json: j })),
      ),
      fetch(`/api/v1/admin/users?${userParams.toString()}`, { signal: controller.signal }).then(
        (r) => r.json(),
      ),
      fetch(`/api/v1/admin/activity?${logParams.toString()}`, { signal: controller.signal }).then(
        (r) => r.json(),
      ),
    ])
      .then(([ana, usrJson, actJson]) => {
        if (controller.signal.aborted) return;
        if (!ana.ok) {
          setError(ana.json.error?.message || "Failed to load analytics");
        } else {
          setError(null);
          setAnalytics(ana.json.data);
        }
        if (usrJson.success) setUsers(usrJson.data.users);
        if (actJson.success) {
          setLogs(actJson.data.items);
          setTotalLogs(actJson.data.total);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Failed to load admin dashboard");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [days, page, logSearch, moduleFilter, statusFilter, userSearch]);

  async function inspectUser(user: AdminUser) {
    setSelectedUser(user);
    setSelectedUserLogs([]);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}/activity`);
      const data = await res.json();
      if (data.success) {
        setSelectedUserLogs(data.data.activity.items);
      }
    } catch {}
  }

  function handleExportCsv() {
    const params = new URLSearchParams();
    if (logSearch.trim()) params.set("search", logSearch.trim());
    if (moduleFilter !== "all") params.set("module", moduleFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const link = document.createElement("a");
    link.href = `/api/v1/admin/activity/export?${params.toString()}`;
    link.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const maxDaily = Math.max(
    1,
    ...(analytics?.dailySeries.map((d) => d.total) || [1]),
  );
  const totalOps = (analytics?.totalSuccess || 0) + (analytics?.totalFailure || 0);
  const successRate = totalOps > 0 ? Math.round(((analytics?.totalSuccess || 0) / totalOps) * 100) : 100;
  const totalPages = Math.max(1, Math.ceil(totalLogs / limit));

  return (
    <div className="page space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
            Admin Activity Monitoring
          </h1>
          <p className="text-sm text-[var(--muted)]">
            Platform-wide user analytics, security audit trail, and individual learner monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-label="Date range"
            className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink)]"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg bg-[#09664f] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#07523f]"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-sm text-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Platform KPI Cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Registered Users</span>
              <Users className="h-4 w-4 text-[var(--accent)]" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
              {analytics.totalUsers}
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              DAU {analytics.dau} · WAU {analytics.wau} · MAU {analytics.mau}
            </span>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Platform Events</span>
              <Activity className="h-4 w-4 text-sky-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
              {analytics.totalActivities}
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              API key calls: {analytics.apiRequests}
            </span>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>SQL Executed</span>
              <Code2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
              {analytics.totalSql}
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              {analytics.sqlSuccess} ok · {analytics.sqlFailed} err
            </span>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>AI Requests</span>
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
              {analytics.totalAi}
            </div>
            <span className="text-[11px] text-[var(--muted)]">Gemini SQL Assistant</span>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Success Rate</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
              {successRate}%
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              {analytics.totalFailure} total failures
            </span>
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>Learning</span>
              <GraduationCap className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 text-2xl font-bold font-mono text-[var(--ink)]">
              {analytics.lessonCompletions + analytics.challengeCompletions}
            </div>
            <span className="text-[11px] text-[var(--muted)]">
              {analytics.lessonCompletions} lessons · {analytics.challengeCompletions} challenges
            </span>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Daily Activity & SQL/AI Trend Bar Chart */}
          <div className="lg:col-span-7 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--ink)]">
                Daily Activity, SQL & AI Trends ({days}d)
              </h2>
              <div className="flex items-center gap-3 text-[11px] text-[var(--muted)]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#09664f] inline-block" /> Total
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" /> SQL
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" /> AI
                </span>
              </div>
            </div>

            <div className="h-44 flex items-end gap-1.5 pt-4 border-b border-[var(--line)] pb-1">
              {analytics.dailySeries.map((pt) => {
                const hTotal = Math.max(4, Math.round((pt.total / maxDaily) * 100));
                const hSql = Math.round((pt.sql / maxDaily) * 100);
                const hAi = Math.round((pt.ai / maxDaily) * 100);
                return (
                  <div
                    key={pt.date}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    title={`${pt.date}: ${pt.total} total, ${pt.sql} SQL, ${pt.ai} AI, ${pt.activeUsers} users`}
                  >
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      <div
                        style={{ height: `${hTotal}%` }}
                        className="w-2 bg-[#09664f] rounded-t transition-all"
                      />
                      {hSql > 0 && (
                        <div
                          style={{ height: `${hSql}%` }}
                          className="w-1.5 bg-sky-500 rounded-t"
                        />
                      )}
                      {hAi > 0 && (
                        <div
                          style={{ height: `${hAi}%` }}
                          className="w-1.5 bg-amber-500 rounded-t"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-[var(--muted)]">
              <span>{analytics.dailySeries[0]?.date}</span>
              <span>{analytics.dailySeries[analytics.dailySeries.length - 1]?.date}</span>
            </div>
          </div>

          {/* Module Distribution & Success/Failure */}
          <div className="lg:col-span-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-[var(--ink)] mb-2">
                Success vs Failed Operations
              </h2>
              <div className="h-3 w-full rounded-full bg-red-200 dark:bg-red-950 overflow-hidden flex">
                <div
                  style={{ width: `${successRate}%` }}
                  className="bg-emerald-600 h-full"
                />
              </div>
              <div className="flex justify-between text-xs text-[var(--muted)] mt-1.5 font-mono">
                <span>Success: {analytics.totalSuccess} ({successRate}%)</span>
                <span>Failed: {analytics.totalFailure}</span>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-[var(--ink)] mb-2">
                Activity Distribution by Module
              </h2>
              <div className="space-y-2">
                {analytics.moduleDistribution.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No module data yet.</p>
                ) : (
                  analytics.moduleDistribution.map((m) => {
                    const pct = Math.round(
                      (m.count / Math.max(1, analytics.totalActivities)) * 100,
                    );
                    return (
                      <div key={m.module} className="space-y-1">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-[var(--ink)]">{m.module}</span>
                          <span className="text-[var(--muted)]">{m.count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--bg)] overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-[var(--accent)]"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Searchable User Directory + Individual User Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`${selectedUser ? "lg:col-span-7" : "lg:col-span-12"} rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden`}>
          <div className="p-4 border-b border-[var(--line)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-[var(--ink)]">
              Individual User Monitoring ({users.length})
            </h2>
            <div className="relative w-64">
              <Search className="h-3.5 w-3.5 text-[var(--muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name or email..."
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] pl-8 pr-3 py-1.5 text-xs text-[var(--ink)]"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-2">
              <div className="h-10 bg-[var(--bg)] rounded animate-pulse" />
              <div className="h-10 bg-[var(--bg)] rounded animate-pulse" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--muted)]">
              No registered users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--line)] bg-[var(--bg)] text-[var(--muted)]">
                  <tr>
                    <th className="py-2.5 px-4">User</th>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-4">SQL / AI</th>
                    <th className="py-2.5 px-4">Progress</th>
                    <th className="py-2.5 px-4">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-[var(--ink)]">
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      onClick={() => void inspectUser(u)}
                      className={`cursor-pointer hover:bg-[var(--tint)] transition-colors ${
                        selectedUser?.id === u.id ? "bg-[var(--tint)]" : ""
                      }`}
                    >
                      <td className="py-2.5 px-4">
                        <p className="font-semibold">{u.display_name}</p>
                        <p className="text-[11px] font-mono text-[var(--muted)]">{u.email || u.id.slice(0, 8)}</p>
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          u.role === "admin"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-[var(--bg)] text-[var(--muted)]"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        {u.sql_queries} / {u.ai_requests}
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        {u.lessons_completed}L · {u.challenges_solved}C
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[var(--muted)]">
                        {u.last_active_at ? new Date(u.last_active_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected User Detail Drawer */}
        {selectedUser && (
          <div className="lg:col-span-5 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h3 className="font-bold text-base text-[var(--ink)]">{selectedUser.display_name}</h3>
                <p className="text-xs font-mono text-[var(--muted)]">{selectedUser.email}</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                aria-label="Close user detail"
                className="text-[var(--muted)] hover:text-[var(--ink)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded bg-[var(--bg)] p-2 border border-[var(--line)]">
                <span className="text-[var(--muted)] block text-[10px]">Registered</span>
                <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span>
              </div>
              <div className="rounded bg-[var(--bg)] p-2 border border-[var(--line)]">
                <span className="text-[var(--muted)] block text-[10px]">Last Login</span>
                <span>{selectedUser.last_login_at ? new Date(selectedUser.last_login_at).toLocaleString() : "—"}</span>
              </div>
              <div className="rounded bg-[var(--bg)] p-2 border border-[var(--line)]">
                <span className="text-[var(--muted)] block text-[10px]">SQL / AI</span>
                <span>{selectedUser.sql_queries} SQL · {selectedUser.ai_requests} AI</span>
              </div>
              <div className="rounded bg-[var(--bg)] p-2 border border-[var(--line)]">
                <span className="text-[var(--muted)] block text-[10px]">Learning</span>
                <span>{selectedUser.lessons_completed} lessons · {selectedUser.challenges_solved} chal.</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[var(--muted)] uppercase mb-2">
                User Activity Timeline
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedUserLogs.length === 0 ? (
                  <p className="text-xs text-[var(--muted)]">No activity logs recorded for this user.</p>
                ) : (
                  selectedUserLogs.map((l) => (
                    <div key={l.id} className="rounded border border-[var(--line)] bg-[var(--bg)] p-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[var(--ink)]">{l.description}</span>
                        <span className={l.status === "success" ? "text-emerald-600" : "text-red-600"}>
                          {l.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--muted)]">
                        {l.event_type} · {new Date(l.created_at).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Platform Activity Logs & Recent Errors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
          <div className="p-4 border-b border-[var(--line)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-[var(--ink)]">
              Platform Activity Stream ({totalLogs})
            </h2>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={logSearch}
                onChange={(e) => {
                  setPage(1);
                  setLogSearch(e.target.value);
                }}
                placeholder="Search logs..."
                className="rounded border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--ink)]"
              />
              <select
                value={moduleFilter}
                onChange={(e) => {
                  setPage(1);
                  setModuleFilter(e.target.value);
                }}
                className="rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--ink)]"
              >
                <option value="all">All Modules</option>
                <option value="auth">auth</option>
                <option value="ai">ai</option>
                <option value="sql">sql</option>
                <option value="explorer">explorer</option>
                <option value="learning">learning</option>
                <option value="challenges">challenges</option>
                <option value="api_keys">api_keys</option>
                <option value="webhooks">webhooks</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
                className="rounded border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs text-[var(--ink)]"
              >
                <option value="all">All Status</option>
                <option value="success">success</option>
                <option value="failure">failure</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-[var(--line)] max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--muted)]">
                No platform activity logs found.
              </div>
            ) : (
              logs.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2">
                    {item.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-medium text-[var(--ink)]">{item.description}</p>
                      <p className="text-[11px] font-mono text-[var(--muted)]">
                        {item.user_email || "anonymous"} · {item.module}/{item.event_type}
                        {item.duration_ms !== null ? ` · ${item.duration_ms}ms` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--muted)] shrink-0">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-[var(--line)] bg-[var(--bg)] flex items-center justify-between text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--line)] bg-[var(--surface)] disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </button>
            <span className="text-[var(--muted)]">Page {page} of {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex items-center gap-1 px-2.5 py-1 rounded border border-[var(--line)] bg-[var(--surface)] disabled:opacity-40"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Recent Errors */}
        <div className="lg:col-span-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] overflow-hidden">
          <div className="p-4 border-b border-[var(--line)] bg-[var(--bg)] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="text-sm font-bold text-[var(--ink)]">Recent Platform Errors</h2>
          </div>
          <div className="divide-y divide-[var(--line)] max-h-96 overflow-y-auto">
            {!analytics || analytics.recentErrors.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--muted)]">
                No recent errors recorded.
              </div>
            ) : (
              analytics.recentErrors.map((err) => (
                <div key={err.id} className="p-3 text-xs space-y-1">
                  <p className="font-medium text-red-700 dark:text-red-300">{err.description}</p>
                  <p className="text-[11px] font-mono text-[var(--muted)]">
                    {err.module}/{err.event_type} · {new Date(err.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
