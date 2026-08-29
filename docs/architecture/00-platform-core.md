# Module 00 — Platform Core Architecture

## Boundary

Platform Core owns identity context, tenancy, project context, master data, authorization, audit, configuration, and integration registration. Domain modules consume these capabilities through stable contracts.

## Core components

- Identity and access context
- Tenant and organization service
- Project context service
- WBS/CBS master-data service
- Period and calendar service
- Audit and provenance service
- Import/integration registry
- Configuration and entitlement service

## Architectural principles

- Tenant isolation by default
- Domain ownership is explicit
- Every write is auditable
- Master data changes are versioned
- APIs are idempotent where practical
- Validation occurs before persistence
- No agent may bypass authorization or audit controls

## Primary dependencies

Identity provider, object storage for import artifacts, relational database, event bus, and observability platform.

## Initial decisions pending

- Identity provider
- Database engine
- Event transport
- Object storage provider
- Tenant isolation strategy
- Deployment topology
