-- ============================================================
-- Add projects (EWS / EQMS / Other) and restructure columns
-- ============================================================

-- Projects table
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  position    double precision not null default 1000,
  created_at  timestamptz not null default now()
);

alter table public.projects enable row level security;
drop policy if exists "anon all projects" on public.projects;
create policy "anon all projects" on public.projects
  for all using (true) with check (true);

-- Link tasks to a project
alter table public.tasks
  add column if not exists project_id uuid references public.projects(id) on delete set null;
create index if not exists tasks_project_id_idx on public.tasks(project_id);

-- Seed default projects
insert into public.projects (name, position)
select * from (values
  ('EWS'::text, 1000::double precision),
  ('EQMS', 2000),
  ('Other', 3000)
) as v(name, position)
where not exists (select 1 from public.projects);

-- ------------------------------------------------------------
-- Columns: To Do -> On Progress -> Need Testing -> Done
-- ------------------------------------------------------------
update public.columns set name = 'On Progress', position = 2000 where name = 'In Progress';
update public.columns set position = 1000 where name = 'To Do';
update public.columns set position = 4000 where name = 'Done';

insert into public.columns (name, position)
select 'Need Testing', 3000
where not exists (select 1 from public.columns where name = 'Need Testing');
