# Product requirements and evaluation

## Product and audience

A beginner should be able to explain why a query works after running it. A more experienced learner should be able to investigate a failing query, compare alternatives and integrate the same tools into another application. Success is a reproducible journey from a natural-language question to a correct result, followed by an independently graded exercise.

## Mandatory assessment build

| Capability | What a reviewer should be able to do |
| --- | --- |
| Accounts and overview | Register, sign in, sign out and see only personal activity. A new account starts at zero. Run one successful and one invalid query and verify both counters against history. |
| Assistant | Generate, explain clause by clause, fix and optimize with Gemini. Continue a scoped conversation, clarify ambiguity, copy, save or explicitly run SQL. A suggested write requires confirmation. |
| Playground | Edit highlighted SQL with line numbers, schema-aware completion and formatting. Run a statement, see ordered columns, typed values, elapsed time and logs. Export the displayed result to CSV or JSON, recall history and reset the selected session. |
| Explorer | Switch between four datasets. Inspect tables, types, keys, references, relationships and paginated sample records. Creating a table in a practice session updates the explorer, completion and tutor context. |
| Learning | Work through all three levels with a concept, syntax, executable example, expected rows, exercise, practice questions, progressive AI hint and scored knowledge check in every lesson. Resume saved progress. |
| Challenges | Choose a difficulty, inspect the problem, schema, sample input/output and edit SQL. Submit against independent fixtures. Review actionable feedback and record first completion once. |
| Developer tools | Generate, copy once, scope, rotate and revoke keys. View usage. Read and try the OpenAPI contract, register a webhook, inspect attempts, retry failed deliveries and verify a signature externally. |
| Release | Run the four quality scripts, perform two-account acceptance on a deployed build, document faculty feedback and prepare the handwritten report, viva and approved repository submission. |

### Initial curriculum

Group related topics into the following lessons. Each row shares one realistic task across its explanation, worked example and assessment.

| Level | Lessons and practical tasks |
| --- | --- |
| Beginner | Databases and relational tables (trace a student identifier). SQL syntax and SELECT (project names). WHERE (filter marks). ORDER BY and LIMIT (rank employees). DISTINCT (list departments). Basic aggregates (compare COUNT and AVG). |
| Intermediate | GROUP BY and HAVING (departments meeting a threshold). Keys and INNER JOIN (match enrolments to courses). LEFT JOIN (include empty courses). Subqueries and UNION (compare cohorts). Data manipulation (insert, update and delete a practice record). |
| Advanced | CTEs (break a report into steps). Window functions (rank within departments). Indexes and query plans (inspect a lookup). Optimization (compare equivalent joins). Transactions (commit and roll back a bounded script). Normalization (split repeated entity data and reconstruct the records). |

Ship at least one independently graded challenge per level. Use ties and missing values in a salary-ranking task, an unmatched row in a join task and multiple partitions in a window-function task. Final lesson completion requires a server-validated exercise and assessment. A failed attempt can be retried. Hints move from a concept to a clause to a partial query. Reveal a worked solution only on an explicit learner action after the hint sequence.

### Screen design

Use the sidebar groups Workspace (Overview, AI Assistant, SQL Playground, Database Explorer), Learning (Learn SQL, Practice Challenges), Library (Query History, Saved Queries), and Developer (Developer API, API Keys, Webhooks, Documentation). Put Settings at the foot. The standalone assistant and playground share the active dataset and practice session.

Desktop playground layout:

```text
Dataset ▾   Session                         Format   Save   Run ⌘/Ctrl+Enter
┌──────────────┬─────────────────────────────┬─────────────────────────┐
│ Schema       │ SQL editor                  │ Tutor                   │
│ tables       │                             │ thread, hint or SQL     │
│ columns      ├─────────────────────────────┤ Copy · Insert · Explain │
│ keys         │ Results | Execution log     │ Fix · Optimize          │
└──────────────┴─────────────────────────────┴─────────────────────────┘
```

Make splitters keyboard-resizable with collapse/restore controls. On narrow screens use Editor, Schema, Results and Tutor tabs with the same shared state. Offer an accessible plain-text editor on touch devices. Use restrained surfaces, a single accent, Inter for navigation and IBM Plex Mono for SQL and numeric results. Keep branding and semantic light/dark colors in configuration.

Show query status and duration beside results. Distinguish zero rows, SQL errors, expired sessions and provider failures. Preserve drafts across panel changes. Skeletons reserve panel space while loading. Announce completion via a live region, keep detailed errors near the action, and use toasts for short confirmations. Test keyboard-only navigation, focus restoration, touch input, contrast and reduced motion.

## Scope decisions

All rows above belong to the submission. Team collaboration, user database connections, additional SQL dialects, leaderboards, visual query builders and adaptive course recommendations can follow after evaluation. The MVP recommends the first incomplete lesson in syllabus order. Its dashboard counts executions from history, completions from unique progress rows and solved challenges from first passes. Use actual database counts divided by published curriculum counts for percentages.
