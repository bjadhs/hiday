'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { KanbanColumn } from './kanban-column';
import { KanbanCard } from './kanban-card';
import { useUpdateKanbanStatus } from '@/lib/hooks/use-kanban';
import type { KanbanSessionWithActiveState } from '@/actions/planned-sessions';
import type { KanbanStatus, KProject } from '@/lib/types';

const COLUMNS: { id: KanbanStatus; title: string; colorVar: string }[] = [
  { id: 'next', title: 'Next', colorVar: 'var(--info)' },
  { id: 'doing', title: 'Doing', colorVar: 'var(--warning)' },
  { id: 'revise', title: 'Revise', colorVar: 'var(--danger)' },
  { id: 'done', title: 'Done', colorVar: 'var(--success)' },
];

interface KanbanBoardProps {
  sessionsByStatus: Record<KanbanStatus, KanbanSessionWithActiveState[]>;
  onStartSession: (sessionId: string) => void;
  onStopSession: (sessionId: string) => Promise<void>;
  onEditSession: (session: KanbanSessionWithActiveState) => void;
  onAddTodo: (defaults: { kprojectId: string | null; kanbanStatus: KanbanStatus }) => void;
  onInboxDrop: (sessionId: string, columnId: KanbanStatus) => void;
  searchQuery: string;
  kprojects: KProject[];
}

export function KanbanBoard({
  sessionsByStatus,
  onStartSession,
  onStopSession,
  onEditSession,
  onAddTodo,
  onInboxDrop,
  searchQuery,
  kprojects,
}: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const updateKanbanStatus = useUpdateKanbanStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Resolve a drag to the column under the pointer. Using the column as the
  // authoritative drop target (rather than whichever card corner is nearest)
  // avoids two bugs: dropping onto an adjacent column's card, and a card never
  // leaving its own column because a sibling card is always the closest hit.
  const collisionDetection = useCallback<CollisionDetection>((args) => {
    const hits = pointerWithin(args);
    const candidates = hits.length > 0 ? hits : rectIntersection(args);
    const columnHit = candidates.find((c) =>
      COLUMNS.some((col) => col.id === c.id)
    );
    return columnHit ? [columnHit] : candidates;
  }, []);

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
      const newStatus = over.id as KanbanStatus;

      // Collision detection only ever resolves to a board column, but guard
      // explicitly so the server's Zod schema (board columns only) can't be
      // reached with a non-column id or 'inbox'.
      if (!COLUMNS.some((c) => c.id === newStatus) || newStatus === 'inbox') {
        return;
      }

      const session = allSessions.find((s) => s.id === sessionId);
      if (session && session.kanban_status !== newStatus) {
        updateKanbanStatus.mutate({
          sessionId,
          kanbanStatus: newStatus,
        });
      }
    },
    [allSessions, updateKanbanStatus]
  );

  const filteredSessionsByStatus = useMemo(() => {
    if (!searchQuery.trim()) return sessionsByStatus;

    const query = searchQuery.toLowerCase();
    const filtered: Record<KanbanStatus, KanbanSessionWithActiveState[]> = {
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
        const projectMatch = (session.projects?.name ?? '')
          .toLowerCase()
          .includes(query);
        return titleMatch || projectMatch;
      });
    });

    return filtered;
  }, [sessionsByStatus, searchQuery]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-4 p-4 h-full">
        {COLUMNS.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            colorVar={column.colorVar}
            sessions={filteredSessionsByStatus[column.id]}
            onStartSession={onStartSession}
            onStopSession={onStopSession}
            onEditSession={onEditSession}
            onAddTodo={(columnId) =>
              // Board-level adds are intentionally unassigned (DEFAULT bucket);
              // the user can pick a kproject in the create dialog.
              onAddTodo({ kprojectId: null, kanbanStatus: columnId })
            }
            onInboxDrop={onInboxDrop}
            kprojects={kprojects}
          />
        ))}
      </div>

      <DragOverlay>
        {activeSession ? (
          <KanbanCard
            session={activeSession}
            isOverlay
            onStartSession={onStartSession}
            onStopSession={onStopSession}
            onEditSession={onEditSession}
            kprojects={kprojects}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
