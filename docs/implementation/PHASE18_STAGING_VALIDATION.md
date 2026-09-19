# VALORIS Phase 18 — Staging Validation

## Status

Local release validation, PostgreSQL staging execution, authenticated API smoke tests, and browser UAT are complete.

## Completed gates

- Full automated suite: 96 tests passed across web, API, database, and domain packages.
- Static UI preview: `index.html`, `app.js`, and `styles.css` served successfully from the release worktree.
- Release migration and deterministic demo seed are present and covered by database contract tests.
- PostgreSQL staging container is running on local port `55433`; schema, migrations `004` through `006`, and seed loaded successfully.
- Seed verification returned one project, one `OPEN` reporting period, and one record for each Phase 2–16 workflow table.
- API smoke verification passed: `/health` returned `200`, authenticated project read returned `200`, valid human-controlled WBS creation returned `201`, unauthenticated read returned `401`, and invalid hierarchy input returned `422`.
- Browser UAT passed for Overview, WBS/CBS, Baseline, Import Center, Transactions, Forecast, EVM, Changes, Cash Flow, Risk & Findings, and Audit Trail. Full reload deep-links render the requested view and the browser console is clean.
- Node database boundary passed: `createPool()` connected through `DATABASE_URL` to PostgreSQL staging and confirmed database `valoris` with one seeded project.
- Repository worktree is clean and the release commit is pushed to `develop`.

## Remaining deployment actions

1. Configure the deployed API runtime with the staging `DATABASE_URL` and auth values from `.env.example`.
2. Verify audit events, tenant scope, role boundaries, and locked-period behavior against deployed identity and database services.

The repeatable local/staging database command is `powershell -ExecutionPolicy Bypass -File scripts/staging-db.ps1 -Seed`. It starts or reuses the isolated PostgreSQL container, applies schema and migrations in order, and only loads demo data when `-Seed` is provided.

The runbook was verified both against the existing staging container and a fresh temporary PostgreSQL container; the temporary verification container was removed afterward.

For deployed API verification, use `powershell -ExecutionPolicy Bypass -File scripts/staging-verify.ps1 -ApiBaseUrl <url> -BearerToken <token> -ProjectId <id>`. The token is supplied at execution time and is never persisted.

No agent may approve, incorporate, post, lock, or mutate financial truth without an authorized human action.
