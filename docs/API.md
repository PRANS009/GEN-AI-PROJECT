# Public API design

The authoritative Phase 0 interface is OpenAPI 3.1 in [public/openapi.yaml](../public/openapi.yaml). These routes describe intended behavior. External callers send a developer bearer key over HTTPS. Each operation requires its documented scope. The browser uses its verified session against the same services. Account management routes accept browser sessions only. All timestamps use UTC RFC 3339.

| Method and path | Required scope | Input → output and side effect |
| --- | --- | --- |
| POST /api/v1/generate | ai:use | Prompt, database, optional session/thread → SQL and explanation or a clarifying question. A generated query records query.generated. |
| POST /api/v1/explain | ai:use | SQL and database → explanation of clauses and suggestions. |
| POST /api/v1/fix | ai:use | SQL, database, optional engine error → proposed correction and warnings. |
| POST /api/v1/optimize | ai:use | SQL and database → proposed rewrite and rationale. Performance improvements require measurement. |
| POST /api/v1/execute | sql:execute | SQL, database, optional practice session/revision → ordered columns, row arrays, changed rows, elapsed time, truncation, query ID and revision. Successful or failed engine executions enter personal history. |
| GET /api/v1/schema | schema:read | Database and optional session → seed version, tables, typed columns, PKs, composite FKs and synthetic seed or owned session previews. |
| GET /api/v1/history | history:read | Optional cursor and limit → owner's recent executions, newest first, nextCursor. |
| GET /api/v1/lessons | learning:read | Optional level, cursor and limit → public lesson materials with the caller's completion state. |
| POST /api/v1/challenges/submit | challenges:submit | Challenge ID and SQL → submission ID, verdict, public case summary, feedback and first-completion flag. Incorrect SQL is a graded attempt and returns 200. |
| GET /api/health | Public | Short dependency readiness check → ready/degraded and request ID. Use a bounded DB/schema probe and configuration checks. A dependency failure returns 503. Keep provider calls out of routine health checks. |

The session resource additionally exposes POST /api/v1/sessions and POST /api/v1/sessions/{id}/reset under sql:execute. An execution without a session uses a fresh practice seed and discards writes when the request ends. A supplied session requires the matching database and an expected revision for writes. Return 409 on a race. The UI can explicitly run up to eight statements in one sandbox call for the transactions lesson. Require a final closed transaction before snapshot publication and discard the whole working copy on error. Return the last statement's grid, with total changed rows and wall time for the batch. The interactive editor and API require explicit confirmWrites for engine-classified writes.

### External integration example

```bash
curl --fail-with-body "$STUDIO_ORIGIN/api/v1/generate" \
  -H "Authorization: Bearer $STUDIO_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"database":"student_management","dialect":"sqlite","prompt":"List the names of students scoring above 80."}'
```

An illustrative structured response follows. It is a contract example.

```json
{
  "success": true,
  "requestId": "3b6f0b5e-6154-4896-9f9f-ec51f38cea31",
  "data": {
    "conversationId": "5ce7e899-8371-4758-b5ff-0d7e44dfcc32",
    "sql": "SELECT name FROM students WHERE marks > 80;",
    "explanation": "SELECT returns the name. WHERE keeps students whose marks exceed 80.",
    "queryType": "SELECT",
    "warnings": [],
    "suggestions": []
  }
}
```

Every error includes success=false, a requestId and an error with code and message. A 400 INVALID_SQL can include engine position and a queryId. HTTP 401 means the caller needs valid credentials, 403 means a missing scope or unconfirmed write, and 404 covers unknown or inaccessible resources. Use 409 for conflicting revisions or idempotency keys, 429 with Retry-After for a quota, 500 for unexpected faults and 503 for provider/DB unavailability. Invalid upstream model output produces 503 with a stable code. Invalid API input never counts as an executed query.

For execution, session reset/creation and challenge submission, accept an Idempotency-Key. Scope it to principal and operation for 24 hours. A repeated identical completed call returns its recorded response. A conflicting body or in-flight call returns 409. Clients should reuse this key when retrying an ambiguous timeout. After a stale revision, reload session state before issuing a new write. Page cursors encode the final ordering pair, timestamp and ID for history or curriculum position and ID for lessons. Default limit 20, maximum 100.

### Session-only management

| Resource under /api/account | Actions and access |
| --- | --- |
| keys, keys/{id}/rotate, keys/{id}/revoke | List metadata/usage, create a named scoped key, rotate or revoke. Secrets appear only in successful creation/rotation responses. |
| webhooks, webhooks/{id} | Register a URL/subscriptions, edit, enable, disable or remove. Return a new signing secret once. |
| webhooks/{id}/test, deliveries, deliveries/{id}/retry | Queue a signed synthetic test event, inspect owned delivery history, request bounded retry of a failed delivery. |
| saved-queries, saved-queries/{id} | Create, list, update and delete owned SQL snippets. |
| lessons/{id}/assess, challenges/{id}/hint | Grade an exercise/assessment server-side or provide the next hint in the learner's sequence. |
| overview, conversations/{id}, settings | Fetch derived metrics and owned context, update profile preferences. |

### Webhook receiver contract

The five production event types are query.generated, query.executed, query.failed, lesson.completed and challenge.completed. A dashboard test sends a synthetic instance marked test=true. Send event UUID, event name, UTC timestamp and a small typed data object. For query.executed include queryId, status, executionTimeMs and rowCount. Exclude SQL and result rows. Register HTTPS endpoints, return 2xx promptly and store processed event IDs under a unique constraint.

Sign the ASCII Unix timestamp header, a literal period and the raw UTF-8 body together. Send X-Studio-Timestamp and X-Studio-Signature (v1= followed by lowercase hex HMAC-SHA256). Verify before parsing JSON. Decode the one-time base64url signing secret to bytes, enforce a five-minute replay window and compare equal-length digests in constant time. Each retry receives a fresh signature timestamp and the same event ID. The security design specifies retry, SSRF and duplicate-handling controls. Phase 5 will serve the spec in Swagger and add executable Python, JavaScript, cURL and receiver verification examples against the deployed base URL.
