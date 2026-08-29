# Module 09 — Agentic Command Center Data Model

## Core entities

AgentDefinition\n- AgentRun\n- AgentTask\n- Finding\n- Recommendation\n- ApprovalRequest\n- Policy\n- AgentActivity

## Data rules

- Every record references project, reporting period, and provenance where applicable.
- Derived outputs reference the exact input versions used.
- Source identifiers are retained for reconciliation and deduplication.
- Material decisions and approvals are append-only and auditable.
- Decimal-safe amounts and explicit currency rules are mandatory where financial values exist.
- Soft deletion is preferred for governed records; history must remain discoverable.
