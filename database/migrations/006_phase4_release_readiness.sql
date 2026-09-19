-- Phase 4 release persistence. Apply after 005_phase3_forecast.sql.
-- OPEN is the operational state for a reporting period in the UI workflow.
do $$
begin
  if not exists (select 1 from pg_enum where enumtypid = 'approval_status'::regtype and enumlabel = 'OPEN') then
    alter type approval_status add value 'OPEN';
  end if;
end $$;

create table if not exists evm_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  period_id uuid not null references reporting_periods(id),
  bac numeric(20,2) not null check (bac >= 0),
  planned_progress numeric(8,5) not null check (planned_progress between 0 and 1),
  actual_progress numeric(8,5) not null check (actual_progress between 0 and 1),
  pv numeric(20,2) not null,
  ev numeric(20,2) not null,
  ac numeric(20,2) not null,
  cv numeric(20,2) not null,
  sv numeric(20,2) not null,
  cpi numeric(20,8),
  spi numeric(20,8),
  created_at timestamptz not null default now(),
  unique(project_id, period_id)
);
create index if not exists evm_snapshots_project_period on evm_snapshots(project_id, period_id);

create table if not exists changes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  number text not null,
  title text not null,
  type text not null,
  estimated_cost numeric(20,2) not null check (estimated_cost >= 0),
  probability numeric(8,5) not null check (probability between 0 and 1),
  exposure numeric(20,2) not null check (exposure >= 0),
  approved_cost numeric(20,2),
  status text not null default 'PENDING',
  created_at timestamptz not null default now(),
  unique(project_id, number)
);
create index if not exists changes_project_status on changes(project_id, status);

create table if not exists risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  title text not null,
  category text not null,
  probability numeric(8,5) not null check (probability between 0 and 1),
  impact numeric(20,2) not null check (impact >= 0),
  exposure numeric(20,2) not null check (exposure >= 0),
  severity text not null,
  status text not null default 'NEW',
  created_at timestamptz not null default now()
);
create index if not exists risks_project_status on risks(project_id, status);

create table if not exists agent_findings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  agent_type text not null,
  title text not null,
  statement text not null,
  severity text not null,
  confidence numeric(8,5) not null check (confidence between 0 and 1),
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'NEW',
  reviewed_by uuid references users(id),
  review_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists agent_findings_project_status on agent_findings(project_id, status);

create table if not exists cash_flow_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  period_id uuid references reporting_periods(id),
  planned jsonb not null default '[]'::jsonb,
  actual jsonb not null default '[]'::jsonb,
  forecast jsonb not null default '[]'::jsonb,
  variance jsonb not null default '[]'::jsonb,
  cumulative_forecast jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists cash_flow_snapshots_project_period on cash_flow_snapshots(project_id, period_id);
