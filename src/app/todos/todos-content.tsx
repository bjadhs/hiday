'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2, CheckSquare, CalendarDays } from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';
import {
  usePlannedSessions,
  useCreatePlannedSession,
  useUpdatePlannedSession,
  useDeletePlannedSession,
  useStartPlannedSession,
  usePausePlannedSession,
  useCompletePlannedSession,
  useUnschedulePlannedSession,
} from '@/lib/hooks/use-planned-sessions';
import { useActiveSessions } from '@/lib/hooks/use-sessions';
import { TodoHeader } from '@/components/todos/todo-header';
import { ProjectColumn } from '@/components/todos/project-column';
import { TodoTimeline } from '@/components/todos/todo-timeline';
import { CreateTodoDialog } from '@/components/todos/create-todo-dialog';
import type { PlannedSession } from '@/lib/types';

export default function TodosPage() {
  // Use fixed epoch date for SSR, sync to real date after hydration
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (typeof window === 'undefined') {
      return new Date(0);
    }
    return new Date();
  });

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preselectedProjectId, setPreselectedProjectId] = useState<string | null>(null);
  const [preselectedTime, setPreselectedTime] = useState<number | null>(null);
  const [editingSession, setEditingSession] = useState<PlannedSession | null>(null);

  // Most-recently-used project id — used as the default when creating a todo
  // directly from the timeline without picking a project.
  const [lastUsedProjectId, setLastUsedProjectId] = useState<string | null>(null);

  // Fetch data
  const formattedDate = selectedDate.toISOString().split('T')[0];
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: plannedSessions = [], isLoading: isLoadingSessions } = usePlannedSessions(formattedDate);
  // Running (active) sessions — a started todo flips to status='active' and so
  // drops out of the planned list; we re-add the ones on this day so they stay
  // visible on the timeline with a RUNNING tag.
  const { data: activeSessions = [] } = useActiveSessions();

  // Mutations
  const createMutation = useCreatePlannedSession();
  const updateMutation = useUpdatePlannedSession();
  const deleteMutation = useDeletePlannedSession();
  const startMutation = useStartPlannedSession();
  const pauseMutation = usePausePlannedSession();
  const completeMutation = useCompletePlannedSession();
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

  // Active projects, sorted by sort_order (excludes archived). Used as the
  // fallback default project when creating a todo directly from the timeline.
  const activeProjects = useMemo(
    () =>
      projects
        .filter((p) => !p.archived)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [projects]
  );

  // Resolve the default project for direct-create: MRU id if still active,
  // otherwise the first active project.
  const resolveDefaultProjectId = useCallback(() => {
    if (lastUsedProjectId && activeProjects.some((p) => p.id === lastUsedProjectId)) {
      return lastUsedProjectId;
    }
    return activeProjects[0]?.id ?? null;
  }, [lastUsedProjectId, activeProjects]);

  // Create todo handlers
  const handleTimeSlotClick = useCallback((timestamp: number, durationMs?: number) => {
    const defaultProjectId = resolveDefaultProjectId();

    // No projects available — fall back to the dialog so the user can pick one.
    if (!defaultProjectId) {
      setPreselectedProjectId(null);
      setPreselectedTime(timestamp);
      setEditingSession(null);
      setIsDialogOpen(true);
      return;
    }

    const plannedDuration = durationMs ? Math.round(durationMs / 1000) : 60 * 60;
    createMutation.mutate(
      {
        projectId: defaultProjectId,
        plannedDate: selectedDate.toISOString().split('T')[0],
        plannedStartTime: timestamp,
        plannedDuration,
      },
      {
        onSuccess: () => setLastUsedProjectId(defaultProjectId),
        onError: (error) => console.error('Direct create failed:', error),
      }
    );
  }, [resolveDefaultProjectId, createMutation, selectedDate]);

  const handleEditSession = useCallback((session: PlannedSession) => {
    setPreselectedProjectId(null);
    setPreselectedTime(null);
    setEditingSession(session);
    setIsDialogOpen(true);
  }, []);

  // Add a todo for a specific project (opens dialog with project preselected,
  // no time set so it lands as an unscheduled todo).
  const handleAddTodoForProject = useCallback((projectId: string) => {
    setPreselectedProjectId(projectId);
    setPreselectedTime(null);
    setEditingSession(null);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setPreselectedProjectId(null);
    setPreselectedTime(null);
    setEditingSession(null);
  }, []);

  // Form submission handlers
  const handleCreateSubmit = useCallback((data: {
    projectId: string;
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
        setLastUsedProjectId(data.projectId);
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

  // Pause a running session: freezes elapsed and returns it to the planned list.
  const handlePauseSession = useCallback((sessionId: string) => {
    pauseMutation.mutate({ sessionId, plannedDate: formattedDate });
  }, [pauseMutation, formattedDate]);

  // Stop a running session: completes it (start = actual started_at, end = now).
  const handleStopSession = useCallback((sessionId: string) => {
    const running = activeSessions.find((s) => s.id === sessionId);
    completeMutation.mutate({
      sessionId,
      plannedDate: formattedDate,
      actualStartTime: running?.started_at ?? undefined,
      actualEndTime: Date.now(),
    });
  }, [completeMutation, formattedDate, activeSessions]);

  // Handle project drop from project column to timeline
  const handleProjectDrop = useCallback((projectId: string, startTime: number, sessionId?: string) => {
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
      // Dropping a project to create a new scheduled session
      createMutation.mutate({
        projectId,
        plannedDate,
        plannedStartTime: startTime,
        plannedDuration,
      });
    }
  }, [createMutation, updateMutation, selectedDate]);

  // Handle unscheduling a session (drag from timeline to project column)
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

  // Count of scheduled todos per project — shown as an "on timeline" hint in
  // the (otherwise backlog-only) project column.
  const scheduledCountByProject = useMemo(() => {
    return scheduledSessions.reduce((acc, session) => {
      if (session.project_id) {
        acc[session.project_id] = (acc[session.project_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [scheduledSessions]);

  // Running sessions that fall on the selected day, normalized to the shape the
  // timeline expects (status forced to 'active' so the block shows as running).
  const runningSessions = useMemo(() => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const start = dayStart.getTime();
    const end = start + 24 * 60 * 60 * 1000;
    return activeSessions
      .filter((s) => s.started_at !== null && s.started_at >= start && s.started_at < end)
      .map((s) => ({ ...s, status: 'active' as const }));
  }, [activeSessions, selectedDate]);

  // Scheduled todos plus running sessions — both rendered on the timeline.
  const timelineSessions = useMemo(
    () => [...scheduledSessions, ...runningSessions],
    [scheduledSessions, runningSessions]
  );

  const isLoading = isLoadingProjects || isLoadingSessions;

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
    <main className="flex-1 h-screen flex flex-col overflow-hidden pb-20 lg:pb-0">
      {/* Header */}
      <TodoHeader
        selectedDate={selectedDate}
        isToday={isToday}
        onPrev={goToPreviousDay}
        onNext={goToNextDay}
        onToday={goToToday}
        onCreateTodo={() => {
          setPreselectedProjectId(null);
          setPreselectedTime(null);
          setEditingSession(null);
          setIsDialogOpen(true);
        }}
      />

      {/* Main Content - Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Project List */}
        <div className="w-80 flex-shrink-0 border-r-2 border-border-strong flex flex-col">
          {/* Project List Header */}
          <div className="flex items-center gap-2.5 p-4 border-b-2 border-border-strong bg-primary/5 dark:bg-primary/10">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span className="font-bold text-base">Projects</span>
          </div>
          <div className="flex-1 overflow-auto">
            <ProjectColumn
              projects={projects}
              unscheduledSessions={unscheduledSessions}
              scheduledCountByProject={scheduledCountByProject}
              onEditSession={handleEditSession}
              onDeleteSession={handleDeleteSession}
              onSessionUnschedule={handleUnscheduleSession}
              onAddTodo={handleAddTodoForProject}
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
              Click or drag to add a todo • Drag sessions to move • Resize edges
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <TodoTimeline
              plannedSessions={timelineSessions}
              selectedDate={selectedDate}
              onSessionClick={handleEditSession}
              onTimeSlotClick={handleTimeSlotClick}
              onSessionUpdate={handleSessionUpdate}
              onProjectDrop={handleProjectDrop}
              onSessionUnschedule={handleUnscheduleSession}
              onSessionStart={handleStartSession}
              onSessionPause={handlePauseSession}
              onSessionStop={handleStopSession}
              onSessionDelete={handleDeleteSession}
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
        projects={projects}
        preselectedProjectId={preselectedProjectId}
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
