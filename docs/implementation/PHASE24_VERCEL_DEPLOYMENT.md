# Phase 24 — Vercel Staging Deployment

## Status

Web and API preview deployments are ready on Vercel. External staging services and API persistence are not yet connected.

## Deployment

- Vercel team: `ekosuryahadis-projects`
- Vercel project: `web`
- Preview URL: `https://web-h25hfsut9-ekosuryahadis-projects.vercel.app`
- Inspect URL: `https://vercel.com/ekosuryahadis-projects/web/93W8SEChGCNz5gYwF83L7C8jfBsP`
- Deployment type: preview

### API preview

- Vercel project: `valoris-api`
- Preview URL: `https://valoris-hlczt04gp-ekosuryahadis-projects.vercel.app`
- Inspect URL: `https://vercel.com/ekosuryahadis-projects/valoris-api/BuB9Pzey9iWJfzSD9c1e6m6eao9y`
- Deployment type: preview

The API adapter exposes `/health` through a Vercel Node Function. Authenticated routes require `AUTH_JWKS_URL`, `AUTH_ISSUER_URL`, and `AUTH_AUDIENCE` in Vercel environment variables. Financial stores still require the PostgreSQL repository wiring before this is a real staging release.

The first CLI deployment was automatically assigned a production target by Vercel because the project had no prior deployment. It is not treated as the VALORIS production release. Subsequent validation uses the explicit preview deployment above.

## Remaining Phase 24 work

1. Configure `DATABASE_URL`, Auth issuer/client/JWKS values, `OBJECT_STORAGE_BUCKET`, `QUEUE_URL`, and `ENCRYPTION_KEY` in the staging secret manager.
2. Wire the API runtime to the PostgreSQL repository and apply migrations/seed only to the isolated staging database.
3. Run `scripts/staging-preflight.ps1` and `scripts/staging-verify.ps1` against the real staging API.
4. Configure the web runtime API base URL and repeat browser UAT against the deployed web URL.

## Guardrails

- No secrets are committed to the repository.
- `LLM_PROVIDER` remains `disabled` until agent-provider controls are approved.
- Production promotion requires an explicit approval after API, database, identity, storage, queue, and human-review checks pass.
