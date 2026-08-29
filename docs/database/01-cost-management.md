# Module 01 — Cost Management Data Model

## Core entities

- CostBaseline
- CostBaselineVersion
- BudgetLine
- Commitment
- ActualCost
- Accrual
- CostAdjustment
- CostTransfer
- CostCode
- CurrencyRate
- CostImportBatch
- ReconciliationRun
- VarianceSnapshot
- PeriodClose

## Key relationships

Project -> baseline versions -> budget lines.
Project -> commitments, actuals, accruals, and adjustments.
Every cost record references period, currency, WBS/CBS, cost code, source, and provenance.
Variance snapshots reference the exact baseline and source cut used for calculation.

## Invariants

- Amounts use decimal-safe storage.
- Original source records are retained.
- Closed-period records are immutable.
- Adjustments are additive and reason-coded.
- Duplicate source identifiers are rejected or explicitly linked.
