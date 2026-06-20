'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getKProjects,
  createKProject,
  updateKProject,
  deleteKProject,
} from '@/actions/kprojects'
import type { KProject } from '@/lib/types'
import type { Database } from '@/lib/supabase/database.types'

type KProjectUpdate = Database['public']['Tables']['kprojects']['Update']
type DbKProject = Database['public']['Tables']['kprojects']['Row']

function mapKProject(kproject: DbKProject): KProject {
  return {
    id: kproject.id,
    userId: kproject.user_id,
    name: kproject.name,
    color: kproject.color,
    sortOrder: kproject.sort_order,
  }
}

// Query keys
export const kprojectKeys = {
  all: ['kprojects'] as const,
  lists: () => [...kprojectKeys.all, 'list'] as const,
  list: () => [...kprojectKeys.lists()] as const,
}

export function useKProjects() {
  return useQuery({
    queryKey: kprojectKeys.list(),
    queryFn: async () => {
      const data = await getKProjects()
      return data.map(mapKProject)
    },
  })
}

export function useCreateKProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const data = await createKProject(name, color)
      return mapKProject(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kprojectKeys.lists() })
    },
  })
}

export function useUpdateKProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: KProjectUpdate
    }) => {
      const data = await updateKProject(id, updates)
      return mapKProject(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kprojectKeys.lists() })
    },
  })
}

export function useDeleteKProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteKProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kprojectKeys.lists() })
    },
  })
}
