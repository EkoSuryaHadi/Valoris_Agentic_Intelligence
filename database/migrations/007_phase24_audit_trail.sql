-- Phase 24 audit hardening. Safe after docs/database/schema.sql and migrations 004–006.
-- The base schema already defines audit_events; this migration makes the release
-- path idempotent for environments that apply migrations independently.
create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  project_id uuid references projects(id),
  actor_user_id uuid references users(id),
  actor_type text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  reason text,
  source_ref text,
  created_at timestamptz not null default now()
);
create index if not exists audit_project_created on audit_events(project_id, created_at);
create index if not exists audit_organization_created on audit_events(organization_id, created_at);
