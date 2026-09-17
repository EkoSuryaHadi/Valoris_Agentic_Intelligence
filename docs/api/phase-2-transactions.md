# Phase 2 Transaction API Contract

All routes use `/api/v1`, bearer auth, tenant/project scope, JSON, cursor pagination, and `Idempotency-Key` on mutations.

```text
GET/POST /projects/{projectId}/commitments
GET/POST /projects/{projectId}/actual-costs
GET/POST /projects/{projectId}/accruals
GET      /projects/{projectId}/reconciliation?periodId=
```

Create commitment requires `referenceNo`, `vendor`, `amount`; actual cost requires `periodId`, `sourceRef`, `amount`; accrual requires `periodId`, `sourceRef`, `amount`. Locked/closed periods return `422 TRANSACTION_VALIDATION_FAILED`. Cross-tenant/project references return `403 PROJECT_SCOPE_DENIED`. Responses use `{data,meta}` and errors use `{error:{code,message}}`.
