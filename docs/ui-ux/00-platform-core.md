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
