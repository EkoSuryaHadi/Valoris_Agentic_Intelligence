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

## Production Runtime Architecture & Stack Decisions

1. **Database & Persistence**:
   - Backend persistence powered by **Neon PostgreSQL** via connection pool.
   - Supabase has been sunsetted. Row-Level Security (RLS) is deferred in favor of robust, parameterized application-level tenant (`organization_id`) and project (`project_id`) isolation across all queries.
2. **Frontend Architecture**:
   - Modern SPA built on **React 19 + TypeScript + Vite** (`apps/web-next/`), featuring 14 modular screens and Industrial Editorial design tokens (`#F8F5EF` paper, `#1B2B31` dark ink teal, `#D4871C` warm amber, `#243047` ink typography).
   - Reusable primitives: vector SVG S-Curve, interactive Trend sparklines, paginated DataTables, and 5 visual states (`.state-loading`, `.state-empty`, `.state-error`, `.state-stale`, `.state-locked`).
3. **Agentic Runtime & LLM Integration**:
   - 5 deterministic rule surveillance agents (`CostMonitorAgent`, `BudgetVarianceAgent`, `CommitmentGapAgent`, `PeriodStalenessAgent`, `AnomalyDetectorAgent`).
   - LLM advisory integration powered by **Sumopod** (`https://ai.sumopod.com/v1`, model `gpt-4o-mini`).
   - Strict read-only guarantee: under no circumstance may an AI agent mutate financial ledgers. All agent findings require explicit human-in-the-loop (HITL) review.
4. **Production Observability & Real-Time**:
   - Deep health diagnostics via `GET /health/deep` and `GET /api/health/deep` reporting memory (`rssMb`, `heapTotalMb`), process uptime, database connection state, and entity store counts.
   - Structured JSON logging with request correlation (`x-request-id`, `organizationId`, `projectId`, `durationMs`).
   - Real-time Server-Sent Events (SSE) stream via `GET /api/v1/projects/:projectId/events` with tenant scoping and event dispatch for live transactions and agent alerts.

## Migration plan

Use additive, reviewable migrations: `001 tenancy/auth/project`, `002 WBS/CBS/cost codes`, `003 budget/baseline`, `004 vendors/contracts/commitments`, `005 invoices/actuals/accruals`, `006 periods/forecast/progress/EVM`, `007 changes/approvals`, `008 cash/risk`, `009 imports/audit/attachments`, `010 agent runs/findings`. Backfill with idempotent jobs, reconcile totals against source files, then enforce constraints. No destructive migration is allowed in MVP; corrections use new records.

## Environment and seed contract

Required runtime configuration: `DATABASE_URL` (Neon PostgreSQL), `AUTH_ISSUER_URL`, `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`, `APP_BASE_URL`, `LLM_PROVIDER=sumopod`, `LLM_BASE_URL=https://ai.sumopod.com/v1`, `SUMOPOD_API_KEY`, `LLM_MODEL=gpt-4o-mini`, `ENCRYPTION_KEY`, `LOG_LEVEL`, `DEFAULT_CURRENCY`, `CPI_WATCH_THRESHOLD`, `CPI_RISK_THRESHOLD`, `SPI_WATCH_THRESHOLD`, and `SPI_RISK_THRESHOLD`. Keep names in `.env.example`; keep values in the secret manager.

Seed one deterministic Acme Construction demo organization, three roles, one USD project, WBS/CBS, approved baseline, six periods, commitments, actuals, accruals, forecast, progress, changes, cash plan, risks, and evidence-linked findings with expected KPI snapshots.

## Quality Gates & Verification Status

- **Monorepo Test Suite**: 148 / 148 tests passing (100% green across web, web-next, api, db, domain).
- **OpenAPI Contract**: Formally validated via `packages/api/test/contract-openapi.test.js`.
- **E2E Full Lifecycle**: 15-stage project controls lifecycle verified in `packages/api/test/e2e-controls-workflow.test.js`.
- **Security & Syntax**: 50 runtime JS files cleanly parsed; 0 secrets or unsafe interpolation detected in static scans.
