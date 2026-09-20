# Implementation Changelog

This file links implementation increments to the PRD contract. Update it in the same commit as any material product or technical change.

## 2026-09-20 — Fase 6: Production Hardening, Health Diagnostics & Real-Time SSE

- Implemented Deep Health Check endpoint in `packages/api/src/routes.js`:
  - `GET /health/deep` and `GET /api/health/deep`
  - Reports system health status (`healthy` or `degraded`), uptime in seconds, database connection verification against persistence engine, memory diagnostics (`rssMb`, `heapTotalMb`, `heapUsedMb`), and active entity store counts.
- Implemented Structured JSON Logging with full request correlation:
  - `packages/api/src/middleware.js`: Enhanced `sendJson` to record request duration (`durationMs`), tenant ID (`organizationId`), project ID (`projectId`), request correlation ID (`x-request-id`), and exported `createStructuredLogger` streaming newline-delimited JSON.
  - `packages/api/src/server.js`: Attached high-precision `startTime` and correlation context to all incoming HTTP requests.
- Implemented Real-Time Server-Sent Events (SSE) Stream:
  - Created `ProjectEventBus` (`packages/api/src/events.js`) for pub/sub event distribution across project subscribers.
  - Added `GET /api/v1/projects/:projectId/events` endpoint in `packages/api/src/routes.js`:
    - Enforces authentication and strict tenant project scoping (`403 PROJECT_SCOPE_DENIED`).
    - Emits initial connection handshake event (`event: connected`).
    - Dispatches real-time broadcast events when project mutations occur (`COMMITMENT_CREATED`, `ACTUAL_POSTED`, `CHANGE_RECORDED`, `CHANGE_INCORPORATED`, `BASELINE_TRANSITIONED`, `AGENT_RUN_COMPLETED`).
    - Handles client socket disconnection and unsubscription.
- Added comprehensive production hardening test suite: `packages/api/test/production-hardening.test.js` covering deep health checks, degraded DB handling, structured logger correlation, and live SSE event broadcasting.
- Updated documentation in `docs/PRODUCTION_HANDOFF.md` and `docs/prd/README.md`.

## 2026-09-20 — Fase 5: Test Hardening & Quality Verification Gates

- Implemented OpenAPI Contract Verification Gate: `packages/api/test/contract-openapi.test.js` validating all 25+ endpoints in `docs/api/openapi.yaml` match registered router handlers.
- Implemented 15-Stage End-to-End Controls Lifecycle Test: `packages/api/test/e2e-controls-workflow.test.js` running a complete project financial workflow:
  1. Project Initialization
  2. WBS Structure Setup
  3. Baseline Draft Creation
  4. Budget Line Allocation
  5. Human Stage-Gate Approvals (Draft -> Under Review -> Submitted -> Approved)
  6. Purchase Commitment Creation
  7. Actual Cost Posting against Open Period
  8. Accrual Posting
  9. EAC Forecast Calculation
  10. EVM Performance Snapshot (PV, EV, AC, CPI, SPI)
  11. Multi-Agent Rule Surveillance Scanning
  12. Sumopod LLM Read-Only Advisory Execution
  13. Human Review & Disposition of Agent Findings
  14. Potential Change Order Proposal & Human Incorporation
  15. Reconciled Executive Cost Summary & Audit Trail Verification
- Implemented Web Next Frontend Test Suite: `apps/web-next/test/ui-next.test.js` verifying canonical design tokens, visual state classes, all 14 screens, UI primitives, and production build artifact validation.
- Created `docs/testing/quality-gates.md` documenting multi-tier test hierarchy, agent non-mutation gates, FSM rules, and tenant boundary enforcement.
- Integrated `npm run test:web-next` into root `package.json` test runner, achieving **148 / 148 passing tests (100%)** across the monorepo.

## 2026-09-20 — Fase 4: Agent Runtime & Sumopod LLM Integration

