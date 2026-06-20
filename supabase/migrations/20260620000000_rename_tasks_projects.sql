-- Rename the two domain tables to clarify their purpose. No data is merged,
-- dropped, or migrated -- pure renaming.
--
--   tasks    -> projects   (rich schema: what you track time against)
--   projects -> kprojects  (simple schema: Kanban grouping buckets)
--
-- Ordering matters: the kanban layer must vacate the `projects` /
-- `project_id` names BEFORE the tasks layer claims them, otherwise the
-- renames collide with still-existing objects.

begin;

-- 1. Tables -- free `projects`/`kprojects` first, then promote `tasks`.
alter table if exists public.projects rename to kprojects;
alter table if exists public.tasks rename to projects;

-- 2. sessions FK columns -- free `project_id` first, then promote `task_id`.
alter table public.sessions rename column project_id to kproject_id;
alter table public.sessions rename column task_id to project_id;

-- 3. goals FK column.
alter table public.goals rename column task_id to project_id;

-- 3b. Data column on the promoted projects table.
alter table public.projects rename column task_tags to project_tags;

-- 4. Indexes -- same vacate-then-promote ordering.
alter index if exists idx_projects_user_id rename to idx_kprojects_user_id;
alter index if exists idx_sessions_project_id rename to idx_sessions_kproject_id;

alter index if exists idx_tasks_user_id rename to idx_projects_user_id;
alter index if exists idx_tasks_archived rename to idx_projects_archived;
alter index if exists idx_sessions_task_id rename to idx_sessions_project_id;

commit;
