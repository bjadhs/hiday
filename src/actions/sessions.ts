'use server'

import { createClient } from '@/lib/supabase/server'

// Note: Server actions must import createClient directly from server.ts
import type { Database } from '@/lib/supabase/database.types'
import { startSessionSchema, sessionUpdateSchema, uuid } from '@/lib/validation'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']
type Task = Database['public']['Tables']['tasks']['Row']

// Session with joined task data
type SessionWithTask = Session & { tasks: Task | null }

export async function getSessions(startDate?: number, endDate?: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('sessions')
    .select('*, tasks(*)')
    .eq('user_id', user.id)

  if (startDate && endDate) {
    // A session overlaps with [startDate, endDate] if it started before/at endDate
    // AND (it's still running OR it ended after/at startDate)
    query = query.lte('started_at', endDate)
      .or(`ended_at.gte.${startDate},ended_at.is.null`)
  } else if (startDate) {
    query = query.gte('started_at', startDate)
  } else if (endDate) {
    query = query.lte('started_at', endDate)
  }

  const { data, error } = await query.order('started_at', { ascending: false })

  if (error) throw error
  return data as SessionWithTask[]
}

export async function getActiveSession() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('sessions')
    .select('*, tasks(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
  return data as SessionWithTask | null
}

// Get ALL active sessions for concurrent tracking support
export async function getActiveSessions() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('sessions')
    .select('*, tasks(*)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .is('ended_at', null)
    .order('started_at', { ascending: false })

  if (error) throw error
  return data as SessionWithTask[]
}

export async function startSession(taskId: string, title?: string, startTime?: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const input = startSessionSchema.parse({ taskId, title, startTime })

  const now = Date.now()
  const sessionStartTime = input.startTime || now
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      task_id: input.taskId,
      user_id: user.id,
      title: input.title || null,
      started_at: sessionStartTime,
      session_date: new Date(sessionStartTime).toISOString().split('T')[0], // YYYY-MM-DD
      source: 'manual',
      sync_status: 'synced',
      client_timestamp: now,
      created_at: now,
    })
    .select()
    .single()

  if (error) throw error
  return data as Session
}

export async function stopSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = uuid.parse(sessionId)
  const now = Date.now()

  // First get the session to calculate duration
  const { data: session, error: fetchError } = await supabase
    .from('sessions')
    .select('started_at, ended_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) {
    console.error('Error fetching session:', fetchError)
    throw new Error('Failed to fetch session')
  }

  if (!session) {
    throw new Error('Session not found - it may have been deleted')
  }

  if (session.ended_at) {
    throw new Error('Session is already stopped')
  }

  const duration = Math.floor((now - session.started_at) / 1000)

  const { data, error } = await supabase
    .from('sessions')
    .update({
      ended_at: now,
      duration,
      sync_status: 'synced',
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Failed to stop session - session not found')
  return data as Session
}

export async function updateSession(sessionId: string, updates: SessionUpdate) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const id = uuid.parse(sessionId)
  const validated = sessionUpdateSchema.parse(updates)

  const { data, error } = await supabase
    .from('sessions')
    .update(validated)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) {
    console.error('Error updating session:', error)
    throw new Error('Failed to update session')
  }

  if (!data) {
    throw new Error('Session not found - it may have been deleted')
  }

  return data as Session
}

export async function deleteSession(sessionId: string) {
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
}

export async function getTodaySessions() {
  const now = Date.now()
  const startOfDay = new Date().setHours(0, 0, 0, 0)
  return getSessions(startOfDay, now)
}