- Implemented 5 deterministic rule surveillance agents under `packages/domain/src/agents/`:
  1. `CostMonitorAgent`: Evaluates cumulative actual costs against sanctioned BAC thresholds (90% warning, >100% breach).
  2. `BudgetVarianceAgent`: Flags critical CPI degradation (< 0.90) and negative Cost Variance (CV).
  3. `CommitmentGapAgent`: Detects unhedged purchase commitments exceeding control account budget allocations.
  4. `PeriodStalenessAgent`: Identifies stale periods lacking invoice postings (>30 days) and unposted accruals.
  5. `AnomalyDetectorAgent`: Robust statistical outlier detection on transaction amounts using z-score analysis.
- Implemented `AgentRegistry` (`packages/domain/src/agents/registry.js`) for centralized agent discovery, execution, and batch scanning.
- Implemented `SumopodLlmAdvisor` (`packages/domain/src/agents/llm-advisor.js`): OpenAI-compatible adapter for Sumopod (`https://ai.sumopod.com/v1`), operating with a strict read-only advisory guarantee (explain & recommend only, never mutate state).
- Added API endpoints in `packages/api/src/routes.js`:
  - `POST /api/v1/projects/:projectId/agents/:agentName/run`
  - `POST /api/v1/projects/:projectId/advisor`
- Updated `.env.example` with `LLM_PROVIDER=sumopod`, `LLM_BASE_URL`, `SUMOPOD_API_KEY`, `LLM_MODEL=gpt-4o-mini`.
- Updated OpenAPI specification in `docs/api/openapi.yaml`.
- Added unit tests in `packages/domain/test/agents.test.js` and integration tests in `packages/api/test/agents-api.test.js`, bringing total passing tests to 137/137 (100%).

## 2026-09-20 — Fase 3: Frontend Modernization (apps/web-next)

- Initialized modern React 19 + TypeScript + Vite frontend application in `apps/web-next/`.
- Configured design system with strict Industrial Editorial design tokens (`src/styles/tokens.css` and `src/styles/index.css`) utilizing warm paper canvas (`#F8F5EF`), dark ink teal (`#1B2B31`), warm amber (`#D4871C`), and navy typography (`#243047`).
- Created TypeScript interfaces for domain entities (`src/types/domain.ts`), auth/roles (`src/types/auth.ts`), and API responses (`src/types/api.ts`).
- Created fully typed API client (`src/api/client.ts`) covering all 13 project-scoped GET endpoints, write endpoints, and error handling.
- Built reusable UI primitives: `MetricCard`, `DataTable` (with sorting, pagination, empty/loading states), `StatusBadge`, `StateView` (5 UI states), `ExportButton` (CSV/JSON), `SCurve` (vector EVM chart), and `TrendLine` (sparkline).
- Implemented 14 screens:
  1. `Executive.tsx`: Executive Cockpit with KPI cards, S-Curve, decision queue, and agent findings.
  2. `Overview.tsx`: Project summary, active baseline status, and recent commitments.
  3. `Structure.tsx`: WBS/CBS hierarchy tree, node creation, and level indentation.
  4. `Baseline.tsx`: Baseline versions, life-cycle stage-gate transitions, and budget line additions.
  5. `Imports.tsx`: Data ingestion staging, schema validation, and commit.
  6. `Transactions.tsx`: Commitments, actual costs, and accruals tabbed ledgers.
  7. `Forecast.tsx`: EAC forecasting engine (run-rate, CPI, composite, manual override).
  8. `Evm.tsx`: Earned Value Management performance metrics (PV, EV, AC, CPI, SPI, CV, SV, TCPI).
  9. `Changes.tsx`: Change order proposals, cost/schedule impact, and baseline incorporation.
  10. `CashFlow.tsx`: Cash flow projections, periodic inflow/outflow, and cumulative curve.
  11. `Risks.tsx`: Quantitative Expected Monetary Value (EMV) risk register and contingency.
  12. `AgentCenter.tsx`: Agent intelligence center with 5 rule agent execution, Sumopod AI advisor, and HITL review inbox.
  13. `Reports.tsx`: Standardized project control reports catalog with one-click exports.
  14. `Audit.tsx`: Immutable chronological audit trail with JSON payload inspection.
