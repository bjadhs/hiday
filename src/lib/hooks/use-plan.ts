'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getPlanDaySessions, createPlannedSession, updatePlannedSession, deletePlannedSession } from '@/actions/planned-sessions'
import { getTimerSessionsForDate } from '@/actions/sessions'
import { plannedSessionKeys } from '@/lib/hooks/use-planned-sessions'

// Query keys
export const planKeys = {
  all: ['plan'] as const,
  day: (date: string) => [...planKeys.all, 'day', date] as const,
  timers: (date: string) => [...planKeys.all, 'timers', date] as const,
}

/**
 * Plan blocks (editable) for the /plan timeline on a given date.
 * Background refetches are disabled — the markdown pane mirrors this data
 * live, and a refetch mid-edit would overwrite what the user is typing.
 * Mutations still invalidate + refetch explicitly.
 */
export function usePlanDaySessions(date: string) {
  return useQuery({
    queryKey: planKeys.day(date),
    queryFn: () => getPlanDaySessions(date),
    refetchOnWindowFocus: false,
  })
}

/** Timer/session blocks (view-only) for the /plan timeline on a given date. */
export function useTimerSessionsForDate(date: string) {
  return useQuery({
    queryKey: planKeys.timers(date),
    queryFn: () => getTimerSessionsForDate(date),
    refetchOnWindowFocus: false,
  })
}

/**
 * The three plan-block mutations share the same underlying actions as
 * /todos's planned-sessions hooks, so each one invalidates both this page's
 * query keys and /todos's — the two routes show overlapping data.
 */
export function useCreatePlanSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      plannedDate,
      plannedStartTime,
      plannedDuration,
      title,
      note,
    }: {
      projectId: string
      plannedDate: string
      plannedStartTime: number | null
      plannedDuration: number
      title?: string
      note?: string
    }) => createPlannedSession(projectId, plannedDate, plannedStartTime, plannedDuration, title, note),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.day(variables.plannedDate) })
      queryClient.invalidateQueries({ queryKey: plannedSessionKeys.list(variables.plannedDate) })
    },
  })
}

export function useUpdatePlanSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      updates,
    }: {
      sessionId: string
      plannedDate: string
      updates: {
        projectId?: string
        plannedStartTime?: number | null
        plannedDuration?: number
        title?: string
        note?: string
      }
    }) => updatePlannedSession(sessionId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.day(variables.plannedDate) })
      queryClient.invalidateQueries({ queryKey: plannedSessionKeys.list(variables.plannedDate) })
    },
  })
}

export function useDeletePlanSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string; plannedDate: string }) =>
      deletePlannedSession(sessionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: planKeys.day(variables.plannedDate) })
      queryClient.invalidateQueries({ queryKey: plannedSessionKeys.list(variables.plannedDate) })
    },
  })
}
