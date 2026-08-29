# Quality Gates

## Required for every implementation slice

- Unit tests for domain rules.
- Integration tests for persistence and authorization.
- Contract tests for API and events.
- Tenant-isolation test coverage.
- Audit-event verification for material mutations.
- Accessibility verification for user-facing workflows.
- Security checks for secrets, input validation, and authorization.
- Operational logging without sensitive data leakage.

## Promotion gates

### develop

Automated tests and static checks pass; review artifacts are attached.

### main

Acceptance criteria, security review, migration safety, and rollback plan are complete.

## Prohibited shortcuts

- Committing secrets or real customer data.
- Mutating closed-period financial records silently.
- Bypassing authorization in internal endpoints.
- Treating agent recommendations as approved decisions.
