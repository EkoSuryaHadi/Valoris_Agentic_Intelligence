# Implementation Changelog

This file links implementation increments to the PRD contract. Update it in the same commit as any material product or technical change.

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
- Added authentication claims boundary and runtime API server. Related PRD: Platform Core, Access Control, API.
- Added API adapters for baseline, transactions, forecast/EVM, change, cash/risk, findings/import, and executive reporting. Related PRD: Modules 01–12.
- Added UI contracts for Phase 2–7 workspaces. Related PRD: UI/UX and module PRDs.

## Required commit discipline

1. Update code and the affected PRD/specification together.
2. Add or update tests for changed behavior.
3. Record the phase/module and acceptance impact here.
4. Run the applicable domain, API, database, and E2E checks.
5. Push only after the PRD, implementation, and tests are consistent.
