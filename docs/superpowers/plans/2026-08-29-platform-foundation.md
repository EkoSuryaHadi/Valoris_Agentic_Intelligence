# Valoris Platform Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure multi-tenant Valoris web foundation where authenticated users can select permitted organizations and projects, with RLS-protected data and auditable project creation.

**Architecture:** A Next.js App Router application on Vercel uses Supabase Auth and PostgreSQL. Domain services run server-side, take an authenticated actor and explicit organization/project context, and call Supabase through RLS-protected access. Material mutations create an append-only audit event in the same database transaction.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Supabase Auth/PostgreSQL/RLS, `@supabase/ssr`, Zod, Vitest, Playwright, ESLint, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-29-platform-foundation-design.md`

## Global Constraints

- Deploy the web application to Vercel and use Supabase for Auth, PostgreSQL, RLS, and storage.
- Every tenant-scoped record contains `organization_id`; project-scoped records also contain `project_id`.
- Browser and server requests must not bypass RLS.
- Every material mutation produces an append-only audit event.
- Cross-tenant and unassigned-project reads and writes must fail.
- Secrets must never be committed; service-role credentials are not part of ordinary request paths.
- No Cost Management, forecast, EVM, change, risk, procurement, agent, or reporting business feature is in scope.

---

## File Structure

- `apps/web/package.json`: web scripts and application dependencies.
- `apps/web/src/lib/env.ts`: validated public Supabase configuration.
- `apps/web/src/lib/supabase/browser.ts`: browser Supabase client.
- `apps/web/src/lib/supabase/server.ts`: server Supabase client with cookie session support.
- `apps/web/src/lib/auth/require-user.ts`: authenticated actor boundary.
- `apps/web/src/lib/context/active-context.ts`: validates and persists selected organization/project context.
- `apps/web/src/lib/organizations/organization-service.ts`: organization membership queries.
- `apps/web/src/lib/projects/project-service.ts`: project read/create operations.
- `apps/web/src/lib/audit/audit-service.ts`: append-only audit writes.
- `apps/web/src/app/(auth)/login/page.tsx`: login page.
- `apps/web/src/app/(app)/layout.tsx`: authenticated app shell.
- `apps/web/src/app/(app)/select-context/page.tsx`: organization/project selection.
- `apps/web/src/app/(app)/projects/new/page.tsx`: minimal project setup.
- `apps/web/src/components/context-switcher.tsx`: accessible context switcher.
- `supabase/migrations/000001_platform_core.sql`: tables, constraints, indexes, triggers, and RLS policies.
- `apps/web/src/**/*.test.ts`: Vitest unit and domain-service tests.
- `apps/web/e2e/**/*.spec.ts`: Playwright end-to-end authorization and journey tests.
- `.github/workflows/ci.yml`: lint, type check, unit test, build, and Playwright job definition.

## Shared Interfaces

```ts
export type Actor = { userId: string; email: string | null };

export type OrganizationRole = "organization_admin" | "project_admin" | "member" | "viewer";

export type ProjectRole = "project_admin" | "member" | "viewer";

export type ActiveContext = {
  organizationId: string;
  projectId: string | null;
};

export type CreateProjectInput = {
  organizationId: string;
  name: string;
  code: string;
  currencyCode: string;
};

export type Project = {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  currencyCode: string;
  status: "setup";
};

export type AuditEventInput = {
  organizationId: string;
  projectId: string | null;
  actorUserId: string;
  action: "project.created";
  entityType: "project";
  entityId: string;
  metadata: Record<string, string>;
};
```

### Task 1: Bootstrap the Web Application and Test Harness

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/lib/env.ts`
- Create: `apps/web/src/lib/env.test.ts`
- Create: `apps/web/.env.example`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`

**Interfaces:**
- Produces: `getPublicEnv(input: Record<string, string | undefined>): { supabaseUrl: string; supabasePublishableKey: string }`.
- Consumes: no earlier task.

- [ ] **Step 1: Write the failing environment test**

```ts
import { describe, expect, it } from "vitest";
import { getPublicEnv } from "./env";

