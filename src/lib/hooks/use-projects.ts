'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/actions/projects'
import type { Project } from '@/lib/types'
import type { Database } from '@/lib/supabase/database.types'

type ProjectUpdate = Database['public']['Tables']['projects']['Update']
type DbProject = Database['public']['Tables']['projects']['Row']

function mapProject(project: DbProject): Project {
  return {
    id: project.id,
    userId: project.user_id,
    name: project.name,
    color: project.color,
    sortOrder: project.sort_order,
  }
}

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: () => [...projectKeys.lists()] as const,
}

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: async () => {
      const data = await getProjects()
      return data.map(mapProject)
    },
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string }) => {
      const data = await createProject(name, color)
      return mapProject(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string
      updates: ProjectUpdate
    }) => {
      const data = await updateProject(id, updates)
      return mapProject(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}
