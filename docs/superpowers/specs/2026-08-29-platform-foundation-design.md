# Valoris Platform Foundation — Multi-Tenant MVP Design

**Status:** Proposed and reviewed  
**Deployment:** Vercel + Supabase  
**Branch:** develop

## Purpose

Build the secure, multi-tenant foundation required by every Valoris module. The first delivery creates an authenticated application shell with organization and project context. It deliberately excludes cost calculations and all other domain-module features.

## Users

- Platform administrator: manages organizations and platform-level setup.
- Organization administrator: manages organization members, projects, and configuration.
- Project administrator: manages project membership and project master data.
- Project member: accesses only assigned project context.
- Viewer: read-only access within assigned scope.

## Architecture

Vercel hosts the Next.js TypeScript application. Supabase provides Auth, PostgreSQL, Row Level Security (RLS), storage, and migration-compatible database infrastructure.

The application has three layers:

1. UI: authenticated application shell, organization/project switcher, setup journeys, and accessible loading, empty, and error states.
2. Domain: server-side validation for membership, project context, WBS/CBS, reporting periods, and audit rules.
3. Data: Supabase database access protected by RLS. No browser or server route may bypass RLS for tenant-scoped data.

## Multi-tenant model

Each business record belongs to one organization through `organization_id`. Project-scoped records also carry `project_id`.

Users gain organization access through `organization_members` and project access through `project_members`. RLS policies enforce both boundaries. Project access never implies access to another project, even inside the same organization.

The initial model uses a shared database and shared schema. A future enterprise tier may introduce isolated Supabase projects or databases without changing the application-level ownership model.

## Initial data model

- `profiles`: user profile linked to Supabase Auth user ID.
- `organizations`: tenant record and lifecycle state.
- `organization_members`: organization membership and role.
- `projects`: project identity, status, ownership, currency, and configuration.
- `project_members`: project membership and role.
- `wbs_nodes`: versioned project work-breakdown nodes.
- `cbs_nodes`: versioned project cost-breakdown nodes.
- `reporting_periods`: project reporting calendar and lock state.
- `audit_events`: append-only record of material mutations.

Every governed write captures actor, action, timestamp, scope, before/after summary where safe, request/correlation ID, and source.

## First delivery scope

- Supabase Auth sign-in/sign-out and protected routes.
- Organization and project data model with RLS.
- Organization/project switcher and context persistence.
- Minimal project setup flow.
- Audit event infrastructure.
- Shared error, loading, empty, and unauthorized states.
- Automated tests for RLS-sensitive domain behavior and authorization.

## Explicitly excluded

- Budget, commitment, actual, accrual, or forecast calculations.
- EVM metrics.
- Change-control, risk, or procurement workflows.
- Autonomous agent execution.
- Production management dashboards.
- Enterprise SSO and per-tenant database isolation.

## Data flow

1. User authenticates with Supabase Auth.
2. The application resolves eligible organizations.
3. User selects an organization and a permitted project.
4. Server actions/API validate the active scope.
5. Supabase RLS applies the final data boundary.
6. Material mutations write both the domain record and an audit event.
7. UI refreshes context-safe query state.

## Error handling

- No active organization: route to organization selection.
- No project membership: show access-denied state; do not disclose project details.
- Invalid or stale context: clear context and require a valid selection.
- RLS denial: return a generic authorization error and log a safe correlation ID.
- Validation failure: retain form input and provide field-level recovery guidance.
- Audit failure: fail the material mutation; never create an unaudited governed record.

## Quality and security gates

- Tests must prove members cannot access data from another organization or unassigned project.
- Tests must prove unauthorized writes fail.
- Every material mutation creates an audit event.
- Secrets remain only in local environment configuration and Vercel/Supabase settings.
- CI must run lint, type checks, unit tests, and production build.
- Accessibility checks cover keyboard navigation, focus behavior, labels, and error messages.

## Acceptance criteria for milestone 1

1. A user can authenticate and access only assigned organizations.
2. An organization administrator can create a project.
3. A project member can access only assigned projects.
4. Organization/project context persists safely across navigation.
5. Cross-tenant reads and writes are denied through RLS.
6. Project creation produces an audit event.
7. The application builds and automated tests pass.

## Open delivery configuration

Before deployment, configure a Supabase project, Vercel project, and environment variables for Supabase URL and publishable key. Service-role credentials, if introduced later, must be server-only and excluded from ordinary request paths.