describe("getPublicEnv", () => {
  it("returns validated Supabase browser configuration", () => {
    expect(
      getPublicEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://tenant.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
      }),
    ).toEqual({
      supabaseUrl: "https://tenant.supabase.co",
      supabasePublishableKey: "publishable-key",
    });
  });

  it("rejects missing public configuration", () => {
    expect(() => getPublicEnv({})).toThrow("Missing NEXT_PUBLIC_SUPABASE_URL");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/lib/env.test.ts` from `apps/web`  
Expected: FAIL because `./env` does not exist.

- [ ] **Step 3: Implement the minimal environment module**

```ts
export function getPublicEnv(input: Record<string, string | undefined>) {
  const supabaseUrl = input.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = input.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!supabasePublishableKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }

  return { supabaseUrl, supabasePublishableKey };
}
```

- [ ] **Step 4: Add the Next.js, TypeScript, Vitest, Playwright, Supabase, Zod, ESLint, and Tailwind configuration**

Use package scripts exactly:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

Include only `NEXT_PUBLIC_SUPABASE_URL=` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=` in `.env.example`.

- [ ] **Step 5: Run the unit test to verify it passes**

Run: `npm test -- src/lib/env.test.ts`  
Expected: PASS.

- [ ] **Step 6: Run static verification**

Run: `npm run lint && npm run typecheck && npm run build`  
Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "chore: bootstrap Valoris web application"
```

### Task 2: Define Platform Core Tables and Row Level Security

**Files:**
- Create: `supabase/migrations/000001_platform_core.sql`
- Create: `supabase/tests/platform_core_rls.sql`
- Modify: `README.md`

**Interfaces:**
- Produces: database tables `profiles`, `organizations`, `organization_members`, `projects`, `project_members`, and `audit_events`.
- Produces: SQL functions `is_organization_member(uuid)` and `is_project_member(uuid)`.
- Consumes: `auth.uid()` from Supabase Auth.

- [ ] **Step 1: Write the failing RLS test**

```sql
begin;
select plan(2);

-- Set the test request identity to a user who belongs only to organization A.
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', true);

select lives_ok(
  $$ select * from projects where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'member can query own organization projects'
);

select is_empty(
  $$ select * from projects where organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  'member cannot query another organization projects'
);

select * from finish();
rollback;
```

- [ ] **Step 2: Run the RLS test to verify it fails**

Run: `supabase test db`  
Expected: FAIL because platform tables and policies do not exist.

- [ ] **Step 3: Write the migration**

Create UUID primary keys and non-null organization ownership. Create these immutable policy helpers:

```sql
create function is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
  );
$$;

create function is_project_member(target_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from project_members
    where project_id = target_project_id
      and user_id = auth.uid()
  );
$$;
```

Enable RLS on every tenant-scoped table. Permit project reads only if `is_project_member(projects.id)` is true. Permit project inserts only to organization administrators for the target organization. Deny direct update/delete on `audit_events` to authenticated users.

- [ ] **Step 4: Run the RLS test to verify it passes**

Run: `supabase db reset && supabase test db`  
Expected: PASS; the second query returns no rows.

- [ ] **Step 5: Add database documentation to the repository README**

Add a short “Local prerequisites” section requiring Node.js, Supabase CLI, and a local Docker runtime for database tests.

- [ ] **Step 6: Commit**

```bash
git add supabase README.md
git commit -m "feat: add multi-tenant platform schema and RLS"
```

### Task 3: Implement Authenticated Actor and Organization Context

**Files:**
- Create: `apps/web/src/lib/supabase/server.ts`
- Create: `apps/web/src/lib/auth/require-user.ts`
- Create: `apps/web/src/lib/auth/require-user.test.ts`
- Create: `apps/web/src/lib/organizations/organization-service.ts`
- Create: `apps/web/src/lib/organizations/organization-service.test.ts`
- Create: `apps/web/src/app/(auth)/login/page.tsx`
- Create: `apps/web/src/middleware.ts`

**Interfaces:**
- Produces: `requireUser(client): Promise<Actor>`.
- Produces: `listOrganizationsForActor(client, actor: Actor): Promise<Array<{ id: string; name: string; role: OrganizationRole }>>`.
- Consumes: RLS-protected `organization_members`.

- [ ] **Step 1: Write the failing actor test**

```ts
import { describe, expect, it, vi } from "vitest";
import { requireUser } from "./require-user";

