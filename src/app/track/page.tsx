'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { Task, HistorySession } from '@/lib/types';
import { useTasks } from '@/lib/hooks/use-tasks';
import {
  useTodaySessions,
  useActiveSessions,
  useStartSession,
  useStopSession,
  useUpdateSession,
} from '@/lib/hooks/use-sessions';
import { useActiveSessionsStore, ActiveSessionState } from '@/lib/stores/active-sessions-store';
import {
  ActiveTimerCard,
  TasksGrid,
  TodaySessions,
  PomodoroTimer,
  SessionEditDialog,
  NotePromptDialog,
} from '@/components/track';

// Default task when no tasks exist
const defaultTask: Task = {
  id: 'inbox',
  name: 'Inbox',
  color: '#6B7280',
  icon: '📥',
};

/**
 * TrackPage
 * 
 * The main tracking interface with three main sections:
 * 1. Active Timer Card - Shows current active sessions or ready state with recent tasks/sessions
 * 2. Tasks Grid - Quick start/stop for tasks
 * 3. Today's Sessions - List of completed sessions today
 * 
 * Uses Zustand for local active session state management
 * and React Query for server state management.
 */
export default function TrackPage() {
  // Zustand store
  const {
    activeSessions,
    addSession,
    removeSession,
    syncFromDatabase
  } = useActiveSessionsStore();

  // Edit dialog state (kept in component as it's UI-specific)
  const [editingSession, setEditingSession] = useState<HistorySession | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [promptSession, setPromptSession] = useState<ActiveSessionState | null>(null);
  const [isStoppingWithNote, setIsStoppingWithNote] = useState(false);

  // Fetch data using React Query
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useTasks();

  const {
    data: todaySessions = [],
    isLoading: isLoadingSessions,
    refetch: refetchTodaySessions,
  } = useTodaySessions();

  // Use the hook that returns ALL active sessions
  const { data: activeDbSessions = [], isLoading: isLoadingActiveSessions } = useActiveSessions();

  // Mutations
  const startSessionMutation = useStartSession();
  const stopSessionMutation = useStopSession();
  const updateSessionMutation = useUpdateSession();

  // Calculate recent tasks (unique tasks from today sessions, max 6)
  const recentTasks = useMemo(() => {
    const taskMap = new Map<string, Task>();

    // Iterate through today's sessions to find unique tasks
    for (const session of todaySessions) {
      if (session.tasks && !taskMap.has(session.tasks.id)) {
        taskMap.set(session.tasks.id, {
          id: session.tasks.id,
          name: session.tasks.name,
          color: session.tasks.color,
          icon: session.tasks.icon,
        });
      }
      if (taskMap.size >= 6) break;
    }

    // If we don't have 6 tasks from today, add from all tasks
    if (taskMap.size < 6) {
      for (const task of tasks) {
        if (!taskMap.has(task.id)) {
          taskMap.set(task.id, task);
        }
        if (taskMap.size >= 6) break;
      }
    }

    return Array.from(taskMap.values());
  }, [todaySessions, tasks]);

  // Sync with database active sessions - ONE WAY sync from DB to local
  useEffect(() => {
    if (isLoadingActiveSessions || !activeDbSessions.length) return;

    // Convert DB sessions to the format expected by the store
    const sessionsForSync = activeDbSessions.map((dbSession) => ({
      id: dbSession.id,
      task: dbSession.tasks as Task,
      title: dbSession.title || '',
      note: dbSession.note || '',
      started_at: dbSession.started_at,
    }));

    syncFromDatabase(sessionsForSync);
  }, [activeDbSessions, isLoadingActiveSessions, syncFromDatabase]);

  const startTask = useCallback(async (task: Task) => {
    try {
      const newSession = await startSessionMutation.mutateAsync({
        taskId: task.id,
        title: task.name,
      });

      // Add to Zustand store
      useActiveSessionsStore.getState().addSession({
        id: newSession.id,
        task,
        title: task.name,
        note: '',
        startTime: Date.now(),
      });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }, [startSessionMutation]);

  const stopSession = useCallback(async (sessionId: string) => {
    // Check if this session's task requires a note prompt
    const sessionToStop = activeSessions.find(s => s.id === sessionId);
    if (sessionToStop?.task.note_prompt) {
      setPromptSession(sessionToStop);
      return;
    }

    // Immediately remove from local state for instant UI feedback
    removeSession(sessionId);

    try {
      await stopSessionMutation.mutateAsync(sessionId);
    } catch (error) {
      console.error('Failed to stop session:', error);
      alert('Failed to stop session. Please try again.');
    }
  }, [activeSessions, removeSession, stopSessionMutation]);

  const handleSaveNoteAndStop = useCallback(async (note: string) => {
    if (!promptSession) return;

    setIsStoppingWithNote(true);
    try {
      const sessionId = promptSession.id;

      // 1. Update session with the note
      await updateSessionMutation.mutateAsync({
        id: sessionId,
        updates: { note: note.trim() || null }
      });

      // 2. Stop the session
      removeSession(sessionId);
      await stopSessionMutation.mutateAsync(sessionId);
      setPromptSession(null);
    } catch (error) {
      console.error('Failed to save note and stop:', error);
      alert('Failed to save note. Please try again.');
    } finally {
      setIsStoppingWithNote(false);
    }
  }, [promptSession, removeSession, stopSessionMutation, updateSessionMutation]);

  const handleStopWithoutNote = useCallback(async () => {
    if (!promptSession) return;

    setIsStoppingWithNote(true);
    try {
      const sessionId = promptSession.id;
      removeSession(sessionId);
      await stopSessionMutation.mutateAsync(sessionId);
      setPromptSession(null);
    } catch (error) {
      console.error('Failed to stop session:', error);
      alert('Failed to stop session. Please try again.');
    } finally {
      setIsStoppingWithNote(false);
    }
  }, [promptSession, removeSession, stopSessionMutation]);

  const updateSession = useCallback(async (sessionId: string, updates: { title?: string; note?: string; taskId?: string }) => {
    try {
      // Convert taskId to task_id for the database
      const dbUpdates: { title?: string; note?: string; task_id?: string } = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.note !== undefined) dbUpdates.note = updates.note;
      if (updates.taskId !== undefined) dbUpdates.task_id = updates.taskId;

      await updateSessionMutation.mutateAsync({
        id: sessionId,
        updates: dbUpdates,
      });

      // If task changed, update the local store
      if (updates.taskId) {
        const newTask = tasks.find(t => t.id === updates.taskId);
        if (newTask) {
          const { activeSessions } = useActiveSessionsStore.getState();
          const session = activeSessions.find(s => s.id === sessionId);
          if (session) {
            // Update the session in the store with the new task
            // The title will be updated separately when user saves in edit mode
            useActiveSessionsStore.getState().updateSession(sessionId, { task: newTask });
          }
        }
      }
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  }, [updateSessionMutation, tasks]);

  const handleEditSession = useCallback((session: HistorySession) => {
    setEditingSession(session);
    setIsEditDialogOpen(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
    setEditingSession(null);
  }, []);

  // Get first task as default or use fallback
  const firstTask = tasks[0] || defaultTask;

  // Loading state
  if (isLoadingTasks || isLoadingSessions) {
    return (
      <main className="flex-1 flex items-center justify-center pb-20 lg:pb-0">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (tasksError) {
    return (
      <main className="flex-1 flex items-center justify-center pb-20 lg:pb-0">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load tasks</p>
          <p className="text-sm text-muted-foreground">Please try again later</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col pb-20 lg:pb-0">
      <div className="flex-1 p-4 lg:p-8">
        {/* Row 1: Timer Cards Grid - Fixed height 280px */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 lg:gap-6 h-[280px] items-start">
          {/* Active Timer Card - Fixed height with concurrent sessions */}
          <ActiveTimerCard
            firstTask={firstTask}
            recentTasks={recentTasks}
            onStartTask={startTask}
            onStopSession={stopSession}
            onUpdateSession={updateSession}
            isStarting={startSessionMutation.isPending}
            isStopping={stopSessionMutation.isPending}
            tasks={tasks}
          />

          {/* Pomodoro Timer Card - Fixed height */}
          <PomodoroTimer
            onComplete={async () => {
              refetchTodaySessions();
            }}
            onStop={async () => {
              refetchTodaySessions();
            }}
          />
        </div>

        {/* Row 2: Tasks and Today's Sessions - Fixed height 400px */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 lg:gap-6 h-[400px] mt-6 items-start">
          {/* Tasks Grid - Left side */}
          <TasksGrid
            tasks={tasks}
            activeSessions={activeSessions}
            onStartTask={startTask}
            onStopSession={stopSession}
            isPending={startSessionMutation.isPending || stopSessionMutation.isPending}
          />

          {/* Today's Sessions - Right side */}
          <TodaySessions
            sessions={todaySessions}
            onEditSession={handleEditSession}
          />
        </div>
      </div>

      {/* Edit Session Dialog */}
      <SessionEditDialog
        session={editingSession}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
      />

      {/* Note Prompt Dialog */}
      <NotePromptDialog
        session={promptSession}
        isOpen={!!promptSession}
        onClose={() => setPromptSession(null)}
        onSave={handleSaveNoteAndStop}
        onStopWithoutNote={handleStopWithoutNote}
        isStopping={isStoppingWithNote}
      />
    </main>
  );
}
