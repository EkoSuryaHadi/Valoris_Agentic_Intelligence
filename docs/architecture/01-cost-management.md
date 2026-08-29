# Module 01 — Cost Management Architecture

## Boundary

Cost Management owns cost planning and cost transaction normalization through variance analysis. It consumes project context, WBS/CBS, periods, currencies, and permissions from Platform Core.

## Components

- Budget and baseline service
- Commitment ledger
- Actual cost ledger
- Accrual and adjustment service
- Cost coding and allocation service
- Reconciliation service
- Variance analysis service
- Period-close workflow
- Cost import adapters

## Data flow

Source systems -> import staging -> validation and coding -> approved ledger -> reconciliation -> variance views -> period-close snapshot.

## Principles

- Separate source facts from normalized records.
- Preserve original source values.
- Use append-only adjustments for closed periods.
- Make calculation grain explicit.
- Keep currency conversion rates versioned.
- Treat reconciliation as a first-class workflow.

## Key risks

Duplicate transactions, late postings, inconsistent cost codes, currency mismatch, partial imports, and unauthorized period reopening.
