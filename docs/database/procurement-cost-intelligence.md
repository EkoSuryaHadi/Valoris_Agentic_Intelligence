# Module 06 — Procurement Cost Intelligence Data Model

## Core entities

Vendor\n- PurchaseOrder\n- POLine\n- ContractCommitment\n- PriceObservation\n- DeliveryMilestone\n- VendorExposure

## Data rules

- Every record references project, reporting period, and provenance where applicable.
- Derived outputs reference the exact input versions used.
- Source identifiers are retained for reconciliation and deduplication.
- Material decisions and approvals are append-only and auditable.
- Decimal-safe amounts and explicit currency rules are mandatory where financial values exist.
- Soft deletion is preferred for governed records; history must remain discoverable.
