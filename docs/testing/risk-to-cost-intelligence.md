# Module 05 — Risk-to-Cost Intelligence Test Strategy

## Test areas

- Domain rules and calculation accuracy
- Versioning, idempotency, and duplicate handling
- Authorization and project isolation
- Import validation and partial-failure recovery
- Audit, provenance, and reproducibility
- API contract and event compatibility
- Accessibility and critical user journeys
- Agent findings, evidence quality, and guardrail enforcement

## Release gates

- Results are reproducible from stored inputs.
- Invalid or incomplete data cannot silently produce approved outputs.
- Unauthorized actions are rejected consistently.
- Material changes are auditable.
- Critical screens cover loading, empty, error, stale, and approval states.
