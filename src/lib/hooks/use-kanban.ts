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
  startKanbanSession,
} from '@/actions/planned-sessions'
import type { KanbanSessionWithActiveState } from '@/actions/planned-sessions'
import { plannedSessionKeys } from './use-planned-sessions'
import { sessionKeys } from './use-sessions'

// Query keys
export const kanbanKeys = {
  all: ['kanban'] as const,
  lists: () => [...kanbanKeys.all, 'list'] as const,
  list: (kprojectId: string | null | undefined) =>
    [...kanbanKeys.lists(), kprojectId ?? 'all'] as const,
  inbox: () => [...kanbanKeys.all, 'inbox'] as const,
}

export function useKanbanSessions(kprojectId?: string | null) {
  return useQuery<KanbanSessionWithActiveState[]>({
    queryKey: kanbanKeys.list(kprojectId),
    queryFn: () => getKanbanSessions(kprojectId),
  })
}

export function useStartKanbanSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId }: { sessionId: string }) =>
      startKanbanSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kanbanKeys.lists() })
      queryClient.invalidateQueries({ queryKey: kanbanKeys.inbox() })
      queryClient.invalidateQueries({ queryKey: plannedSessionKeys.all })
      queryClient.invalidateQueries({ queryKey: sessionKeys.active() })
      queryClient.invalidateQueries({ queryKey: sessionKeys.today() })
    },
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
      projectId,
      kprojectId,
      kanbanStatus,
      duration,
      title,
      note,
    }: {
      projectId: string
      kprojectId: string | null
      kanbanStatus: 'next' | 'doing' | 'done' | 'revise'
      duration: number
      title?: string
      note?: string
    }) =>
      createKanbanTodo({
        projectId,
        kprojectId,
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
      kprojectId,
      projectId,
      title,
    }: {
      kprojectId: string | null
      projectId?: string
      title?: string
    }) => createInboxTodo({ kprojectId, projectId, title }),
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
