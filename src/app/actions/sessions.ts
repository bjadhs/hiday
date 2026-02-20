'use server'

import { createClient } from '@/lib/supabase/server'

// Note: Server actions must import createClient directly from server.ts
import type { Database } from '@/lib/supabase/database.types'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']
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
    .is('ended_at', null)
    .order('started_at', { ascending: false })

  if (error) throw error
  return data as SessionWithTask[]
}

export async function startSession(taskId: string, title?: string, startTime?: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = Date.now()
  const sessionStartTime = startTime || now
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      task_id: taskId,
      user_id: user.id,
      title: title || null,
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

  const now = Date.now()

  // First get the session to calculate duration
  const { data: session } = await supabase
    .from('sessions')
    .select('started_at')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) throw new Error('Session not found')

  const duration = Math.floor((now - session.started_at) / 1000)

  const { data, error } = await supabase
    .from('sessions')
    .update({
      ended_at: now,
      duration,
      sync_status: 'synced',
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as Session
}

export async function updateSession(sessionId: string, updates: SessionUpdate) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as Session
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function getTodaySessions() {
  const now = Date.now()
  const startOfDay = new Date().setHours(0, 0, 0, 0)
  return getSessions(startOfDay, now)
}
