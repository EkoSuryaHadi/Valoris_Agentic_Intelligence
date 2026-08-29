# Module 00 — Valoris Platform Core PRD

## Vision

Provide the secure, auditable foundation shared by every Valoris module.

## Problem

Cost, forecast, risk, procurement, and reporting capabilities need a consistent project context, organizational boundary, permission model, audit trail, and integration-ready data foundation.

## Primary users

- Portfolio and program administrators
- Project managers
- Project controls and cost engineers
- Finance and commercial users
- Executives and reviewers

## Goals

1. Create and manage organizations, users, roles, projects, and project context.
2. Establish WBS/CBS structures as shared references for downstream modules.
3. Provide tenant isolation, authorization, auditability, and configuration.
4. Support controlled import and integration onboarding.
5. Make data ownership and source provenance explicit.

## Scope

- Organization and tenant setup
- User, role, and permission model
- Project setup and lifecycle
- WBS/CBS master data
- Calendar, currency, unit, and period configuration
- Audit log and data provenance
- Import/integration registration
- Platform settings and feature entitlements

## Out of scope

- Cost calculations
- Forecast calculations
- EVM calculations
- Change approval workflows
- Production agent execution
- Executive dashboards

## Success criteria

- A new project can be configured with owner, currency, calendar, WBS, CBS, and reporting periods.
- Every material change is attributable to a user, timestamp, source, and action.
- Users can access only organizations and projects permitted by their role.
- Downstream modules can reference stable project, WBS, CBS, and period identifiers.

## Key requirements

- Multi-tenant isolation
- Role-based and project-scoped authorization
- Immutable audit event history
- Versioned master data
- Configurable approval boundaries
- Import validation before commit
- API-first contracts
- Clear error and recovery states
