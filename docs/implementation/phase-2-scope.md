# Phase 2 — Commitment, Actual Cost & Accrual

## Completed domain contract

- Commitments require project-scoped reference, vendor, amount, and optional WBS/cost code mapping.
- Actual cost requires source reference and can only post to an open project period.
- Accruals are traceable by source reference and start as `DRAFT`.
- Locked/closed periods reject new actuals and accruals; correction uses reversal/adjustment records.
- Negative and non-finite monetary values are rejected and all values are rounded to cents.
- Cross-project WBS, cost code, and period references are rejected.

## Remaining integration tasks

- Persist vendors, contracts, commitments, invoices, actual costs, and accruals through migration 004/005.
- Add API handlers and RBAC policy enforcement.
- Add Commitment, Actual Cost, and Accrual screens with import/reconciliation states.
- Add transaction totals and budget-vs-commitment reconciliation.
