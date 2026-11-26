# SQL Studio AI

Individual BTIN337 Gen AI Applications CIA-P project. A learner chooses a synthetic dataset, asks a question, inspects the generated SQLite query, runs it and practices the same concept on a graded exercise. The initial product name will live in one branding configuration.

## Project status

Phase 0 design baseline, 26 November 2026. Workspace inspection found an empty directory, including hidden files, with no package manifest, source code or Git repository. Local tools reported Node 26.8.2, npm 11.19.1 and Git 2.55.0. The directory name ends with a space. Use a quoted path locally and set the npm package name explicitly to `sql-studio-ai` when scaffolding.

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

## First demonstration to build

Sign in as a new learner. Choose Student Management and ask for students scoring above 80. Inspect the generated SQL and its rationale. Run it, then check the result against the schema explorer. Reopen the dashboard and see one real execution. Issue a scoped key, call the API from a terminal, and verify a signed event at an independent HTTPS receiver. Use a second account to demonstrate isolation.

The roadmap distinguishes planned evidence from recorded results. Application tests, live credentials, deployment, faculty feedback and final submission belong to the later phases. The university repository is the submission destination after faculty approval and access. This local repository has no configured remote.
