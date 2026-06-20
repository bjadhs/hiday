'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KanbanCard } from './kanban-card';
import type { KanbanSessionWithActiveState } from '@/actions/planned-sessions';
import type { KanbanStatus, KProject } from '@/lib/types';

interface KanbanColumnProps {
  id: KanbanStatus;
  title: string;
  colorVar: string;
  sessions: KanbanSessionWithActiveState[];
  onStartSession: (sessionId: string) => void;
  onStopSession: (sessionId: string) => Promise<void>;
  onEditSession: (session: KanbanSessionWithActiveState) => void;
  onAddTodo: (columnId: KanbanStatus) => void;
  onInboxDrop: (sessionId: string, columnId: KanbanStatus) => void;
  kprojects: KProject[];
}

export function KanbanColumn({
  id,
  title,
  colorVar,
  sessions,
  onStartSession,
  onStopSession,
  onEditSession,
  onAddTodo,
  onInboxDrop,
  kprojects,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('sessionId');
    if (sessionId) {
      onInboxDrop(sessionId, id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col rounded-2xl border-2 border-border-strong bg-surface/50 shadow-brutal-sm transition-colors h-full max-h-full',
        isOver && 'bg-primary/5 border-primary/50'
      )}
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b-2 border-border-strong rounded-t-2xl shrink-0"
        style={{ backgroundColor: `color-mix(in srgb, ${colorVar} 8%, transparent)` }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: colorVar }}
        />
        <h3 className="font-bold text-sm uppercase tracking-wide">{title}</h3>
        <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {sessions.length}
        </span>
        <button
          type="button"
          onClick={() => onAddTodo(id)}
          className="p-1 rounded hover:bg-white/30 dark:hover:bg-black/20 transition-colors"
          title={`Add todo to ${title}`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-0">
        <SortableContext
          items={sessions.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sessions.map((session) => (
            <KanbanCard
              key={session.id}
              session={session}
              onStartSession={onStartSession}
              onStopSession={onStopSession}
              onEditSession={onEditSession}
              kprojects={kprojects}
            />
          ))}
        </SortableContext>

        {sessions.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
            Drop items here
          </div>
        )}
      </div>
    </div>
  );
}
