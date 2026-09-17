# Phase 2 UI — Transactions

## Commitment Ledger

Filter by period, vendor, contract, WBS, cost code, and status. Columns: reference, vendor, contract, WBS, cost code, committed amount, invoiced amount, remaining commitment, status. New Commitment opens a validated form; each row exposes source/evidence.

## Actual Cost Ledger

Filter by period, source, invoice, WBS, and cost code. Columns: posting date, source reference, invoice, WBS, cost code, amount, status. Locked/closed periods are read-only and explain reversal guidance.

## Accrual Entry and reconciliation

Fields: period, source reference, amount, WBS, cost code, explanation, attachment. Draft → submit → approve → reverse. Show Budget, Commitment, Actual, Accrual, and Remaining Budget side by side. Highlight unmapped, duplicate, and period-locked errors.
