# Valoris Quality Gates & Test Strategy

## 1. Overview
Valoris Agentic Intelligence implements a multi-tier testing and verification architecture to guarantee zero financial regression, strict tenant data isolation, OpenAPI contract fidelity, and human-in-the-loop (HITL) agent safety.

All testing suites run without external dependencies using Node.js's native test runner (`node --test`), with automated offline mock fallbacks for external integrations (such as Sumopod LLM API and Neon PostgreSQL persistence).

## 2. Test Suites & Coverage Hierarchy

| Tier | Suite Command | Scope & Focus | Primary Assertions |
|------|---------------|---------------|-------------------|
| **Tier 0: Static Safety** | `npm run build` | ECMAScript Module validation, syntax checks, import resolution | Validates all 49+ runtime `.js`/`.mjs` files parse cleanly. |
| **Tier 0: Security Scan** | `npm run security:scan` | Credential leak scanning, raw SQL interpolation, forbidden patterns | Detects unparameterized SQL, hardcoded secrets, unsafe shell calls. |
| **Tier 1: Web Shell (Legacy)** | `npm run test:web` | Vanilla UI Shell, CSS token presence, visual states | Verifies 5 state classes (`.state-loading`, `.state-empty`, etc.) and token unminification. |
| **Tier 1: Web Next (React 19)** | `npm run test:web-next` | Industrial Editorial design system, 14 screens, chart primitives, bundle verification | Verifies `--color-amber`, `--color-dark-ink-teal`, 14 screens, `dist/index.html` integrity. |
| **Tier 2: Domain Engine** | `npm run test:domain` | EVM formulas, cost rollup, baseline FSM, rule surveillance agents, LLM advisor | Mathematically verifies CPI/SPI/EAC/ETC, 5 surveillance agents, read-only advisory. |
| **Tier 2: Database Persistence** | `npm run test:db` | Neon schema, migrations, parameterized read queries, tenant scoping | Verifies SQL safety, tenant boundary validation, pagination `{ data, meta }`. |
| **Tier 3: API Unit & Middlewares** | `npm run test:api` | Parameter router, auth middleware, rate limiter, payload limiter | 401 unauthenticated, 403 project scope denied, 429 rate limit, 413 body size limit. |
| **Tier 4: OpenAPI Contract Gate** | `packages/api/test/contract-openapi.test.js` | Structural schema validation against `docs/api/openapi.yaml` | Verifies all OpenAPI defined routes match runtime router endpoints. |
| **Tier 5: E2E Lifecycle Workflow** | `packages/api/test/e2e-controls-workflow.test.js` | Complete 15-stage project control lifecycle | Project -> WBS -> Baseline FSM -> Commitments -> Actuals -> EVM -> Agents -> Audit. |
| **Tier 6: Production Hardening** | `packages/api/test/production-hardening.test.js` | Deep health diagnostics, structured JSON logging, real-time SSE stream | Health 200/503, durationMs correlation, SSE `text/event-stream` broadcast. |

## 3. Critical Quality Gates

### 3.1. Tenant & Project Isolation Gate
- No database query or API endpoint may omit `organizationId` or allow cross-project leakage without explicit `403 PROJECT_SCOPE_DENIED`.
- All queries must be parameterized via `$1, $2` prepared statements.

### 3.2. Agent Safety & Non-Mutation Gate
- Surveillance agents (`CostMonitorAgent`, `BudgetVarianceAgent`, `CommitmentGapAgent`, `PeriodStalenessAgent`, `AnomalyDetectorAgent`) and `SumopodLlmAdvisor` must execute in **READ-ONLY** mode.
- Under NO circumstances may an AI agent automatically mutate a budget line, baseline, commitment, or ledger entry.
- Agent findings are published as proposals (`status: 'NEW'`) requiring explicit human-in-the-loop (HITL) review via `/api/v1/projects/:projectId/findings/:id/review`.

### 3.3. Baseline FSM State Machine Gate
- Baseline transitions must adhere strictly to:
  `DRAFT -> UNDER_REVIEW -> SUBMITTED -> APPROVED`
- Approval requires `PROJECT_MANAGER` or `COST_MANAGER` role accompanied by an immutable audit reason.
- Direct transitions jumping from `DRAFT -> APPROVED` are rejected with `400 INVALID_TRANSITION`.

### 3.4. Continuous Integration Execution
To run all test suites across the monorepo:
```bash
npm test
# Equivalent to: npm run test:all
```
Success requires 100% passing tests (0 failures, 0 regressions).
