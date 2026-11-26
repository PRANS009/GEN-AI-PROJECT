# Viva Voce Preparation Guide: SQL Studio AI

This document contains key technical questions and concise, authoritative answers for the university assessment viva.

---

### Q1: How does your application ensure SQL execution security? What prevents destructive commands?
**Answer:**  
SQL execution is completely decoupled from our production application database. All student and user queries execute inside an ephemeral WebAssembly-based SQLite virtual machine (`@sqlite.org/sqlite-wasm`) running in an isolated worker thread.  
1. *Memory and Time Limits:* Memory is bounded to a maximum of 48MB, and workers have a strict 3000ms watchdog timeout to prevent infinite loops (e.g., recursive CTEs).  
2. *Filesystem Isolation:* The database runs purely in `:memory:`, so write operations (INSERT, UPDATE, DELETE, DROP) can never modify host files or leak into other sessions.  
3. *Application Data Isolation:* User profiles, API keys, and progress are stored in Supabase PostgreSQL protected by Row-Level Security (RLS) policies; user SQL has zero connectivity to Postgres.

---

### Q2: How is the Google Gemini API integrated, and how do you guarantee valid responses?
**Answer:**  
Gemini is integrated directly through a secure server-side endpoint (`src/server/ai.ts`).  
1. *Zero Client Exposure:* The `GEMINI_API_KEY` is kept exclusively on the server and is never exposed in the browser bundle or client requests.  
2. *Schema-Aware Prompting:* Before calling Gemini, we extract the active dataset schema (table definitions, columns, primary and foreign keys, sample data) and inject it into the dedicated system prompt.  
3. *Structured Schema Validation:* We configure Gemini with JSON response formatting and validate the returned object using Zod schemas (`AiResponseSchema`). If the model fails or produces invalid JSON, our robust schema fallback gracefully handles the request without crashing.

---

### Q3: How do you validate student challenge submissions without requiring exact SQL string matching?
**Answer:**  
We evaluate submissions based on semantic execution equivalence rather than string matching. In `workers/sqlite.mjs`, when a challenge is submitted:  
1. The student's query is executed on a freshly seeded in-memory SQLite database, producing a column list and row matrix.  
2. The reference solution is executed on an identical fresh database.  
3. The engine verifies column count, row count, and row content. If the query includes `ORDER BY`, strict sequential equality is enforced; otherwise, a multiset (order-independent) comparison is performed. This permits valid alternative solutions (e.g. `JOIN ... ON` vs subqueries, different column aliases, extra whitespace).

---

### Q4: How does your API Key authentication and authorization work?
**Answer:**  
Developer API keys (`sk_live_*`) are generated using cryptographically secure randomness (`crypto.randomBytes(24)`).  
1. *Hashing at Rest:* Only the SHA-256 hash of the key is persisted in storage; the raw key is displayed to the user exactly once upon generation.  
2. *Middleware Verification:* Incoming REST requests to `/api/v1/*` provide the bearer token in the `Authorization` header. The middleware hashes the token, performs a constant-time lookup, checks revocation status, updates `last_used_at`, and enforces specific operation scopes (`ai:use`, `sql:execute`, `challenges:submit`, etc.).

---

### Q5: How is your Webhook system designed and secured?
**Answer:**  
When significant platform events occur (`query.executed`, `lesson.completed`, `challenge.completed`), our webhook dispatcher (`src/server/webhooks.ts`) sends an HTTP POST request to registered subscriber URLs:  
1. *HMAC-SHA256 Signatures:* Each request includes `X-Studio-Timestamp` and `X-Studio-Signature: v1=<hmac_hex>` computed using the subscriber's private secret and payload. Receivers can verify authenticity and protect against tampering.  
2. *Replay Protection:* Timestamps allow receivers to reject payloads outside a 5-minute tolerance window.  
3. *Delivery Logs:* All delivery attempts, HTTP status codes, and timestamps are recorded for developer auditing and retry verification.
