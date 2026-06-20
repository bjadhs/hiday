-- Cosmetic follow-up to 20260620000000_rename_tasks_projects.sql.
--
-- Renaming a table/column in Postgres does NOT rename its constraints,
-- backing indexes, or RLS policies, so the deployed DB still carries the old
-- `tasks_*` / `projects_*` names. This migration realigns those names with the
-- new table/column names. No data or behaviour changes.
--
-- Every rename is guarded so the migration is idempotent (safe to re-run).
-- Ordering vacates the kproject-layer names before the project-layer claims
-- them (PK backing-index names are unique per schema; the sessions FK reuses
-- the `sessions_project_id_fkey` name).

begin;

-- Helper-free idempotent renames via DO blocks.

-- 1. kprojects: vacate the `projects_*` names first.
do $$ begin
  if exists (select 1 from pg_constraint where conname = 'projects_pkey'
             and conrelid = 'public.kprojects'::regclass) then
    alter table public.kprojects rename constraint projects_pkey to kprojects_pkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'projects_user_id_fkey'
             and conrelid = 'public.kprojects'::regclass) then
    alter table public.kprojects rename constraint projects_user_id_fkey to kprojects_user_id_fkey;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'kprojects'
             and policyname = 'Users can only access their own projects') then
    alter policy "Users can only access their own projects" on public.kprojects
      rename to "Users can only access their own kprojects";
  end if;
end $$;

-- 2. sessions: vacate the kanban FK name before the tasks FK claims it.
do $$ begin
  if exists (select 1 from pg_constraint where conname = 'sessions_project_id_fkey'
             and conrelid = 'public.sessions'::regclass) then
    alter table public.sessions rename constraint sessions_project_id_fkey to sessions_kproject_id_fkey;
  end if;
end $$;

-- 3. projects (was tasks): promote the `tasks_*` names to `projects_*`.
do $$ begin
  if exists (select 1 from pg_constraint where conname = 'tasks_pkey'
             and conrelid = 'public.projects'::regclass) then
    alter table public.projects rename constraint tasks_pkey to projects_pkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'tasks_user_id_fkey'
             and conrelid = 'public.projects'::regclass) then
    alter table public.projects rename constraint tasks_user_id_fkey to projects_user_id_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'tasks_goal_type_check'
             and conrelid = 'public.projects'::regclass) then
    alter table public.projects rename constraint tasks_goal_type_check to projects_goal_type_check;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects'
             and policyname = 'Users can CRUD their own tasks') then
    alter policy "Users can CRUD their own tasks" on public.projects
      rename to "Users can CRUD their own projects";
  end if;
end $$;

-- 4. sessions / goals: promote the remaining `*_task_id_fkey` names.
do $$ begin
  if exists (select 1 from pg_constraint where conname = 'sessions_task_id_fkey'
             and conrelid = 'public.sessions'::regclass) then
    alter table public.sessions rename constraint sessions_task_id_fkey to sessions_project_id_fkey;
  end if;
  if exists (select 1 from pg_constraint where conname = 'goals_task_id_fkey'
             and conrelid = 'public.goals'::regclass) then
    alter table public.goals rename constraint goals_task_id_fkey to goals_project_id_fkey;
  end if;
end $$;

commit;
