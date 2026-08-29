# Module 01 — Cost Management API

## Resource groups

- Baselines and budget lines
- Commitments
- Actuals
- Accruals and adjustments
- Reconciliation
- Variance
- Period close

## Initial endpoint candidates

- `GET/POST /projects/{projectId}/cost-baselines`
- `POST /projects/{projectId}/cost-baselines/{baselineId}/versions`
- `GET /projects/{projectId}/cost-ledger`
- `POST /projects/{projectId}/cost-imports`
- `GET /projects/{projectId}/cost-variance`
- `POST /projects/{projectId}/reconciliations`
- `POST /projects/{projectId}/period-close`

## Rules

- All write requests include project context and idempotency where needed.
- Closed periods reject ordinary mutations.
- Currency and conversion-rate references are mandatory.
- Responses expose source, status, freshness, and reconciliation state.
- Financial calculations return the calculation basis and rounding policy.
