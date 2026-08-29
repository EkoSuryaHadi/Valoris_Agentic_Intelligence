# Implementation Foundation

This phase turns the approved blueprint into an executable delivery plan. It does not implement business features.

## Workstreams

1. Repository and branch governance
2. Runtime and deployment baseline
3. Identity, tenancy, and authorization foundation
4. Database migration and audit foundation
5. API conventions and error handling
6. UI shell and project context
7. Observability and security baseline
8. Automated quality gates

## Definition of ready

A module is ready for implementation when its vocabulary, ownership, API contracts, data model, permission matrix, critical journeys, test fixtures, and acceptance criteria are reviewed.

## Definition of done

A delivery slice is complete when tests, audit behavior, authorization, accessibility, observability, documentation, and rollback behavior are verified.

## Delivery rule

Implement Platform Core first. Downstream modules must consume its project context, identity, permission, period, WBS/CBS, audit, and provenance contracts.
