# Module 10 — Reporting & Analytics API

## Resource groups

/reports\n- /report-runs\n- /dashboards\n- /exports\n- /report-schedules

## Conventions

- Versioned API namespace and consistent error schema.
- Project context is authorized server-side.
- Idempotency for imports and retryable writes.
- Pagination, filtering, sorting, and field selection for collections.
- Responses expose status, source, freshness, confidence, and review state.
- Mutations create audit events and return a traceable identifier.
