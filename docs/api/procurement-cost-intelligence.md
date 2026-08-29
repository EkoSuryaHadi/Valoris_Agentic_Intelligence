# Module 06 — Procurement Cost Intelligence API

## Resource groups

/vendors\n- /purchase-orders\n- /vendor-exposures\n- /price-observations\n- /delivery-risks

## Conventions

- Versioned API namespace and consistent error schema.
- Project context is authorized server-side.
- Idempotency for imports and retryable writes.
- Pagination, filtering, sorting, and field selection for collections.
- Responses expose status, source, freshness, confidence, and review state.
- Mutations create audit events and return a traceable identifier.