describe("requireUser", () => {
  it("returns the authenticated actor", async () => {
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-1", email: "user@example.com" } },
        error: null,
      }) },
    };

    await expect(requireUser(client as never)).resolves.toEqual({
      userId: "user-1",
      email: "user@example.com",
    });
  });

  it("rejects anonymous access", async () => {
    const client = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    };

    await expect(requireUser(client as never)).rejects.toThrow("Unauthorized");
  });
});
```

- [ ] **Step 2: Run the actor test to verify it fails**

Run: `npm test -- src/lib/auth/require-user.test.ts`  
Expected: FAIL because `require-user.ts` does not exist.

- [ ] **Step 3: Implement the minimal actor boundary**

```ts
export async function requireUser(client: {
  auth: { getUser(): Promise<{ data: { user: { id: string; email?: string | null } | null } }> };
}): Promise<Actor> {
  const { data } = await client.auth.getUser();
  if (!data.user) throw new Error("Unauthorized");
  return { userId: data.user.id, email: data.user.email ?? null };
}
```

- [ ] **Step 4: Write the failing organization-list test**

```ts
it("returns only memberships visible through RLS", async () => {
  const client = {
    from: () => ({
      select: () => ({
        order: async () => ({
          data: [{ organization: { id: "org-1", name: "Atlas" }, role: "organization_admin" }],
          error: null,
        }),
      }),
    }),
  };

  await expect(listOrganizationsForActor(client as never, {
    userId: "user-1",
    email: null,
  })).resolves.toEqual([{ id: "org-1", name: "Atlas", role: "organization_admin" }]);
});
```

- [ ] **Step 5: Run the organization-list test to verify it fails**

Run: `npm test -- src/lib/organizations/organization-service.test.ts`  
Expected: FAIL because `organization-service.ts` does not exist.

- [ ] **Step 6: Implement the minimal organization query**

Query `organization_members` joined to `organizations`, filter by `user_id = actor.userId`, sort by organization name, map records to the declared return type, and throw `Unable to load organizations` when Supabase returns an error.

- [ ] **Step 7: Run all Task 3 tests to verify they pass**

Run: `npm test -- src/lib/auth/require-user.test.ts src/lib/organizations/organization-service.test.ts`  
Expected: PASS.

- [ ] **Step 8: Add the login route and authentication middleware**

The middleware redirects unauthenticated requests outside `/login` to `/login`. The login page has email/password controls, an accessible error summary, and a submit button; it must not render tenant data.

- [ ] **Step 9: Commit**

```bash
git add apps/web/src
git commit -m "feat: add authenticated actor and organization context"
```

### Task 4: Implement Project Creation with Audit Events

**Files:**
- Create: `apps/web/src/lib/audit/audit-service.ts`
- Create: `apps/web/src/lib/audit/audit-service.test.ts`
- Create: `apps/web/src/lib/projects/project-service.ts`
- Create: `apps/web/src/lib/projects/project-service.test.ts`
- Create: `apps/web/src/app/(app)/projects/new/actions.ts`
- Create: `apps/web/src/app/(app)/projects/new/page.tsx`

**Interfaces:**
- Produces: `appendAuditEvent(client, input: AuditEventInput): Promise<void>`.
- Produces: `createProject(client, actor: Actor, input: CreateProjectInput): Promise<Project>`.
- Consumes: `requireUser`, RLS policy for projects, and audit table.

- [ ] **Step 1: Write the failing audit test**

```ts
import { expect, it, vi } from "vitest";
import { appendAuditEvent } from "./audit-service";

