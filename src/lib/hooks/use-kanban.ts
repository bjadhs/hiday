'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getKanbanSessions,
  getInboxSessions,
  updateKanbanStatus,
  createKanbanTodo,
  createInboxTodo,
  updateKanbanTodo,
  deletePlannedSession,
} from '@/actions/planned-sessions'
import { plannedSessionKeys } from './use-planned-sessions'

// Query keys
export const kanbanKeys = {
  all: ['kanban'] as const,
  lists: () => [...kanbanKeys.all, 'list'] as const,
  list: (projectId: string | null | undefined) =>
    [...kanbanKeys.lists(), projectId ?? 'all'] as const,
  inbox: () => [...kanbanKeys.all, 'inbox'] as const,
}

export function useKanbanSessions(projectId?: string | null) {
  return useQuery({
    queryKey: kanbanKeys.list(projectId),
    queryFn: () => getKanbanSessions(projectId),
  })
}

export function useInboxSessions() {
  return useQuery({
    queryKey: kanbanKeys.inbox(),
    queryFn: () => getInboxSessions(),
  })
}

export function useUpdateKanbanStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      kanbanStatus,
    }: {
      sessionId: string
      kanbanStatus: 'next' | 'doing' | 'done' | 'revise'
    }) => updateKanbanStatus(sessionId, kanbanStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.inbox() })
      queryClient.invalidateQueries({ queryKey: plannedSessionKeys.all })
    },
  })
}

export function useCreateKanbanTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskId,
      projectId,
      kanbanStatus,
      duration,
      title,
      note,
    }: {
      taskId: string
      projectId: string | null
      kanbanStatus: 'next' | 'doing' | 'done' | 'revise'
      duration: number
      title?: string
      note?: string
    }) =>
      createKanbanTodo({
        taskId,
        projectId,
        kanbanStatus,
        duration,
        title,
        note,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.inbox() })
      queryClient.invalidateQueries({ queryKey: plannedSessionKeys.all })
    },
  })
}

export function useCreateInboxTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      taskId,
      title,
    }: {
      projectId: string | null
      taskId?: string
      title?: string
    }) => createInboxTodo({ projectId, taskId, title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.inbox() })
      queryClient.invalidateQueries({ queryKey: plannedSessionKeys.all })
    },
  })
}

export function useUpdateKanbanTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      sessionId,
      updates,
    }: {
      sessionId: string
      updates: Parameters<typeof updateKanbanTodo>[1]
    }) => updateKanbanTodo(sessionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.inbox() })
      queryClient.invalidateQueries({ queryKey: plannedSessionKeys.all })
    },
  })
}

export function useDeleteKanbanTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (sessionId: string) => deletePlannedSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.inbox() })
      queryClient.invalidateQueries({ queryKey: plannedSessionKeys.all })
    },
  })
}
