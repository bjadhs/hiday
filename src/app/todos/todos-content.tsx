'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { Loader2, CheckSquare, CalendarDays } from 'lucide-react';
import { useTasks } from '@/lib/hooks/use-tasks';
import {
  usePlannedSessions,
  useCreatePlannedSession,
  useUpdatePlannedSession,
  useDeletePlannedSession,
  useStartPlannedSession,
  useUnschedulePlannedSession,
} from '@/lib/hooks/use-planned-sessions';
import { TodoHeader } from '@/components/todos/todo-header';
import { TaskColumn } from '@/components/todos/task-column';
import { TodoTimeline } from '@/components/todos/todo-timeline';
import { CreateTodoDialog } from '@/components/todos/create-todo-dialog';
import type { PlannedSession } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';

export default function TodosPage() {
  // Use fixed epoch date for SSR, sync to real date after hydration
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(0));

  // Sync to real current date after hydration
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preselectedTaskId, setPreselectedTaskId] = useState<string | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<number | null>(null);
  const [editingSession, setEditingSession] = useState<PlannedSession | null>(null);

  // Fetch data
  const formattedDate = selectedDate.toISOString().split('T')[0];
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();
  const { data: plannedSessions = [], isLoading: isLoadingSessions } = usePlannedSessions(formattedDate);

  // Mutations
  const createMutation = useCreatePlannedSession();
  const updateMutation = useUpdatePlannedSession();
  const deleteMutation = useDeletePlannedSession();
  const startMutation = useStartPlannedSession();
  const unscheduleMutation = useUnschedulePlannedSession();

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || startMutation.isPending;
  const submitError = createMutation.error?.message || updateMutation.error?.message || null;

  // Check if selected date is today
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Navigation handlers
  const goToPreviousDay = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  // Create todo handlers
  const handleCreateTodo = useCallback((taskId: string) => {
    setPreselectedTaskId(taskId);
    setPreselectedTime(null);
    setEditingSession(null);
    setIsDialogOpen(true);
  }, []);

  const handleTimeSlotClick = useCallback((timestamp: number) => {
    setPreselectedTaskId(null);
    setPreselectedTime(timestamp);
    setEditingSession(null);
    setIsDialogOpen(true);
  }, []);

  const handleEditSession = useCallback((session: PlannedSession) => {
    setPreselectedTaskId(null);
    setPreselectedTime(null);
    setEditingSession(session);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setPreselectedTaskId(null);
    setPreselectedTime(null);
    setEditingSession(null);
  }, []);

  // Form submission handlers
  const handleCreateSubmit = useCallback((data: {
    taskId: string;
    plannedDate: string;
    plannedStartTime: number | null;
    plannedDuration: number;
    title?: string;
    note?: string;
  }) => {
    console.log('handleCreateSubmit called', data);
    createMutation.mutate(data, {
      onSuccess: () => {
        console.log('Create mutation succeeded');
        handleCloseDialog();
      },
      onError: (error) => {
        console.error('Create mutation failed:', error);
      }
    });
  }, [createMutation, handleCloseDialog]);

  const handleUpdateSubmit = useCallback((sessionId: string, updates: {
    plannedStartTime?: number | null;
    plannedEndTime?: number;
    plannedDuration?: number;
    title?: string;
    note?: string;
  }) => {
    // If plannedEndTime is provided, calculate plannedDuration
    const finalUpdates = { ...updates };
    if (updates.plannedEndTime && updates.plannedStartTime) {
      finalUpdates.plannedDuration = Math.round((updates.plannedEndTime - updates.plannedStartTime) / 1000);
    } else if (updates.plannedEndTime && !updates.plannedStartTime) {
      // If only end time changed, need start time from existing session
      const session = plannedSessions.find(s => s.id === sessionId);
      if (session && session.started_at) {
        finalUpdates.plannedDuration = Math.round((updates.plannedEndTime - session.started_at) / 1000);
      }
    }

    updateMutation.mutate(
      { sessionId, plannedDate: formattedDate, updates: finalUpdates },
      {
        onSuccess: () => {
          handleCloseDialog();
        },
      }
    );
  }, [updateMutation, formattedDate, handleCloseDialog, plannedSessions]);

  // Direct update from timeline drag/resize
  const handleSessionUpdate = useCallback((sessionId: string, updates: {
    plannedStartTime?: number;
    plannedEndTime?: number;
  }) => {
    // Calculate duration if both times are provided
    const finalUpdates: {
      plannedStartTime?: number;
      plannedDuration?: number;
    } = {};

    if (updates.plannedStartTime !== undefined) {
      finalUpdates.plannedStartTime = updates.plannedStartTime;
    }

    if (updates.plannedEndTime !== undefined && updates.plannedStartTime !== undefined) {
      finalUpdates.plannedDuration = Math.round((updates.plannedEndTime - updates.plannedStartTime) / 1000);
    } else if (updates.plannedEndTime !== undefined) {
      // Only end time changed
      const session = plannedSessions.find(s => s.id === sessionId);
      if (session && session.started_at) {
        finalUpdates.plannedDuration = Math.round((updates.plannedEndTime - session.started_at) / 1000);
      }
    } else if (updates.plannedStartTime !== undefined) {
      // Only start time changed, keep same duration
      const session = plannedSessions.find(s => s.id === sessionId);
      if (session) {
        finalUpdates.plannedDuration = session.duration || 3600;
      }
    }

    updateMutation.mutate({
      sessionId,
      plannedDate: formattedDate,
      updates: finalUpdates
    });
  }, [updateMutation, formattedDate, plannedSessions]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    if (confirm('Are you sure you want to delete this planned session?')) {
      deleteMutation.mutate({ sessionId, plannedDate: formattedDate });
    }
  }, [deleteMutation, formattedDate]);

  const handleStartSession = useCallback((sessionId: string) => {
    startMutation.mutate({ sessionId, plannedDate: formattedDate });
  }, [startMutation, formattedDate]);

  // Handle task drop from task column to timeline
  const handleTaskDrop = useCallback((taskId: string, startTime: number, sessionId?: string) => {
    const plannedDate = selectedDate.toISOString().split('T')[0];
    const plannedDuration = 60 * 60; // 1 hour in seconds

    if (sessionId) {
      // Dropping an unscheduled session to the timeline - schedule it
      updateMutation.mutate({
        sessionId,
        plannedDate,
        updates: {
          plannedStartTime: startTime,
          plannedDuration,
        },
      });
    } else {
      // Dropping a task to create a new scheduled session
      createMutation.mutate({
        taskId,
        plannedDate,
        plannedStartTime: startTime,
        plannedDuration,
      });
    }
  }, [createMutation, updateMutation, selectedDate]);

  // Handle unscheduling a session (drag from timeline to task column)
  const handleUnscheduleSession = useCallback((sessionId: string) => {
    unscheduleMutation.mutate({
      sessionId,
      plannedDate: formattedDate,
    });
  }, [unscheduleMutation, formattedDate]);

  // Separate scheduled and unscheduled sessions
  const { scheduledSessions, unscheduledSessions } = useMemo(() => {
    const scheduled: typeof plannedSessions = [];
    const unscheduled: typeof plannedSessions = [];

    plannedSessions.forEach((session) => {
      if (session.started_at === null) {
        unscheduled.push(session);
      } else {
        scheduled.push(session);
      }
    });

    return {
      scheduledSessions: scheduled.map((session) => ({
        ...session,
        status: session.status as 'planned' | 'active' | 'completed' | 'cancelled',
      })),
      unscheduledSessions: unscheduled.map((session) => ({
        ...session,
        status: session.status as 'planned' | 'active' | 'completed' | 'cancelled',
      })),
    };
  }, [plannedSessions]);

  const isLoading = isLoadingTasks || isLoadingSessions;

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center pb-20 lg:pb-0">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading todos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden pb-20 lg:pb-0">
      {/* Header */}
      <TodoHeader
        selectedDate={selectedDate}
        isToday={isToday}
        onPrev={goToPreviousDay}
        onNext={goToNextDay}
        onToday={goToToday}
        onCreateTodo={() => {
          setPreselectedTaskId(null);
          setPreselectedTime(null);
          setEditingSession(null);
          setIsDialogOpen(true);
        }}
      />

      {/* Main Content - Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Task List */}
        <div className="w-80 flex-shrink-0 border-r-2 border-border-strong flex flex-col">
          {/* Task List Header */}
          <div className="flex items-center gap-2 p-3 border-b-2 border-border-strong bg-primary/5 dark:bg-primary/10">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Tasks</span>
          </div>
          <div className="flex-1 overflow-auto">
            <TaskColumn
              tasks={tasks}
              plannedSessions={scheduledSessions}
              unscheduledSessions={unscheduledSessions}
              onCreateTodo={handleCreateTodo}
              onEditSession={handleEditSession}
              onDeleteSession={handleDeleteSession}
              onStartSession={handleStartSession}
              onSessionUnschedule={handleUnscheduleSession}
            />
          </div>
        </div>

        {/* Right Column - Todo Timeline */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Timeline Header */}
          <div className="flex items-center gap-2 p-3 border-b-2 border-border-strong bg-surface-elevated/30">
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className="font-semibold text-sm">Todo Timeline (12am - 12am)</span>
            <span className="text-xs text-muted-foreground ml-auto">
              Click and drag to create • Drag sessions to move • Resize edges
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <TodoTimeline
              plannedSessions={scheduledSessions}
              selectedDate={selectedDate}
              onSessionClick={handleEditSession}
              onTimeSlotClick={handleTimeSlotClick}
              onSessionUpdate={handleSessionUpdate}
              onTaskDrop={handleTaskDrop}
              onSessionUnschedule={handleUnscheduleSession}
              showTimeLabels={true}
              showHeader={false}
            />
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <CreateTodoDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        tasks={tasks}
        preselectedTaskId={preselectedTaskId}
        preselectedTime={preselectedTime}
        selectedDate={selectedDate}
        editingSession={editingSession}
        onCreate={handleCreateSubmit}
        onUpdate={handleUpdateSubmit}
        isSubmitting={isSubmitting}
        error={submitError}
      />
    </main>
  );
}
