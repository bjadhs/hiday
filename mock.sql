-- Mock data for Hiday app
-- Generated from schema.sql — matches the uploaded Supabase schema exactly
-- User: c8059141-fc14-4b98-8125-a6f8d1b24a7f

-- ============================================================
-- 1. Auth user (required for all FK constraints)
-- ============================================================
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  'c8059141-fc14-4b98-8125-a6f8d1b24a7f',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@hiday.app',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Demo User"}'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Projects
-- ============================================================
INSERT INTO projects (id, user_id, name, icon, color, goal_duration, goal_type, archived, sort_order) VALUES
  -- Work projects
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Inbox & Quick Projects', '📥', '#6B7280', NULL, 'none', false, 0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Hiday App Development', '💻', '#8B5CF6', 300, 'daily', false, 1),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Meetings & Calls', '🗣️', '#F59E0B', NULL, 'none', false, 2),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'UI/UX Design', '🎨', '#EC4899', 120, 'daily', false, 3),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Planning & Review', '📝', '#6366F1', NULL, 'none', false, 4),

  -- Health projects
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Gym Workout', '💪', '#22C55E', 60, 'daily', false, 5),
  ('00000000-0000-0000-0000-000000000001', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Meditation', '🧘', '#14B8A6', 20, 'daily', false, 6),
  ('00000000-0000-0000-0000-000000000002', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Morning Walk', '🚶', '#84CC16', 30, 'daily', false, 7),

  -- Learning projects
  ('00000000-0000-0000-0000-000000000003', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Reading', '📖', '#3B82F6', 30, 'daily', false, 8),
  ('00000000-0000-0000-0000-000000000004', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Online Courses', '🎓', '#8B5CF6', 60, 'daily', false, 9),

  -- Personal projects
  ('00000000-0000-0000-0000-000000000005', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Cooking & Meals', '🍳', '#F97316', NULL, 'none', false, 10),
  ('00000000-0000-0000-0000-000000000006', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Break & Rest', '☕', '#EF4444', NULL, 'none', false, 11),
  ('00000000-0000-0000-0000-000000000007', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Household Chores', '🏠', '#6B7280', NULL, 'none', false, 12);

-- ============================================================
-- 4. Tags
-- ============================================================
INSERT INTO tags (id, user_id, name, color, type, sort_order) VALUES
  ('c4444444-4444-4444-4444-444444444444', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Deep Work', '#8B5CF6', 'basic', 0),
  ('c5555555-5555-5555-5555-555555555555', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'High Priority', '#EF4444', 'basic', 1),
  ('c3333333-3333-3333-3333-333333333333', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Focus', '#3B82F6', 'basic', 2),
  ('c1111111-1111-1111-1111-111111111111', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'High Energy', '#22C55E', 'basic', 3),
  ('c6666666-6666-6666-6666-666666666666', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Break', '#F59E0B', 'basic', 4),
  ('c2222222-2222-2222-2222-222222222222', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Routine', '#6B7280', 'basic', 5),
  ('c8888888-8888-8888-8888-888888888888', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Creative', '#EC4899', 'basic', 6),
  ('c9999999-9999-9999-9999-999999999999', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Admin', '#6366F1', 'basic', 7),
  ('c7777777-7777-7777-7777-777777777777', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Health', '#14B8A6', 'basic', 8);

-- ============================================================
-- 5. Sessions (today's realistic tracking)
-- NOTE: session_date is DATE NOT NULL (no default) — must be explicit
-- ============================================================
INSERT INTO sessions (id, user_id, project_id, title, started_at, ended_at, duration, note, tags, source, sync_status, client_timestamp, session_date) VALUES
  -- Morning routine
  ('a1111111-1111-1111-1111-111111111111', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', '00000000-0000-0000-0000-000000000002', 'Morning Walk',
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '6 hours') * 1000,
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '6 hours 30 minutes') * 1000,
   1800, 'Fresh air and light exercise', ARRAY['c1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222'], 'manual', 'synced', EXTRACT(EPOCH FROM NOW()) * 1000, CURRENT_DATE),

  ('a2222222-2222-2222-2222-222222222222', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', '00000000-0000-0000-0000-000000000001', 'Morning Meditation',
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '6 hours 45 minutes') * 1000,
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '7 hours 5 minutes') * 1000,
   1200, 'Headspace app - focus session', ARRAY['c3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222'], 'manual', 'synced', EXTRACT(EPOCH FROM NOW()) * 1000, CURRENT_DATE),

  ('a3333333-3333-3333-3333-333333333333', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', '00000000-0000-0000-0000-000000000005', 'Breakfast Prep',
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '7 hours 15 minutes') * 1000,
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '7 hours 45 minutes') * 1000,
   1800, 'Oatmeal and coffee', ARRAY['c2222222-2222-2222-2222-222222222222'], 'manual', 'synced', EXTRACT(EPOCH FROM NOW()) * 1000, CURRENT_DATE),

  -- Deep work session 1
  ('a4444444-4444-4444-4444-444444444444', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Supabase Integration - Auth Setup',
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '8 hours') * 1000,
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '10 hours 30 minutes') * 1000,
   9000, 'Setup auth flow, middleware, and provider', ARRAY['c4444444-4444-4444-4444-444444444444', 'c5555555-5555-5555-5555-555555555555'], 'manual', 'synced', EXTRACT(EPOCH FROM NOW()) * 1000, CURRENT_DATE),

  -- Quick break
  ('a5555555-5555-5555-5555-555555555555', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', '00000000-0000-0000-0000-000000000006', 'Coffee Break',
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '10 hours 30 minutes') * 1000,
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '10 hours 50 minutes') * 1000,
   1200, 'Stretch and coffee refill', ARRAY['c6666666-6666-6666-6666-666666666666'], 'manual', 'synced', EXTRACT(EPOCH FROM NOW()) * 1000, CURRENT_DATE),

  -- Deep work session 2
  ('a6666666-6666-6666-6666-666666666666', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Database Schema & Actions',
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '11 hours') * 1000,
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '13 hours') * 1000,
   7200, 'Created tables, RLS policies, server actions', ARRAY['c4444444-4444-4444-4444-444444444444', 'c5555555-5555-5555-5555-555555555555'], 'manual', 'synced', EXTRACT(EPOCH FROM NOW()) * 1000, CURRENT_DATE),

  -- Lunch
  ('a7777777-7777-7777-7777-777777777777', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', '00000000-0000-0000-0000-000000000005', 'Lunch Break',
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '13 hours') * 1000,
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '13 hours 45 minutes') * 1000,
   2700, 'Rice bowl with vegetables', ARRAY['c6666666-6666-6666-6666-666666666666'], 'manual', 'synced', EXTRACT(EPOCH FROM NOW()) * 1000, CURRENT_DATE),

  -- Gym session
  ('a8888888-8888-8888-8888-888888888888', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Upper Body Workout',
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '14 hours') * 1000,
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '15 hours 15 minutes') * 1000,
   4500, 'Chest and triceps - bench press, dips, tricep extensions', ARRAY['c1111111-1111-1111-1111-111111111111', 'c7777777-7777-7777-7777-777777777777'], 'manual', 'synced', EXTRACT(EPOCH FROM NOW()) * 1000, CURRENT_DATE),

  -- Afternoon work
  ('a9999999-9999-9999-9999-999999999999', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Bruddle Design System Components',
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '16 hours') * 1000,
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '17 hours 30 minutes') * 1000,
   5400, 'UI components with neo-brutalist style - cards, buttons, shadows', ARRAY['c8888888-8888-8888-8888-888888888888'], 'manual', 'synced', EXTRACT(EPOCH FROM NOW()) * 1000, CURRENT_DATE),

  -- Quick projects
  ('b0000000-0000-0000-0000-000000000001', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Email & Messages',
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '17 hours 30 minutes') * 1000,
   EXTRACT(EPOCH FROM DATE_TRUNC('day', NOW()) + INTERVAL '17 hours 50 minutes') * 1000,
   1200, 'Replied to client emails, Slack updates', ARRAY['c9999999-9999-9999-9999-999999999999'], 'manual', 'synced', EXTRACT(EPOCH FROM NOW()) * 1000, CURRENT_DATE);

