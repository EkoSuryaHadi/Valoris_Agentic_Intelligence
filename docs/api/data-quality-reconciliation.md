# Module 07 — Data Quality & Reconciliation API

## Resource groups

/data-sources\n- /imports\n- /validation-runs\n- /reconciliations\n- /quality-issues

## Conventions

- Versioned API namespace and consistent error schema.
- Project context is authorized server-side.
- Idempotency for imports and retryable writes.
- Pagination, filtering, sorting, and field selection for collections.
- Responses expose status, source, freshness, confidence, and review state.
- Mutations create audit events and return a traceable identifier.
