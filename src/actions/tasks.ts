'use server'

import { createClient } from '@/lib/supabase/server'

// Note: Server actions must import createClient directly from server.ts
import type { Database } from '@/lib/supabase/database.types'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export async function getTasks() {
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
  return data as Task[]
}

export async function getTaskById(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) throw error
  return data as Task
}

export async function createTask(task: Omit<TaskInsert, 'user_id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const now = Date.now()
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      ...task,
      user_id: user.id,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()

  if (error) throw error
  return data as Task
}

export async function updateTask(id: string, updates: TaskUpdate) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      updated_at: Date.now(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) throw error
  return data as Task
}

export async function deleteTask(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
}

export async function archiveTask(id: string) {
  return updateTask(id, { archived: true })
}

export async function reorderTasks(tasks: { id: string; name: string }[]) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const updates = tasks.map((task, index) => ({
    id: task.id,
    name: task.name,
    user_id: user.id,
    sort_order: index,
    updated_at: Date.now(),
  }))

  const { error } = await supabase
    .from('tasks')
    .upsert(updates, { onConflict: 'id' })

  if (error) throw error
}
