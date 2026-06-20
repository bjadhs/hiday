'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPlannedSessions,
  getPlannedSessionsRange,
  createPlannedSession,
  updatePlannedSession,
  deletePlannedSession,
  startPlannedSession,
  pausePlannedSession,
  completePlannedSession,
  unschedulePlannedSession,
} from '@/actions/planned-sessions'

// Query keys
export const plannedSessionKeys = {
  all: ['planned-sessions'] as const,
  lists: () => [...plannedSessionKeys.all, 'list'] as const,
  list: (date: string) => [...plannedSessionKeys.lists(), date] as const,
  range: (startDate: string, endDate: string) =>
    [...plannedSessionKeys.all, 'range', startDate, endDate] as const,
}

/**
 * Hook to fetch planned sessions for a specific date
 */
export function usePlannedSessions(date: string) {
  return useQuery({
    queryKey: plannedSessionKeys.list(date),
    queryFn: () => getPlannedSessions(date),
  })
}

/**
 * Hook to fetch planned sessions for a date range
 */
export function usePlannedSessionsRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: plannedSessionKeys.range(startDate, endDate),
    queryFn: () => getPlannedSessionsRange(startDate, endDate),
  })
}

/**
 * Hook to create a new planned session
 * Can create scheduled (with time) or unscheduled (no time) sessions
 */
export function useCreatePlannedSession() {
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
      plannedStartTime: number | null  // Null for unscheduled
      plannedDuration: number
      title?: string
      note?: string
    }) => {
      return createPlannedSession(
        projectId,
        plannedDate,
        plannedStartTime,
        plannedDuration,
        title,
        note
      )
    },
    onSuccess: (_, variables) => {
      // Invalidate the planned sessions list for the date
      queryClient.invalidateQueries({
        queryKey: plannedSessionKeys.list(variables.plannedDate),
      })
    },
  })
}

/**
 * Hook to update a planned session
 * Pass plannedStartTime: null to unschedule the session
 */
export function useUpdatePlannedSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      updates,
    }: {
      sessionId: string
      plannedDate: string
      updates: {
        plannedStartTime?: number | null  // Null to unschedule
        plannedDuration?: number
        title?: string
        note?: string
        status?: 'planned' | 'active' | 'completed' | 'cancelled'
      }
    }) => {
      return updatePlannedSession(sessionId, updates)
    },
    onSuccess: (_, variables) => {
      // Invalidate the planned sessions list for the date
      queryClient.invalidateQueries({
        queryKey: plannedSessionKeys.list(variables.plannedDate),
      })
    },
  })
}

/**
 * Hook to unschedule a planned session (remove from timeline, keep as unscheduled todo)
 */
export function useUnschedulePlannedSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
    }: {
      sessionId: string
      plannedDate: string
    }) => {
      return unschedulePlannedSession(sessionId)
    },
    onSuccess: (_, variables) => {
      // Invalidate the planned sessions list for the date
      queryClient.invalidateQueries({
        queryKey: plannedSessionKeys.list(variables.plannedDate),
      })
    },
  })
}

/**
 * Hook to delete a planned session
 */
export function useDeletePlannedSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
    }: {
      sessionId: string
      plannedDate: string
    }) => {
      return deletePlannedSession(sessionId)
    },
    onSuccess: (_, variables) => {
      // Invalidate the planned sessions list for the date
      queryClient.invalidateQueries({
        queryKey: plannedSessionKeys.list(variables.plannedDate),
      })
    },
  })
}

/**
 * Hook to start a planned session (convert to active session)
 */
export function useStartPlannedSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
    }: {
      sessionId: string
      plannedDate: string
    }) => {
      return startPlannedSession(sessionId)
    },
    onSuccess: (_, variables) => {
      // Invalidate the planned sessions list for the date
      queryClient.invalidateQueries({
        queryKey: plannedSessionKeys.list(variables.plannedDate),
      })
      // Also invalidate active sessions
      queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] })
      // Remove started todo from Kanban board
      queryClient.invalidateQueries({ queryKey: ['kanban'] })
    },
  })
}

/**
 * Hook to pause a running session (freeze elapsed, return to planned list)
 */
export function usePausePlannedSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
    }: {
      sessionId: string
      plannedDate: string
    }) => {
      return pausePlannedSession(sessionId)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: plannedSessionKeys.list(variables.plannedDate),
      })
      // The row leaves the active list — refresh running sessions too.
      queryClient.invalidateQueries({ queryKey: ['sessions', 'active'] })
    },
  })
}

/**
 * Hook to complete a planned session (mark as done without tracking)
 */
export function useCompletePlannedSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      actualStartTime,
      actualEndTime,
    }: {
      sessionId: string
      plannedDate: string
      actualStartTime?: number
      actualEndTime?: number
    }) => {
      return completePlannedSession(sessionId, actualStartTime, actualEndTime)
    },
    onSuccess: (_, variables) => {
      // Invalidate the planned sessions list for the date
      queryClient.invalidateQueries({
        queryKey: plannedSessionKeys.list(variables.plannedDate),
      })
      // Also invalidate regular sessions
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
