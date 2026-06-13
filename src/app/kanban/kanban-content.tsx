'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';
import {
  useKanbanSessions,
  useInboxSessions,
  useUpdateKanbanStatus,
  useCreateKanbanTodo,
  useCreateInboxTodo,
  useUpdateKanbanTodo,
  useDeleteKanbanTodo,
} from '@/lib/hooks/use-kanban';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useStartPlannedSession } from '@/lib/hooks/use-planned-sessions';
import { KanbanHeader } from '@/components/kanban/kanban-header';
import { ProjectsPanel } from '@/components/kanban/projects-panel';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { CreateKanbanTodoDialog } from '@/components/kanban/create-kanban-todo-dialog';
import type { PlannedSessionWithTask } from '@/actions/planned-sessions';
import type { KanbanStatus } from '@/lib/types';

export default function KanbanContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [dialogDefaults, setDialogDefaults] = useState<{
    projectId: string | null;
    kanbanStatus: KanbanStatus;
  }>({
    projectId: null,
    kanbanStatus: 'next',
  });
  const [editingSession, setEditingSession] =
    useState<PlannedSessionWithTask | null>(null);

  const [pendingInbox, setPendingInbox] = useState<{
    projectId: string | null;
    title: string;
    defaultTaskId?: string;
  } | null>(null);

  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: sessions = [], isLoading: isLoadingSessions } =
    useKanbanSessions(undefined);
  const { data: inboxSessions = [], isLoading: isLoadingInbox } =
    useInboxSessions();
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();

  const startMutation = useStartPlannedSession();
  const createTodoMutation = useCreateKanbanTodo();
  const createInboxMutation = useCreateInboxTodo();
  const updateTodoMutation = useUpdateKanbanTodo();
  const deleteTodoMutation = useDeleteKanbanTodo();
  const updateStatusMutation = useUpdateKanbanStatus();

  const isLoading =
    isLoadingProjects || isLoadingSessions || isLoadingInbox || isLoadingTasks;

  const sessionsByStatus = useMemo(() => {
    const grouped: Record<KanbanStatus, typeof sessions> = {
      inbox: [],
      next: [],
      doing: [],
      done: [],
      revise: [],
    };

    sessions.forEach((session) => {
      const status = (session.kanban_status ?? 'next') as KanbanStatus;
      grouped[status].push(session);
    });

    return grouped;
  }, [sessions]);

  const toggleProjectExpand = useCallback((projectId: string) => {
    setExpandedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }, []);

  const openCreateDialog = useCallback(
    (defaults: { projectId?: string | null; kanbanStatus?: KanbanStatus }) => {
      setEditingSession(null);
      setDialogDefaults({
        projectId: defaults.projectId ?? null,
        kanbanStatus: defaults.kanbanStatus ?? 'next',
      });
      setDialogKey((prev) => prev + 1);
      setIsDialogOpen(true);
    },
    []
  );

  const openEditDialog = useCallback(
    (
      session: PlannedSessionWithTask,
      overrides?: { kanbanStatus?: KanbanStatus }
    ) => {
      setEditingSession({
        ...session,
        kanban_status:
          overrides?.kanbanStatus ??
          (session.kanban_status as KanbanStatus) ??
          'next',
      });
      setDialogDefaults({
        projectId: session.project_id,
        kanbanStatus:
          overrides?.kanbanStatus ??
          (session.kanban_status as KanbanStatus) ??
          'next',
      });
      setDialogKey((prev) => prev + 1);
      setIsDialogOpen(true);
    },
    []
  );

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingSession(null);
  }, []);

  const handleCreateTodo = useCallback(
    (data: {
      taskId: string;
      projectId: string | null;
      kanbanStatus: KanbanStatus;
      duration: number;
      title?: string;
      note?: string;
    }) => {
      const { taskId, projectId, kanbanStatus, duration, title, note } = data;
      if (kanbanStatus === 'inbox') return;

      createTodoMutation.mutate(
        { taskId, projectId, kanbanStatus, duration, title, note },
        {
          onSuccess: () => {
            closeDialog();
          },
        }
      );
    },
    [createTodoMutation, closeDialog]
  );

  const handleUpdateTodo = useCallback(
    (
      sessionId: string,
      data: {
        taskId?: string | null;
        projectId?: string | null;
        kanbanStatus?: KanbanStatus;
        duration?: number;
        title?: string | null;
        note?: string | null;
      }
    ) => {
      updateTodoMutation.mutate(
        { sessionId, updates: data },
        {
          onSuccess: () => {
            closeDialog();
          },
        }
      );
    },
    [updateTodoMutation, closeDialog]
  );

  const handleDeleteTodo = useCallback(
    (sessionId: string) => {
      deleteTodoMutation.mutate(sessionId, {
        onSuccess: () => {
          closeDialog();
        },
      });
    },
    [deleteTodoMutation, closeDialog]
  );

  const handleStartSession = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      startMutation.mutate({
        sessionId,
        plannedDate: session.session_date,
      });
    },
    [sessions, startMutation]
  );

  const handleCreateInbox = useCallback(
    (projectId: string | null, defaultTaskId?: string) => {
      setPendingInbox({ projectId, title: '', defaultTaskId });
      setExpandedProjectIds((prev) => new Set(prev).add(projectId ?? 'default'));
    },
    []
  );

  const handlePendingTitleChange = useCallback((title: string) => {
    setPendingInbox((prev) => (prev ? { ...prev, title } : null));
  }, []);

  const handleSavePendingInbox = useCallback(
    (projectId: string | null) => {
      const title = pendingInbox?.title.trim();
      if (!title) {
        setPendingInbox(null);
        return;
      }

      createInboxMutation.mutate(
        { projectId, taskId: pendingInbox?.defaultTaskId, title },
        {
          onSuccess: () => {
            setPendingInbox(null);
          },
        }
      );
    },
    [pendingInbox, createInboxMutation]
  );

  const handleCancelPendingInbox = useCallback(() => {
    setPendingInbox(null);
  }, []);

  const handleInboxDrop = useCallback(
    (sessionId: string, columnId: KanbanStatus) => {
      const session = inboxSessions.find((s) => s.id === sessionId);
      if (!session) return;

      if (!session.task_id) {
        openEditDialog(session, { kanbanStatus: columnId });
        return;
      }

      updateStatusMutation.mutate({
        sessionId,
        kanbanStatus: columnId as Exclude<KanbanStatus, 'inbox'>,
      });
    },
    [inboxSessions, openEditDialog, updateStatusMutation]
  );

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center pb-20 lg:pb-0">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading kanban board...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden pb-20 lg:pb-0">
      <KanbanHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewTodo={() => openCreateDialog({})}
      />

      <div className="flex flex-1 overflow-hidden">
        <ProjectsPanel
          projects={projects}
          inboxSessions={inboxSessions}
          kanbanSessions={sessions}
          expandedProjectIds={expandedProjectIds}
          onToggleExpand={toggleProjectExpand}
          onCreateInbox={handleCreateInbox}
          onEditSession={openEditDialog}
          pendingInbox={pendingInbox}
          onPendingTitleChange={handlePendingTitleChange}
          onSavePendingInbox={handleSavePendingInbox}
          onCancelPendingInbox={handleCancelPendingInbox}
          tasks={tasks}
        />

        <div className="flex-1 min-w-0 overflow-hidden">
          <KanbanBoard
            sessionsByStatus={sessionsByStatus}
            onStartSession={handleStartSession}
            onEditSession={openEditDialog}
            onAddTodo={openCreateDialog}
            onInboxDrop={handleInboxDrop}
            searchQuery={searchQuery}
            projects={projects}
          />
        </div>
      </div>

      <CreateKanbanTodoDialog
        key={dialogKey}
        isOpen={isDialogOpen}
        onClose={closeDialog}
        tasks={tasks}
        projects={projects}
        defaultProjectId={dialogDefaults.projectId}
        defaultKanbanStatus={dialogDefaults.kanbanStatus}
        editingSession={editingSession}
        onCreate={handleCreateTodo}
        onUpdate={handleUpdateTodo}
        onDelete={editingSession ? handleDeleteTodo : undefined}
        isSubmitting={
          createTodoMutation.isPending || updateTodoMutation.isPending
        }
        isDeleting={deleteTodoMutation.isPending}
      />
    </main>
  );
}
