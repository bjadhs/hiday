'use client';

import { useState, useCallback, useMemo } from 'react';
import { Loader2, CalendarDays, History } from 'lucide-react';
import { useTimeline } from '@/lib/hooks/use-timeline';
import { useUpdateSession } from '@/lib/hooks/use-sessions';
import { usePlannedSessions, useUpdatePlannedSession, useCreatePlannedSession } from '@/lib/hooks/use-planned-sessions';
import { DayNavigation } from '@/components/timeline/day-navigation';
import { SessionTimeline } from '@/components/timeline/session-timeline';
import { TodoTimeline } from '@/components/todos/todo-timeline';
import { HOURS, HOUR_HEIGHT } from '@/components/timeline/constants';
import { TimelineSession } from '@/components/timeline/types';
import { SessionEditDialog } from '@/components/track/session-edit-dialog';
import { CreateTodoDialog } from '@/components/todos/create-todo-dialog';
import { HistorySession, PlannedSession } from '@/lib/types';
import { useTasks } from '@/lib/hooks/use-tasks';

export default function TimelinePage() {
  // Timeline hook for sessions
  const {
    selectedDate,
    isMounted,
    now,
    startOfDay,
    isLoading: isLoadingSessions,
    timelineSessions,
    scrollContainerRef: sessionScrollRef,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    isToday,
  } = useTimeline();

  // Format date for planned sessions query
  const formattedDate = selectedDate.toISOString().split('T')[0];

  // Fetch planned sessions (todos)
  const { data: plannedSessions = [], isLoading: isLoadingPlanned } = usePlannedSessions(formattedDate);
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();

  // Mutations
  const updateSessionMutation = useUpdateSession();
  const updatePlannedMutation = useUpdatePlannedSession();
  const createPlannedMutation = useCreatePlannedSession();

  // Edit dialog state for sessions
  const [editingSession, setEditingSession] = useState<HistorySession | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Todo dialog state
  const [isTodoDialogOpen, setIsTodoDialogOpen] = useState(false);
  const [preselectedTaskId, setPreselectedTaskId] = useState<string | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<number | null>(null);
  const [editingPlannedSession, setEditingPlannedSession] = useState<PlannedSession | null>(null);

  // Handle edit session
  const handleEditSession = (session: TimelineSession) => {
    const historySession: HistorySession = {
      id: session.id,
      taskId: session.task.id,
      task: session.task,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration: session.duration,
      title: session.title,
      note: session.note,
    };
    setEditingSession(historySession);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingSession(null);
  };

  // Handle session drag/resize updates
  const handleSessionUpdate = useCallback((sessionId: string, updates: { startedAt?: number; endedAt?: number }) => {
    const updateData: { started_at?: number; ended_at?: number; duration?: number } = {};

    if (updates.startedAt !== undefined) {
      updateData.started_at = updates.startedAt;
    }

    if (updates.endedAt !== undefined) {
      updateData.ended_at = updates.endedAt;
    }

    // Recalculate duration if both times are available
    if (updates.startedAt && updates.endedAt) {
      updateData.duration = Math.round((updates.endedAt - updates.startedAt) / 1000);
    }

    updateSessionMutation.mutate({
      id: sessionId,
      updates: updateData,
    });
  }, [updateSessionMutation]);

  // Handle planned session (todo) click
  const handlePlannedSessionClick = useCallback((session: PlannedSession) => {
    setEditingPlannedSession(session);
    setPreselectedTaskId(null);
    setPreselectedTime(null);
    setIsTodoDialogOpen(true);
  }, []);

  // Handle time slot click for new todo
  const handleTimeSlotClick = useCallback((timestamp: number) => {
    setPreselectedTime(timestamp);
    setPreselectedTaskId(null);
    setEditingPlannedSession(null);
    setIsTodoDialogOpen(true);
  }, []);

  // Handle planned session update from drag/resize
  const handlePlannedSessionUpdate = useCallback((sessionId: string, updates: { plannedStartTime?: number; plannedEndTime?: number }) => {
    const finalUpdates: {
      plannedStartTime?: number;
      plannedDuration?: number;
    } = {};

    if (updates.plannedStartTime !== undefined) {
      finalUpdates.plannedStartTime = updates.plannedStartTime;
    }

    if (updates.plannedEndTime !== undefined && updates.plannedStartTime !== undefined) {
      finalUpdates.plannedDuration = Math.round((updates.plannedEndTime - updates.plannedStartTime) / 1000);
    }

    updatePlannedMutation.mutate({
      sessionId,
      plannedDate: formattedDate,
      updates: finalUpdates,
    });
  }, [updatePlannedMutation, formattedDate]);

  // Handle create todo submit
  const handleCreateTodoSubmit = useCallback((data: {
    taskId: string;
    plannedDate: string;
    plannedStartTime: number | null;
    plannedDuration: number;
    title?: string;
    note?: string;
  }) => {
    createPlannedMutation.mutate(data, {
      onSuccess: () => {
        setIsTodoDialogOpen(false);
        setPreselectedTaskId(null);
        setPreselectedTime(null);
      },
    });
  }, [createPlannedMutation]);

  // Handle update todo submit
  const handleUpdateTodoSubmit = useCallback((sessionId: string, updates: {
    plannedStartTime?: number | null;
    plannedEndTime?: number;
    plannedDuration?: number;
    title?: string;
    note?: string;
  }) => {
    const finalUpdates = { ...updates };
    if (updates.plannedEndTime && updates.plannedStartTime) {
      finalUpdates.plannedDuration = Math.round((updates.plannedEndTime - updates.plannedStartTime) / 1000);
    }

    updatePlannedMutation.mutate(
      { sessionId, plannedDate: formattedDate, updates: finalUpdates },
      {
        onSuccess: () => {
          setIsTodoDialogOpen(false);
          setEditingPlannedSession(null);
        },
      }
    );
  }, [updatePlannedMutation, formattedDate]);

  const handleCloseTodoDialog = useCallback(() => {
    setIsTodoDialogOpen(false);
    setPreselectedTaskId(null);
    setPreselectedTime(null);
    setEditingPlannedSession(null);
  }, []);

  const totalHeight = HOURS.length * HOUR_HEIGHT;

  const isLoading = isLoadingSessions || isLoadingPlanned || isLoadingTasks;

  if (isLoading) {
    return (
      <main className='flex-1 flex items-center justify-center pb-20 lg:pb-0'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='w-8 h-8 animate-spin text-primary' />
          <p className='text-muted-foreground'>Loading timeline...</p>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-0 overflow-hidden'>
      <div className='flex-1 p-4 lg:p-6 space-y-4 min-h-0'>
        {/* Header with date navigation */}
        <DayNavigation
          selectedDate={selectedDate}
          isMounted={isMounted}
          isToday={isToday}
          onPrev={goToPreviousDay}
          onNext={goToNextDay}
          onToday={goToToday}
        />

        {/* Split Timeline View */}
        <div className='flex-1 bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark rounded-xl shadow-brutal dark:shadow-brutal-dark overflow-hidden flex flex-col min-h-0'>
          {/* Timeline Headers */}
          <div className="flex border-b-2 border-border-strong dark:border-border-strong-dark">
            {/* Left Header - Todo Timeline */}
            <div className="flex-1 flex items-center gap-2 p-3 border-r-2 border-border-strong dark:border-border-strong-dark bg-primary/5 dark:bg-primary/10">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Planned (Todos)</span>
            </div>
            {/* Right Header - Session Timeline */}
            <div className="flex-1 flex items-center gap-2 p-3 bg-surface-elevated/30 dark:bg-surface-elevated-dark/30">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Completed Sessions</span>
            </div>
          </div>

          {/* Timelines Side by Side */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Side - Todo Timeline */}
            <div className="flex-1 border-r-2 border-border-strong dark:border-border-strong-dark min-w-0">
              <TodoTimeline
                plannedSessions={plannedSessions}
                selectedDate={selectedDate}
                onSessionClick={handlePlannedSessionClick}
                onTimeSlotClick={handleTimeSlotClick}
                onSessionUpdate={handlePlannedSessionUpdate}
                showTimeLabels={true}
                showHeader={false}
              />
            </div>

            {/* Right Side - Session Timeline */}
            <div className="flex-1 min-w-0">
              <SessionTimeline
                totalHeight={totalHeight}
                isToday={isToday}
                now={now}
                startOfDay={startOfDay}
                sessions={timelineSessions}
                onEditSession={handleEditSession}
                onSessionUpdate={handleSessionUpdate}
                showTimeLabels={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Session Dialog */}
      <SessionEditDialog
        session={editingSession}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
      />

      {/* Create/Edit Todo Dialog */}
      <CreateTodoDialog
        isOpen={isTodoDialogOpen}
        onClose={handleCloseTodoDialog}
        tasks={tasks}
        preselectedTaskId={preselectedTaskId}
        preselectedTime={preselectedTime}
        selectedDate={selectedDate}
        editingSession={editingPlannedSession}
        onCreate={handleCreateTodoSubmit}
        onUpdate={handleUpdateTodoSubmit}
        isSubmitting={createPlannedMutation.isPending || updatePlannedMutation.isPending}
        error={createPlannedMutation.error?.message || updatePlannedMutation.error?.message || null}
      />
    </main>
  );
}
