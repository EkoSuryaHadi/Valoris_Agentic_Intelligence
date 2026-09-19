# Implementation Changelog

This file links implementation increments to the PRD contract. Update it in the same commit as any material product or technical change.

## 2026-09-19 — Release validation foundation

- Added release migration for EVM snapshots, changes, risks, agent findings, and cash-flow snapshots.
- Expanded deterministic demo seed through the end-to-end cost-control workflow.
- Updated CI and `npm test` to execute web, API, database, and domain suites.
- Completed local release smoke validation and documented the remaining staging-only actions for Phase 18.
- Applied schema, migrations 004–006, and deterministic seed to the local PostgreSQL staging container; verified the seeded workflow records and OPEN/NEW statuses.
- Completed API smoke validation for health, security headers, tenant-scoped read, human-controlled WBS write, unauthorized access, and hierarchy rejection.
- Completed browser UAT across all primary workspace screens; fixed hash-route reload handling and removed the favicon console error.
- Verified the Node `pg` pool boundary against the running PostgreSQL staging container using `DATABASE_URL`.
- Added the Phase 19 repeatable PostgreSQL staging runbook with parameterized credentials and opt-in demo seed loading.
- Added the Phase 20 deployment verification script for API health, security headers, authenticated project access, and optional project scope checks.
- Added the Phase 21 staging preflight and environment runbook for secret-safe auth, storage, queue, database, and deployment checks.
- Added the Phase 22 Playwright CLI browser UAT runner for all 11 primary workspace screens and console-error detection.

## 2026-09-18

