# VALORIS Production Handoff

## Scope

MVP-first cost-control platform covering Modules 01–12. Primary flow: data entry/import → validation → deterministic calculation → evidence-linked agent finding → human review → approval/lock → reporting. The primary UX is a workspace, not a chatbot.

## Source-of-truth contract

| Artifact | Source of truth |
|---|---|
| BAC | approved, immutable baseline |
| AC | posted actual cost; corrections are reversals/adjustments |
| ETC/EAC | approved forecast snapshot |
| EV | approved progress |
| Current Budget | BAC plus incorporated approved changes |
| Cash actual | posted payment records |

All material values carry project currency, source reference, calculation version, actor, timestamp, and audit event. Financial values are fixed precision `numeric(20,2)`; ratios are `numeric(12,6)`.

## Agent and approval guardrails

Agents are read-only against source-of-truth data. They may calculate, detect, explain, rank, and recommend. They may not change baseline, post actual cost, approve/reject/incorporate changes, approve forecast, or lock a period. Findings must include evidence references, confidence, model/rule version, recommended action, and human disposition. Approval requires authorized human role, optimistic-lock version, and audit record.

## Canonical formulas

`BAC = sum(approved baseline lines)`; `Current Budget = BAC + incorporated approved changes`; `EAC = AC + ETC`; `VAC = BAC - EAC`; `Exposure = probability × impact`; `PV = BAC × planned progress`; `EV = BAC × approved physical progress`; `CV = EV - AC`; `SV = EV - PV`; `CPI = EV / AC`; `SPI = EV / PV`. CPI/SPI are null for zero denominators.

## MVP priorities

- MVP-A: auth/RBAC, tenancy, project, WBS/CBS, budget/baseline, import center.
- MVP-B: commitment, actual, accrual, forecast/ETC/EAC, EVM.
- MVP-C: change, cash flow, risk, agent runs/findings, human review.
- MVP-D: executive dashboard, reports, settings, users/roles, audit trail.

## Migration plan

Use additive, reviewable migrations: `001 tenancy/auth/project`, `002 WBS/CBS/cost codes`, `003 budget/baseline`, `004 vendors/contracts/commitments`, `005 invoices/actuals/accruals`, `006 periods/forecast/progress/EVM`, `007 changes/approvals`, `008 cash/risk`, `009 imports/audit/attachments`, `010 agent runs/findings`. Backfill with idempotent jobs, reconcile totals against source files, then enforce constraints. No destructive migration is allowed in MVP; corrections use new records.

## Environment and seed contract

Required runtime configuration: `DATABASE_URL`, `AUTH_ISSUER_URL`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `APP_BASE_URL`, `OBJECT_STORAGE_BUCKET`, `QUEUE_URL`, `LLM_PROVIDER`, `LLM_API_KEY`, `AGENT_MODEL`, `ENCRYPTION_KEY`, `LOG_LEVEL`, `DEFAULT_CURRENCY`, `CPI_WATCH_THRESHOLD`, `CPI_RISK_THRESHOLD`, `SPI_WATCH_THRESHOLD`, and `SPI_RISK_THRESHOLD`. Keep names in `.env.example`; keep values in the secret manager.

Seed one deterministic Acme Construction demo organization, three roles, one USD project, WBS/CBS, approved baseline, six periods, commitments, actuals, accruals, forecast, progress, changes, cash plan, risks, and evidence-linked findings with expected KPI snapshots.

## Sprint 0 exit

Clone/configure/run migrations and seed; sign in as demo roles; open project workspace; inspect WBS/CBS and approved baseline; view audit trail; run CI. Definition of Ready/Done and full backlog are maintained in the handoff package.
