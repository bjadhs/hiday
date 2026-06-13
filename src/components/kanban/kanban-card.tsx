'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Clock, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlannedSessionWithTask } from '@/actions/planned-sessions';
import type { Project } from '@/lib/types';

interface KanbanCardProps {
  session: PlannedSessionWithTask;
  isOverlay?: boolean;
  onStartSession: (sessionId: string) => void;
  onEditSession: (session: PlannedSessionWithTask) => void;
  projects: Project[];
}

export function KanbanCard({
  session,
  isOverlay,
  onStartSession,
  onEditSession,
  projects,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: session.id,
    data: {
      type: 'kanban-card',
      session,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging || isOverlay ? 50 : undefined,
  };

  const project = projects.find((p) => p.id === session.project_id);
  const isActive = session.status === 'active';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative flex flex-col gap-1 p-2 rounded-xl bg-surface border-2 border-border-strong shadow-brutal-sm cursor-grab active:cursor-grabbing',
        (isDragging || isOverlay) &&
          'opacity-90 rotate-2 scale-105 ring-2 ring-primary shadow-brutal z-50',
        isOverlay && 'cursor-grabbing'
      )}
    >
      {/* Title + project */}
      <div className="flex items-start gap-2 min-w-0">
        <p className="font-semibold text-sm truncate flex-1 min-w-0">
          {session.title || 'Untitled todo'}
        </p>
        {project && (
          <span
            className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border"
            style={{
              backgroundColor: '#A78BFA20',
              color: '#A78BFA',
              borderColor: '#A78BFA40',
            }}
          >
            <span
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: '#A78BFA' }}
            />
            {project.name}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{Math.round((session.duration ?? 0) / 60)} min</span>
        </div>

        <div className="flex items-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditSession(session);
            }}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Edit todo"
          >
            <Pencil className="w-3 h-3" />
          </button>

          {!isActive ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onStartSession(session.id);
              }}
              className="p-1 rounded-md bg-primary text-white shadow-brutal-xs btn-brutal opacity-0 group-hover:opacity-100 transition-opacity"
              title="Start session"
            >
              <Play className="w-3 h-3" />
            </button>
          ) : (
            <span className="text-[9px] font-bold text-warning px-1.5 py-0.5 rounded bg-warning/10 border border-warning/20">
              Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
