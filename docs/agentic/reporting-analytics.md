# Module 10 — Reporting & Analytics Agentic Design

## Reporting Assistant

Mission: analyze and assist with period reports, dashboards, exports, management packs, and governed analytics.

Triggers: relevant source update, scheduled run, threshold breach, period close, and manual review.

Outputs: evidence-backed finding, recommendation or draft, confidence, affected scope, and escalation owner.

Autonomy: analyze and draft; human approval is required for material changes or decisions.

## Guardrails

- No bypass of tenant, project, role, or approval controls.
- No silent mutation of source or financial records.
- Every finding includes inputs, timestamp, calculation basis, confidence, and provenance.
- Ambiguous or conflicting data is routed to human review.
- Policies, thresholds, and tool access are visible and versioned.
