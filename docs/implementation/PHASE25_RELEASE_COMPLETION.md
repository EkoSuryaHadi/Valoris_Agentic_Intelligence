# Phase 25 — Release Completion

## Status

Application-side release work is complete through MVP-D persistence boundaries. The remaining gate is environment-owned verification against the user's current Vercel Preview and Neon branch with real identity-provider claims, object storage, and queue/worker settings.

## Completed in repository

- MVP-A/B repositories persist projects, WBS, baselines, commitments, actuals, accruals, forecasts, and EVM snapshots.
- MVP-C repositories persist changes, incorporated changes, risks, findings, finding reviews, and cash-flow snapshots.
- Human baseline transitions, change incorporation, and agent-finding review emit audit events.
- Migration `007_phase24_audit_trail.sql` is idempotent and included in `scripts/staging-db.ps1`.
- `scripts/staging-verify.ps1` validates health/security headers plus tenant-scoped project, WBS, and baseline reads when supplied a short-lived token.
- CI test suites and static security scan cover the release boundaries.

## Environment-owned release gate

1. In Vercel Preview, apply schema, migrations `004–007`, and `database/seed.sql` to the Neon Preview branch.
2. Configure real `AUTH_JWKS_URL`, `AUTH_ISSUER_URL`, and `AUTH_AUDIENCE`; keep `LLM_PROVIDER=disabled`.
3. Configure object storage and queue values only when those services are available; do not enable production promotion yet.
4. Run `scripts/staging-preflight.ps1` and `scripts/staging-verify.ps1` with a short-lived JWT containing `sub`, `org_id`, `project_id`, and `role`.
5. Run browser UAT against the deployed web URL and confirm project scope, financial writes, approval/review actions, and audit evidence.

## Exit criteria

- `npm run test:all`, `npm run security:scan`, and `npm run build` pass on the release commit.
- Preview API reads Neon seed data and all state-changing MVP-A–C routes persist successfully.
- Unauthorized tenant/project requests are rejected.
- No agent can approve, lock, incorporate, or disposition financial truth without a human role.
- Production environment remains untouched until explicit human approval.
