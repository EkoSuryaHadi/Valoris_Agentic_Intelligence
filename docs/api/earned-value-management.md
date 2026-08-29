# Module 03 — Earned Value Management API

## Resource groups

/evm-baselines\n- /evm-snapshots\n- /evm-metrics\n- /evm-trends\n- /performance-findings

## Conventions

- Versioned API namespace and consistent error schema.
- Project context is authorized server-side.
- Idempotency for imports and retryable writes.
- Pagination, filtering, sorting, and field selection for collections.
- Responses expose status, source, freshness, confidence, and review state.
- Mutations create audit events and return a traceable identifier.
