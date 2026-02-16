'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  getSessions, 
  getActiveSession, 
  getActiveSessions,
  getTodaySessions,
  startSession, 
  stopSession, 
  updateSession, 
  deleteSession 
} from '@/app/actions/sessions'
import type { Database } from '@/lib/supabase/database.types'

type Session = Database['public']['Tables']['sessions']['Row']
type SessionInsert = Database['public']['Tables']['sessions']['Insert']
type SessionUpdate = Database['public']['Tables']['sessions']['Update']

// Query keys
export const sessionKeys = {
  all: ['sessions'] as const,
  lists: () => [...sessionKeys.all, 'list'] as const,
  list: (filters: { startDate?: number; endDate?: number }) => [...sessionKeys.lists(), filters] as const,
  today: () => [...sessionKeys.all, 'today'] as const,
  active: () => [...sessionKeys.all, 'active'] as const,
  details: () => [...sessionKeys.all, 'detail'] as const,
  detail: (id: string) => [...sessionKeys.details(), id] as const,
}

// Hook to fetch sessions with date range
export function useSessions(startDate?: number, endDate?: number) {
  return useQuery({
    queryKey: sessionKeys.list({ startDate, endDate }),
    queryFn: () => getSessions(startDate, endDate),
  })
}

// Hook to fetch today's sessions
export function useTodaySessions() {
  return useQuery({
    queryKey: sessionKeys.today(),
    queryFn: () => getTodaySessions(),
  })
}

// Hook to fetch single active session (legacy)
export function useActiveSession() {
  return useQuery({
    queryKey: sessionKeys.active(),
    queryFn: () => getActiveSession(),
  })
}

// Hook to fetch ALL active sessions (concurrent support)
export function useActiveSessions() {
  return useQuery({
    queryKey: [...sessionKeys.active(), 'all'],
    queryFn: () => getActiveSessions(),
  })
}

// Hook to start a new session
export function useStartSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title?: string }) => startSession(taskId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: sessionKeys.today() })
      queryClient.invalidateQueries({ queryKey: sessionKeys.active() })
    },
  })
}

// Hook to stop an active session
export function useStopSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (sessionId: string) => stopSession(sessionId),
    onSuccess: async () => {
      // Invalidate and refetch immediately to ensure fresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sessionKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: sessionKeys.today() }),
        queryClient.invalidateQueries({ queryKey: sessionKeys.active() }),
      ])
      // Force refetch today's sessions to show stopped session
      await queryClient.refetchQueries({ queryKey: sessionKeys.today() })
    },
  })
}

// Hook to update a session
export function useUpdateSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: SessionUpdate }) => updateSession(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: sessionKeys.today() })
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(variables.id) })
    },
  })
}

// Hook to delete a session
export function useDeleteSession() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() })
      queryClient.invalidateQueries({ queryKey: sessionKeys.today() })
    },
  })
}