- Built clean client-side hash routing (`Shell.tsx`, `Rail.tsx`, `Topbar.tsx`, `App.tsx`) preserving URL compatibility (`#executive`, `#overview`, `#baseline`, etc.).
- Successfully verified production build (`npm run build`) generating optimized bundles with 0 TypeScript or bundling errors.

## 2026-09-20 — Fase 2: Complete Read Endpoints

- Created `packages/db/src/read-queries.js` implementing SQL-injection-safe parameterized project-scoped queries with table allow-listing and standardized pagination (`LIMIT/OFFSET` + total count).
- Added `list()` and specific project query methods across all repository classes in `packages/db/src/domain-repositories.js` (`HierarchyRepository`, `BaselineRepository`, `TransactionRepository`, `ForecastRepository`, `EvmRepository`, `ChangeRepository`, `RiskRepository`, `FindingRepository`, `CashFlowRepository`, and `AuditRepository`).
- Implemented 13 project-scoped GET endpoints in `packages/api/src/routes.js` with pagination metadata (`{ data, meta: { total, page, limit, totalPages } }`) and strict project scope authorization (`PROJECT_SCOPE_DENIED`):
  1. `GET /api/v1/projects/:id/cost-codes`
  2. `GET /api/v1/projects/:id/periods`
  3. `GET /api/v1/projects/:id/commitments`
  4. `GET /api/v1/projects/:id/actual-costs`
  5. `GET /api/v1/projects/:id/accruals`
  6. `GET /api/v1/projects/:id/forecasts`
  7. `GET /api/v1/projects/:id/evm-snapshots`
  8. `GET /api/v1/projects/:id/changes`
  9. `GET /api/v1/projects/:id/risks`
  10. `GET /api/v1/projects/:id/agent-findings`
  11. `GET /api/v1/projects/:id/cash-flow`
  12. `GET /api/v1/projects/:id/audit-events`
  13. `GET /api/v1/projects/:id/cost-summary` (aggregates BAC, AC, EAC, VAC, CPI, SPI, and project health via `buildExecutiveSummary`).
- Loaded `cash_flow_snapshots` and `audit_events` into runtime database stores in `packages/api/src/database-stores.js`.
- Updated OpenAPI specification in `docs/api/openapi.yaml` with all 13 complete GET routes.
- Added comprehensive unit and integration tests in `packages/api/test/read-endpoints.test.js` and `packages/db/test/read-queries.test.js`, bringing the test suite to 126 passing tests.
- Updated `docs/prd/README.md` implementation map. Related PRD: Platform Core, API, Reporting, and Database.

## 2026-09-20 — Fase 1: API Router Refactoring

- Extracted routing mechanics from `server.js` into modular `packages/api/src/router.js`, supporting parameterized route paths (e.g. `:projectId`, `:periodId`), path arrays, and centralized route matching.
- Created `packages/api/src/middleware.js` implementing a composable middleware execution pipeline (`compose`), standardized rate-limiting (`createRateLimitMiddleware`), request body parsing with size/syntax validation (`createBodyParseMiddleware`), bearer token verification (`createAuthMiddleware`), and unified response/error handlers (`sendJson`, `sendError`).
- Created `packages/api/src/routes.js` grouping all 22 existing API route definitions, mapping write endpoints through the unified `[rateLimit, parseBody, auth]` pipeline and read endpoints through `auth`.
- Refactored `packages/api/src/server.js` from a 343-line monolith with 20+ repetitive regex matchers down to a clean 57-line thin wiring module.
- Added comprehensive unit tests in `packages/api/test/router.test.js` (5 tests) and `packages/api/test/middleware.test.js` (3 tests), bringing the API test suite to 61 tests (all passing).
- Updated `docs/prd/README.md` implementation map to record API router and middleware modularization as Completed. Related PRD: Platform Core, API.

