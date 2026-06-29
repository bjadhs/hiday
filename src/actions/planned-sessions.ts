'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import {
  createPlannedSessionSchema,
  updatePlannedSessionSchema,
  completePlannedSessionSchema,
  createKanbanTodoSchema,
  createInboxTodoSchema,
  updateKanbanTodoSchema,
  updateKanbanStatusSchema,
  uuid,
} from '@/lib/validation'
import type {
  UpdatePlannedSessionInput,
  CreateKanbanTodoInput,
  CreateInboxTodoInput,
  UpdateKanbanTodoInput,
} from '@/lib/validation'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']
type Project = Database['public']['Tables']['projects']['Row']
type KProject = Database['public']['Tables']['kprojects']['Row']

// Planned session with joined project and kproject data
export type PlannedSessionWithProject = Session & { projects: Project | null; kprojects: KProject | null }

// Kanban card with computed active-session state
export type KanbanSessionWithActiveState = PlannedSessionWithProject & {
  hasActiveSession: boolean
  activeSessionIds: string[]
  activeSessionStartedAt: number | null
}

/**
 * Get all planned sessions for a specific date
 * Planned sessions have status = 'planned' and are ordered by planned start time
 * Includes both scheduled (with started_at) and unscheduled (started_at is null) sessions
 */
export async function getPlannedSessions(date: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // NOTE: We intentionally do NOT filter by a started_at millisecond range
  // here. `session_date` already pins the calendar day (it is set at creation
  // to the same UTC date string the client uses). Deriving a started_at window
  // from the date string would re-interpret it in the server's local timezone
  // and, in UTC-behind zones, exclude sessions whose started_at was stored
  // from the client's local-midnight reference — making dropped/scheduled
  // sessions vanish from both the scheduled and unscheduled lists.

  // Get scheduled sessions (with started_at time) for this calendar date
  const { data: scheduledData, error: scheduledError } = await supabase
    .from('sessions')
    .select('*, projects(*)')
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .eq('session_date', date)
    .not('started_at', 'is', null)
    .order('started_at', { ascending: true })

  if (scheduledError) throw scheduledError

  // Get unscheduled sessions (started_at is null)
  const { data: unscheduledData, error: unscheduledError } = await supabase
    .from('sessions')
    .select('*, projects(*)')
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .eq('session_date', date)
    .is('started_at', null)
    .order('created_at', { ascending: true })

  if (unscheduledError) throw unscheduledError

  // Combine both lists
  return [...(scheduledData || []), ...(unscheduledData || [])] as PlannedSessionWithProject[]
}

/**
 * Get the "Plan" blocks for the /plan page on a given date: scheduled
 * sessions that originated from the planned-sessions flow, whether still
 * planned or already marked done (status IN planned/completed). Currently
 * *running* todos (status='active') are intentionally excluded here — the
 * /plan page renders those as read-only timer blocks instead, matching how
 * /todos already treats active sessions as a separate "running" overlay
 * rather than part of the editable planned list.
 */
export async function getPlanDaySessions(date: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('sessions')
    .select('*, projects(*)')
    .eq('user_id', user.id)
    .eq('session_date', date)
    .in('status', ['planned', 'completed'])
    .not('started_at', 'is', null)
    .order('started_at', { ascending: true })

  if (error) throw error
  return data as PlannedSessionWithProject[]
}

/**
 * Create a new planned session
 * A planned session has status = 'planned' and uses started_at as the planned start time
 * If plannedStartTime is null, creates an unscheduled session (no specific time)
 */
