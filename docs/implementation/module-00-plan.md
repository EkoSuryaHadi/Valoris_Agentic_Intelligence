# Module 00 Implementation Plan

## Phase 0 — Decisions

- Select application runtime and framework.
- Select relational database and migration tool.
- Select identity provider and session strategy.
- Select object storage and import boundary.
- Select deployment and secrets strategy.
- Confirm tenant isolation model.

## Phase 1 — Shared contracts

- Organization, user, membership, role, and permission vocabulary.
- Project context and project lifecycle.
- WBS/CBS identifiers and versioning.
- Reporting period and currency contracts.
- Audit event and provenance schema.
- Shared API errors, pagination, and idempotency rules.

## Phase 2 — Platform shell

- Authenticated application shell.
- Organization and project switcher.
- Route-level authorization.
- Global error, loading, and empty states.
- Audit-aware mutation pattern.
- Observability hooks.

## Phase 3 — Core workflows

- Organization setup.
- Project setup.
- WBS/CBS management.
- Reporting calendar.
- User and role management.
- Import registration and validation boundary.

## Phase 4 — Hardening

- Tenant isolation tests.
- Permission matrix tests.
- Migration and rollback tests.
- Accessibility checks.
- Security review.
- Performance baseline.
- Operational runbook.

## First milestone

The first milestone is a secure, authenticated project shell with organization/project context and no domain calculations.
