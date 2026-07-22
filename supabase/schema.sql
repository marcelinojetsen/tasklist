-- ============================================================
-- Tasklist schema — run this in Supabase SQL Editor
-- ============================================================

-- Team members (people you can assign tasks to)
create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now()
);

-- Kanban columns (e.g. To Do, In Progress, Done)
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
  assignee_id  uuid references public.team_members(id) on delete set null,
  position     double precision not null default 1000,
  start_date   date,
  due_date     date,
  done         boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists tasks_column_id_idx on public.tasks(column_id);
create index if not exists tasks_position_idx  on public.tasks(position);

-- ============================================================
-- Row Level Security
-- Personal single-user app with no auth: allow anon full access.
-- (Tighten this later if you add Supabase Auth.)
-- ============================================================
alter table public.team_members enable row level security;
alter table public.columns      enable row level security;
alter table public.tasks        enable row level security;

drop policy if exists "anon all team_members" on public.team_members;
drop policy if exists "anon all columns"      on public.columns;
drop policy if exists "anon all tasks"        on public.tasks;

create policy "anon all team_members" on public.team_members
  for all using (true) with check (true);
create policy "anon all columns" on public.columns
  for all using (true) with check (true);
create policy "anon all tasks" on public.tasks
  for all using (true) with check (true);

-- ============================================================
-- Seed default columns (only if the table is empty)
-- ============================================================
insert into public.columns (name, position)
select * from (values
  ('To Do'::text, 1000::double precision),
  ('In Progress', 2000),
  ('Done', 3000)
) as v(name, position)
where not exists (select 1 from public.columns);