export async function createPlannedSession(
  projectId: string,
  plannedDate: string,
  plannedStartTime: number | null,
  plannedDuration: number,
  title?: string,
  note?: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const input = createPlannedSessionSchema.parse({
    projectId,
    plannedDate,
    plannedStartTime,
    plannedDuration,
    title,
    note,
  })

  const now = Date.now()

  const sessionData: SessionInsert = {
    user_id: user.id,
    project_id: input.projectId,
    started_at: input.plannedStartTime ?? null, // Null for unscheduled, timestamp for scheduled
    ended_at: input.plannedStartTime ? input.plannedStartTime + input.plannedDuration * 1000 : null, // Null for unscheduled
    duration: input.plannedDuration,
    title: input.title || null,
    note: input.note || null,
    status: 'planned',
    session_date: input.plannedDate,
    source: 'manual',
    sync_status: 'pending',
    client_timestamp: now,
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select('*, projects(*)')
    .single()

  if (error) throw error
  return data as PlannedSessionWithProject
}

/**
 * Update a planned session
 * Can update time, duration, title, note, or status
 * Pass plannedStartTime: null to unschedule the session (remove from timeline)
 */
export async function updatePlannedSession(
  sessionId: string,
  updates: UpdatePlannedSessionInput
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = uuid.parse(sessionId)
  const v = updatePlannedSessionSchema.parse(updates)

  const updateData: SessionUpdate = {}

  if (v.projectId !== undefined) {
    updateData.project_id = v.projectId
  }

  if (v.plannedStartTime !== undefined) {
    updateData.started_at = v.plannedStartTime

    // If unscheduling (setting to null), also clear ended_at
    if (v.plannedStartTime === null) {
      updateData.ended_at = null
    }
  }

  if (v.plannedDuration !== undefined) {
    updateData.duration = v.plannedDuration
    // Recalculate ended_at based on new duration (only if scheduled)
    const startTime = v.plannedStartTime !== undefined
      ? v.plannedStartTime
      : (await getPlannedSessionById(id))?.started_at
    if (startTime) {
      updateData.ended_at = startTime + v.plannedDuration * 1000
    }
  }

  if (v.title !== undefined) {
    updateData.title = v.title
  }

  if (v.note !== undefined) {
    updateData.note = v.note
  }

  if (v.status !== undefined) {
    updateData.status = v.status
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, projects(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Planned session not found')
  return data as PlannedSessionWithProject
}

/**
 * Helper function to get a single planned session by ID
 */
async function getPlannedSessionById(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return null
  return data as Session | null
}

/**
 * Delete a planned session
 */
export async function deletePlannedSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) throw error
  return { success: true }
}

/**
 * Start a planned session - converts it to an active session
 * Updates status to 'active' and sets started_at to current time
 */
export async function startPlannedSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = Date.now()

  // Look at the current start/end first so we can preserve the ORIGINAL start
  // time when resuming. Resuming a paused todo (it has a recorded end time) — or
  // one already scheduled at/in the past — keeps its initial start. Only a todo
  // with no end time (fresh / never run) or one scheduled in the future begins
  // fresh from now.
  const { data: current, error: fetchError } = await supabase
    .from('sessions')
    .select('started_at, ended_at')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!current) throw new Error('Planned session not found or already started')

  const keepInitialStart =
    current.ended_at !== null &&
    current.started_at !== null &&
    current.started_at <= now
  const startedAt = keepInitialStart ? current.started_at! : now

  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: 'active',
      started_at: startedAt,
      ended_at: null,
      sync_status: 'pending',
      client_timestamp: now,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .eq('status', 'planned') // Only update if it's still planned
    .select('*, projects(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Planned session not found or already started')
  return data as PlannedSessionWithProject
}

/**
 * Start a Kanban todo while keeping the card on the board.
 * The original planned session row remains as the Kanban card (status stays 'planned',
 * kanban_status moves to 'doing'), and a new active session row is created for
 * actual time tracking. The active session links back via parent_session_id.
 */
