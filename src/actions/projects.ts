'use server'

import { createClient } from '@/lib/supabase/server'

// Note: Server actions must import createClient directly from server.ts
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
    .eq('archived', false)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data as Project[]
}

export async function getProjectById(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const projectId = uuid.parse(id)

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Project not found')
  return data as Project
}

export async function createProject(project: Omit<ProjectInsert, 'user_id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const validated = projectInputSchema.parse(project)

  const now = Date.now()
  const { data, error } = await supabase
    .from('projects')
    .insert({
      ...validated,
      user_id: user.id,
      created_at: now,
      updated_at: now,
    })
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
    })
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
}

export async function archiveProject(id: string) {
  return updateProject(id, { archived: true })
}

export async function reorderProjects(projects: { id: string; name: string }[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const updates = projects.map((project, index) => ({
    id: project.id,
    name: project.name,
    user_id: user.id,
    sort_order: index,
    updated_at: Date.now(),
  }))

  const { error } = await supabase
    .from('projects')
    .upsert(updates, { onConflict: 'id' })

  if (error) throw error
}
