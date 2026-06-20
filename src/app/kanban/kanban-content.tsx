'use client';

import { useState, useMemo, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useKProjects } from '@/lib/hooks/use-kprojects';
import { useProjects } from '@/lib/hooks/use-projects';
import {
  useKanbanSessions,
  useInboxSessions,
  useUpdateKanbanStatus,
  useCreateKanbanTodo,
  useCreateInboxTodo,
  useUpdateKanbanTodo,
  useDeleteKanbanTodo,
  useStartKanbanSession,
} from '@/lib/hooks/use-kanban';
import { useStopSession } from '@/lib/hooks/use-sessions';
import { KanbanHeader } from '@/components/kanban/kanban-header';
import { KProjectsPanel } from '@/components/kanban/kprojects-panel';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { CreateKanbanTodoDialog } from '@/components/kanban/create-kanban-todo-dialog';
import type { KanbanSessionWithActiveState, PlannedSessionWithProject } from '@/actions/planned-sessions';
import type { KanbanStatus } from '@/lib/types';

export default function KanbanContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedKProjectIds, setExpandedKProjectIds] = useState<Set<string>>(new Set());

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [dialogDefaults, setDialogDefaults] = useState<{
    kprojectId: string | null;
    kanbanStatus: KanbanStatus;
  }>({
    kprojectId: null,
    kanbanStatus: 'next',
  });
  const [editingSession, setEditingSession] =
    useState<(PlannedSessionWithProject & { activeSessionStartedAt?: number | null }) | null>(null);

  const [pendingInbox, setPendingInbox] = useState<{
    kprojectId: string | null;
    title: string;
    defaultProjectId?: string;
  } | null>(null);

  const { data: kprojects = [], isLoading: isLoadingKProjects } = useKProjects();
  const { data: sessions = [], isLoading: isLoadingSessions } =
    useKanbanSessions(undefined);
  const { data: inboxSessions = [], isLoading: isLoadingInbox } =
    useInboxSessions();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();

  const startKanbanMutation = useStartKanbanSession();
  const stopSessionMutation = useStopSession();
  const createTodoMutation = useCreateKanbanTodo();
  const createInboxMutation = useCreateInboxTodo();
  const updateTodoMutation = useUpdateKanbanTodo();
  const deleteTodoMutation = useDeleteKanbanTodo();
  const updateStatusMutation = useUpdateKanbanStatus();

  const isLoading =
    isLoadingKProjects || isLoadingSessions || isLoadingInbox || isLoadingProjects;

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

  const toggleKProjectExpand = useCallback((kprojectId: string) => {
    setExpandedKProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(kprojectId)) {
        next.delete(kprojectId);
      } else {
        next.add(kprojectId);
      }
      return next;
    });
  }, []);

  const openCreateDialog = useCallback(
    (defaults: { kprojectId?: string | null; kanbanStatus?: KanbanStatus }) => {
      setEditingSession(null);
      setDialogDefaults({
        kprojectId: defaults.kprojectId ?? null,
        kanbanStatus: defaults.kanbanStatus ?? 'next',
      });
      setDialogKey((prev) => prev + 1);
      setIsDialogOpen(true);
    },
    []
  );

  const openEditDialog = useCallback(
    (
      session: PlannedSessionWithProject | KanbanSessionWithActiveState,
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
        kprojectId: session.kproject_id,
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
      projectId: string;
      kprojectId: string | null;
      kanbanStatus: KanbanStatus;
      duration: number;
      title?: string;
      note?: string;
    }) => {
      const { projectId, kprojectId, kanbanStatus, duration, title, note } = data;
      if (kanbanStatus === 'inbox') return;

      createTodoMutation.mutate(
        { projectId, kprojectId, kanbanStatus, duration, title, note },
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
        projectId?: string | null;
        kprojectId?: string | null;
        kanbanStatus?: KanbanStatus;
        duration?: number;
        plannedStartTime?: number | null;
        plannedEndTime?: number | null;
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

      startKanbanMutation.mutate({ sessionId });
    },
    [sessions, startKanbanMutation]
  );

  const handleStopSession = useCallback(
    async (activeSessionId: string) => {
      await stopSessionMutation.mutateAsync(activeSessionId);
    },
    [stopSessionMutation]
  );

  const handleCreateInbox = useCallback(
    (kprojectId: string | null, defaultProjectId?: string) => {
      setPendingInbox({ kprojectId, title: '', defaultProjectId });
      setExpandedKProjectIds((prev) => new Set(prev).add(kprojectId ?? 'default'));
    },
    []
  );

  const handlePendingTitleChange = useCallback((title: string) => {
    setPendingInbox((prev) => (prev ? { ...prev, title } : null));
  }, []);

  const handleSavePendingInbox = useCallback(
    (kprojectId: string | null) => {
      const title = pendingInbox?.title.trim();
      if (!title) {
        setPendingInbox(null);
        return;
      }

      createInboxMutation.mutate(
        { kprojectId, projectId: pendingInbox?.defaultProjectId, title },
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

      if (!session.project_id) {
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
        <KProjectsPanel
          kprojects={kprojects}
          inboxSessions={inboxSessions}
          kanbanSessions={sessions}
          expandedKProjectIds={expandedKProjectIds}
          onToggleExpand={toggleKProjectExpand}
          onCreateInbox={handleCreateInbox}
          onEditSession={openEditDialog}
          pendingInbox={pendingInbox}
          onPendingTitleChange={handlePendingTitleChange}
          onSavePendingInbox={handleSavePendingInbox}
          onCancelPendingInbox={handleCancelPendingInbox}
          projects={projects}
        />

        <div className="flex-1 min-w-0 overflow-hidden">
          <KanbanBoard
            sessionsByStatus={sessionsByStatus}
            onStartSession={handleStartSession}
            onStopSession={handleStopSession}
            onEditSession={openEditDialog}
            onAddTodo={openCreateDialog}
            onInboxDrop={handleInboxDrop}
            searchQuery={searchQuery}
            kprojects={kprojects}
          />
        </div>
      </div>

      <CreateKanbanTodoDialog
        key={dialogKey}
        isOpen={isDialogOpen}
        onClose={closeDialog}
        projects={projects}
        kprojects={kprojects}
        defaultKProjectId={dialogDefaults.kprojectId}
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
