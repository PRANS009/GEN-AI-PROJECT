# Academic Project Report: SQL Studio AI
**Course:** Gen AI Applications (BTIN337) — CIA-P Assessment (20 Marks)  
**Date:** November 2026  
**Author:** Individual Submission  
**Target Repository:** https://github.com/kamathn-blr/GenAI-CIAP-2025Batch.git  

---

### 1. Project Title & Objective
**Title:** SQL Studio AI — Database Query Assistant and SQL Learning Platform  
**Objective:** Design, develop, test, and deploy a production-grade, secure, AI-powered platform to help students and developers learn relational database concepts, generate schema-aware SQL from natural language, execute queries in an isolated sandbox, and practice with graded coding challenges.

---

### 2. System Architecture & Tech Stack
- **Frontend & App Framework:** Next.js (App Router, Server Actions, SSR), React 19, TypeScript.
- **Styling & UI:** Tailwind CSS, responsive developer-tool layout with light/dark theme toggle.
- **SQL Execution Sandbox:** In-memory SQLite WebAssembly (`@sqlite.org/sqlite-wasm`) with bounded memory limits and strict execution timeouts (3000ms), ensuring total isolation from application databases.
- **Application Database & Auth:** Supabase PostgreSQL with strict Row Level Security (RLS) policies and session-based authentication.
- **AI Engine:** Direct server-side integration with Google Gemini API (`gemini-2.5-flash`), strictly validated via Zod structured schemas.
- **Developer Platform:** Versioned REST APIs (`/api/v1/*`), cryptographically secure SHA-256 hashed API keys with granular scopes, and HMAC-SHA256 signed webhooks with retry capabilities.

---

### 3. Direct Generative AI Integration
- **System Prompt:** Configured as a specialized SQL Tutor and Database Engineer. It injects active schema definitions (tables, columns, data types, primary & foreign keys) into the context window.
- **Validation:** Enforces structured JSON output conforming to `{ sql, explanation, queryType, warnings, suggestions }`.
- **Operations:**
  1. *Natural Language to SQL:* Converts ambiguous or plain English user prompts into valid SQL.
  2. *Line-by-Line Explanation:* Explains clauses, projections, and joins for educational clarity.
  3. *AI Error Correction:* Diagnoses syntax/runtime engine errors and proposes validated repairs.
  4. *Query Optimization:* Analyzes execution complexity and suggests index & join refinements.
- **Safety Boundary:** Zero client exposure of AI credentials; requests run through secure server-side routes with request rate limiting.

---

### 4. Developer REST APIs & Webhook System
- **REST Endpoints:**
  - `POST /api/v1/generate`: Generates SQL & explanation from natural language prompts (`ai:use`).
  - `POST /api/v1/explain`: Line-by-line query explanation (`ai:use`).
  - `POST /api/v1/execute`: Sandboxed SQLite execution returning columns, rows, timing (`sql:execute`).
  - `POST /api/v1/fix`: AI repair of syntax and schema errors (`ai:use`).
  - `POST /api/v1/optimize`: AI query performance recommendations (`ai:use`).
  - `GET /api/v1/schema`: Schema inspection for datasets (`schema:read`).
  - `GET /api/v1/history`: User execution history (`history:read`).
  - `GET /api/v1/lessons`: Curriculum modules and completion states (`learning:read`).
  - `POST /api/v1/challenges/submit`: Automated multiset test grading (`challenges:submit`).
  - `GET /api/health`: Comprehensive dependency and database readiness probe.
- **Authentication:** Dual-mode auth supporting verified browser cookies and `Authorization: Bearer sk_live_*` API keys validated via SHA-256 hash lookup and scope verification.
- **Webhooks:** Dispatches event notifications (`query.generated`, `query.executed`, `query.failed`, `lesson.completed`, `challenge.completed`). Payloads are signed with HMAC-SHA256 headers (`X-Studio-Signature: v1=<hex>`, `X-Studio-Timestamp`).

---

### 5. Educational Platform & Practice Challenges
- **Three-Tier Curriculum:**
  - *Beginner:* Relational concepts, SELECT, WHERE filtering, ORDER BY, LIMIT, Basic Aggregates.
  - *Intermediate:* INNER/LEFT JOINs, GROUP BY, HAVING, Subqueries.
  - *Advanced:* Common Table Expressions (CTEs), Window Functions (`RANK`, `ROW_NUMBER`), Transactions.
- **Automated Grading Engine:** Compares student query output against canonical solutions via multiset equivalence and order verification rather than fragile string matching.

---

### 6. Verification & Evaluation Results
- **Automated Test Suite:** 9/9 passing tests in Node.js native test runner (`tests/foundation.test.mjs`, `tests/platform.test.mjs`).
- **Type Safety & Linting:** 0 TypeScript compiler errors, 0 ESLint warnings.
- **Production Build:** Next.js production build (`next build --webpack`) verified and ready for Vercel deployment.
