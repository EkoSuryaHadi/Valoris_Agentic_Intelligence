# Phase 0 Runbook

## Goal

Make local development reproducible before feature work begins.

## Current foundation

- Node test runner and deterministic domain package.
- Canonical env names in `.env.example`.
- PostgreSQL executable baseline in `docs/database/schema.sql`.
- Deterministic Acme Construction demo seed in `database/seed.sql`.
- CI runs domain tests on `main`, `develop`, and pull requests.
- Product, API, database, backlog, and agentic guardrails are linked from `docs/PRODUCTION_HANDOFF.md`.

## Local sequence

1. Copy `.env.example` to `.env` and replace only local values.
2. Create PostgreSQL database `valoris`.
3. Apply `docs/database/schema.sql`.
4. Apply `database/seed.sql`.
5. Run `npm test`.

## Phase 0 acceptance

- A clean checkout has no runtime secrets.
- Domain tests pass without external services.
- Seed is idempotent for core demo entities.
- CI executes the same test command as local development.
- The next implementation slice must add runtime authentication, tenant middleware, and RBAC before exposing project data.