it("writes an append-only project creation event", async () => {
  const insert = vi.fn().mockResolvedValue({ error: null });
  const client = { from: vi.fn(() => ({ insert })) };

  await appendAuditEvent(client as never, {
    organizationId: "org-1",
    projectId: "project-1",
    actorUserId: "user-1",
    action: "project.created",
    entityType: "project",
    entityId: "project-1",
    metadata: { code: "VAL-001" },
  });

  expect(insert).toHaveBeenCalledWith(expect.objectContaining({
    action: "project.created",
    entity_id: "project-1",
  }));
});
```

- [ ] **Step 2: Run the audit test to verify it fails**

Run: `npm test -- src/lib/audit/audit-service.test.ts`  
Expected: FAIL because `audit-service.ts` does not exist.

- [ ] **Step 3: Implement the append-only audit writer**

Insert into `audit_events` using snake-case persistence keys. Throw `Unable to record audit event` when the insert returns an error.

- [ ] **Step 4: Run the audit test to verify it passes**

Run: `npm test -- src/lib/audit/audit-service.test.ts`  
Expected: PASS.

- [ ] **Step 5: Write the failing project-service test**

```ts
it("creates a setup project and records its audit event", async () => {
  const insert = vi.fn().mockReturnValue({
    select: () => ({ single: async () => ({
      data: { id: "project-1", organization_id: "org-1", name: "Valoris Alpha", code: "VAL-001", currency_code: "USD", status: "setup" },
      error: null,
    }) }),
  });
  const client = { from: vi.fn(() => ({ insert })) };

  await expect(createProject(client as never, { userId: "user-1", email: null }, {
    organizationId: "org-1",
    name: "Valoris Alpha",
    code: "VAL-001",
    currencyCode: "USD",
  })).resolves.toMatchObject({ id: "project-1", status: "setup" });
});
```

- [ ] **Step 6: Run the project-service test to verify it fails**

Run: `npm test -- src/lib/projects/project-service.test.ts`  
Expected: FAIL because `project-service.ts` does not exist.

- [ ] **Step 7: Implement minimal validation and project creation**

Validate `name` (1–120 characters), `code` (2–32 uppercase letters, numbers, and hyphens), and `currencyCode` (three uppercase letters). Insert status `setup`; then invoke `appendAuditEvent`. If audit recording fails, return an error and do not report creation success.

- [ ] **Step 8: Run all Task 4 tests to verify they pass**

Run: `npm test -- src/lib/audit/audit-service.test.ts src/lib/projects/project-service.test.ts`  
Expected: PASS.

- [ ] **Step 9: Add the protected project-setup page**

Submit server action values `organizationId`, `name`, `code`, and `currencyCode`. Return field-level validation messages and preserve submitted values on failure. On success, redirect to the selected project context.

- [ ] **Step 10: Commit**

```bash
git add apps/web/src
git commit -m "feat: add auditable project setup"
```

### Task 5: Implement Context Selection and Authenticated App Shell

**Files:**
- Create: `apps/web/src/lib/context/active-context.ts`
- Create: `apps/web/src/lib/context/active-context.test.ts`
- Create: `apps/web/src/components/context-switcher.tsx`
- Create: `apps/web/src/app/(app)/layout.tsx`
- Create: `apps/web/src/app/(app)/select-context/page.tsx`
- Create: `apps/web/src/app/(app)/select-context/actions.ts`
- Create: `apps/web/src/app/(app)/page.tsx`

**Interfaces:**
- Produces: `validateActiveContext(client, actor: Actor, context: ActiveContext): Promise<ActiveContext>`.
- Produces: accessible `ContextSwitcher` with organization and project controls.
- Consumes: `listOrganizationsForActor` and RLS-protected project membership.

- [ ] **Step 1: Write the failing context validation test**

```ts
import { expect, it } from "vitest";
import { validateActiveContext } from "./active-context";

