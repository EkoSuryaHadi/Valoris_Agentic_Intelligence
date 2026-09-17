# Valoris Agentic Intelligence

Valoris Agentic Intelligence is a production-oriented, MVP-first platform for project cost management, forecasting, earned value, change control, risk-to-cost intelligence, procurement intelligence, data quality, executive insight, reporting, and agentic operations.

## Project status

Documentation baseline is complete and Sprint 0 implementation is ready to begin. Runtime feature implementation is intentionally sequenced from the first vertical slice: Auth → Organization/Project → WBS/CBS → Baseline → Audit Trail.

## Product guardrails

- Agentic workflow without a chatbot as the primary interface.
- Agents are evidence-first and advisory; humans approve, reject, incorporate, and lock.
- Agents cannot change baselines, post actual cost, approve changes, or lock periods.
- Approved baseline, posted actual, approved forecast, approved progress, and incorporated change are separate sources of truth.
- Every material calculation and agent recommendation is traceable through evidence, version, actor, timestamp, and audit event.

## Canonical handoff

The production handoff is the cross-document contract for Sprint 0: [Production Handoff](docs/PRODUCTION_HANDOFF.md). Module documents may add detail but must not contradict its invariants, status machines, formulas, API conventions, or approval guardrails.

## Documentation

- [PRD](docs/prd/README.md)
- [Architecture](docs/architecture/README.md)
- [UI/UX](docs/ui-ux/README.md)
- [Agentic](docs/agentic/README.md)
- [Database](docs/database/README.md)
- [API](docs/api/README.md)
- [Testing](docs/testing/README.md)
- [Backlog](docs/backlog/README.md)
- [Production Handoff](docs/PRODUCTION_HANDOFF.md)
- [API contract](docs/api/openapi.yaml)
- [PostgreSQL schema](docs/database/schema.sql)

## Branch strategy

- `main`: stable, reviewed project baseline
- `develop`: integration branch for upcoming work

## Contribution status

Contribution, decision, release, Definition of Ready, and Definition of Done conventions are defined in the production handoff and testing quality gates.
