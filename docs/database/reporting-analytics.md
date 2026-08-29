# Module 10 — Reporting & Analytics Data Model

## Core entities

ReportDefinition\n- ReportRun\n- Dashboard\n- Widget\n- ExportJob\n- DistributionList\n- ReportSnapshot

## Data rules

- Every record references project, reporting period, and provenance where applicable.
- Derived outputs reference the exact input versions used.
- Source identifiers are retained for reconciliation and deduplication.
- Material decisions and approvals are append-only and auditable.
- Decimal-safe amounts and explicit currency rules are mandatory where financial values exist.
- Soft deletion is preferred for governed records; history must remain discoverable.
