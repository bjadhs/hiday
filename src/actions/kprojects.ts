'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { kprojectInputSchema, kprojectUpdateSchema, uuid } from '@/lib/validation'

type KProject = Database['public']['Tables']['kprojects']['Row']
type KProjectInsert = Database['public']['Tables']['kprojects']['Insert']
type KProjectUpdate = Database['public']['Tables']['kprojects']['Update']

export async function getKProjects() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('kprojects')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as KProject[]
}

export async function createKProject(name: string, color: string = '#6D28D9') {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const input = kprojectInputSchema.parse({ name, color })

  const now = Date.now()
  const { data, error } = await supabase
    .from('kprojects')
    .insert({
      user_id: user.id,
      name: input.name,
      color: input.color,
      sort_order: 0,
      created_at: now,
      updated_at: now,
    } as KProjectInsert)
    .select()
    .single()

  if (error) throw error
  return data as KProject
}

export async function updateKProject(id: string, updates: KProjectUpdate) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const kprojectId = uuid.parse(id)
  const validated = kprojectUpdateSchema.parse(updates)

  const { data, error } = await supabase
    .from('kprojects')
    .update({
      ...validated,
      updated_at: Date.now(),
    } as KProjectUpdate)
    .eq('id', kprojectId)
    .eq('user_id', user.id)
    .select()
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('KProject not found')
  return data as KProject
}

export async function deleteKProject(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const kprojectId = uuid.parse(id)

  const { error } = await supabase
    .from('kprojects')
    .delete()
    .eq('id', kprojectId)
    .eq('user_id', user.id)

  if (error) throw error
  return { success: true }
}
