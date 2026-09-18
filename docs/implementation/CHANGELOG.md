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
- Added authentication claims boundary and runtime API server. Related PRD: Platform Core, Access Control, API.
- Added API adapters for baseline, transactions, forecast/EVM, change, cash/risk, findings/import, and executive reporting. Related PRD: Modules 01–12.
- Added UI contracts for Phase 2–7 workspaces. Related PRD: UI/UX and module PRDs.

## Required commit discipline

1. Update code and the affected PRD/specification together.
2. Add or update tests for changed behavior.
3. Record the phase/module and acceptance impact here.
4. Run the applicable domain, API, database, and E2E checks.
5. Push only after the PRD, implementation, and tests are consistent.
