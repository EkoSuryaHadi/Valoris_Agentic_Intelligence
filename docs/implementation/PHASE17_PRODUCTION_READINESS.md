# VALORIS Phase 17 — Production Readiness

## Release gates

- [x] Tenant and project scope enforced on protected routes.
- [x] Bearer authentication required outside explicit development mode.
- [x] Idempotency keys required for financial and approval writes.
- [x] Request correlation via `x-request-id`.
- [x] Rate limiter boundary is injectable for multi-instance deployment.
- [x] JSON body size limit and malformed JSON handling covered by tests.
- [x] `x-content-type-options: nosniff`, `referrer-policy: no-referrer`, and `cache-control: no-store` enabled.
- [x] Agent findings cannot self-approve; human disposition is required.
- [x] Baseline, forecast, EVM, change, risk, and transaction writes preserve human control.
- [x] PRD and OpenAPI are updated with the implemented MVP surface.

## Demo seed plan

The demo environment should contain one organization, one project, one open period, one approved baseline, three WBS nodes, two cost codes, two commitments, one actual cost, one draft accrual, one forecast snapshot, one EVM snapshot, one pending change, one risk, and one NEW agent finding with source evidence.

Seed data must be deterministic, obviously synthetic, and isolated from production credentials. Demo mode in the web shell remains read-only until an authorized API configuration is supplied.

## Environment checklist

Copy `.env.example` into the deployment environment and replace every placeholder. Required production values are `DATABASE_URL`, `AUTH_ISSUER_URL`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `APP_BASE_URL`, `OBJECT_STORAGE_BUCKET`, `QUEUE_URL`, and `ENCRYPTION_KEY`. Keep `LLM_PROVIDER=disabled` until an agent provider is approved and its audit controls are configured.

## Definition of Ready

A task is ready when its user outcome, scope boundary, role capability, evidence/source expectation, API contract, acceptance criteria, and rollback/lock behavior are documented. The task must identify whether the change is advisory or an approved financial mutation.

## Definition of Done

A task is done when implementation, focused failing-then-passing tests, regression tests, OpenAPI, PRD/changelog, and human-review behavior are complete. The worktree must be clean, the commit must be pushed to `develop`, and the relevant screen must be reviewable in the local preview.
