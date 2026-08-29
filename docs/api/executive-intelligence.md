# Module 08 — Executive Intelligence API

## Resource groups

/executive-briefs\n- /insights\n- /kpis\n- /priority-actions\n- /escalations

## Conventions

- Versioned API namespace and consistent error schema.
- Project context is authorized server-side.
- Idempotency for imports and retryable writes.
- Pagination, filtering, sorting, and field selection for collections.
- Responses expose status, source, freshness, confidence, and review state.
- Mutations create audit events and return a traceable identifier.
