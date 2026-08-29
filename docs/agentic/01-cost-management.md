# Module 01 — Cost Management Agentic Design

## Cost Monitoring Agent

Mission: monitor budget, commitment, actual, accrual, and variance movement.

Triggers: new cost import, commitment update, actual posting, accrual update, variance threshold, and period close.

Outputs: variance alert, anomaly candidate, cost exposure summary, and recommended review owner.

Autonomy: analyze and recommend; never post or reclassify financial records.

## Data Quality Agent collaboration

Validates duplicates, missing coding, period mismatch, currency mismatch, and reconciliation gaps before analysis.

## Guardrails

- Read-only access to financial source systems by default.
- No automatic ledger posting.
- Thresholds must be configurable and visible.
- Findings include evidence, calculation grain, timestamp, confidence, and affected scope.
- Material findings require human acknowledgment.
