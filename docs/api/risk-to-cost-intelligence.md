# Module 05 — Risk-to-Cost Intelligence API

## Resource groups

/risks\n- /risk-assessments\n- /cost-exposures\n- /contingency\n- /risk-adjusted-forecasts

## Conventions

- Versioned API namespace and consistent error schema.
- Project context is authorized server-side.
- Idempotency for imports and retryable writes.
- Pagination, filtering, sorting, and field selection for collections.
- Responses expose status, source, freshness, confidence, and review state.
- Mutations create audit events and return a traceable identifier.