## 2026-09-20 — Fase 0: CSS & Design Token Reconciliation

- Unminified `apps/web/styles.css` into a structured, human-readable stylesheet (~600 lines) with clear module sections.
- Reconciled `:root` design tokens to the canonical "industrial editorial" aesthetic direction per `.impeccable.md`:
  - Canvas (Paper): `--canvas: #F8F5EF` (Warm paper background)
  - Card (Surface): `--card: #FFFDF9` (Warm white surface)
  - Sidebar (Shell): `--sidebar: #1B2B31` (Dark ink teal structure)
  - Primary Action (Signal): `--primary: #D4871C` (Warm operational amber)
  - Ink (Typography): `--ink: #243047` (Navy ink base text)
  - Semantic: Green `--success: #2E7D47`, Amber `--warning: #C27803`, Red `--danger: #C0392B`, Blue `--info: #2B6CB0`
- Replaced hardcoded hex color values across components with semantic CSS variables.
- Added 5 standard state classes with visual treatments: `.state-loading`, `.state-empty`, `.state-error`, `.state-stale`, and `.state-locked`.
- Updated `apps/web/ui-shell.test.js` to assert the reconciled industrial editorial design tokens and state classes.
- Updated `.impeccable.md` and `docs/prd/README.md` implementation map to mark design token migration as Completed. Related PRD: UI/UX Specification v1.0 and Platform Core.

## 2026-09-19 — Release validation foundation

- Added release migration for EVM snapshots, changes, risks, agent findings, and cash-flow snapshots.
- Expanded deterministic demo seed through the end-to-end cost-control workflow.
- Updated CI and `npm test` to execute web, API, database, and domain suites.
- Completed local release smoke validation and documented the remaining staging-only actions for Phase 18.
- Applied schema, migrations 004–006, and deterministic seed to the local PostgreSQL staging container; verified the seeded workflow records and OPEN/NEW statuses.
- Completed API smoke validation for health, security headers, tenant-scoped read, human-controlled WBS write, unauthorized access, and hierarchy rejection.
- Completed browser UAT across all primary workspace screens; fixed hash-route reload handling and removed the favicon console error.
- Verified the Node `pg` pool boundary against the running PostgreSQL staging container using `DATABASE_URL`.
- Added the Phase 19 repeatable PostgreSQL staging runbook with parameterized credentials and opt-in demo seed loading.
- Added the Phase 20 deployment verification script for API health, security headers, authenticated project access, and optional project scope checks.
- Added the Phase 21 staging preflight and environment runbook for secret-safe auth, storage, queue, database, and deployment checks.
- Added the Phase 22 Playwright CLI browser UAT runner for all 11 primary workspace screens and console-error detection.
- Added the Phase 23 CI security gate with static runtime-pattern scanning, high-severity dependency audit, and a strict-compatible frontend CSP.
- Deployed the VALORIS web shell to an explicit Vercel preview and documented the remaining API/runtime staging handoff for Phase 24.
- Added the Vercel Node API adapter and deployed an explicit API preview; authentication and PostgreSQL runtime wiring remain gated by staging configuration.
- Selected Neon PostgreSQL for Vercel Preview and documented the ordered schema, migration, and seed handoff.
- Added cold-start Neon snapshot loading for the Vercel API adapter with snake_case-to-camelCase domain normalization; repository-backed writes remain gated for the next increment.
- Wired project creation through the parameterized `ProjectRepository`, preserving the API-generated project ID and tenant scope.
- Wired WBS creation through the parameterized `HierarchyRepository`, preserving project scope and the API-generated node ID.
- Wired baseline draft and budget-line creation through the parameterized `BaselineRepository`; approval and lock guardrails remain unchanged.
- Wired commitment, actual-cost, and accrual creation through the parameterized `TransactionRepository`; open-period and source-reference validation remain enforced.

## 2026-09-18

