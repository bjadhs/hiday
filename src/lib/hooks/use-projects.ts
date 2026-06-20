'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProjects, createProject, updateProject, deleteProject, archiveProject, reorderProjects } from '@/actions/projects'
import type { Database } from '@/lib/supabase/database.types'

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: { archived?: boolean }) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

// Hook to fetch all projects
export function useProjects(filters: { archived?: boolean } = {}) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => getProjects(),
  })
}

// Hook to create a project
export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (project: Omit<Database['public']['Tables']['projects']['Insert'], 'user_id' | 'created_at' | 'updated_at'>) => createProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// Hook to update a project
export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Database['public']['Tables']['projects']['Update'] }) => updateProject(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.id) })
    },
  })
}

// Hook to delete a project
export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// Hook to archive a project
export function useArchiveProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => archiveProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}

// Hook to reorder projects
export function useReorderProjects() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (projects: { id: string; name: string }[]) => reorderProjects(projects),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },
  })
}
