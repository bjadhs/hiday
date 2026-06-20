-- Link active tracking sessions back to their originating Kanban card.
--
-- Kanban cards stay as planned sessions. When a card is started, a new active
-- session row is created with parent_session_id pointing at the Kanban card.
-- This keeps the card visible on the board while the timer lives on Track.

begin;

alter table public.sessions
  add column parent_session_id uuid references public.sessions(id) on delete set null;

create index idx_sessions_parent_session_id
  on public.sessions(parent_session_id);

commit;
