# SQL Studio AI

Individual BTIN337 Gen AI Applications CIA-P project. A learner chooses a synthetic dataset, asks a question, inspects the generated SQLite query, runs it and practices the same concept on a graded exercise. The initial product name will live in one branding configuration.

## Project status

Phase 1 local foundation, 26 November 2026. The current build supports Supabase registration, sign-in, owner-isolated profiles and a SQLite-backed sample explorer. Workspace inspection found an empty directory, including hidden files, with no package manifest, source code or Git repository. Local tools reported Node 26.8.2, npm 11.19.1 and Git 2.55.0. The directory name ends with a space. Use a quoted path locally and set the npm package name explicitly to `sql-studio-ai` when scaffolding.

| Review question | Design record |
| --- | --- |
| What should the assessment build deliver? | [Product requirements, curriculum and UX](docs/PRODUCT.md) |
| Where does SQL execute, and what survives a restart? | [System architecture, repository and data model](ARCHITECTURE.md) |
| How will external applications call it? | [API contracts and worked examples](docs/API.md) and [OpenAPI specification](public/openapi.yaml) |
| How will we protect users, secrets and webhook receivers? | [Security design](SECURITY.md) |
| Which dependencies and free-tier constraints affect the decision? | [Compatibility and deployment plan](docs/DEPLOYMENT.md) |
| How will each phase and faculty requirement be demonstrated? | [Delivery roadmap and evidence matrix](ROADMAP.md) |

## Phase 0 verification

Redocly validated the OpenAPI 3.1 document with its spec ruleset. A separate check resolved all internal references and local documentation links, counted 12 unique operations and validated the documented generation request and response against their schemas.

## Run locally

Use Node 26.x, npm and Docker Desktop. Run these commands in the checkout.

```bash
npm ci
npx supabase start -x realtime,storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
node scripts/connect-local.mjs
npm run dev
```

Open [SQL Studio AI](http://localhost:3000). The local connection script creates an ignored .env.local once. Keep the existing file on subsequent starts. Supabase applies the foundation migration during first startup. Apply subsequent local migrations with `npx supabase migration up --local`. The minimal stack uses password registration with email confirmation disabled locally. For hosted auth configure email confirmation and SMTP or the documented GitHub provider. Set APP_ORIGIN to the actual origin and allowlist /auth/callback in Supabase.

The overview opens four sample databases. Choose a table in Database explorer to see actual SQLite results, column types and foreign keys. Sign in to edit your display name. The worker accepts catalogue identifiers and runs a fixed sample statement. Arbitrary SQL, Gemini, grading, scoped developer keys and webhooks are scheduled in later phases.

## Verify

```bash
npm run lint
npm run typecheck
npm run test
npm run build
node --env-file=.env.local scripts/smoke-local.mjs
```

The last command requires the running local app and Supabase. It creates two synthetic local accounts, submits the actual registration and login forms, updates a profile and verifies isolation. The automated suite also exercises the migration on PostgreSQL-compatible PGlite, all seeded tables and worker timeout recovery. The public health check returns 200 only when the database schema probe succeeds. A missing database returns 503.

For a Vercel preview, use the repository root, configure a reachable Supabase project from .env.example, apply the migration and register the preview callback. Localhost credentials only work on this Mac. The remaining release checks and university submission workflow are in [ROADMAP.md](ROADMAP.md).
