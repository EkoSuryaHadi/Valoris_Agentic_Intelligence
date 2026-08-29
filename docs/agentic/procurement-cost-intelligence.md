# Module 06 — Procurement Cost Intelligence Agentic Design

## Procurement Cost Agent

Mission: analyze and assist with PO, vendor exposure, material pricing, commitments, delivery risk, and escalation.

Triggers: relevant source update, scheduled run, threshold breach, period close, and manual review.

Outputs: evidence-backed finding, recommendation or draft, confidence, affected scope, and escalation owner.

Autonomy: analyze and draft; human approval is required for material changes or decisions.

## Guardrails

- No bypass of tenant, project, role, or approval controls.
- No silent mutation of source or financial records.
- Every finding includes inputs, timestamp, calculation basis, confidence, and provenance.
- Ambiguous or conflicting data is routed to human review.
- Policies, thresholds, and tool access are visible and versioned.
