# Implementation Changelog

This file links implementation increments to the PRD contract. Update it in the same commit as any material product or technical change.

## 2026-09-18

- Added runtime PostgreSQL pool and tenant-scoped project repository. Related PRD: Platform Core, Database, Security.
- Added parameterized WBS/CBS, baseline-line, and actual-cost repository boundaries. Related PRD: Project Setup, Cost Baseline, Actual Cost.
- Added parameterized commitment, accrual, and forecast snapshot repositories. Related PRD: Commitment, Forecast, and EAC.
- Reconciled tenant-scoped transaction reads with the shared-schema ownership model and added the forecast persistence migration. Related PRD: Platform Core, Commitment, Forecast, and EAC. Acceptance: organization and project scope are enforced through the project join; forecast snapshots are unique per project and reporting period.
- Added authentication claims boundary and runtime API server. Related PRD: Platform Core, Access Control, API.
- Added API adapters for baseline, transactions, forecast/EVM, change, cash/risk, findings/import, and executive reporting. Related PRD: Modules 01–12.
- Added UI contracts for Phase 2–7 workspaces. Related PRD: UI/UX and module PRDs.

## Required commit discipline

1. Update code and the affected PRD/specification together.
2. Add or update tests for changed behavior.
3. Record the phase/module and acceptance impact here.
4. Run the applicable domain, API, database, and E2E checks.
5. Push only after the PRD, implementation, and tests are consistent.
