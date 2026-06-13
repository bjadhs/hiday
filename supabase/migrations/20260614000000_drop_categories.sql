-- Drop the unused `categories` feature.
--
-- The app organizes work via `projects` (sessions.project_id) instead of
-- categories. Nothing in the codebase reads or writes categories, so this
-- removes the vestigial table and its foreign keys.
--
-- Run in the Supabase SQL editor (or `supabase db push` if you adopt the CLI).

begin;

-- Foreign-key columns that point at categories.
alter table public.tasks drop column if exists category_id;
alter table public.goals drop column if exists category_id;

-- The table itself (cascades any remaining dependent objects).
drop table if exists public.categories cascade;

-- Remove category streaks and tighten the CHECK constraint so `type` can no
-- longer be 'category'. (`streaks.type` is a TEXT column with a CHECK, not an
-- enum, so this is non-destructive — we just delete the now-orphaned rows and
-- swap the constraint.) The category rows must be deleted first, otherwise the
-- new constraint would fail to validate against existing data.
delete from public.streaks where type = 'category';

alter table public.streaks drop constraint if exists streaks_type_check;
alter table public.streaks add constraint streaks_type_check
  check (type in ('daily', 'goal'));

commit;
