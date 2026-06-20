'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type Session = Database['public']['Tables']['sessions']['Row']
type Project = Database['public']['Tables']['projects']['Row']
type SessionWithProject = Session & { projects: Project | null }

/**
 * Get sessions with optional date filtering
 * Note: This function uses standard server action caching via Next.js 16
 *
 * @param startDate - Optional start date timestamp
 * @param endDate - Optional end date timestamp
 * @returns Object containing sessions array
 */
export async function getCachedSessions(startDate?: number, endDate?: number) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('sessions')
    .select('*, projects(*)')
    .eq('user_id', user.id)

  if (startDate && endDate) {
    query = query.lte('started_at', endDate)
      .or(`ended_at.gte.${startDate},ended_at.is.null`)
  } else if (startDate) {
    query = query.gte('started_at', startDate)
  } else if (endDate) {
    query = query.lte('started_at', endDate)
  }

  const { data, error } = await query.order('started_at', { ascending: false })

  if (error) throw error

  return {
    sessions: data as SessionWithProject[],
    userId: user.id,
    dateRange: { startDate, endDate }
  }
}

/**
 * Get today's sessions for the dashboard
 * Optimized for the track page
 *
 * @returns Object containing today's sessions
 */
export async function getCachedTodaySessions() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get start of today (midnight)
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1

  const { data, error } = await supabase
    .from('sessions')
    .select('*, projects(*)')
    .eq('user_id', user.id)
    .gte('started_at', startOfDay)
    .lte('started_at', endOfDay)
    .order('started_at', { ascending: false })

  if (error) throw error

  return {
    sessions: data as SessionWithProject[],
    userId: user.id,
    date: startOfDay
  }
}

/**
 * Get active sessions (running timers)
 * Critical for concurrent tracking feature
 *
 * @returns Object containing active (running) sessions
 */
export async function getCachedActiveSessions() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('sessions')
    .select('*, projects(*)')
    .eq('user_id', user.id)
    .is('ended_at', null)
    .order('started_at', { ascending: false })

  if (error) throw error

  return {
    sessions: data as SessionWithProject[],
    userId: user.id
  }
}

/**
 * Get session statistics for analytics
 *
 * @param days - Number of days to look back (default: 7)
 * @returns Object containing sessions and calculated statistics
 */
export async function getCachedSessionStats(days: number = 7) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('sessions')
    .select('*, projects(*)')
    .eq('user_id', user.id)
    .gte('started_at', cutoffDate)
    .not('ended_at', 'is', null)

  if (error) throw error

  // Calculate stats
  const sessions = data as SessionWithProject[]
  const totalDuration = sessions.reduce((sum, s) => {
    return sum + ((s.ended_at || 0) - (s.started_at || 0))
  }, 0)

  return {
    sessions,
    stats: {
      totalSessions: sessions.length,
      totalDuration,
      averageDuration: sessions.length > 0 ? totalDuration / sessions.length : 0,
      days
    },
    userId: user.id
  }
}
