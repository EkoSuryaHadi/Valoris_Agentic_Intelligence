# Module 00 — Platform Core Agentic Design

## Initial agent responsibilities

Platform Core does not begin with autonomous feature agents. It provides the controlled context layer required by later agents.

## Candidate platform capabilities

- Context resolver: resolves active tenant, project, period, WBS, CBS, and permissions.
- Data quality gate: validates imports and reports blocking issues.
- Audit summarizer: summarizes material configuration changes for reviewers.

## Guardrails

- No agent can create a tenant, grant permissions, or bypass approval controls.
- No agent can mutate master data without an attributable user action or approved workflow.
- Agent outputs must include source, timestamp, confidence, and affected scope.
- Ambiguous mapping must be routed for human review.
