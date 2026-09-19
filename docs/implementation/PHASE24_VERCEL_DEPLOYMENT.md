# Phase 24 — Vercel Staging Deployment

## Status

Web preview deployment is ready on Vercel. The API and external staging services are not yet connected.

## Deployment

- Vercel team: `ekosuryahadis-projects`
- Vercel project: `web`
- Preview URL: `https://web-h25hfsut9-ekosuryahadis-projects.vercel.app`
- Inspect URL: `https://vercel.com/ekosuryahadis-projects/web/93W8SEChGCNz5gYwF83L7C8jfBsP`
- Deployment type: preview

The first CLI deployment was automatically assigned a production target by Vercel because the project had no prior deployment. It is not treated as the VALORIS production release. Subsequent validation uses the explicit preview deployment above.

## Remaining Phase 24 work

1. Deploy the Node API as a separate Vercel-compatible service or select an API runtime host.
2. Configure `DATABASE_URL`, Auth issuer/client values, `OBJECT_STORAGE_BUCKET`, `QUEUE_URL`, and `ENCRYPTION_KEY` in the staging secret manager.
3. Apply migrations and seed only the isolated staging database.
4. Run `scripts/staging-preflight.ps1` and `scripts/staging-verify.ps1` against the real staging API.
5. Configure the web runtime API base URL and repeat browser UAT against the deployed web URL.

## Guardrails

- No secrets are committed to the repository.
- `LLM_PROVIDER` remains `disabled` until agent-provider controls are approved.
- Production promotion requires an explicit approval after API, database, identity, storage, queue, and human-review checks pass.