-- ============================================================
-- 6. Goals
-- ============================================================
INSERT INTO goals (id, user_id, name, target_type, target_value, period, project_id, active) VALUES
  -- Daily work goals
  ('a0111111-1111-1111-1111-111111111111', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Hiday Development - 5 hours daily', 'duration', 300, 'daily', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true),
  ('a0222222-2222-2222-2222-222222222222', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Design Work - 2 hours daily', 'duration', 120, 'daily', 'dddddddd-dddd-dddd-dddd-dddddddddddd', true),

  -- Health goals
  ('a0333333-3333-3333-3333-333333333333', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Gym Session Daily', 'occurrence', 1, 'daily', 'ffffffff-ffff-ffff-ffff-ffffffffffff', true),
  ('a0444444-4444-4444-4444-444444444444', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Meditation - 20 min daily', 'duration', 20, 'daily', '00000000-0000-0000-0000-000000000001', true),
  ('a0555555-5555-5555-5555-555555555555', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Morning Walk - 30 min daily', 'duration', 30, 'daily', '00000000-0000-0000-0000-000000000002', true),

  -- Learning goals
  ('a0666666-6666-6666-6666-666666666666', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Reading - 30 min daily', 'duration', 30, 'daily', '00000000-0000-0000-0000-000000000003', true),
  ('a0777777-7777-7777-7777-777777777777', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Online Course - 1 hour daily', 'duration', 60, 'daily', '00000000-0000-0000-0000-000000000004', true),

  -- Weekly goals
  ('a0888888-8888-8888-8888-888888888888', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Complete Hiday MVP this week', 'occurrence', 5, 'weekly', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', true),
  ('a0999999-9999-9999-9999-999999999999', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'Workout 5 times this week', 'occurrence', 5, 'weekly', 'ffffffff-ffff-ffff-ffff-ffffffffffff', true);

-- ============================================================
-- 7. Streaks
-- ============================================================
INSERT INTO streaks (id, user_id, type, reference_id, current_count, longest_count, last_extended_at) VALUES
  ('b0111111-1111-1111-1111-111111111111', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'daily', NULL, 7, 12, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('b0222222-2222-2222-2222-222222222222', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'goal', 'a0111111-1111-1111-1111-111111111111', 5, 10, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('b0333333-3333-3333-3333-333333333333', 'c8059141-fc14-4b98-8125-a6f8d1b24a7f', 'goal', 'a0333333-3333-3333-3333-333333333333', 12, 15, EXTRACT(EPOCH FROM NOW()) * 1000);