it("rejects a project that does not belong to the selected organization", async () => {
  const client = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: { message: "not found" } }),
        }),
      }),
    }),
  };

  await expect(validateActiveContext(client as never, {
    userId: "user-1",
    email: null,
  }, { organizationId: "org-1", projectId: "project-2" }))
    .rejects.toThrow("Invalid active project");
});
```

- [ ] **Step 2: Run the context test to verify it fails**

Run: `npm test -- src/lib/context/active-context.test.ts`  
Expected: FAIL because `active-context.ts` does not exist.

- [ ] **Step 3: Implement context validation**

First confirm visible organization membership, then, if `projectId` is non-null, query `projects` with both `id` and `organization_id`. Rely on RLS for the final visibility boundary. Return the same context only when both checks succeed.

- [ ] **Step 4: Run the context test to verify it passes**

Run: `npm test -- src/lib/context/active-context.test.ts`  
Expected: PASS.

- [ ] **Step 5: Build the app shell and switcher**

The authenticated layout renders the active organization/project, navigation placeholders for the approved module map, a sign-out control, and an accessible context switcher. The selection page lists only RLS-visible organizations and projects. It must show a purposeful empty state when the user has no organization membership.

- [ ] **Step 6: Add a no-context state**

When a user has no valid active organization, redirect to `/select-context`. Do not query project data before a context is valid.

- [ ] **Step 7: Run lint, unit tests, type check, and build**

Run: `npm run lint && npm test && npm run typecheck && npm run build`  
Expected: all commands exit 0.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src
git commit -m "feat: add authenticated Valoris application shell"
```

### Task 6: Add End-to-End Authorization Coverage and CI

**Files:**
- Create: `apps/web/e2e/auth-context.spec.ts`
- Create: `apps/web/playwright.config.ts`
- Create: `.github/workflows/ci.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: login route, context selector, project setup route, Supabase test users, and the scripts created in Task 1.
- Produces: repeatable quality checks for the `develop` and `main` branches.

- [ ] **Step 1: Write the failing Playwright test**

```ts
import { expect, test } from "@playwright/test";

test("member cannot open an unassigned project by URL", async ({ page }) => {
  await page.goto("/projects/project-not-assigned");
  await expect(page.getByText("You do not have access to this project")).toBeVisible();
});
```

- [ ] **Step 2: Run the E2E test to verify it fails**

Run: `npm run test:e2e -- auth-context.spec.ts`  
Expected: FAIL because the protected route has not yet rendered the required denial state.

- [ ] **Step 3: Implement the authorization-safe denial state**

For an invalid project route, render exactly: `You do not have access to this project`. Do not render project name, code, members, or any other project metadata.

- [ ] **Step 4: Run the E2E test to verify it passes**

Run: `npm run test:e2e -- auth-context.spec.ts`  
Expected: PASS.

- [ ] **Step 5: Create the CI workflow**

Run these commands in separate steps:

```yaml
- run: npm ci
- run: npm run lint
- run: npm run typecheck
- run: npm test
- run: npm run build
```

Run Playwright after starting the web application and provisioning the test Supabase environment. Mask all environment secrets in workflow logs.

- [ ] **Step 6: Document local and hosted configuration**

Document local `.env.local` variables, Supabase migration commands, Vercel environment-variable names, the rule that service-role secrets are server-only, and the required CI commands.

- [ ] **Step 7: Run final verification**

Run: `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e` from `apps/web`  
Expected: all commands exit 0.

- [ ] **Step 8: Commit**

```bash
git add apps/web .github README.md
git commit -m "test: add platform foundation quality gates"
```
