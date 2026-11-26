# Delivery plan and assessment evidence

**Deadline:** complete the assessment build before 4 December 2026. Target the verified release on 2 December and reserve 3 December for feedback and submission preparation. Dates use Asia/Kolkata. The schedule assumes one student, prompt access to hosted accounts and a faculty feedback opportunity. Faculty approval and repository access determine the final push date.

| Target | Phase and priority | Work and exit evidence |
| --- | --- | --- |
| Nov 26 | 0 · Design | Inspect workspace, decide boundaries, record provider constraints, define data model, review public contract and prioritize the mandatory scope. Review the plan against the eleven requested outputs. |
| Nov 26–27 | 1 · Foundation | Scaffold a locked Next project, typed env and brand configuration. Build accessible shell, Supabase Auth callback, initial migrations, RLS and first preview. Prove two separate accounts, readiness and a Linux production build. Run a small disposable-worker experiment on preview now to expose packaging or hard-limit issues early. |
| Nov 27 | 2 · Gemini | Add the supplied system prompt, official REST request, scope-bound context, validated responses, timeout and quotas. Run real generation against a known seed and save a redacted trace. Test invalid output, follow-up, clarification and provider errors. |
| Nov 28–29 | 3 · Workspace | Implement engine restrictions, persisted session revisions, reset, four seeds, Monaco, schema tree, results, history, save, export and dashboard counts. Validate all requested SQL operations, failed queries, two-user isolation, limits and revision conflicts. |
| Nov 29–30 | 4 · Learning | Publish lessons covering all listed topics and at least one multi-fixture challenge per difficulty. Verify every expected example against its seed. Demonstrate hints, assessment, equivalent solutions, NULLs, duplicates, tie handling and persistent progress. |
| Nov 30–Dec 1 | 5 · Developer platform | Expose the versioned service adapters, keys/scopes/usage, dashboard management, Swagger, code examples, signatures and durable retries. Verify external cURL, revocation, remote receiver acknowledgement, duplicate handling and redelivery after failure. |
| Dec 2 | 6 · Release | Exercise a clean migration and seed, repeat upgrade from preceding schema, run lint/typecheck/test/build, two-account browser and external-client smoke tests on the deployed version. Record a deployment URL, commit, UTC time, signed receiver receipt and known limits. |
| Dec 3 | 7 · Academic handoff | Rehearse the demonstration, record actual faculty feedback and response commits, prepare viva Q&A and handwritten report content, verify prescribed format and package approved source. Obtain faculty approval and repository access before submitting. |
| Nov 26 | 8 · Activity & Admin | Faculty feedback integration: persistent `activity_logs` migration, centralized sanitizing logger, `/activity` timeline, `/admin/activity` RBAC dashboard, charts, individual user monitoring, and CSV export. |

## Acceptance evidence

Keep a record per release with date, commit, environment, expected condition, actual result and artifact link. Mark untested items pending. Use local commits per accepted increment and redact tokens, signing keys and personal identifiers from screenshots. Test doubles make failures deterministic. Record live Gemini and real HTTPS receiver calls separately.

| Mandatory university requirement | Planned evidence | Current state |
| --- | --- | --- |
| 1. Functional application on assigned topic | Registered learner completes generate → execute → explanation → correction → graded practice with saved progress. | Product and architecture defined |
| 2. Deploy to approved hosting | Reachable Vercel URL, readiness response, cold-start worker and two-account smoke report. | Hosting plan defined |
| 3. Direct Gemini/Grok API | Server-only Gemini REST source, live model ID, redacted provider outcome and schema-valid response. | Provider and candidate model reviewed |
| 4. External API endpoints | Public OpenAPI contract, authenticated requests from an independent terminal and response assertions. | Design contract authored |
| 5. JSON webhooks and HTTP status | Signed event captured at independent receiver, retry/failure history and receiver verification result. | Delivery design defined |
| 6. Structured key authentication and authorization | Create, scope, use, rotate, revoke, inspect usage and prove forbidden cross-owner access. | Identity and lifecycle defined |
| 7. API documentation | Swagger with current deployment origin, use-case examples and working Python, JavaScript and cURL calls. | OpenAPI and example drafted |
| 8. Secure code and env | RLS/grant tests, sandbox limits, secret scan, .env.example, bounded outbound transport. | Controls and release tests defined |
| 9. Multiple iterations and feedback | Dated feedback from faculty, issue/decision, linked implementation commit and retest outcome. | Feedback pending |
| 10. Approved designated Git submission | Faculty approval record, granted access and exact reviewed commit submitted to designated repository. | Local repository only |
| 11. One-page handwritten report | Concise final text mapped to faculty-prescribed headings and actual observations. | Official template and verified results pending |

