# Module 09 — Agentic Command Center API

## Resource groups

/agents\n- /agent-runs\n- /agent-tasks\n- /findings\n- /recommendations\n- /approval-requests

## Conventions

- Versioned API namespace and consistent error schema.
- Project context is authorized server-side.
- Idempotency for imports and retryable writes.
- Pagination, filtering, sorting, and field selection for collections.
- Responses expose status, source, freshness, confidence, and review state.
- Mutations create audit events and return a traceable identifier.
