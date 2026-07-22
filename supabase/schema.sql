-- ============================================================
-- Tasklist FULL schema — convenience snapshot for a fresh project.
-- The source of truth is supabase/migrations/*. This file is the
-- same end state, handy to paste into the SQL Editor in one shot.
-- ============================================================

-- Projects (EWS / EQMS / Other) — shown as tabs in the app
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  position    double precision not null default 1000,
  created_at  timestamptz not null default now()
);

-- Team members (people you can assign tasks to)
create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now()
);

-- Kanban columns
create table if not exists public.columns (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  position    double precision not null default 1000,
  created_at  timestamptz not null default now()
);

-- Tasks
create table if not exists public.tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  column_id    uuid references public.columns(id) on delete cascade,
  project_id   uuid references public.projects(id) on delete set null,
  assignee_id  uuid references public.team_members(id) on delete set null,
  position     double precision not null default 1000,
  start_date   date,
  due_date     date,
  done         boolean not null default false,
  priority     text,
  labels       text[] not null default '{}',
  created_at   timestamptz not null default now()
);

create index if not exists tasks_column_id_idx  on public.tasks(column_id);
create index if not exists tasks_project_id_idx on public.tasks(project_id);
create index if not exists tasks_position_idx   on public.tasks(position);
create index if not exists tasks_labels_idx     on public.tasks using gin (labels);

-- ============================================================
-- Row Level Security — personal app, allow anon full access.
-- ============================================================
alter table public.projects     enable row level security;
alter table public.team_members enable row level security;
alter table public.columns      enable row level security;
alter table public.tasks        enable row level security;

drop policy if exists "anon all projects"     on public.projects;
drop policy if exists "anon all team_members" on public.team_members;
drop policy if exists "anon all columns"      on public.columns;
drop policy if exists "anon all tasks"        on public.tasks;

create policy "anon all projects" on public.projects
  for all using (true) with check (true);
create policy "anon all team_members" on public.team_members
  for all using (true) with check (true);
create policy "anon all columns" on public.columns
  for all using (true) with check (true);
create policy "anon all tasks" on public.tasks
  for all using (true) with check (true);

-- ============================================================
-- Seed default projects and columns (only if empty)
-- ============================================================
insert into public.projects (name, position)
select * from (values
  ('EWS'::text, 1000::double precision),
  ('EQMS', 2000),
  ('Other', 3000)
) as v(name, position)
where not exists (select 1 from public.projects);

insert into public.columns (name, position)
select * from (values
  ('To Do'::text, 1000::double precision),
  ('On Progress', 2000),
  ('Need Testing', 3000),
  ('Done', 4000)
) as v(name, position)
where not exists (select 1 from public.columns);
