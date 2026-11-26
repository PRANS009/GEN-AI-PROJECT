import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  sanitizeMetadata,
  logActivity,
  filterInMemoryLogs,
  computeAnalyticsFromLogs,
  activityLogsToCsv,
} from "../src/server/activity.ts";

test("sanitizeMetadata redacts sensitive credentials, raw SQL, prompts, and rows", () => {
  const sanitized = sanitizeMetadata({
    database: "student_management",
    rowCount: 5,
    password: "super-secret-password",
    apiKey: "sk_live_secret123",
    authorization: "Bearer secret",
    sql: "SELECT * FROM users;",
    prompt: "Find all private emails",
    rows: [["secret@example.com"]],
  });

  assert.equal(sanitized.database, "student_management");
  assert.equal(sanitized.rowCount, 5);
  assert.equal(sanitized.password, "[redacted]");
  assert.equal(sanitized.apiKey, "[redacted]");
  assert.equal(sanitized.authorization, "[redacted]");
  assert.equal(sanitized.sql, "[redacted]");
  assert.equal(sanitized.prompt, "[redacted]");
  assert.equal(sanitized.rows, "[redacted]");
});

test("logActivity records events and handles unconfigured database gracefully", async () => {
  await assert.doesNotReject(
    logActivity({
      userId: "user-1",
      eventType: "sql.executed",
      module: "sql",
      action: "execute",
      status: "success",
      description: "Executed query on student_management",
      durationMs: 14,
      metadata: { database: "student_management", rowCount: 4, sql: "SELECT 1;" },
    }),
  );
});

test("filterInMemoryLogs supports module, status, date, and search filters", () => {
  const sample = [
    {
      id: "1",
      user_id: "u1",
      event_type: "sql.executed",
      module: "sql",
      action: "execute",
      status: "success",
      description: "Executed SQL on ecommerce",
      duration_ms: 12,
      metadata: {},
      created_at: "2026-11-26T10:00:00.000Z",
    },
    {
      id: "2",
      user_id: "u2",
      event_type: "ai.generate",
      module: "ai",
      action: "generate_sql",
      status: "failure",
      description: "AI generation failed",
      duration_ms: 50,
      metadata: {},
      created_at: "2026-11-25T10:00:00.000Z",
    },
  ];

  assert.equal(filterInMemoryLogs(sample, { userId: "u1" }).length, 1);
  assert.equal(filterInMemoryLogs(sample, { module: "ai" }).length, 1);
  assert.equal(filterInMemoryLogs(sample, { status: "failure" }).length, 1);
  assert.equal(filterInMemoryLogs(sample, { search: "ecommerce" }).length, 1);
  assert.equal(
    filterInMemoryLogs(sample, { from: "2026-11-26T00:00:00.000Z" }).length,
    1,
  );
});

test("computeAnalyticsFromLogs accurately aggregates DAU, WAU, MAU, SQL, AI, and errors", () => {
  const now = Date.parse("2026-11-26T12:00:00.000Z");
  const logs = [
    {
      id: "1",
      user_id: "u1",
      event_type: "sql.executed",
      module: "sql",
      action: "execute",
      status: "success",
      description: "SQL ok",
      duration_ms: 10,
      metadata: {},
      created_at: "2026-11-26T11:00:00.000Z",
    },
    {
      id: "2",
      user_id: "u2",
      event_type: "ai.generate",
      module: "ai",
      action: "generate_sql",
      status: "failure",
      description: "AI error",
      duration_ms: 20,
      metadata: { via: "api_key" },
      created_at: "2026-11-22T11:00:00.000Z",
    },
    {
      id: "3",
      user_id: "u1",
      event_type: "lesson.completed",
      module: "learning",
      action: "complete_lesson",
      status: "success",
      description: "Lesson 1",
      duration_ms: null,
      metadata: {},
      created_at: "2026-11-10T11:00:00.000Z",
    },
  ];

  const stats = computeAnalyticsFromLogs(logs, 5, 14, now);
  assert.equal(stats.totalUsers, 5);
  assert.equal(stats.dau, 1);
  assert.equal(stats.wau, 2);
  assert.equal(stats.mau, 2);
  assert.equal(stats.totalSql, 1);
  assert.equal(stats.sqlSuccess, 1);
  assert.equal(stats.totalAi, 1);
  assert.equal(stats.apiRequests, 1);
  assert.equal(stats.lessonCompletions, 1);
  assert.equal(stats.recentErrors.length, 1);
});

test("activityLogsToCsv neutralizes CSV formula injection", () => {
  const csv = activityLogsToCsv([
    {
      id: "1",
      user_id: "u1",
      user_email: "user@example.com",
      event_type: "sql.executed",
      module: "sql",
      action: "execute",
      status: "success",
      description: "=cmd|' /C calc'!A0",
      duration_ms: 5,
      metadata: {},
      created_at: "2026-11-26T12:00:00.000Z",
    },
  ]);
  assert.match(csv, /"'=cmd/);
});

test("activity_logging migration enforces user isolation, role immutability, and admin access", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create schema auth;
      create role authenticated;
      create role anon;
      create table auth.users(id uuid primary key, email text);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated;
    `);

    const userOne = crypto.randomUUID();
    const userTwo = crypto.randomUUID();
    const adminId = crypto.randomUUID();

    await db.query("insert into auth.users values ($1, $2), ($3, $4), ($5, $6)", [
      userOne,
      "u1@example.com",
      userTwo,
      "u2@example.com",
      adminId,
      "admin@example.com",
    ]);

    await db.exec(
      await readFile(
        new URL("../supabase/migrations/20261126000100_foundation.sql", import.meta.url),
        "utf8",
      ),
    );
    await db.exec(
      await readFile(
        new URL("../supabase/migrations/20261126000200_activity_logging.sql", import.meta.url),
        "utf8",
      ),
    );

    // Promote adminId as superuser/owner before switching to authenticated role
    await db.query("update public.profiles set role = 'admin' where id = $1", [adminId]);

    // Switch to userOne
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userOne]);

    // User 1 inserts their own activity log
    await db.query(
      "insert into public.activity_logs (user_id, event_type, module, action, status, description) values ($1, 'sql.executed', 'sql', 'execute', 'success', 'User 1 query')",
      [userOne],
    );

    // User 1 cannot insert activity log for User 2
    await assert.rejects(
      db.query(
        "insert into public.activity_logs (user_id, event_type, module, action, status, description) values ($1, 'sql.executed', 'sql', 'execute', 'success', 'Spoofed')",
        [userTwo],
      ),
      /row-level security/,
    );

    // User 1 cannot self-escalate role to admin
    await assert.rejects(
      db.query("update public.profiles set role = 'admin' where id = $1", [userOne]),
      /permission denied/,
    );

    // User 1 cannot update or delete activity_logs
    await assert.rejects(
      db.query("delete from public.activity_logs where user_id = $1", [userOne]),
      /permission denied/,
    );

    // Switch to userTwo: cannot read userOne's activity logs
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userTwo]);
    const userTwoLogs = await db.query("select id from public.activity_logs");
    assert.equal(userTwoLogs.rows.length, 0);

    // Switch to adminId: CAN read all activity logs and all profiles
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [adminId]);
    const adminLogs = await db.query("select id from public.activity_logs");
    assert.equal(adminLogs.rows.length, 1);
    const adminProfiles = await db.query("select id from public.profiles");
    assert.equal(adminProfiles.rows.length, 3);
  } finally {
    await db.close();
  }
});
