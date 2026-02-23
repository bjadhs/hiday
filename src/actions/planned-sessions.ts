'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']
type Task = Database['public']['Tables']['tasks']['Row']

// Planned session with joined task data
export type PlannedSessionWithTask = Session & { tasks: Task | null }

/**
 * Get all planned sessions for a specific date
 * Planned sessions have status = 'planned' and are ordered by planned start time
 * Includes both scheduled (with started_at) and unscheduled (started_at is null) sessions
 */
export async function getPlannedSessions(date: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get start and end of the day in milliseconds
  const dateObj = new Date(date)
  const startOfDay = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime()
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1

  // Get scheduled sessions (with started_at time)
  const { data: scheduledData, error: scheduledError } = await supabase
    .from('sessions')
    .select('*, tasks(*)')
    .eq('user_id', user.id)
    .eq('status', 'planned')
    .eq('session_date', date)
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
    .eq('session_date', date)
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

  const now = Date.now()

  const sessionData: SessionInsert = {
    user_id: user.id,
    task_id: taskId,
    started_at: plannedStartTime ?? null, // Null for unscheduled, timestamp for scheduled
    ended_at: plannedStartTime ? plannedStartTime + plannedDuration * 1000 : null, // Null for unscheduled
    duration: plannedDuration,
    title: title || null,
    note: note || null,
    status: 'planned',
    session_date: plannedDate,
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
  updates: {
    plannedStartTime?: number | null;
    plannedDuration?: number;
    title?: string;
    note?: string;
    status?: 'planned' | 'active' | 'completed' | 'cancelled';
  }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const updateData: SessionUpdate = {}

  if (updates.plannedStartTime !== undefined) {
    updateData.started_at = updates.plannedStartTime

    // If unscheduling (setting to null), also clear ended_at
    if (updates.plannedStartTime === null) {
      updateData.ended_at = null
    }
  }

  if (updates.plannedDuration !== undefined) {
    updateData.duration = updates.plannedDuration
    // Recalculate ended_at based on new duration (only if scheduled)
    const startTime = updates.plannedStartTime !== undefined
      ? updates.plannedStartTime
      : (await getPlannedSessionById(sessionId))?.started_at
    if (startTime) {
      updateData.ended_at = startTime + updates.plannedDuration * 1000
    }
  }

  if (updates.title !== undefined) {
    updateData.title = updates.title
  }

  if (updates.note !== undefined) {
    updateData.note = updates.note
  }

  if (updates.status !== undefined) {
    updateData.status = updates.status
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select('*, tasks(*)')
    .single()

  if (error) throw error
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
    .single()

  if (error) return null
  return data as Session
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

  const { data, error } = await supabase
    .from('sessions')
    .update({
      status: 'active',
      started_at: now,
      ended_at: null,
      sync_status: 'pending',
      client_timestamp: now,
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .eq('status', 'planned') // Only update if it's still planned
    .select('*, tasks(*)')
    .single()

  if (error) throw error
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

  const now = Date.now()
  const startTime = actualStartTime || now
  const endTime = actualEndTime || now
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
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select('*, tasks(*)')
    .single()

  if (error) throw error
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
    .select('*, tasks(*)')
    .single()

  if (error) throw error
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

  const startObj = new Date(startDate)
  const endObj = new Date(endDate)
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
