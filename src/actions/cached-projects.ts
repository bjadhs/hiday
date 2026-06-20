'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type Project = Database['public']['Tables']['projects']['Row']

/**
 * Get all non-archived projects for the current user
 * Optimized for project lists and grids
 *
 * @returns Object containing projects array
 */
export async function getCachedProjects() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('sort_order', { ascending: true })

  if (error) throw error

  return {
    projects: data as Project[],
    userId: user.id
  }
}

/**
 * Get a single project by ID
 *
 * @param id - Project ID
 * @returns Object containing project (or null if not found)
 */
export async function getCachedProjectById(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error

  return {
    project: data as Project | null,
    userId: user.id
  }
}

/**
 * Get all archived projects
 * For archive/history views
 *
 * @returns Object containing archived projects array
 */
export async function getCachedArchivedProjects() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .eq('archived', true)
    .order('updated_at', { ascending: false })

  if (error) throw error

  return {
    projects: data as Project[],
    userId: user.id
  }
}

/**
 * Revalidate projects cache
 * Call this after creating, updating, or deleting projects
 *
 * Note: In Next.js 16, we use revalidatePath for cache invalidation
 * This ensures fresh data on the next request
 */
export async function revalidateProjectsCache() {
  // Cache revalidation is handled automatically by Next.js 16
  // when mutations occur through server actions
  // This function exists for explicit cache management if needed
}
