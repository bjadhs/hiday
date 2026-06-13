'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { useUpdateKanbanStatus } from '@/lib/hooks/use-kanban';
import type { PlannedSessionWithTask } from '@/actions/planned-sessions';
import type { KanbanStatus, Project } from '@/lib/types';

const COLUMNS: { id: KanbanStatus; title: string; color: string }[] = [
  { id: 'next', title: 'Next', color: '#3B82F6' },
  { id: 'doing', title: 'Doing', color: '#F59E0B' },
  { id: 'done', title: 'Done', color: '#10B981' },
];

interface KanbanBoardProps {
  sessionsByStatus: Record<KanbanStatus, PlannedSessionWithTask[]>;
  onStartSession: (sessionId: string) => void;
  onEditSession: (session: PlannedSessionWithTask) => void;
  onAddTodo: (defaults: { projectId: string | null; kanbanStatus: KanbanStatus }) => void;
  onInboxDrop: (sessionId: string, columnId: KanbanStatus) => void;
  searchQuery: string;
  projects: Project[];
}

export function KanbanBoard({
  sessionsByStatus,
  onStartSession,
  onEditSession,
  onAddTodo,
  onInboxDrop,
  searchQuery,
  projects,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateKanbanStatus = useUpdateKanbanStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const allSessions = useMemo(() => {
    return Object.values(sessionsByStatus).flat();
  }, [sessionsByStatus]);

  const activeSession = useMemo(() => {
    if (!activeId) return null;
    return allSessions.find((s) => s.id === activeId) ?? null;
  }, [activeId, allSessions]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const sessionId = active.id as string;
      const overId = over.id as string;

      // Determine target column
      let newStatus: KanbanStatus | null = null;

      const isColumn = COLUMNS.some((c) => c.id === overId);
      if (isColumn) {
        newStatus = overId as KanbanStatus;
      } else {
        const targetSession = allSessions.find((s) => s.id === overId);
        if (targetSession) {
          newStatus = targetSession.kanban_status as KanbanStatus;
        }
      }

      if (!newStatus) return;

      const session = allSessions.find((s) => s.id === sessionId);
      if (session && session.kanban_status !== newStatus) {
        updateKanbanStatus.mutate({
          sessionId,
          kanbanStatus: newStatus as Exclude<KanbanStatus, 'inbox'>,
        });
      }
    },
    [allSessions, updateKanbanStatus]
  );

  const filteredSessionsByStatus = useMemo(() => {
    if (!searchQuery.trim()) return sessionsByStatus;

    const query = searchQuery.toLowerCase();
    const filtered: Record<KanbanStatus, PlannedSessionWithTask[]> = {
      inbox: [],
      next: [],
      doing: [],
      done: [],
      revise: [],
    };

    (Object.keys(sessionsByStatus) as KanbanStatus[]).forEach((status) => {
      filtered[status] = sessionsByStatus[status].filter((session) => {
        const titleMatch = (session.title ?? '')
          .toLowerCase()
          .includes(query);
        const taskMatch = (session.tasks?.name ?? '')
          .toLowerCase()
          .includes(query);
        return titleMatch || taskMatch;
      });
    });

    return filtered;
  }, [sessionsByStatus, searchQuery]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-3 gap-4 p-4 h-full">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            sessions={filteredSessionsByStatus[column.id]}
            onStartSession={onStartSession}
            onEditSession={onEditSession}
            onAddTodo={(columnId) =>
              onAddTodo({ projectId: null, kanbanStatus: columnId })
            }
            onInboxDrop={onInboxDrop}
            projects={projects}
          />
        ))}
      </div>

      <DragOverlay>
        {activeSession ? (
          <KanbanCard
            session={activeSession}
            isOverlay
            onStartSession={onStartSession}
            onEditSession={onEditSession}
            projects={projects}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
