# Module 02 — Forecast Intelligence API

## Resource groups

/forecast-runs\n- /forecast-scenarios\n- /etc\n- /eac\n- /forecast-drivers

## Conventions

- Versioned API namespace and consistent error schema.
- Project context is authorized server-side.
- Idempotency for imports and retryable writes.
- Pagination, filtering, sorting, and field selection for collections.
- Responses expose status, source, freshness, confidence, and review state.
- Mutations create audit events and return a traceable identifier.