- Added runtime PostgreSQL pool and tenant-scoped project repository. Related PRD: Platform Core, Database, Security.
- Added parameterized WBS/CBS, baseline-line, and actual-cost repository boundaries. Related PRD: Project Setup, Cost Baseline, Actual Cost.
- Added parameterized commitment, accrual, and forecast snapshot repositories. Related PRD: Commitment, Forecast, and EAC.
- Reconciled tenant-scoped transaction reads with the shared-schema ownership model and added the forecast persistence migration. Related PRD: Platform Core, Commitment, Forecast, and EAC. Acceptance: organization and project scope are enforced through the project join; forecast snapshots are unique per project and reporting period.
- Added RS256 JWT/JWKS verification with issuer, audience, expiry, key, and signature validation; wired API runtime to bearer authentication with an explicit development-only header fallback. Related PRD: Platform Core and Security. Acceptance: production paths reject missing bearer credentials and preserve tenant/project claims from the verified token.
- Added bounded JSON parsing and injectable per-client rate limiting for state-changing API routes, with structured `400`, `413`, `429`, and `401` errors. Related PRD: Platform Core and Security. Acceptance: oversized/malformed bodies and abusive request bursts are rejected without exposing internals.
- Added validated request correlation IDs, audit-safe structured request events, and an injectable rate-limit store boundary for future Redis/edge adapters. Related PRD: Platform Core, Security, and Observability. Acceptance: every response carries a safe request ID and logs exclude authorization headers, bodies, and token claims.
- Added the Phase 10 MVP-A workspace shell with organization/project context, Overview, WBS/CBS, Baseline, Import Center, and Audit Trail screens. Related PRD: Platform Core and UI/UX. Acceptance: the shell is responsive, status is conveyed with labels plus color, and no chatbot is used as the primary interaction model.
- Added authenticated MVP-A read endpoints for tenant-scoped projects and project-scoped WBS/CBS and baseline collections. Related PRD: Platform Core, API, and UI/UX. Acceptance: read responses require bearer auth, filter by verified organization/project context, and expose structured scope errors.
- Added the MVP-A browser API client and optional live WBS/baseline hydration. Related PRD: Platform Core, API, and UI/UX. Acceptance: bearer tokens are obtained only through a trusted runtime token provider; request IDs, idempotency keys, and structured backend errors flow through the client boundary; the visual review shell safely falls back to demo data.
- Added the MVP-A active project selector. Related PRD: Platform Core and UI/UX. Acceptance: the control is populated solely by tenant-scoped results, preserves an explicit active project, refreshes project-bound WBS/baseline data, and never invents a cross-tenant fallback.
- Added authenticated WBS creation for MVP-A. Related PRD: Project Setup, API, and UI/UX. Acceptance: WBS nodes can only be created inside the verified project scope by an authorized human role, require an idempotency key, and satisfy hierarchy validation before persistence.
- Added the MVP-A human-controlled WBS creation form. Related PRD: Project Setup and UI/UX. Acceptance: an operator explicitly provides code and name, submits only in the active authorized project context, sees inline outcomes, and receives no simulated write in demo mode.
- Added role-gated baseline draft creation for MVP-A. Related PRD: Cost Baseline, API, and UI/UX. Acceptance: the API assigns the next project-scoped version and `DRAFT` state only after verified human authorization; approval remains a separate Human-in-the-Loop action.
- Added the MVP-A baseline draft action to the workspace. Related PRD: Cost Baseline and UI/UX. Acceptance: a human explicitly starts draft creation from the Baseline screen, receives inline success or error feedback, and the version history refreshes from the authorized project context.
- Added the MVP-A budget-line API boundary. Related PRD: Cost Baseline, API, and Database. Acceptance: lines can be added only to an open baseline with same-project WBS/cost-code references and non-negative validated amounts.
- Started migration to the approved VALORIS UI/UX Design Specification v1.0. Related PRD: UI/UX and Platform Core. Acceptance: shell tokens use the specified navy sidebar, cool canvas, white cards, indigo primary, semantic colors, 8–12px geometry, and compact financial typography.
- Added the MVP-A budget-line entry workspace. Related PRD: Cost Baseline and UI/UX. Acceptance: a human enters WBS, cost-code, and non-negative amount values, submits against the active open baseline, and receives inline validation or API feedback.
- Added the MVP-A baseline review workflow. Related PRD: Cost Baseline, Access Control, API, and UI/UX. Acceptance: approval and locking use valid state transitions, role capability checks, project scope, idempotency, and a required audit reason before persistence.
- Added the MVP-A Import Center preview flow. Related PRD: Import Center, API, and UI/UX. Acceptance: operators submit source rows for validation, see valid/error/total results, and no financial records are committed during preview.
- Added the MVP-A Import Center commit flow. Related PRD: Import Center, API, Database, and Audit. Acceptance: only fully valid previews can be committed, the action requires human confirmation and idempotency, and invalid batches are rejected without partial persistence.
- Added the MVP-A Import Center upload and mapping stepper. Related PRD: Import Center and UI/UX. Acceptance: CSV rows can be loaded, reference and amount columns mapped, and handed to validation without implicit import or data mutation.
- Added MVP-B commitment and actual-cost API adapters. Related PRD: Commitment, Actual Cost & Accrual. Acceptance: authorized users can create a project-scoped commitment and post actual cost only to an open period, with idempotency and human-controlled writes.
- Added the accrual draft workspace and API route. Acceptance: authorized users can record a source-backed accrual only in an open period; the record remains DRAFT for human review and later reconciliation.
- Added the MVP-B Forecast Control workspace and period forecast route. Acceptance: BAC, AC, and ETC calculate EAC and VAC in an open period without changing the baseline; the UI marks the result advisory until human review.
- Added the MVP-B EVM performance workspace and period EVM route. Acceptance: planned progress, approved progress, BAC, and AC produce PV/EV/CV/SV/CPI/SPI snapshots with evidence-linked UI and no automatic approval.
- Added the MVP-C Change Management workspace and scoped create/incorporate routes. Acceptance: potential changes show weighted exposure; only approved changes can be incorporated by an authorized project or cost manager.
- Added the MVP-C Cash Flow Control workspace and read-only variance route. Acceptance: aligned planned and actual period series return variance and cumulative forecast for human review.
- Added the MVP-C Risk & Findings workspace with risk creation, evidence-linked finding capture, and human review routes. Acceptance: agents can recommend but only a human can accept, dismiss, or escalate a finding.
- Added Phase 17 production-readiness gates, deterministic demo seed guidance, environment checklist, and Definition of Ready/Done. Added security response headers and regression coverage.
- Added authentication claims boundary and runtime API server. Related PRD: Platform Core, Access Control, API.
- Added API adapters for baseline, transactions, forecast/EVM, change, cash/risk, findings/import, and executive reporting. Related PRD: Modules 01–12.
- Added UI contracts for Phase 2–7 workspaces. Related PRD: UI/UX and module PRDs.

## Required commit discipline

1. Update code and the affected PRD/specification together.
2. Add or update tests for changed behavior.
3. Record the phase/module and acceptance impact here.
4. Run the applicable domain, API, database, and E2E checks.
5. Push only after the PRD, implementation, and tests are consistent.
