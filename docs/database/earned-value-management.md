# Module 03 — Earned Value Management Data Model

## Core entities

EVMBaseline\n- PlannedValue\n- EarnedValue\n- ActualCostLink\n- EVMPeriodSnapshot\n- EVMMetric\n- PerformanceFinding

## Data rules

- Every record references project, reporting period, and provenance where applicable.
- Derived outputs reference the exact input versions used.
- Source identifiers are retained for reconciliation and deduplication.
- Material decisions and approvals are append-only and auditable.
- Decimal-safe amounts and explicit currency rules are mandatory where financial values exist.
- Soft deletion is preferred for governed records; history must remain discoverable.
