# Module 04 — Change Management API

## Resource groups

/change-requests\n- /impact-assessments\n- /approvals\n- /change-decisions

## Conventions

- Versioned API namespace and consistent error schema.
- Project context is authorized server-side.
- Idempotency for imports and retryable writes.
- Pagination, filtering, sorting, and field selection for collections.
- Responses expose status, source, freshness, confidence, and review state.
- Mutations create audit events and return a traceable identifier.