export async function startKanbanSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = Date.now()
  const today = new Date().toISOString().split('T')[0]

  // Fetch the Kanban card and lock it to planned status
  const { data: kanbanCard, error: fetchError } = await supabase
    .from('sessions')
    .select('*, projects(*)')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!kanbanCard) throw new Error('Kanban session not found or already started')
  if (!kanbanCard.project_id) throw new Error('Kanban card must have an assigned project')

  // Move the card to Doing so started projects always live there
  const { data: updatedCard, error: updateError } = await supabase
    .from('sessions')
    .update({
      kanban_status: 'doing',
      sync_status: 'pending',
      client_timestamp: now,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .select('*, projects(*), kprojects(*)')
    .maybeSingle()

  if (updateError) throw updateError
  if (!updatedCard) throw new Error('Failed to update Kanban card')

  // A Kanban card has at most ONE tracking session, reused across pause/resume
  // cycles. Reusing it (rather than inserting a new one on every start) keeps
  // start → pause → start from spawning duplicate sessions; the single session
  // spans the card's first start to its final stop.
  const { data: existing, error: existingError } = await supabase
    .from('sessions')
    .select('*, projects(*)')
    .eq('user_id', user.id)
    .eq('parent_session_id', sessionId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingError) throw existingError

  if (existing) {
    // Already running: idempotent, nothing to do.
    if (!existing.ended_at) {
      return {
        kanbanCard: updatedCard as PlannedSessionWithProject,
        activeSession: existing as PlannedSessionWithProject,
      }
    }

    // Paused: resume the same session, keeping its original start time.
    const { data: resumed, error: resumeError } = await supabase
      .from('sessions')
      .update({
        status: 'active',
        ended_at: null,
        duration: null,
        sync_status: 'synced',
        client_timestamp: now,
      })
      .eq('id', existing.id)
      .eq('user_id', user.id)
      .select('*, projects(*)')
      .single()

    if (resumeError) throw resumeError

    return {
      kanbanCard: updatedCard as PlannedSessionWithProject,
      activeSession: resumed as PlannedSessionWithProject,
    }
  }

  // First start: create the tracking session linked to the Kanban card.
  const { data: activeSession, error: insertError } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      project_id: kanbanCard.project_id,
      kproject_id: kanbanCard.kproject_id,
      title: kanbanCard.title,
      note: kanbanCard.note,
      tags: kanbanCard.tags,
      started_at: now,
      ended_at: null,
      duration: null,
      status: 'active',
      session_date: today,
      source: 'manual',
      sync_status: 'synced',
      client_timestamp: now,
      created_at: now,
      parent_session_id: sessionId,
    })
    .select('*, projects(*)')
    .single()

  if (insertError) throw insertError

  return {
    kanbanCard: updatedCard as PlannedSessionWithProject,
    activeSession: activeSession as PlannedSessionWithProject,
  }
}

/**
 * Pause a running session - freezes elapsed time into duration and returns the
 * row to the planned list so it can be resumed via startPlannedSession.
 * Sets ended_at to the pause moment and recomputes duration from started_at.
 * NOTE: resuming restarts elapsed from 0 (no accumulation yet — see FIX_TODO).
 */
export async function pausePlannedSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = uuid.parse(sessionId)
  const now = Date.now()

  // Need the actual start time to compute how long it ran.
  const { data: current, error: fetchError } = await supabase
    .from('sessions')
    .select('started_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!current || current.started_at === null) {
    throw new Error('Running session not found')
  }

  const duration = Math.max(1, Math.floor((now - current.started_at) / 1000))

  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: 'planned',
      ended_at: now,
      duration,
      sync_status: 'pending',
      client_timestamp: now,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .select('*, projects(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Running session not found')
  return data as PlannedSessionWithProject
}

/**
 * Convert a planned session to a completed session
 * This is used when manually marking a planned session as done without tracking
 */
