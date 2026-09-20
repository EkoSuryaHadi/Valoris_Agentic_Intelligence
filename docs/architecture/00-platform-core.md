# Module 00 — Platform Core Architecture

## Boundary

Platform Core owns identity context, tenancy, project context, master data, authorization, audit, configuration, and integration registration. Domain modules consume these capabilities through stable contracts.

## Core components

- Identity and access context
- Tenant and organization service
- Project context service
- WBS/CBS master-data service
- Period and calendar service
- Audit and provenance service
- Import/integration registry
- Configuration and entitlement service

## Architectural principles

- Tenant isolation by default
- Domain ownership is explicit
- Every write is auditable
- Master data changes are versioned
- APIs are idempotent where practical
- Validation occurs before persistence
- No agent may bypass authorization or audit controls

## Primary dependencies

Identity provider, object storage for import artifacts, relational database, event bus, and observability platform.

## Architectural Decisions (Confirmed)

- **Database Engine**: Neon PostgreSQL with parameterized, SQL-injection safe repository queries (`packages/db/src/`).
- **Tenant Isolation Strategy**: Application-level query scoping by `organization_id` and `project_id`, enforcing 403 `PROJECT_SCOPE_DENIED` boundaries on all API routes.
- **Frontend Architecture**: Modern React 19 + TypeScript + Vite SPA (`apps/web-next`) with Industrial Editorial design system and 14 dedicated project control screens.
- **Agentic Subsystem**:
  - Centralized `AgentRegistry` managing 5 deterministic rule surveillance agents (`CostMonitorAgent`, `BudgetVarianceAgent`, `CommitmentGapAgent`, `PeriodStalenessAgent`, `AnomalyDetectorAgent`).
  - Strict Human-in-the-Loop (HITL) review gates for all agent findings; agents are read-only observers and cannot directly approve or mutate ledgers.
- **LLM Advisory Provider**: Sumopod OpenAI-compatible API (`https://ai.sumopod.com/v1`, `gpt-4o-mini`).
  - Read-only explanation and recommendation persona.
  - Cites specific ledger evidence and control accounts.
  - Offline simulation fallback when API keys are unconfigured.
