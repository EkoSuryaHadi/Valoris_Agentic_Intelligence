# Module 01 — Cost Management Test Strategy

## Test areas

- Baseline creation, versioning, and approval
- Cost coding and dimensional completeness
- Duplicate detection and idempotent imports
- Currency conversion and rounding
- Budget, commitment, actual, and accrual aggregation
- Variance calculations and drill-down evidence
- Period lock and controlled adjustment
- Reconciliation completeness
- Role-based access to sensitive cost data
- Agent finding accuracy and explainability

## Release gates

- Aggregates reconcile to source-approved totals.
- Closed periods cannot be silently changed.
- Variance results are reproducible from stored inputs.
- Duplicate imports do not double count.
- Every material adjustment is auditable.
