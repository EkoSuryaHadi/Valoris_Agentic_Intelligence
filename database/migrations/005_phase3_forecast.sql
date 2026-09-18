-- Phase 3 forecast persistence. Apply after the baseline and transaction schema.
create table if not exists forecasts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  period_id uuid not null references reporting_periods(id),
  actual_cost numeric(20,2) not null check(actual_cost>=0),
  etc numeric(20,2) not null check(etc>=0),
  eac numeric(20,2) not null check(eac>=0),
  vac numeric(20,2) not null,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  unique(project_id,period_id)
);
create index if not exists forecasts_project_period on forecasts(project_id,period_id);