export async function completePlannedSession(
  sessionId: string,
  actualStartTime?: number,
  actualEndTime?: number
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = uuid.parse(sessionId)
  const { actualStartTime: start, actualEndTime: end } = completePlannedSessionSchema.parse({
    actualStartTime,
    actualEndTime,
  })

  const now = Date.now()
  const startTime = start || now
  const endTime = end || now
  const duration = Math.floor((endTime - startTime) / 1000)

  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      started_at: startTime,
      ended_at: endTime,
      duration: duration > 0 ? duration : 0,
      sync_status: 'pending',
      client_timestamp: now,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, projects(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Planned session not found')
  return data as PlannedSessionWithProject
}

/**
 * Unschedule a planned session - removes it from the timeline but keeps it as an unscheduled todo
 * Sets started_at and ended_at to null
 */
export async function unschedulePlannedSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('sessions')
    .update({
      started_at: null,
      ended_at: null,
      sync_status: 'pending',
      client_timestamp: Date.now(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .select('*, projects(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Planned session not found')
  return data as PlannedSessionWithProject
}

/**
 * Get all planned sessions for a date range
 * Useful for weekly view
 */
export async function getPlannedSessionsRange(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const startObj = new Date(startDate)
  const endObj = new Date(endDate)
  const startTime = new Date(startObj.getFullYear(), startObj.getMonth(), startObj.getDate()).getTime()
  const endTime = new Date(endObj.getFullYear(), endObj.getMonth(), endObj.getDate()).getTime() + 24 * 60 * 60 * 1000 - 1

  const { data, error } = await supabase
    .from('sessions')
    .select('*, projects(*)')
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .gte('started_at', startTime)
    .lte('started_at', endTime)
    .order('started_at', { ascending: true })

  if (error) throw error
  return data as PlannedSessionWithProject[]
}

/**
 * Get planned sessions for the Kanban board.
 * Active tracking sessions are intentionally excluded from the board itself;
 * instead, each Kanban card reports whether it currently has any linked active
 * sessions via hasActiveSession / activeSessionIds.
 * Optionally filtered by kproject_id. Passing null returns only unassigned sessions (the DEFAULT bucket).
 */
export async function getKanbanSessions(kprojectId?: string | null) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('sessions')
    .select('*, projects(*), kprojects(*)')
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .not('kanban_status', 'eq', 'inbox')
    .order('created_at', { ascending: true })

  if (kprojectId === null) {
    query = query.is('kproject_id', null)
  } else if (kprojectId !== undefined) {
    query = query.eq('kproject_id', kprojectId)
  }

  const { data: cards, error: cardsError } = await query

  if (cardsError) throw cardsError
  if (!cards || cards.length === 0) return [] as KanbanSessionWithActiveState[]

  // Find any active sessions linked to these Kanban cards.
  const cardIds = cards.map((card) => card.id)
  const { data: activeSessions, error: activeError } = await supabase
    .from('sessions')
    .select('id, parent_session_id, started_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .is('ended_at', null)
    .in('parent_session_id', cardIds)

  if (activeError) throw activeError

  const activeByParent = new Map<string, { ids: string[]; startedAt: number | null }>()
  for (const session of activeSessions || []) {
    if (!session.parent_session_id) continue
    const existing = activeByParent.get(session.parent_session_id) || { ids: [], startedAt: null }
    existing.ids.push(session.id)
    if (session.started_at !== null) {
      existing.startedAt = existing.startedAt === null
        ? session.started_at
        : Math.max(existing.startedAt, session.started_at)
    }
    activeByParent.set(session.parent_session_id, existing)
  }

  return cards.map((card) => {
    const active = activeByParent.get(card.id) || { ids: [], startedAt: null }
    return {
      ...card,
      hasActiveSession: active.ids.length > 0,
      activeSessionIds: active.ids,
      activeSessionStartedAt: active.startedAt,
    } as KanbanSessionWithActiveState
  })
}

/**
 * Get all inbox todos for the current user
 * Inbox items are not shown on the Kanban board columns
 */
export async function getInboxSessions() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('sessions')
    .select('*, projects(*), kprojects(*)')
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .eq('kanban_status', 'inbox')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as PlannedSessionWithProject[]
}
export async function updateKanbanStatus(
  sessionId: string,
  kanbanStatus: 'next' | 'doing' | 'done' | 'revise'
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = uuid.parse(sessionId)
  const status = updateKanbanStatusSchema.parse(kanbanStatus)

  const now = Date.now()

  const { data, error } = await supabase
    .from('sessions')
    .update({
      kanban_status: status,
      sync_status: 'pending',
      client_timestamp: now,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, projects(*), kprojects(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Session not found')
  return data as PlannedSessionWithProject
}

/**
 * Create a planned session directly from the Kanban board
 * Unscheduled (started_at is null) so it does not appear on the timeline
 */
export async function createKanbanTodo({
  projectId,
  kprojectId,
  kanbanStatus,
  duration,
  title,
  note,
}: CreateKanbanTodoInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const input = createKanbanTodoSchema.parse({ projectId, kprojectId, kanbanStatus, duration, title, note })

  const now = Date.now()
  const sessionDate = new Date().toISOString().split('T')[0]

  const sessionData: SessionInsert = {
    user_id: user.id,
    project_id: input.projectId ?? null,
    kproject_id: input.kprojectId ?? null,
    kanban_status: input.kanbanStatus,
    started_at: null,
    ended_at: null,
    duration: input.duration,
    title: input.title || null,
    note: input.note || null,
    status: 'planned',
    session_date: sessionDate,
    source: 'manual',
    sync_status: 'pending',
    client_timestamp: now,
    created_at: now,
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select('*, projects(*), kprojects(*)')
    .single()

  if (error) throw error
  return data as PlannedSessionWithProject
}

/**
 * Create a quick inbox todo from the kproject dropdown
 * Project is optional; must be assigned before moving to a Kanban column
 */
export async function createInboxTodo({
  kprojectId,
  projectId,
  title,
}: CreateInboxTodoInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const input = createInboxTodoSchema.parse({ kprojectId, projectId, title })

  const now = Date.now()
  const sessionDate = new Date().toISOString().split('T')[0]

  const sessionData: SessionInsert = {
    user_id: user.id,
    project_id: input.projectId ?? null,
    kproject_id: input.kprojectId,
    kanban_status: 'inbox',
    started_at: null,
    ended_at: null,
    duration: 0,
    title: input.title || null,
    note: null,
    status: 'planned',
    session_date: sessionDate,
    source: 'manual',
    sync_status: 'pending',
    client_timestamp: now,
    created_at: now,
  }

  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select('*, projects(*), kprojects(*)')
    .single()

  if (error) throw error
  return data as PlannedSessionWithProject
}

/**
 * Full update for a Kanban todo (used by the edit dialog and inline title edit)
 */
export async function updateKanbanTodo(
  sessionId: string,
  updates: UpdateKanbanTodoInput
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = uuid.parse(sessionId)
  const v = updateKanbanTodoSchema.parse(updates)

  const updateData: SessionUpdate = {
    sync_status: 'pending',
    client_timestamp: Date.now(),
  }

  if (v.projectId !== undefined) {
    updateData.project_id = v.projectId || null
  }
  if (v.kprojectId !== undefined) {
    updateData.kproject_id = v.kprojectId
  }
  if (v.kanbanStatus !== undefined) {
    updateData.kanban_status = v.kanbanStatus
  }
  if (v.duration !== undefined) {
    updateData.duration = v.duration
  }
  if (v.plannedStartTime !== undefined) {
    updateData.started_at = v.plannedStartTime
    // Unscheduling: clear ended_at as well
    if (v.plannedStartTime === null) {
      updateData.ended_at = null
    }
  }
  if (v.plannedEndTime !== undefined) {
    updateData.ended_at = v.plannedEndTime
  }
  // If both start and end are set (or one is set and the other exists in DB),
  // derive duration from the range so the three fields stay consistent.
  const needsStartTime = v.plannedStartTime !== undefined;
  const needsEndTime = v.plannedEndTime !== undefined;
  if (needsStartTime || needsEndTime) {
    const existing = await getPlannedSessionById(id)
    const startTime = v.plannedStartTime !== undefined ? v.plannedStartTime : existing?.started_at
    const endTime = v.plannedEndTime !== undefined ? v.plannedEndTime : existing?.ended_at
    if (startTime !== null && startTime !== undefined && endTime !== null && endTime !== undefined) {
      updateData.duration = Math.max(0, Math.floor((endTime - startTime) / 1000))
    }
  }

  if (v.title !== undefined) {
    updateData.title = v.title
  }
  if (v.note !== undefined) {
    updateData.note = v.note
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*, projects(*), kprojects(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Session not found')
  return data as PlannedSessionWithProject
}
