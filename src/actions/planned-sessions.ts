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
  dateString,
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
type Task = Database['public']['Tables']['tasks']['Row']
type Project = Database['public']['Tables']['projects']['Row']

// Planned session with joined task and project data
export type PlannedSessionWithTask = Session & { tasks: Task | null; projects: Project | null }

/**
 * Get all planned sessions for a specific date
 * Planned sessions have status = 'planned' and are ordered by planned start time
 * Includes both scheduled (with started_at) and unscheduled (started_at is null) sessions
 */
export async function getPlannedSessions(date: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const validDate = dateString.parse(date)

  // Get start and end of the day in milliseconds
  const dateObj = new Date(validDate)
  const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime()
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1

  // Get scheduled sessions (with started_at time)
  const { data: scheduledData, error: scheduledError } = await supabase
    .from('sessions')
    .select('*, tasks(*)')
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .eq('session_date', validDate)
    .not('started_at', 'is', null)
    .gte('started_at', startOfDay)
    .lt('started_at', endOfDay)
    .order('started_at', { ascending: true })

  if (scheduledError) throw scheduledError

  // Get unscheduled sessions (started_at is null)
  const { data: unscheduledData, error: unscheduledError } = await supabase
    .from('sessions')
    .select('*, tasks(*)')
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .eq('session_date', validDate)
    .is('started_at', null)
    .order('created_at', { ascending: true })

  if (unscheduledError) throw unscheduledError

  // Combine both lists
  return [...(scheduledData || []), ...(unscheduledData || [])] as PlannedSessionWithTask[]
}

/**
 * Create a new planned session
 * A planned session has status = 'planned' and uses started_at as the planned start time
 * If plannedStartTime is null, creates an unscheduled session (no specific time)
 */
export async function createPlannedSession(
  taskId: string,
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
    taskId,
    plannedDate,
    plannedStartTime,
    plannedDuration,
    title,
    note,
  })

  const now = Date.now()

  const sessionData: SessionInsert = {
    user_id: user.id,
    task_id: input.taskId,
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
    .select('*, tasks(*)')
    .single()

  if (error) throw error
  return data as PlannedSessionWithTask
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
    .select('*, tasks(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Planned session not found')
  return data as PlannedSessionWithTask
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

  const id = uuid.parse(sessionId)

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)
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

  const id = uuid.parse(sessionId)
  const now = Date.now()

  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: 'active',
      started_at: now,
      ended_at: null,
      sync_status: 'pending',
      client_timestamp: now,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'planned') // Only update if it's still planned
    .select('*, tasks(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Planned session not found or already started')
  return data as PlannedSessionWithTask
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
    .select('*, tasks(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Planned session not found')
  return data as PlannedSessionWithTask
}

/**
 * Unschedule a planned session - removes it from the timeline but keeps it as an unscheduled todo
 * Sets started_at and ended_at to null
 */
export async function unschedulePlannedSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = uuid.parse(sessionId)

  const { data, error } = await supabase
    .from('sessions')
    .update({
      started_at: null,
      ended_at: null,
      sync_status: 'pending',
      client_timestamp: Date.now(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .select('*, tasks(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Planned session not found')
  return data as PlannedSessionWithTask
}

/**
 * Get all planned sessions for a date range
 * Useful for weekly view
 */
export async function getPlannedSessionsRange(startDate: string, endDate: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const validStart = dateString.parse(startDate)
  const validEnd = dateString.parse(endDate)

  const startObj = new Date(validStart)
  const endObj = new Date(validEnd)
  const startTime = new Date(startObj.getFullYear(), startObj.getMonth(), startObj.getDate()).getTime()
  const endTime = new Date(endObj.getFullYear(), endObj.getMonth(), endObj.getDate()).getTime() + 24 * 60 * 60 * 1000 - 1

  const { data, error } = await supabase
    .from('sessions')
    .select('*, tasks(*)')
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .gte('started_at', startTime)
    .lte('started_at', endTime)
    .order('started_at', { ascending: true })

  if (error) throw error
  return data as PlannedSessionWithTask[]
}

/**
 * Get planned sessions for the Kanban board
 * Active (started) sessions are intentionally excluded so tracking stays on the Track page.
 * Optionally filtered by project_id. Passing null returns only unassigned sessions (the DEFAULT bucket).
 */
export async function getKanbanSessions(projectId?: string | null) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('sessions')
    .select('*, tasks(*), projects(*)')
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .not('kanban_status', 'eq', 'inbox')
    .order('created_at', { ascending: true })

  if (projectId === null) {
    query = query.is('project_id', null)
  } else if (projectId !== undefined) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) throw error
  return data as PlannedSessionWithTask[]
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
    .select('*, tasks(*), projects(*)')
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .eq('kanban_status', 'inbox')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as PlannedSessionWithTask[]
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
    .select('*, tasks(*), projects(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Session not found')
  return data as PlannedSessionWithTask
}

/**
 * Create a planned session directly from the Kanban board
 * Unscheduled (started_at is null) so it does not appear on the timeline
 */
export async function createKanbanTodo({
  taskId,
  projectId,
  kanbanStatus,
  duration,
  title,
  note,
}: CreateKanbanTodoInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const input = createKanbanTodoSchema.parse({ taskId, projectId, kanbanStatus, duration, title, note })

  const now = Date.now()
  const sessionDate = new Date().toISOString().split('T')[0]

  const sessionData: SessionInsert = {
    user_id: user.id,
    task_id: input.taskId ?? null,
    project_id: input.projectId ?? null,
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
    .select('*, tasks(*), projects(*)')
    .single()

  if (error) throw error
  return data as PlannedSessionWithTask
}

/**
 * Create a quick inbox todo from the project dropdown
 * Task is optional; must be assigned before moving to a Kanban column
 */
export async function createInboxTodo({
  projectId,
  taskId,
  title,
}: CreateInboxTodoInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const input = createInboxTodoSchema.parse({ projectId, taskId, title })

  const now = Date.now()
  const sessionDate = new Date().toISOString().split('T')[0]

  const sessionData: SessionInsert = {
    user_id: user.id,
    task_id: input.taskId ?? null,
    project_id: input.projectId,
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
    .select('*, tasks(*), projects(*)')
    .single()

  if (error) throw error
  return data as PlannedSessionWithTask
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

  if (v.taskId !== undefined) {
    updateData.task_id = v.taskId || null
  }
  if (v.projectId !== undefined) {
    updateData.project_id = v.projectId
  }
  if (v.kanbanStatus !== undefined) {
    updateData.kanban_status = v.kanbanStatus
  }
  if (v.duration !== undefined) {
    updateData.duration = v.duration
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
    .select('*, tasks(*), projects(*)')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Session not found')
  return data as PlannedSessionWithTask
}
