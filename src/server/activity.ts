async function getAuthHelpers() {
  return import("./auth.ts");
}

export type ActivityModule =
  | "auth"
  | "ai"
  | "sql"
  | "explorer"
  | "learning"
  | "challenges"
  | "api_keys"
  | "webhooks"
  | "api";

export type ActivityStatus = "success" | "failure";

export interface ActivityLogRecord {
  id: string;
  user_id: string | null;
  event_type: string;
  module: ActivityModule;
  action: string;
  status: ActivityStatus;
  description: string;
  duration_ms: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  user_email?: string | null;
  user_name?: string | null;
}

export interface LogActivityInput {
  userId?: string | null;
  eventType: string;
  module: ActivityModule;
  action: string;
  status: ActivityStatus;
  description: string;
  durationMs?: number | null;
  metadata?: Record<string, unknown>;
  updateLoginAt?: boolean;
}

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "passwd",
  "secret",
  "token",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "sql",
  "query",
  "prompt",
  "rows",
  "resultrows",
  "credential",
  "signingkey",
  "signing_key",
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
  // Allow operational counters/identifiers like queryId, queryType, rowCount, sqlLength
  if (
    ["queryid", "querytype", "rowcount", "affectedrows", "sqllength"].includes(
      normalized,
    )
  ) {
    return false;
  }
  return SENSITIVE_KEY_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function sanitizeValue(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.length > 180 ? `${value.slice(0, 177)}...` : value;
  }
  if (depth >= 3) return "[truncated]";
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>).slice(0, 20)) {
      if (isSensitiveKey(k)) {
        out[k] = "[redacted]";
      } else {
        out[k] = sanitizeValue(v, depth + 1);
      }
    }
    return out;
  }
  return String(value).slice(0, 100);
}

export function sanitizeMetadata(
  metadata?: Record<string, unknown>,
): Record<string, unknown> {
  if (!metadata || typeof metadata !== "object") return {};
  return sanitizeValue(metadata, 0) as Record<string, unknown>;
}

// Bounded in-memory fallback buffer for unconfigured/offline environments & tests
const memoryLogs: ActivityLogRecord[] = [];

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    let resolvedUserId = input.userId;
    if (resolvedUserId === undefined) {
      try {
        const { account } = await getAuthHelpers();
        const user = await account();
        resolvedUserId = user?.id ?? null;
      } catch {
        resolvedUserId = null;
      }
    }

    const sanitizedMeta = sanitizeMetadata(input.metadata);
    const cleanDescription = input.description.trim().slice(0, 500) || input.action;
    const duration =
      typeof input.durationMs === "number" && Number.isFinite(input.durationMs)
        ? Math.max(0, Math.round(input.durationMs))
        : null;

    const record: ActivityLogRecord = {
      id: crypto.randomUUID(),
      user_id: resolvedUserId ?? null,
      event_type: input.eventType.slice(0, 80),
      module: input.module,
      action: input.action.slice(0, 80),
      status: input.status,
      description: cleanDescription,
      duration_ms: duration,
      metadata: sanitizedMeta,
      created_at: new Date().toISOString(),
    };

    memoryLogs.unshift(record);
    if (memoryLogs.length > 500) memoryLogs.pop();

    const { authClient, serviceClient } = await getAuthHelpers();
    const adminDb = serviceClient();
    const db = adminDb || (resolvedUserId ? await authClient() : null);
    if (!db) return;

    await db.from("activity_logs").insert({
      id: record.id,
      user_id: record.user_id,
      event_type: record.event_type,
      module: record.module,
      action: record.action,
      status: record.status,
      description: record.description,
      duration_ms: record.duration_ms,
      metadata: record.metadata,
      created_at: record.created_at,
    });

    if (resolvedUserId && adminDb) {
      const updates: Record<string, string> = { last_active_at: record.created_at };
      if (input.updateLoginAt) updates.last_login_at = record.created_at;
      await adminDb.from("profiles").update(updates).eq("id", resolvedUserId);
    }
  } catch (err) {
    // Graceful failure: logging must never crash application requests
    console.warn(
      "Activity log persistence skipped:",
      err instanceof Error ? err.message : "unknown",
    );
  }
}

