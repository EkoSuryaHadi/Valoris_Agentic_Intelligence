# VALORIS Phase 21 — Real Staging Environment

## Objective

Connect the release candidate to a real staging environment while keeping credentials outside the repository and preserving the Human-in-the-Loop guardrails.

## Preflight

1. Copy `.env.example` to a secret-managed `.env.staging` file.
2. Replace all placeholders and keep `LLM_PROVIDER=disabled` until agent provider controls are approved.
3. Run `powershell -ExecutionPolicy Bypass -File scripts/staging-preflight.ps1 -EnvFile .env.staging`.
4. Optionally pass health URLs for the auth provider, object storage, and queue/worker services.
5. Run `scripts/staging-db.ps1 -Seed` only against an isolated staging database.
6. Run `scripts/staging-verify.ps1` against the deployed API with a short-lived staging token.

## Required services

- PostgreSQL with migrations 004–006 applied
- Auth provider issuing a JWT with issuer, audience, expiry, organization, project, and role claims
- Object storage bucket for source evidence and import artifacts
- Queue/worker endpoint for asynchronous jobs
- API and web base URLs reachable from the staging network

## Exit criteria

- No placeholder or secret value appears in logs.
- Authenticated project access is tenant- and project-scoped.
- Import, financial writes, approvals, and finding dispositions require the correct human role.
- Agent recommendations remain advisory and cannot mutate financial truth.
- Demo seed is isolated from production data.
