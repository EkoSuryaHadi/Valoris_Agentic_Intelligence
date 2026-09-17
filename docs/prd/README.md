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

Planned modules include Platform Core, Cost Management, Forecast Intelligence, Earned Value Management, Change Management, Risk-to-Cost Intelligence, Procurement Cost Intelligence, Data Quality & Reconciliation, Executive Intelligence, Agentic Command Center, and Reporting & Analytics.
