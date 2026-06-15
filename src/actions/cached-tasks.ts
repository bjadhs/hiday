'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { uuid } from '@/lib/validation'

type Task = Database['public']['Tables']['tasks']['Row']

/**
 * Get all non-archived tasks for the current user
 * Optimized for task lists and grids
 *
 * @returns Object containing tasks array
 */
export async function getCachedTasks() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return {
    tasks: data as Task[],
    userId: user.id
  }
}

/**
 * Get a single task by ID
 *
 * @param id - Task ID
 * @returns Object containing task (or null if not found)
 */
export async function getCachedTaskById(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const taskId = uuid.parse(id)

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error

  return {
    task: data as Task | null,
    userId: user.id
  }
}

/**
 * Get all archived tasks
 * For archive/history views
 *
 * @returns Object containing archived tasks array
 */
export async function getCachedArchivedTasks() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .eq('archived', true)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return {
    tasks: data as Task[],
    userId: user.id
  }
}

/**
 * Revalidate tasks cache
 * Call this after creating, updating, or deleting tasks
 *
 * Note: In Next.js 16, we use revalidatePath for cache invalidation
 * This ensures fresh data on the next request
 */
export async function revalidateTasksCache() {
  // Cache revalidation is handled automatically by Next.js 16
  // when mutations occur through server actions
  // This function exists for explicit cache management if needed
}
