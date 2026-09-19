# VALORIS Phase 18 — Staging Validation

## Status

Local release validation is complete. Execution against a real staging PostgreSQL instance and browser UAT remain deployment-environment tasks.

## Completed gates

- Full automated suite: 96 tests passed across web, API, database, and domain packages.
- Static UI preview: `index.html`, `app.js`, and `styles.css` served successfully from the release worktree.
- Release migration and deterministic demo seed are present and covered by database contract tests.
- Repository worktree is clean and the release commit is pushed to `develop`.

## Pending staging actions

1. Provision PostgreSQL and set the values from `.env.example`.
2. Apply `docs/database/schema.sql`, migrations `004` through `006`, then `database/seed.sql`.
3. Run API health, authenticated read, and human-controlled write smoke tests.
4. Run browser UAT for Overview, Baseline, Imports, Transactions, Forecast, EVM, Changes, Cash Flow, Risks, and Audit.
5. Verify audit events, tenant scope, role boundaries, and locked-period behavior.

No agent may approve, incorporate, post, lock, or mutate financial truth without an authorized human action.
