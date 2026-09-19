# VALORIS Release Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the remaining repository-backed MVP-C/MVP-D release work, staging verification tooling, and production handoff documentation without weakening tenant isolation or Human-in-the-Loop controls.

**Architecture:** Keep domain calculations and approval rules unchanged. Extend the existing API `persistence` boundary with parameterized PostgreSQL repositories for changes, risks, agent findings, cash-flow snapshots, and audit events; load those records at Vercel cold start and update in-memory stores only after successful persistence. Finish with deterministic tests, security checks, release documentation, and a clean push to `main`.

**Tech Stack:** Node.js ESM, `node:test`, PostgreSQL/Neon via `pg`, Vercel Node Function, vanilla web shell, GitHub Actions.

**Spec:** `docs/prd/README.md`, `docs/PRODUCTION_HANDOFF.md`, `docs/implementation/PHASE24_VERCEL_DEPLOYMENT.md`

## Global Constraints

- Tenant isolation uses `organization_id` and project-scoped RBAC.
- Approved baselines and locked periods are immutable; corrections use adjustment records.
- Financial amounts remain fixed-precision decimal values in project currency.
- Agent findings always retain evidence, confidence, and explicit human disposition.
- Approval/review actions remain authorized human actions with audit reasons where required.
- No LLM/provider automation is enabled by default.
- Every implementation increment updates the affected PRD/spec and changelog in the same commit.

### Task 1: Complete MVP-C/D PostgreSQL persistence boundaries

**Files:**
- Modify: `packages/api/src/server.js`
- Modify: `api/index.js`
- Modify: `packages/api/src/database-stores.js`
- Modify: `packages/db/src/domain-repositories.js`
- Test: `packages/api/test/http-hardening.test.js`
- Test: `packages/db/test/forecast-repositories.test.js`

**Interfaces:**
- `persistence.change.create(value)`, `persistence.change.incorporate(value)`
- `persistence.risk.create(value)`
- `persistence.finding.create(value)`, `persistence.finding.review(value)`
- `persistence.cashFlow.save(value)`
- `persistence.audit.record(value)`

- [x] Add failing API tests proving successful change, incorporation, risk, finding creation/review, and cash-flow responses call the matching persistence callbacks.
- [x] Add failing repository tests proving API-generated IDs and audit fields are passed as parameterized values.
- [x] Implement repositories against `changes`, `risks`, `agent_findings`, `cash_flow_snapshots`, and a new audit table migration.
- [x] Wire repositories in `api/index.js` and load cash-flow/audit stores safely.
- [x] Run API and database tests.

### Task 2: Add audit trail schema and Human-in-the-Loop event capture

**Files:**
- Create: `database/migrations/007_phase24_audit_trail.sql`
- Modify: `database/seed.sql`
- Modify: `packages/api/src/server.js`
- Test: `packages/db/test/release-readiness.test.js`
- Test: `packages/api/test/http-hardening.test.js`

- [x] Define an append-only `audit_events` table with organization/project/user/action/entity/reason/request metadata and JSON details.
- [x] Record baseline transition, change incorporation, and finding review events after successful domain decisions.
- [x] Assert no agent route can create an accepted disposition without a human actor.
- [x] Update seed and migration coverage tests.

### Task 3: Release verification and documentation

**Files:**
- Modify: `docs/prd/README.md`
- Modify: `docs/implementation/PHASE24_VERCEL_DEPLOYMENT.md`
- Modify: `docs/implementation/PHASE21_STAGING_ENVIRONMENT.md`
- Modify: `docs/implementation/CHANGELOG.md`
- Modify: `scripts/staging-verify.ps1`
- Create: `docs/implementation/PHASE25_RELEASE_COMPLETION.md`

- [x] Document completed MVP-C/D persistence and remaining external-secret actions.
- [x] Extend staging runbook with migration 007 and release verification steps without exposing credentials.
- [x] Document Vercel Preview/Neon branch promotion checklist and rollback procedure.
- [x] Record test/security evidence and the exact commit in the PRD/changelog.

### Task 4: Full validation and delivery

**Files:**
- Modify only as required by verification findings.

- [x] Run `npm.cmd run test:all`.
- [x] Run `npm.cmd run security:scan`.
- [x] Run `npm.cmd run build`.
- [x] Run `git diff --check` and inspect status.
- [x] Commit the completed increment and push both `phase10-api-wiring` and `main`.
- [x] Report the completed phase and any external action still requiring the user's Vercel/Neon credentials.
