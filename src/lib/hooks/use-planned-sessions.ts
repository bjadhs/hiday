'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getPlannedSessions,
  getPlannedSessionsRange,
  createPlannedSession,
  updatePlannedSession,
  deletePlannedSession,
  startPlannedSession,
  completePlannedSession,
  type PlannedSessionWithTask,
} from '@/app/actions/planned-sessions'
import type { Database } from '@/lib/supabase/database.types'

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
 */
export function useCreatePlannedSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      plannedDate,
      plannedStartTime,
      plannedDuration,
      title,
      note,
    }: {
      taskId: string
      plannedDate: string
      plannedStartTime: number
      plannedDuration: number
      title?: string
      note?: string
    }) => {
      return createPlannedSession(
        taskId,
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
 */
export function useUpdatePlannedSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      plannedDate,
      updates,
    }: {
      sessionId: string
      plannedDate: string
      updates: Parameters<typeof updatePlannedSession>[1]
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
 * Hook to delete a planned session
 */
export function useDeletePlannedSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      plannedDate,
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
      plannedDate,
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
      plannedDate,
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