export interface ActivityFilterOptions {
  userId?: string | null;
  search?: string;
  module?: string;
  eventType?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export async function queryActivityLogs(
  options: ActivityFilterOptions,
  useAdmin = false,
): Promise<{ items: ActivityLogRecord[]; total: number; page: number; limit: number }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const { authClient, serviceClient } = await getAuthHelpers();
  const db = useAdmin ? serviceClient() || (await authClient()) : await authClient();
  if (db) {
    try {
      let query = db
        .from("activity_logs")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (options.userId) query = query.eq("user_id", options.userId);
      if (options.module && options.module !== "all")
        query = query.eq("module", options.module);
      if (options.eventType && options.eventType !== "all")
        query = query.eq("event_type", options.eventType);
      if (options.status && options.status !== "all")
        query = query.eq("status", options.status);
      if (options.from) query = query.gte("created_at", options.from);
      if (options.to) query = query.lte("created_at", options.to);
      if (options.search?.trim()) {
        const s = options.search.trim();
        query = query.or(
          `description.ilike.%${s}%,event_type.ilike.%${s}%,action.ilike.%${s}%`,
        );
      }

      const { data, count, error } = await query.range(offset, offset + limit - 1);
      if (!error && data) {
        let items = data as ActivityLogRecord[];
        if (useAdmin && items.length > 0) {
          const userIds = [...new Set(items.map((i) => i.user_id).filter(Boolean))] as string[];
          if (userIds.length > 0) {
            const { data: profiles } = await db
              .from("profiles")
              .select("id, email, display_name")
              .in("id", userIds);
            const map = new Map(
              (profiles || []).map((p: { id: string; email: string | null; display_name: string | null }) => [p.id, p]),
            );
            items = items.map((item) => {
              const prof = item.user_id ? map.get(item.user_id) : null;
              return {
                ...item,
                user_email: prof?.email ?? null,
                user_name: prof?.display_name ?? null,
              };
            });
          }
        }
        return { items, total: count ?? items.length, page, limit };
      }
    } catch {
      // Fallback to in-memory buffer below
    }
  }

  // Fallback filter on memoryLogs
  const filtered = filterInMemoryLogs(memoryLogs, options);
  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    page,
    limit,
  };
}

