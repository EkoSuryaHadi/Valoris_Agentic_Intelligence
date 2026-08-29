# Module 03 — Earned Value Management Architecture

## Boundary

This module owns PV, EV, AC, CPI, SPI, VAC, TCPI, and performance diagnosis. It consumes Platform Core context and integrates with Cost Management, Forecast Intelligence, EVM, Change, Risk, Procurement, Data Quality, Executive Intelligence, and Reporting as applicable.

## Components

- Domain service and versioned calculation/read model
- Import and normalization adapter
- Workflow and approval service
- Evidence, provenance, and audit integration
- Alert/event publisher
- Query and drill-down read model

## Principles

- Preserve source facts separately from derived intelligence.
- Make calculation grain and effective period explicit.
- Use idempotent imports and versioned outputs.
- Fail closed on authorization and validation errors.
- Emit events only after durable state is committed.

## Risks

Stale inputs, duplicated records, inconsistent coding, unclear ownership, hidden assumptions, and cross-module timing differences.
