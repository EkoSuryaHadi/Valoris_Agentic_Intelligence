# Phase 24 — Vercel Staging Deployment

## Status

Web and API preview deployments are ready on Vercel. Neon is selected as the staging PostgreSQL provider; migrations 004–007, seed, and API runtime wiring are implemented for Preview, while external identity/storage/queue validation remains deployment-gated.

## Deployment

- Vercel team: `ekosuryahadis-projects`
- Vercel project: `web`
- Preview URL: `https://web-h25hfsut9-ekosuryahadis-projects.vercel.app`
- Inspect URL: `https://vercel.com/ekosuryahadis-projects/web/93W8SEChGCNz5gYwF83L7C8jfBsP`
- Deployment type: preview

### Database

- Provider: Neon PostgreSQL
- Vercel environment: `Preview`
- Neon deployment branch: `Preview`
- Runtime variable: `DATABASE_URL`
- Use Neon's pooled connection URI for the Vercel Function runtime.

### API preview

- Vercel project: `valoris-api`
- Preview URL: `https://valoris-hlczt04gp-ekosuryahadis-projects.vercel.app`
- Current staging URL: `https://valoris-agentic-api.vercel.app`
- Inspect URL: `https://vercel.com/ekosuryahadis-projects/valoris-api/BuB9Pzey9iWJfzSD9c1e6m6eao9y`
- Deployment type: preview

The API adapter exposes `/health` through a Vercel Node Function. Authenticated routes require `AUTH_JWKS_URL`, `AUTH_ISSUER_URL`, and `AUTH_AUDIENCE` in Vercel environment variables. The adapter now loads the seeded PostgreSQL snapshot at cold start and persists project, WBS, baseline, transaction, forecast, and EVM writes through PostgreSQL repositories; external identity, storage, queue, and final staging verification remain release gates.

The first CLI deployment was automatically assigned a production target by Vercel because the project had no prior deployment. It is not treated as the VALORIS production release. Subsequent validation uses the explicit preview deployment above.

## Remaining Phase 24 work

WBS creation is now persisted through `HierarchyRepository`.
Baseline creation and budget-line creation are now persisted through `BaselineRepository`; approval and lock transitions remain human-controlled.

Commitment, actual-cost, and accrual creation are now persisted through `TransactionRepository`; open-period and source-reference validation remain enforced.

Forecast/ETC/EAC and EVM snapshots are now persisted through `ForecastRepository` and `EvmRepository`; period lock and formula guardrails remain enforced.

1. Apply `docs/database/schema.sql`, migrations `004–007`, and `database/seed.sql` once to the Neon Preview branch.
2. Configure Auth issuer/client/JWKS values, `OBJECT_STORAGE_BUCKET`, `QUEUE_URL`, and `ENCRYPTION_KEY` in the staging secret manager.
3. Repository-backed change, risk, finding, cash-flow, and audit writes are complete; run `scripts/staging-preflight.ps1` and `scripts/staging-verify.ps1` against the real staging API.
4. Configure the web runtime API base URL and repeat browser UAT against the deployed web URL.

## Guardrails

- No secrets are committed to the repository.
- `LLM_PROVIDER` remains `disabled` until agent-provider controls are approved.
- Production promotion requires an explicit approval after API, database, identity, storage, queue, and human-review checks pass.