### Verification checklist by layer

- Unit: Zod request limits and AI variants, key hashing/validation, grants/scopes, grading comparator, HMAC and timestamp verification, DNS/IP decisions, quota and scheduling calculations.
- Integration: real SQLite seed → SELECT/write/error/timeout/reset; two concurrent writes; separated sessions; tests with duplicated/NULL rows and alternative queries; outbox atomicity, disablement, leases and retry limits.
- Database: migrate and seed an empty instance, test upgrade and RLS with two authenticated identities, check cross-owner children, read-only catalogue, quota concurrency and unique completions. Confirm browser roles cannot forge history or progress.
- HTTP: status/envelope and ownership tests with cookies and bearer keys, invalid bodies, scopes, key rotation, idempotent retries, provider failure, no-store responses and Swagger examples. Confirm health reports an unavailable dependency.
- Release: run npm run lint, npm run typecheck, npm run test and npm run build against the release commit. Verify touch and keyboard flow, fresh registration, a real Gemini answer, signed callback and retry on the actual deployment.

### Risks and contingencies

| Risk | First check | Planned response |
| --- | --- | --- |
| A WASM package resolves but its Node worker or limits fail on Vercel | Preview loads the worker, proves a hard deadline, hard memory cap and next-request recovery in Phase 1 | Trace missing assets, supply a bounded WASM build if necessary. Keep execution unavailable until limits pass. Escalate a hosting change to faculty only if the approved platform cannot satisfy isolation. |
| Model unavailable or quota too low for evaluation | Account-scoped model listing and structured generation on Nov 27 | Select an available compatible free model via environment, lower local budgets and keep editor, lessons and history operational during AI outages. |
| Public registration fails under default SMTP | Sign up with a fresh evaluator identity on preview | Configure Supabase GitHub OAuth first. Verify any additional email path with custom SMTP before advertising it. |
| Serverless retries duplicate an event or lose a write | Kill a worker after send or during an update, then run another dispatcher | Use transactional outbox, leases, stable event IDs, deduplicated transitions, revision checks and idempotent request receipts. |
| Free database fills with practice images and logs | Measure seed/snapshot sizes, active sessions and row growth during rehearsal | Enforce per-owner snapshot caps, expire inactive sessions and define retention. Avoid storing full execution grids in history. |
| Eight calendar days leave little integration time | Require an early preview and demonstrate one end-to-end flow per phase | Defer optional features first, retain one polished challenge per difficulty, and identify unmet gates explicitly if a dependency slips. |
| Faculty template or approval arrives late | Ask for the prescribed report layout and feedback slot during implementation | Draft one page covering objective, design, GenAI/API/webhook method, verified results and conclusion. Map to official headings on receipt. Keep the reviewed local commit ready. |

### Demonstration and viva preparation

Use the Student Management marks query as the through-line. Show the selected schema, one live generation and run, an error and correction, a lesson assessment and an alternative passing challenge answer. Then use a scoped key outside the browser, show a signed event followed by a successful retry, revoke the key and demonstrate 401 on the next call. Prepare to explain the SQLite/PostgreSQL trust boundary, model validation, row-level security, multiset grading, shared rate limits, at-least-once delivery and free-tier tradeoffs.

Final report and viva answers should refer to the deployed commit and observed outcomes. The designated repository is [GenAI-CIAP-2025Batch](https://github.com/kamathn-blr/GenAI-CIAP-2025Batch.git).
