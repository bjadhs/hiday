'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { projectInputSchema, projectUpdateSchema, uuid } from '@/lib/validation'

type Project = Database['public']['Tables']['projects']['Row']
type ProjectInsert = Database['public']['Tables']['projects']['Insert']
type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export async function getProjects() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as Project[]
}

export async function createProject(name: string, color: string = '#6D28D9') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const input = projectInputSchema.parse({ name, color })

  const now = Date.now()
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: input.name,
      color: input.color,
      sort_order: 0,
      created_at: now,
      updated_at: now,
    } as ProjectInsert)
    .select()
    .single()

  if (error) throw error
  return data as Project
}

export async function updateProject(id: string, updates: ProjectUpdate) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const projectId = uuid.parse(id)
  const validated = projectUpdateSchema.parse(updates)

  const { data, error } = await supabase
    .from('projects')
    .update({
      ...validated,
      updated_at: Date.now(),
    } as ProjectUpdate)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Project not found')
  return data as Project
}

export async function deleteProject(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const projectId = uuid.parse(id)

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) throw error
  return { success: true }
}
