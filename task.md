# Task Execution Checklist — Valoris Agentic Intelligence

## Fase 0 — CSS & Design Token Reconciliation [COMPLETED]
- [x] Baseline test verification (`npm test` passes — 114 tests)
- [x] Create `task.md` checklist
- [x] Unminify `apps/web/styles.css` to readable format (~600 lines)
- [x] Reconcile `:root` tokens to "industrial editorial" direction (amber primary `#D4871C`, dark teal sidebar `#1B2B31`, warm paper canvas `#F8F5EF`, ink `#243047`)
- [x] Replace all hardcoded colors with CSS variables
- [x] Add state classes: `.state-loading`, `.state-empty`, `.state-error`, `.state-stale`, `.state-locked`
- [x] Update `apps/web/ui-shell.test.js` to assert new token variables & state classes
- [x] Update `.impeccable.md` to confirm token palette
- [x] Update `docs/prd/README.md` implementation map
- [x] Update `docs/implementation/CHANGELOG.md`
- [x] Verify test suite passes (`npm test` — 114 tests passing)

## Fase 1 — API Router Refactoring [COMPLETED]
- [x] Create `packages/api/src/router.js` with path param extraction
- [x] Create `packages/api/src/middleware.js` with composable auth/rateLimit/body parsing
- [x] Refactor `packages/api/src/server.js` to thin wiring (57 lines ≤ 80 lines)
- [x] Add router unit tests `packages/api/test/router.test.js` & `packages/api/test/middleware.test.js`
- [x] Verify all 61 API tests + 122 monorepo tests pass
- [x] Update `docs/prd/README.md` and `docs/implementation/CHANGELOG.md`

## Fase 2 — Complete Read Endpoints [COMPLETED]
- [x] Create `packages/db/src/read-queries.js` with parameterized SELECTs & pagination
- [x] Add `list()` methods to all repository classes in `packages/db/src/domain-repositories.js`
- [x] Implement 13 GET endpoints in API with pagination (`{ data, meta }`)
- [x] Add tests for all 13 GET endpoints (`packages/api/test/read-endpoints.test.js`)
- [x] Update `docs/api/openapi.yaml`
- [x] Update `docs/prd/README.md` and `docs/implementation/CHANGELOG.md`
- [x] Verify full test suite passes (`npm test` — 126 tests passing)

## Fase 3 — Frontend Migration: Vite + React + TypeScript [COMPLETED]
- [x] Initialize `apps/web-next/` with Vite, React 19, TypeScript
- [x] Port and type API client (`client.ts`)
- [x] Implement reusable design components (Shell, MetricCard, DataTable, StatusBadge, SCurve, TrendLine, StateView, ExportButton)
- [x] Implement 11 migrated screens + 3 new screens (Executive, AgentCenter, Reports)
- [x] Verify responsive layout & routing parity
- [x] Verify Vite & TypeScript production build (`npm run build` succeeds)
- [x] Update PRD docs (`README.md`, `ui-ux/00-platform-core.md`, `architecture/00-platform-core.md`, `CHANGELOG.md`)

## Fase 4 — Agent Runtime + Sumopod Integration [COMPLETED]
- [x] Create base agent framework in `packages/domain/src/agents/base-agent.js`
- [x] Implement 5 deterministic rule agents (CostMonitor, BudgetVariance, CommitmentGap, PeriodStaleness, AnomalyDetector)
- [x] Implement centralized AgentRegistry (`packages/domain/src/agents/registry.js`)
- [x] Implement Sumopod OpenAI-compatible advisor (`llm-advisor.js`) with read-only guarantee
- [x] Add agent run and advisor endpoints in `packages/api/src/routes.js`
- [x] Update `.env.example` with Sumopod configuration
- [x] Update `docs/api/openapi.yaml` with agent endpoints
- [x] Add agent unit tests (`agents.test.js`) and API integration tests (`agents-api.test.js`)
- [x] Update PRD docs and implementation changelog

## Fase 5 — Testing Hardening [COMPLETED]
- [x] Add OpenAPI contract validation tests (`packages/api/test/contract-openapi.test.js`)
- [x] Add 15-stage End-to-End full lifecycle controls workflow test (`packages/api/test/e2e-controls-workflow.test.js`)
- [x] Add React architecture & build verification tests in `apps/web-next/test/ui-next.test.js`
- [x] Update root `package.json` test scripts (`npm run test:web-next` and `npm run test:all`)
- [x] Create `docs/testing/quality-gates.md` and update `docs/prd/README.md`
- [x] Verify full monorepo passes with zero regressions

## Fase 6 — Production Hardening [COMPLETED]
- [x] Add ProjectEventBus and SSE real-time stream endpoint (`GET /api/v1/projects/:projectId/events`)
- [x] Add structured JSON logging with request correlation (`x-request-id`, `durationMs`, `organizationId`, `projectId`)
- [x] Add deep health check endpoint (`GET /health/deep` & `GET /api/health/deep`) checking DB, memory, uptime, stores
- [x] Add production hardening integration test suite (`packages/api/test/production-hardening.test.js`)
- [x] Update PRD docs, `docs/PRODUCTION_HANDOFF.md`, and final walkthrough
- [x] 148 / 148 automated tests passing (100% green across monorepo)