export function filterInMemoryLogs(
  logs: ActivityLogRecord[],
  options: ActivityFilterOptions,
): ActivityLogRecord[] {
  return logs.filter((item) => {
    if (options.userId && item.user_id !== options.userId) return false;
    if (options.module && options.module !== "all" && item.module !== options.module)
      return false;
    if (
      options.eventType &&
      options.eventType !== "all" &&
      item.event_type !== options.eventType
    )
      return false;
    if (options.status && options.status !== "all" && item.status !== options.status)
      return false;
    if (options.from && item.created_at < options.from) return false;
    if (options.to && item.created_at > options.to) return false;
    if (options.search?.trim()) {
      const q = options.search.trim().toLowerCase();
      const hay = `${item.description} ${item.event_type} ${item.action} ${item.module}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function getUserSummary(userId: string) {
  const { items } = await queryActivityLogs({ userId, page: 1, limit: 100 }, false);
  const queriesExecuted = items.filter((i) => i.event_type === "sql.executed").length;
  const queriesSucceeded = items.filter(
    (i) => i.event_type === "sql.executed" && i.status === "success",
  ).length;
  const queriesFailed = items.filter(
    (i) => i.event_type === "sql.executed" && i.status === "failure",
  ).length;
  const aiRequests = items.filter((i) => i.module === "ai").length;
  const lessonsCompleted = items.filter(
    (i) => i.event_type === "lesson.completed" && i.status === "success",
  ).length;
  const challengesSolved = items.filter(
    (i) => i.event_type === "challenge.completed" && i.status === "success",
  ).length;

  return {
    totalActivities: items.length,
    queriesExecuted,
    queriesSucceeded,
    queriesFailed,
    aiRequests,
    lessonsCompleted,
    challengesSolved,
    lastActiveAt: items[0]?.created_at ?? null,
  };
}

export interface AdminUserSummary {
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

export async function getAdminUsersList(search?: string): Promise<AdminUserSummary[]> {
  const { authClient, serviceClient } = await getAuthHelpers();
  const db = serviceClient() || (await authClient());
  if (!db) return [];

  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, display_name, role, created_at, last_login_at, last_active_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: logs } = await db
    .from("activity_logs")
    .select("user_id, event_type, module, status, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  const statsMap = new Map<
    string,
    { total: number; sql: number; ai: number; lessons: number; challenges: number; lastActive: string | null }
  >();
  for (const log of logs || []) {
    if (!log.user_id) continue;
    const cur = statsMap.get(log.user_id) || {
      total: 0,
      sql: 0,
      ai: 0,
      lessons: 0,
      challenges: 0,
      lastActive: null,
    };
    cur.total += 1;
    if (log.event_type === "sql.executed") cur.sql += 1;
    if (log.module === "ai") cur.ai += 1;
    if (log.event_type === "lesson.completed" && log.status === "success") cur.lessons += 1;
    if (log.event_type === "challenge.completed" && log.status === "success")
      cur.challenges += 1;
    if (!cur.lastActive || log.created_at > cur.lastActive) cur.lastActive = log.created_at;
    statsMap.set(log.user_id, cur);
  }

  let users: AdminUserSummary[] = (profiles || []).map((p) => {
    const s = statsMap.get(p.id);
    return {
      id: p.id,
      email: p.email ?? null,
      display_name: p.display_name || "Learner",
      role: p.role || "user",
      created_at: p.created_at,
      last_login_at: p.last_login_at ?? null,
      last_active_at: p.last_active_at || s?.lastActive || null,
      total_activities: s?.total ?? 0,
      sql_queries: s?.sql ?? 0,
      ai_requests: s?.ai ?? 0,
      lessons_completed: s?.lessons ?? 0,
      challenges_solved: s?.challenges ?? 0,
    };
  });

  if (search?.trim()) {
    const q = search.trim().toLowerCase();
    users = users.filter(
      (u) =>
        u.display_name.toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q),
    );
  }

  return users;
}

export async function getAdminAnalytics(days = 14) {
  const safeDays = Math.min(90, Math.max(1, days));
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const sinceIso = new Date(now - safeDays * dayMs).toISOString();

  const { authClient, serviceClient } = await getAuthHelpers();
  const db = serviceClient() || (await authClient());
  let totalUsers = 0;
  let logs: ActivityLogRecord[] = [];

  if (db) {
    try {
      const { count } = await db
        .from("profiles")
        .select("id", { count: "exact", head: true });
      totalUsers = count ?? 0;

      const { data } = await db
        .from("activity_logs")
        .select("*")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (data) logs = data as ActivityLogRecord[];
    } catch {
      logs = memoryLogs;
    }
  } else {
    logs = memoryLogs;
  }

  return computeAnalyticsFromLogs(logs, totalUsers, safeDays, now);
}

export function computeAnalyticsFromLogs(
  logs: ActivityLogRecord[],
  totalUsers: number,
  days = 14,
  nowMs = Date.now(),
) {
  const dayMs = 24 * 60 * 60 * 1000;
  const dauCutoff = new Date(nowMs - dayMs).toISOString();
  const wauCutoff = new Date(nowMs - 7 * dayMs).toISOString();
  const mauCutoff = new Date(nowMs - 30 * dayMs).toISOString();

  const dauSet = new Set<string>();
  const wauSet = new Set<string>();
  const mauSet = new Set<string>();

  let totalSql = 0;
  let sqlSuccess = 0;
  let sqlFailed = 0;
  let totalAi = 0;
  let apiRequests = 0;
  let totalSuccess = 0;
  let totalFailure = 0;
  let lessonCompletions = 0;
  let challengeCompletions = 0;

  const moduleCounts: Record<string, number> = {};
  const dailyMap = new Map<
    string,
    { date: string; total: number; sql: number; ai: number; failures: number; users: Set<string> }
  >();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(nowMs - i * dayMs).toISOString().slice(0, 10);
    dailyMap.set(d, { date: d, total: 0, sql: 0, ai: 0, failures: 0, users: new Set() });
  }

  for (const log of logs) {
    if (log.user_id) {
      if (log.created_at >= dauCutoff) dauSet.add(log.user_id);
      if (log.created_at >= wauCutoff) wauSet.add(log.user_id);
      if (log.created_at >= mauCutoff) mauSet.add(log.user_id);
    }

    if (log.status === "success") totalSuccess += 1;
    else totalFailure += 1;

    if (log.event_type === "sql.executed") {
      totalSql += 1;
      if (log.status === "success") sqlSuccess += 1;
      else sqlFailed += 1;
    }
    if (log.module === "ai") totalAi += 1;
    if (log.metadata?.via === "api_key" || log.module === "api") apiRequests += 1;
    if (log.event_type === "lesson.completed" && log.status === "success")
      lessonCompletions += 1;
    if (log.event_type === "challenge.completed" && log.status === "success")
      challengeCompletions += 1;

    moduleCounts[log.module] = (moduleCounts[log.module] || 0) + 1;

    const dateKey = log.created_at.slice(0, 10);
    const bucket = dailyMap.get(dateKey);
    if (bucket) {
      bucket.total += 1;
      if (log.event_type === "sql.executed") bucket.sql += 1;
      if (log.module === "ai") bucket.ai += 1;
      if (log.status === "failure") bucket.failures += 1;
      if (log.user_id) bucket.users.add(log.user_id);
    }
  }

  const dailySeries = Array.from(dailyMap.values()).map((b) => ({
    date: b.date,
    total: b.total,
    sql: b.sql,
    ai: b.ai,
    failures: b.failures,
    activeUsers: b.users.size,
  }));

  const recentErrors = logs.filter((l) => l.status === "failure").slice(0, 15);

  return {
    totalUsers,
    dau: dauSet.size,
    wau: wauSet.size,
    mau: mauSet.size,
    totalActivities: logs.length,
    totalSql,
    sqlSuccess,
    sqlFailed,
    totalAi,
    apiRequests,
    totalSuccess,
    totalFailure,
    lessonCompletions,
    challengeCompletions,
    moduleDistribution: Object.entries(moduleCounts).map(([module, count]) => ({
      module,
      count,
    })),
    dailySeries,
    recentErrors,
  };
}

function escapeCsvCell(val: unknown): string {
  const str = String(val ?? "");
  // Prevent CSV formula injection
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function activityLogsToCsv(logs: ActivityLogRecord[]): string {
  const headers = [
    "id",
    "created_at",
    "user_id",
    "user_email",
    "module",
    "event_type",
    "action",
    "status",
    "duration_ms",
    "description",
    "metadata",
  ];
  const rows = logs.map((l) =>
    [
      l.id,
      l.created_at,
      l.user_id || "anonymous",
      l.user_email || "",
      l.module,
      l.event_type,
      l.action,
      l.status,
      l.duration_ms ?? "",
      l.description,
      JSON.stringify(l.metadata || {}),
    ]
      .map(escapeCsvCell)
      .join(","),
  );
  return [headers.join(","), ...rows].join("\n");
}
