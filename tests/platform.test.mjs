import test from "node:test";
import assert from "node:assert/strict";
import { executeSql, evaluateChallenge } from "../workers/preview.mjs";
import { generateApiKey, hashKey, verifyAuthHeader } from "../src/server/api-keys.ts";
import { signPayload } from "../src/server/webhooks.ts";
import { requestGemini, explainSql, fixSql, optimizeSql } from "../src/server/ai.ts";
import curriculum from "../src/content/curriculum.ts";

test("arbitrary SQL query execution in sandboxed SQLite worker", async () => {
  const result = await executeSql("student_management", "SELECT name, marks FROM students WHERE marks > 80 ORDER BY marks DESC;");
  assert.equal(result.success, true);
  assert.ok(result.rows.length > 0);
  assert.equal(result.columns.length, 2);
  assert.ok(result.durationMs >= 0);
});

test("syntax error in SQL returns appropriate failure message", async () => {
  await assert.rejects(
    executeSql("student_management", "SELECT FROM WHERE;"),
    /syntax error|SQLite/i
  );
});

test("challenge evaluation correctly grades equivalent solutions and rejects wrong answers", async () => {
  const passing = await evaluateChallenge(
    "student_management",
    "SELECT name, marks FROM students WHERE marks > 85 ORDER BY marks DESC;",
    "SELECT name, marks FROM students WHERE marks > 85 ORDER BY marks DESC;"
  );
  assert.equal(passing.passed, true);
  assert.match(passing.feedback, /passed/i);

  const failing = await evaluateChallenge(
    "student_management",
    "SELECT name FROM students;",
    "SELECT name, marks FROM students WHERE marks > 85 ORDER BY marks DESC;"
  );
  assert.equal(failing.passed, false);
});

test("API key generation, secure SHA-256 hashing, and scope verification", async () => {
  const { rawKey, keyRecord } = generateApiKey("Test Key", "user_123", ["ai:use", "sql:execute"]);
  assert.ok(rawKey.startsWith("sk_live_"));
  assert.equal(keyRecord.hash, hashKey(rawKey));

  const authSuccess = await verifyAuthHeader(`Bearer ${rawKey}`, "ai:use");
  assert.equal(authSuccess.success, true);
  assert.equal(authSuccess.ownerId, "user_123");

  const authMissingScope = await verifyAuthHeader(`Bearer ${rawKey}`, "challenges:submit");
  assert.equal(authMissingScope.success, false);
  assert.match(authMissingScope.error, /scope/i);

  const authInvalid = await verifyAuthHeader("Bearer sk_invalid_key", "ai:use");
  assert.equal(authInvalid.success, false);
});

test("webhook HMAC-SHA256 signature generation and verification", () => {
  const secret = "test_webhook_secret_key_123";
  const timestamp = 1732612000;
  const payload = JSON.stringify({ id: "evt_1", event: "query.executed" });

  const signature = signPayload(secret, timestamp, payload);
  assert.ok(signature.startsWith("v1="));
  assert.equal(signature.length, 3 + 64); // v1= + 64 hex characters
});

test("AI query assistant generates, explains, fixes, and optimizes SQL queries", async () => {
  const gen = await requestGemini("Find students who scored above 80 marks", "student_management");
  assert.ok(gen.sql.includes("SELECT"));
  assert.ok(gen.explanation.length > 0);
  assert.equal(gen.queryType, "SELECT");

  const explained = await explainSql("SELECT name FROM students;", "student_management");
  assert.ok(explained.explanation.length > 0);

  const fixed = await fixSql("SELECT * FORM students", "student_management", "syntax error");
  assert.ok(fixed.sql.length > 0);

  const optimized = await optimizeSql("SELECT * FROM students;", "student_management");
  assert.ok(optimized.suggestions.length > 0);
});

test("all 20 curriculum challenges execute and pass their reference solutions", async () => {
  assert.equal(curriculum.challenges.length, 20);
  for (const ch of curriculum.challenges) {
    const res = await evaluateChallenge(ch.database, ch.solutionSql, ch.solutionSql);
    assert.equal(res.passed, true, `Challenge ${ch.id} failed self-check: ${res.feedback}`);
  }
});

test("all 18 curriculum lessons execute and pass their reference solutions", async () => {
  const lessons = curriculum.modules.flatMap((m) => m.lessons);
  assert.equal(lessons.length, 18);
  for (const lesson of lessons) {
    const res = await evaluateChallenge(lesson.database, lesson.solutionSql, lesson.solutionSql);
    assert.equal(res.passed, true, `Lesson ${lesson.id} failed self-check: ${res.feedback}`);
  }
});
