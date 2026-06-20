'use client';

import { useState, useCallback, useRef } from 'react';
import { Loader2, CalendarDays, History, Plus } from 'lucide-react';
import { useTimeline } from '@/lib/hooks/use-timeline';
import { useScrollToNow } from '@/lib/hooks/use-scroll-to-now';
import { useUpdateSession } from '@/lib/hooks/use-sessions';
import { usePlannedSessions, useUpdatePlannedSession, useCreatePlannedSession } from '@/lib/hooks/use-planned-sessions';
import { DayNavigation } from '@/components/timeline/day-navigation';
import { SessionTimeline } from '@/components/timeline/session-timeline';
import { TodoTimeline } from '@/components/todos/todo-timeline';
import { CurrentTimeIndicator } from '@/components/timeline/current-time-indicator';
import { TimeLabels } from '@/components/timeline/time-labels';
import { HOURS, HOUR_HEIGHT, TIME_COLUMN_WIDTH } from '@/components/timeline/constants';
import { TimelineSession } from '@/components/timeline/types';
import { SessionEditDialog } from '@/components/track/session-edit-dialog';
import { CreateTodoDialog } from '@/components/todos/create-todo-dialog';
import { HistorySession, PlannedSession } from '@/lib/types';
import { useProjects } from '@/lib/hooks/use-projects';

export default function TimelineContent() {
  // Timeline hook for sessions
  const {
    selectedDate,
    isMounted,
    now,
    startOfDay,
    isLoading: isLoadingSessions,
    timelineSessions,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    isToday,
  } = useTimeline();

  // Format date for planned sessions query
  const formattedDate = selectedDate.toISOString().split('T')[0];

  // Fetch planned sessions (todos)
  const { data: plannedSessions = [], isLoading: isLoadingPlanned } = usePlannedSessions(formattedDate);
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();

  // Mutations
  const updateSessionMutation = useUpdateSession();
  const updatePlannedMutation = useUpdatePlannedSession();
  const createPlannedMutation = useCreatePlannedSession();

  // Edit dialog state for sessions
  const [editingSession, setEditingSession] = useState<HistorySession | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Todo dialog state
  const [isTodoDialogOpen, setIsTodoDialogOpen] = useState(false);
  const [preselectedProjectId, setPreselectedProjectId] = useState<string | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<number | null>(null);
  const [editingPlannedSession, setEditingPlannedSession] = useState<PlannedSession | null>(null);

  // Handle edit session
  const handleEditSession = (session: TimelineSession) => {
    const historySession: HistorySession = {
      id: session.id,
      projectId: session.project.id,
      project: session.project,
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
    setPreselectedProjectId(null);
    setPreselectedTime(null);
    setIsTodoDialogOpen(true);
  }, []);

  // Open a fresh todo dialog from the header "Add" button (unscheduled by
  // default; the dialog defaults its start time to now if scheduled).
  const handleAddTodo = useCallback(() => {
    setEditingPlannedSession(null);
    setPreselectedProjectId(null);
    setPreselectedTime(null);
    setIsTodoDialogOpen(true);
  }, []);

  // Handle time slot click for new todo
  const handleTimeSlotClick = useCallback((timestamp: number) => {
    setPreselectedTime(timestamp);
    setPreselectedProjectId(null);
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
    projectId: string;
    plannedDate: string;
    plannedStartTime: number | null;
    plannedDuration: number;
    title?: string;
    note?: string;
  }) => {
    createPlannedMutation.mutate(data, {
      onSuccess: () => {
        setIsTodoDialogOpen(false);
        setPreselectedProjectId(null);
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
    setPreselectedProjectId(null);
    setPreselectedTime(null);
    setEditingPlannedSession(null);
  }, []);

  const totalHeight = HOURS.length * HOUR_HEIGHT;

  const isLoading = isLoadingSessions || isLoadingPlanned || isLoadingProjects;

  // Single shared scroll container for both planned + completed timelines.
  // Gate on !isLoading so the centering re-runs once the scroll container is
  // actually mounted (the page renders a loader first).
  const sharedScrollRef = useRef<HTMLDivElement>(null);
  useScrollToNow(sharedScrollRef, startOfDay, isToday && !isLoading);

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
    <main className='flex-1 h-screen flex flex-col pb-20 lg:pb-0 overflow-hidden'>
      <div className='flex-1 flex flex-col p-4 lg:p-6 gap-4 min-h-0'>
        {/* Header with date navigation */}
        <DayNavigation
          selectedDate={selectedDate}
          isMounted={isMounted}
          isToday={isToday}
          onPrev={goToPreviousDay}
          onNext={goToNextDay}
          onToday={goToToday}
        />

        {/* Split Timeline View — one shared scroll + one now-line for both columns */}
        <div className='flex-1 bg-surface border-2 border-border-strong rounded-xl shadow-brutal overflow-hidden flex flex-col min-h-0'>
          {/* Timeline Headers (spacer aligns with the shared time-labels column) */}
          <div className="flex border-b-2 border-border-strong">
            <div className="shrink-0 border-r-2 border-border-strong" style={{ width: TIME_COLUMN_WIDTH }} />
            {/* Left Header - Todo Timeline */}
            <div className="flex-1 flex items-center gap-2 p-3 border-r-2 border-border-strong bg-primary/5">
              <CalendarDays className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Planned (Todos)</span>
              <button
                type="button"
                onClick={handleAddTodo}
                className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                title="Add todo"
                aria-label="Add todo"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            {/* Right Header - Session Timeline */}
            <div className="flex-1 flex items-center gap-2 p-3 bg-surface-elevated/30">
              <History className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Running / Completed</span>
            </div>
          </div>

          {/* Single shared scroll container holding both grids */}
          <div ref={sharedScrollRef} className="flex-1 overflow-auto relative">
            <div className="flex" style={{ minHeight: totalHeight }}>
              <TimeLabels />
              {/* Positioning context for the single shared now-line spanning both grids */}
              <div className="relative flex-1 flex min-w-0">
                <TodoTimeline
                  embedded
                  scrollContainerRef={sharedScrollRef}
                  plannedSessions={plannedSessions}
                  selectedDate={selectedDate}
                  onSessionClick={handlePlannedSessionClick}
                  onTimeSlotClick={handleTimeSlotClick}
                  onSessionUpdate={handlePlannedSessionUpdate}
                  showTimeLabels={false}
                  showHeader={false}
                />
                <SessionTimeline
                  embedded
                  scrollContainerRef={sharedScrollRef}
                  totalHeight={totalHeight}
                  isToday={isToday}
                  now={now}
                  startOfDay={startOfDay}
                  sessions={timelineSessions}
                  onEditSession={handleEditSession}
                  onSessionUpdate={handleSessionUpdate}
                  showTimeLabels={false}
                />
                {isToday && (
                  <CurrentTimeIndicator now={now} startOfDay={startOfDay} totalHeight={totalHeight} />
                )}
              </div>
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
        projects={projects}
        preselectedProjectId={preselectedProjectId}
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
