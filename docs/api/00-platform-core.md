# Module 00 — Platform Core API

## Resource groups

- Organizations
- Projects
- Members and roles
- WBS and CBS
- Periods and calendars
- Imports and integrations
- Audit events

## API conventions

- Versioned API namespace
- Tenant and project context explicit in authorization
- Idempotency keys for import and write operations where applicable
- Consistent pagination, filtering, sorting, and error schema
- Optimistic concurrency for versioned master data
- No sensitive credentials in request or response bodies

## Initial endpoint candidates

- `GET/POST /organizations`
- `GET/POST /projects`
- `GET/POST /projects/{projectId}/wbs`
- `GET/POST /projects/{projectId}/cbs`
- `GET/POST /projects/{projectId}/periods`
- `POST /projects/{projectId}/imports`
- `GET /projects/{projectId}/audit-events`
