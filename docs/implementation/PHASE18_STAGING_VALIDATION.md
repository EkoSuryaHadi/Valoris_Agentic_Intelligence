# VALORIS Phase 18 — Staging Validation

## Status

Local release validation and PostgreSQL staging execution are complete. Authenticated API smoke tests and browser UAT remain.

## Completed gates

- Full automated suite: 96 tests passed across web, API, database, and domain packages.
- Static UI preview: `index.html`, `app.js`, and `styles.css` served successfully from the release worktree.
- Release migration and deterministic demo seed are present and covered by database contract tests.
- PostgreSQL staging container is running on local port `55433`; schema, migrations `004` through `006`, and seed loaded successfully.
- Seed verification returned one project, one `OPEN` reporting period, and one record for each Phase 2–16 workflow table.
- API smoke verification passed: `/health` returned `200`, authenticated project read returned `200`, valid human-controlled WBS creation returned `201`, unauthenticated read returned `401`, and invalid hierarchy input returned `422`.
- Repository worktree is clean and the release commit is pushed to `develop`.

## Pending staging actions

1. Configure the API runtime with the local/staging `DATABASE_URL` and auth values from `.env.example`.
2. Run browser UAT for Overview, Baseline, Imports, Transactions, Forecast, EVM, Changes, Cash Flow, Risks, and Audit.
3. Verify audit events, tenant scope, role boundaries, and locked-period behavior.

No agent may approve, incorporate, post, lock, or mutate financial truth without an authorized human action.
