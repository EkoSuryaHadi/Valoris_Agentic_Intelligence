# Module 00 — Platform Core Data Model

## Core entities

- Organization
- User
- Role
- Permission
- OrganizationMembership
- Project
- ProjectMembership
- WBSNode
- CBSNode
- ReportingPeriod
- Calendar
- Currency
- ImportJob
- Integration
- AuditEvent
- DataProvenance

## Invariants

- Every project belongs to exactly one organization.
- Every project-scoped record references a project.
- WBS and CBS nodes are versioned and cannot be silently overwritten.
- Audit events are append-only.
- Import records retain source metadata and validation outcome.
- Membership and authorization changes are auditable.
