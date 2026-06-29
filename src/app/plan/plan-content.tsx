'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';
import {
  usePlanDaySessions,
  useTimerSessionsForDate,
  useCreatePlanSession,
  useUpdatePlanSession,
  useDeletePlanSession,
} from '@/lib/hooks/use-plan';
import { TodoTimeline, CreateTodoDialog } from '@/components/todos';
import { PlanMarkdownPane } from '@/components/plan/plan-markdown-pane';
import {
  generatePlanMarkdown,
  parsePlanBlocksFromMarkdown,
  planRowKey,
  type PlanMarkdownRow,
  type TimerMarkdownRow,
} from '@/lib/plan-markdown';
import type { PlannedSession } from '@/lib/types';

const MARKDOWN_SYNC_DEBOUNCE_MS = 800;

export default function PlanContent() {
  // Dynamically imported with ssr: false (see plan-wrapper.tsx), but kept
  // SSR-safe regardless — matches the same epoch-fallback pattern /todos uses.
  const [selectedDate] = useState<Date>(() => (typeof window === 'undefined' ? new Date(0) : new Date()));
  const formattedDate = selectedDate.toISOString().split('T')[0];

  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const { data: planSessions = [], isLoading: isLoadingPlans } = usePlanDaySessions(formattedDate);
  const { data: timerSessions = [], isLoading: isLoadingTimers } = useTimerSessionsForDate(formattedDate);

  const createPlanSession = useCreatePlanSession();
  const updatePlanSession = useUpdatePlanSession();
  const deletePlanSession = useDeletePlanSession();

  // Edit dialog state (plan blocks only — timer blocks have their own
  // read-only popover built into TimerSessionBlock).
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preselectedTime, setPreselectedTime] = useState<number | null>(null);
  const [editingSession, setEditingSession] = useState<PlannedSession | null>(null);
  const [lastUsedProjectId, setLastUsedProjectId] = useState<string | null>(null);

  const activeProjects = useMemo(
    () => [...projects].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
    [projects]
  );

  const resolveDefaultProjectId = useCallback(() => {
    if (lastUsedProjectId && activeProjects.some((p) => p.id === lastUsedProjectId)) {
      return lastUsedProjectId;
    }
    return activeProjects[0]?.id ?? null;
  }, [lastUsedProjectId, activeProjects]);

  const resolveProjectIdByName = useCallback(
    (name: string | null) => {
      if (!name) return undefined;
      return activeProjects.find((p) => p.name.toLowerCase() === name.trim().toLowerCase())?.id;
    },
    [activeProjects]
  );

  // Drag-to-create on the timeline behaves like /todos: create directly with
  // the default project, only falling back to the dialog when there's none.
  const handleTimeSlotClick = useCallback(
    (timestamp: number, durationMs?: number) => {
      const defaultProjectId = resolveDefaultProjectId();
      if (!defaultProjectId) {
        setPreselectedTime(timestamp);
        setEditingSession(null);
        setIsDialogOpen(true);
        return;
      }

      const plannedDuration = durationMs ? Math.round(durationMs / 1000) : 60 * 60;
      createPlanSession.mutate(
        { projectId: defaultProjectId, plannedDate: formattedDate, plannedStartTime: timestamp, plannedDuration },
        { onSuccess: () => setLastUsedProjectId(defaultProjectId) }
      );
    },
    [resolveDefaultProjectId, createPlanSession, formattedDate]
  );

  const handleSessionClick = useCallback((session: PlannedSession) => {
    setPreselectedTime(null);
    setEditingSession(session);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setPreselectedTime(null);
    setEditingSession(null);
  }, []);

  const handleCreateSubmit = useCallback(
    (data: {
      projectId: string;
      plannedDate: string;
      plannedStartTime: number | null;
      plannedDuration: number;
      title?: string;
      note?: string;
    }) => {
      createPlanSession.mutate(data, {
        onSuccess: () => {
          setLastUsedProjectId(data.projectId);
          handleCloseDialog();
        },
      });
    },
    [createPlanSession, handleCloseDialog]
  );

  const handleUpdateSubmit = useCallback(
    (
      sessionId: string,
      updates: {
        projectId?: string;
        plannedStartTime?: number | null;
        plannedDuration?: number;
        title?: string;
        note?: string;
      }
    ) => {
      updatePlanSession.mutate(
        { sessionId, plannedDate: formattedDate, updates },
        { onSuccess: () => handleCloseDialog() }
      );
    },
    [updatePlanSession, formattedDate, handleCloseDialog]
  );

  // Direct update from timeline drag/resize (mirrors /todos's handleSessionUpdate).
  const handleSessionUpdate = useCallback(
    (sessionId: string, updates: { plannedStartTime?: number; plannedEndTime?: number }) => {
      const finalUpdates: { plannedStartTime?: number; plannedDuration?: number } = {};

      if (updates.plannedStartTime !== undefined) {
        finalUpdates.plannedStartTime = updates.plannedStartTime;
      }

      if (updates.plannedEndTime !== undefined && updates.plannedStartTime !== undefined) {
        finalUpdates.plannedDuration = Math.round((updates.plannedEndTime - updates.plannedStartTime) / 1000);
      } else if (updates.plannedEndTime !== undefined) {
        const session = planSessions.find((s) => s.id === sessionId);
        if (session && session.started_at) {
          finalUpdates.plannedDuration = Math.round((updates.plannedEndTime - session.started_at) / 1000);
        }
      } else if (updates.plannedStartTime !== undefined) {
        const session = planSessions.find((s) => s.id === sessionId);
        if (session) {
          finalUpdates.plannedDuration = session.duration || 3600;
        }
      }

      updatePlanSession.mutate({ sessionId, plannedDate: formattedDate, updates: finalUpdates });
    },
    [updatePlanSession, formattedDate, planSessions]
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      if (confirm('Delete this plan?')) {
        deletePlanSession.mutate({ sessionId, plannedDate: formattedDate });
      }
    },
    [deletePlanSession, formattedDate]
  );

  /* ---------------------------------------------------------------------- */
  /*  Markdown pane — bidirectional sync                                    */
  /* ---------------------------------------------------------------------- */

  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  // True while the user has unsynced keystrokes (or a sync is in flight) so
  // the canonical markdown below doesn't clobber their typing.
  const pendingEditRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Timeline -> markdown: derived directly from the query data (not an
  // effect+setState — the markdown text doesn't need its own state at all
  // when nothing is being actively edited).
  const canonicalMarkdown = useMemo(() => {
    const planRows: PlanMarkdownRow[] = planSessions
      .filter((s) => s.started_at != null && s.ended_at != null)
      .map((s) => ({
        id: s.id,
        title: s.title,
        startTime: s.started_at!,
        endTime: s.ended_at!,
        projectName: s.projects?.name || 'No project',
        status: s.status as 'planned' | 'active' | 'completed' | 'cancelled',
      }));

    const timerRows: TimerMarkdownRow[] = timerSessions
      .filter((s) => s.started_at != null)
      .map((s) => ({
        id: s.id,
        title: s.title,
        startTime: s.started_at!,
        endTime: s.ended_at,
        durationSeconds: s.duration,
        projectName: s.projects?.name || 'No project',
      }));

    return generatePlanMarkdown(selectedDate, planRows, timerRows);
  }, [planSessions, timerSessions, selectedDate]);

  // While the user has a pending edit (typing, or a sync still in flight) the
  // draft text wins over the regenerated canonical text; once sync settles
  // the draft is cleared and the (now up to date) canonical text takes over.
  const [draftMarkdown, setDraftMarkdown] = useState<string | null>(null);
  const markdown = draftMarkdown ?? canonicalMarkdown;

  // Markdown -> timeline: parse the "## Plans" blocks and diff against what's
  // currently on the timeline. Matching is by the rendered (start, end, title)
  // triplet — see plan-markdown.ts for why that's deliberately simple.
  const syncMarkdownToTimeline = useCallback(
    async (text: string) => {
      setSyncStatus('Syncing…');
      try {
        const parsedBlocks = parsePlanBlocksFromMarkdown(text, selectedDate);

        const existingByKey = new Map<string, (typeof planSessions)[number]>();
        for (const row of planSessions) {
          if (row.started_at == null || row.ended_at == null) continue;
          existingByKey.set(planRowKey({ title: row.title, startTime: row.started_at, endTime: row.ended_at }), row);
        }

        const matchedIds = new Set<string>();

        for (const block of parsedBlocks) {
          const existing = existingByKey.get(block.key);
          if (existing) {
            matchedIds.add(existing.id);
            const resolvedProjectId = resolveProjectIdByName(block.projectName);
            if (resolvedProjectId && resolvedProjectId !== existing.project_id) {
              await updatePlanSession.mutateAsync({
                sessionId: existing.id,
                plannedDate: formattedDate,
                updates: { projectId: resolvedProjectId },
              });
            }
            continue;
          }

          const projectId = resolveProjectIdByName(block.projectName) ?? activeProjects[0]?.id;
          if (!projectId) continue; // nothing to assign the new plan to — skip rather than guess

          const durationSeconds = Math.max(60, Math.round((block.endTime - block.startTime) / 1000));
          await createPlanSession.mutateAsync({
            projectId,
            plannedDate: formattedDate,
            plannedStartTime: block.startTime,
            plannedDuration: durationSeconds,
            title: block.title,
          });
        }

        for (const [, row] of existingByKey) {
          if (!matchedIds.has(row.id)) {
            await deletePlanSession.mutateAsync({ sessionId: row.id, plannedDate: formattedDate });
          }
        }

        setSyncStatus('Synced');
      } catch {
        setSyncStatus('Sync failed');
      } finally {
        pendingEditRef.current = false;
        setDraftMarkdown(null);
      }
    },
    [selectedDate, planSessions, activeProjects, formattedDate, resolveProjectIdByName, createPlanSession, updatePlanSession, deletePlanSession]
  );

  const handleMarkdownChange = useCallback(
    (text: string) => {
      setDraftMarkdown(text);
      pendingEditRef.current = true;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        void syncMarkdownToTimeline(text);
      }, MARKDOWN_SYNC_DEBOUNCE_MS);
    },
    [syncMarkdownToTimeline]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const isLoading = isLoadingProjects || isLoadingPlans || isLoadingTimers;

  if (isLoading) {
    return (
      <main className="flex-1 flex items-center justify-center pb-20 lg:pb-0">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your plan...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 h-screen flex flex-col overflow-hidden pb-20 lg:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 border-b-2 border-border-strong">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
          <p className="text-sm text-muted-foreground">
            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block text-right max-w-xs">
          Click and drag to plan • Drag to move • Resize edges • Edit the markdown to sync
        </p>
      </div>

      {/* Split view: 60% timeline / 40% markdown */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-[3] min-w-0 flex flex-col border-r-2 border-border-strong">
          <TodoTimeline
            plannedSessions={planSessions}
            readOnlySessions={timerSessions}
            selectedDate={selectedDate}
            onSessionClick={handleSessionClick}
            onTimeSlotClick={handleTimeSlotClick}
            onSessionUpdate={handleSessionUpdate}
            onSessionDelete={handleDeleteSession}
            showTimeLabels
            showHeader={false}
          />
        </div>

        <div className="flex-[2] min-w-0 flex flex-col">
          <PlanMarkdownPane
            value={markdown}
            onChange={handleMarkdownChange}
            isLoading={isLoading}
            syncStatus={syncStatus ?? undefined}
          />
        </div>
      </div>

      {/* Plan edit/create dialog — project stays editable, unlike /todos */}
      <CreateTodoDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        projects={projects}
        preselectedProjectId={null}
        preselectedTime={preselectedTime}
        selectedDate={selectedDate}
        editingSession={editingSession}
        onCreate={handleCreateSubmit}
        onUpdate={handleUpdateSubmit}
        isSubmitting={createPlanSession.isPending || updatePlanSession.isPending || deletePlanSession.isPending}
        error={createPlanSession.error?.message || updatePlanSession.error?.message || null}
        allowProjectChange
      />
    </main>
  );
}
