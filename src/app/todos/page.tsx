'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useTasks } from '@/lib/hooks/use-tasks';
import {
  usePlannedSessions,
  useCreatePlannedSession,
  useUpdatePlannedSession,
  useDeletePlannedSession,
  useStartPlannedSession,
} from '@/lib/hooks/use-planned-sessions';
import { TodoHeader } from './components/todo-header';
import { TaskColumn } from './components/task-column';
import { PlanningTimeline } from './components/planning-timeline';
import { CreateTodoDialog } from './components/create-todo-dialog';
import type { PlannedSession } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';

export default function TodosPage() {
  // Date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
    plannedStartTime: number;
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
    plannedStartTime?: number;
    plannedDuration?: number;
    title?: string;
    note?: string;
  }) => {
    updateMutation.mutate(
      { sessionId, plannedDate: formattedDate, updates },
      {
        onSuccess: () => {
          handleCloseDialog();
        },
      }
    );
  }, [updateMutation, formattedDate, handleCloseDialog]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    if (confirm('Are you sure you want to delete this planned session?')) {
      deleteMutation.mutate({ sessionId, plannedDate: formattedDate });
    }
  }, [deleteMutation, formattedDate]);

  const handleStartSession = useCallback((sessionId: string) => {
    startMutation.mutate({ sessionId, plannedDate: formattedDate });
  }, [startMutation, formattedDate]);

  // Convert planned sessions to DB format for child components
  const dbPlannedSessions = useMemo(() => {
    return plannedSessions.map((session) => ({
      ...session,
      status: session.status as 'planned' | 'active' | 'completed' | 'cancelled',
    }));
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

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Task List */}
        <div className="w-80 flex-shrink-0 border-r-2 border-border-strong dark:border-border-strong-dark">
          <TaskColumn
            tasks={tasks}
            plannedSessions={dbPlannedSessions}
            onCreateTodo={handleCreateTodo}
            onEditSession={handleEditSession}
            onDeleteSession={handleDeleteSession}
            onStartSession={handleStartSession}
          />
        </div>

        {/* Right Column - Timeline */}
        <div className="flex-1 min-w-0">
          <PlanningTimeline
            plannedSessions={dbPlannedSessions}
            selectedDate={selectedDate}
            onSessionClick={handleEditSession}
            onTimeSlotClick={handleTimeSlotClick}
          />
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
