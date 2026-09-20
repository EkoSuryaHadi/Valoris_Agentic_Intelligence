# Module 00 — Platform Core UI/UX

## Core navigation

- Organizations
- Projects
- Master Data
- Users & Roles
- Imports & Integrations
- Audit Log
- Settings

## Essential screens

1. Organization and project switcher
2. Project setup wizard
3. Project overview
4. WBS/CBS explorer
5. Reporting calendar and periods
6. User and role management
7. Import validation workspace
8. Audit log viewer

## UX principles

- Always show active organization and project context.
- Explain permission boundaries in plain language.
- Preview and validate imports before committing.
- Preserve user work during validation errors.
- Show source, freshness, and last-updated metadata.
- Use progressive disclosure for advanced configuration.

## Empty states

Every empty state should explain why it is empty, what prerequisite is missing, and the next safe action.

## Phase 10 implementation baseline

The MVP-A web shell is implemented in `apps/web` with an industrial-editorial visual direction: warm paper surfaces, ink navy navigation, amber action signals, and dense evidence-first tables. The shell includes Overview, WBS/CBS, Baseline, Import Center, and Audit Trail views. It is a workspace UI, not a chatbot surface; later API wiring must preserve organization/project context, role boundaries, source freshness, and human approval states.

The shell now supports progressive live-data hydration through `apps/web/api-client.js`. A trusted host may provide `globalThis.VALORIS_API_CONFIG` with `baseUrl`, `projectId`, and a `tokenProvider` function; the browser never persists bearer tokens in the DOM or web storage. Without that runtime configuration, the review shell stays in demo-data mode.

When the runtime configuration is active, the persistent project selector is populated only from the tenant-scoped project API response. Switching projects refreshes WBS and baseline views for the selected project; an empty authorized-project list produces an explicit `No authorized project` state.

The WBS explorer now exposes a human-controlled root-node form. It requires code and name confirmation, submits only to the selected authorized project, refreshes the project tree after the API confirms creation, and renders validation or scope errors in place. Demo mode makes the limitation explicit and does not simulate a mutation.
The Baseline screen now exposes a human-triggered Create version action. It creates only a project-scoped DRAFT, refreshes version history after confirmation, and keeps approval as a separate human decision.

## Modern Frontend Runtime (apps/web-next)

The frontend is migrated to a React 19 + TypeScript + Vite modern application in `apps/web-next`, featuring:
- **14 Unified Screens**:
  1. Executive Cockpit (`#executive`): Executive KPIs, vector S-Curve, decision approvals, active agent findings.
  2. Project Overview (`#overview`): Project scope, active baseline status, major commitment lines.
  3. Structure WBS/CBS (`#structure`): Hierarchy tree, node creation, parent/child relationships.
  4. Baselines & Budgets (`#baseline`): Version progression, life-cycle stage-gate transitions, budget lines.
  5. Data Ingestion (`#imports`): Multi-type ERP staging, pre-commit schema validation, and batch commit.
  6. Financial Transactions (`#transactions`): Commitments, actual cost invoices, period accruals.
  7. EAC Forecasting (`#forecast`): Multi-model predictive forecast engine (CPI, run-rate, composite, manual).
  8. Earned Value Management (`#evm`): ANSI-748 EVM metrics (PV, EV, AC, CPI, SPI, CV, SV, TCPI).
  9. Change Management (`#changes`): Scope change requests, cost/schedule deltas, baseline incorporation.
  10. Cash Flow (`#cashflow`): Periodic cash inflows/outflows, cumulative balance trajectory.
  11. Cost Risk Register (`#risks`): Quantitative Expected Monetary Value (EMV), probability/impact matrix.
  12. Agent Intelligence Center (`#agents`): 5 deterministic rule surveillance agents + Sumopod LLM advisory with HITL review.
  13. Reports Catalog (`#reports`): Standardized deliverables with one-click JSON/CSV exports.
  14. Immutable Audit Trail (`#audit`): Chronological ledger audit log with JSON payload inspection.
- **Design System Tokens**: Warm paper canvas (`#F8F5EF`), dark ink teal (`#1B2B31`), warm amber (`#D4871C`), navy typography (`#243047`).
- **5 Standard UI State Views**: `.state-loading`, `.state-empty`, `.state-error`, `.state-stale`, `.state-locked`.
- **Vector EVM S-Curve & Sparkline Components**: Pure SVG data visualization with interactive hover tooltips.
