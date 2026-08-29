# Module 01 — Cost Management PRD

## Vision

Give project teams one trusted view of approved budget, commitments, actuals, accruals, and cost variance.

## Problem

Project cost data is often split across spreadsheets, finance systems, procurement records, and contractor reports. Teams need a controlled baseline and timely explanation of cost movement.

## Primary users

Project controls, cost engineers, project managers, commercial teams, finance, and executives.

## Goals

1. Establish an approved cost baseline by project, WBS, CBS, period, and cost category.
2. Capture commitments, actuals, accruals, transfers, and adjustments with provenance.
3. Reconcile cost records against source systems.
4. Calculate and explain variance against budget and baseline.
5. Provide controlled review and sign-off at period close.

## Scope

- Budget and baseline versions
- Commitment and purchase order cost
- Actual cost and invoice cost
- Accruals and adjustments
- Cost transfers and reclassification
- Period close
- Variance analysis
- Cost coding against WBS/CBS
- Imports and reconciliation
- Cost data quality indicators

## Out of scope

Forecast calculations, EVM metrics, change approval, risk-adjusted exposure, procurement workflow, and autonomous posting to financial systems.

## Core requirements

- Every amount has currency, period, cost code, source, and status.
- Baselines are versioned and approval-controlled.
- Actuals and commitments are traceable to source records.
- Adjustments require reason and authorization.
- Closed periods are immutable except through controlled adjustment entries.
- Variance views support project, WBS, CBS, vendor, category, and period dimensions.

## Success criteria

- Users can reconcile budget, commitment, actual, and accrual totals.
- Variance explanations identify amount, driver, owner, and status.
- Period close produces a reproducible snapshot.
- No financial record can be silently overwritten.