- Added runtime PostgreSQL pool and tenant-scoped project repository. Related PRD: Platform Core, Database, Security.
- Added parameterized WBS/CBS, baseline-line, and actual-cost repository boundaries. Related PRD: Project Setup, Cost Baseline, Actual Cost.
- Added parameterized commitment, accrual, and forecast snapshot repositories. Related PRD: Commitment, Forecast, and EAC.
- Wired API-generated Forecast and EVM snapshot IDs through `ForecastRepository` and `EvmRepository`; the Vercel/Neon MVP-B financial workflow now persists forecast and performance snapshots without changing Human-in-the-Loop approval boundaries.
- Completed MVP-C persistence boundaries for changes, risks, agent findings, cash-flow snapshots, and append-only audit events; change incorporation and finding review remain human-authorized and are recorded with reasons/actor context.
- Added idempotent Phase 24 audit migration `007_phase24_audit_trail.sql` and included it in the PostgreSQL staging runbook. Related PRD: Change, Risk, Agentic Review, Reporting, and Security.
- Fixed Vercel API health routing by accepting both `/health` and `/api/health`; staging verification now falls back between both paths for function-prefix deployments.
- Reconciled tenant-scoped transaction reads with the shared-schema ownership model and added the forecast persistence migration. Related PRD: Platform Core, Commitment, Forecast, and EAC. Acceptance: organization and project scope are enforced through the project join; forecast snapshots are unique per project and reporting period.
- Added RS256 JWT/JWKS verification with issuer, audience, expiry, key, and signature validation; wired API runtime to bearer authentication with an explicit development-only header fallback. Related PRD: Platform Core and Security. Acceptance: production paths reject missing bearer credentials and preserve tenant/project claims from the verified token.
- Added bounded JSON parsing and injectable per-client rate limiting for state-changing API routes, with structured `400`, `413`, `429`, and `401` errors. Related PRD: Platform Core and Security. Acceptance: oversized/malformed bodies and abusive request bursts are rejected without exposing internals.
- Added validated request correlation IDs, audit-safe structured request events, and an injectable rate-limit store boundary for future Redis/edge adapters. Related PRD: Platform Core, Security, and Observability. Acceptance: every response carries a safe request ID and logs exclude authorization headers, bodies, and token claims.
- Added the Phase 10 MVP-A workspace shell with organization/project context, Overview, WBS/CBS, Baseline, Import Center, and Audit Trail screens. Related PRD: Platform Core and UI/UX. Acceptance: the shell is responsive, status is conveyed with labels plus color, and no chatbot is used as the primary interaction model.
- Added authenticated MVP-A read endpoints for tenant-scoped projects and project-scoped WBS/CBS and baseline collections. Related PRD: Platform Core, API, and UI/UX. Acceptance: read responses require bearer auth, filter by verified organization/project context, and expose structured scope errors.
- Added the MVP-A browser API client and optional live WBS/baseline hydration. Related PRD: Platform Core, API, and UI/UX. Acceptance: bearer tokens are obtained only through a trusted runtime token provider; request IDs, idempotency keys, and structured backend errors flow through the client boundary; the visual review shell safely falls back to demo data.
- Added the MVP-A active project selector. Related PRD: Platform Core and UI/UX. Acceptance: the control is populated solely by tenant-scoped results, preserves an explicit active project, refreshes project-bound WBS/baseline data, and never invents a cross-tenant fallback.
- Added authenticated WBS creation for MVP-A. Related PRD: Project Setup, API, and UI/UX. Acceptance: WBS nodes can only be created inside the verified project scope by an authorized human role, require an idempotency key, and satisfy hierarchy validation before persistence.
- Added the MVP-A human-controlled WBS creation form. Related PRD: Project Setup and UI/UX. Acceptance: an operator explicitly provides code and name, submits only in the active authorized project context, sees inline outcomes, and receives no simulated write in demo mode.
- Added role-gated baseline draft creation for MVP-A. Related PRD: Cost Baseline, API, and UI/UX. Acceptance: the API assigns the next project-scoped version and `DRAFT` state only after verified human authorization; approval remains a separate Human-in-the-Loop action.
- Added the MVP-A baseline draft action to the workspace. Related PRD: Cost Baseline and UI/UX. Acceptance: a human explicitly starts draft creation from the Baseline screen, receives inline success or error feedback, and the version history refreshes from the authorized project context.
- Added the MVP-A budget-line API boundary. Related PRD: Cost Baseline, API, and Database. Acceptance: lines can be added only to an open baseline with same-project WBS/cost-code references and non-negative validated amounts.
- Started migration to the approved VALORIS UI/UX Design Specification v1.0. Related PRD: UI/UX and Platform Core. Acceptance: shell tokens use the specified navy sidebar, cool canvas, white cards, indigo primary, semantic colors, 8–12px geometry, and compact financial typography.
- Added the MVP-A budget-line entry workspace. Related PRD: Cost Baseline and UI/UX. Acceptance: a human enters WBS, cost-code, and non-negative amount values, submits against the active open baseline, and receives inline validation or API feedback.
- Added the MVP-A baseline review workflow. Related PRD: Cost Baseline, Access Control, API, and UI/UX. Acceptance: approval and locking use valid state transitions, role capability checks, project scope, idempotency, and a required audit reason before persistence.
- Added the MVP-A Import Center preview flow. Related PRD: Import Center, API, and UI/UX. Acceptance: operators submit source rows for validation, see valid/error/total results, and no financial records are committed during preview.
- Added the MVP-A Import Center commit flow. Related PRD: Import Center, API, Database, and Audit. Acceptance: only fully valid previews can be committed, the action requires human confirmation and idempotency, and invalid batches are rejected without partial persistence.
- Added the MVP-A Import Center upload and mapping stepper. Related PRD: Import Center and UI/UX. Acceptance: CSV rows can be loaded, reference and amount columns mapped, and handed to validation without implicit import or data mutation.
- Added MVP-B commitment and actual-cost API adapters. Related PRD: Commitment, Actual Cost & Accrual. Acceptance: authorized users can create a project-scoped commitment and post actual cost only to an open period, with idempotency and human-controlled writes.
- Added the accrual draft workspace and API route. Acceptance: authorized users can record a source-backed accrual only in an open period; the record remains DRAFT for human review and later reconciliation.
- Added the MVP-B Forecast Control workspace and period forecast route. Acceptance: BAC, AC, and ETC calculate EAC and VAC in an open period without changing the baseline; the UI marks the result advisory until human review.
- Added the MVP-B EVM performance workspace and period EVM route. Acceptance: planned progress, approved progress, BAC, and AC produce PV/EV/CV/SV/CPI/SPI snapshots with evidence-linked UI and no automatic approval.
- Added the MVP-C Change Management workspace and scoped create/incorporate routes. Acceptance: potential changes show weighted exposure; only approved changes can be incorporated by an authorized project or cost manager.
- Added the MVP-C Cash Flow Control workspace and read-only variance route. Acceptance: aligned planned and actual period series return variance and cumulative forecast for human review.
- Added the MVP-C Risk & Findings workspace with risk creation, evidence-linked finding capture, and human review routes. Acceptance: agents can recommend but only a human can accept, dismiss, or escalate a finding.
- Added Phase 17 production-readiness gates, deterministic demo seed guidance, environment checklist, and Definition of Ready/Done. Added security response headers and regression coverage.
- Added authentication claims boundary and runtime API server. Related PRD: Platform Core, Access Control, API.
- Added API adapters for baseline, transactions, forecast/EVM, change, cash/risk, findings/import, and executive reporting. Related PRD: Modules 01–12.
- Added UI contracts for Phase 2–7 workspaces. Related PRD: UI/UX and module PRDs.

## Required commit discipline

1. Update code and the affected PRD/specification together.
2. Add or update tests for changed behavior.
3. Record the phase/module and acceptance impact here.
4. Run the applicable domain, API, database, and E2E checks.
5. Push only after the PRD, implementation, and tests are consistent.
