# Product Requirements Documents

Place the master product blueprint and module-level PRDs here. The canonical cross-module contract is [Production Handoff](../PRODUCTION_HANDOFF.md).

## Master PRD addendum

### MVP release boundary

MVP-A: platform core, project setup, WBS/CBS, budget/baseline, import center.
MVP-B: commitment, actual cost, accrual, forecast/ETC/EAC, EVM.
MVP-C: change, cash flow, risk, agent findings and human review.
MVP-D: executive dashboard, reporting, administration, audit trail hardening.

### Non-negotiable requirements

1. Tenant isolation by `organization_id` and project-scoped RBAC.
2. Locked periods and approved baselines are immutable; corrections use reversal/adjustment records.
3. All financial amounts use fixed-precision decimal values in project currency.
4. Agent findings include evidence references, confidence, calculation/model version, and human disposition.
5. Approval actions require an authorized human, reason where applicable, optimistic-lock version, and audit event.

### Canonical formulas

`BAC = sum(approved baseline budget lines)`; `Current Budget = BAC + incorporated approved changes`; `EAC = AC + ETC`; `VAC = BAC - EAC`; `Exposure = probability × impact`; `PV = BAC × planned progress`; `EV = BAC × approved physical progress`; `CV = EV - AC`; `SV = EV - PV`; `CPI = EV / AC`; `SPI = EV / PV` (null when denominator is zero).

## Implementation traceability policy

Every code, API, database, UI, agentic, security, or deployment change must update the affected PRD/specification in the same commit. Each implementation commit must identify the relevant phase/module, acceptance behavior, and test evidence. PRD changes must not silently alter source-of-truth rules, approval guardrails, formulas, or Human-in-the-Loop requirements.

## Current implementation map

| Capability | Status | Canonical evidence |
|---|---|---|
| Domain calculations and guardrails | Implemented | `packages/domain`, domain tests |
| Project/WBS/CBS/Baseline API adapters | Implemented | `packages/api`, API tests |
| Commitment/Actual/Accrual adapters | Implemented | `packages/api/src/transactions.js` |
| Forecast/EVM/Change/Cash/Risk adapters | Implemented | API adapters and module scopes |
| Agent findings and import preview | Implemented | `packages/api/src/agent-import.js` |
| Executive reporting adapter | Implemented | `packages/api/src/reporting.js` |
| PostgreSQL pool and project repository | Foundation implemented | `packages/db`, runtime tests |
| Frontend runtime MVP-A shell | Implemented | `apps/web/index.html`, `apps/web/styles.css`, `apps/web/app.js` |
| MVP-A read API boundary | Implemented | `packages/api/src/server.js`; tenant-scoped projects plus project-scoped WBS/baseline reads |
| MVP-A browser API client | Implemented | `apps/web/api-client.js`; bearer, request ID, idempotency, and structured error boundary |
| MVP-A active project context | Implemented | `apps/web/project-context.js`, `apps/web/app.js`; selection constrained to tenant-scoped API results |
| MVP-A WBS creation API | Implemented | `packages/api/src/server.js`; authenticated, project-scoped, role-gated WBS creation with idempotency and hierarchy validation |
| MVP-A WBS creation workspace | Implemented | `apps/web/index.html`, `apps/web/app.js`; human-confirmed root-node form bound to the active authorized project |
| MVP-A baseline draft API | Implemented | `packages/api/src/server.js`; role-gated, project-scoped draft creation with sequential versioning |
| MVP-A baseline draft workspace | Implemented | `apps/web/index.html`, `apps/web/app.js`; human-triggered draft creation with inline outcome and refresh |
| MVP-A budget-line API boundary | Implemented | `packages/api/src/server.js`, `apps/web/api-client.js`; project-scoped budget-line creation with baseline, WBS, cost-code, and amount guardrails |
| Provider-backed JWT/JWKS verification | Implemented | `packages/api/src/auth.js`; bearer auth is required unless explicit insecure development mode is enabled |
| API request hardening | Implemented | `packages/api/src/http-hardening.js`, `packages/api/src/server.js`; bounded JSON bodies and per-client rate-limit response |
| Request correlation and rate-limit store boundary | Implemented | `x-request-id` correlation, injectable limiter store, and audit-safe structured request events |
| Full CRUD repositories and E2E | Planned | Phase 9 hardening backlog |
| WBS/CBS, baseline-line, and actual-cost repositories | Foundation implemented | `packages/db/src/domain-repositories.js` |
| Commitment, accrual, and forecast repositories | Foundation implemented | `packages/db/src/domain-repositories.js` |
| Tenant-safe transaction reads and forecast migration | Implemented | `packages/db/src/queries.js`, `database/migrations/005_phase3_forecast.sql` |

The implementation map is a status snapshot, not a replacement for module-level acceptance criteria.

Planned modules include Platform Core, Cost Management, Forecast Intelligence, Earned Value Management, Change Management, Risk-to-Cost Intelligence, Procurement Cost Intelligence, Data Quality & Reconciliation, Executive Intelligence, Agentic Command Center, and Reporting & Analytics.
