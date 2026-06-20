'use client';

import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Clock, Pencil, Pause, Loader2 } from 'lucide-react';
import { cn, formatDuration, getKProjectColor } from '@/lib/utils';
import { useNow } from '@/lib/hooks/use-now';
import type { KanbanSessionWithActiveState } from '@/actions/planned-sessions'
import type { KProject } from '@/lib/types';

/**
 * Live elapsed-time readout. Kept as its own leaf so the per-second `useNow`
 * tick only re-renders this span — not the draggable card root, which would
 * otherwise interrupt an in-progress dnd-kit drag of a running ("Doing") card.
 */
function LiveDuration({ startedAt }: { startedAt: number }) {
  const now = useNow(1000);
  const elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
  return <span>{formatDuration(elapsedSeconds)}</span>;
}

interface KanbanCardProps {
  session: KanbanSessionWithActiveState;
  isOverlay?: boolean;
  onStartSession: (sessionId: string) => void;
  onStopSession: (sessionId: string) => Promise<void>;
  onEditSession: (session: KanbanSessionWithActiveState) => void;
  kprojects: KProject[];
}

export function KanbanCard({
  session,
  isOverlay,
  onStartSession,
  onStopSession,
  onEditSession,
  kprojects,
}: KanbanCardProps) {
  const [isStopping, setIsStopping] = useState(false);
  // The active session id we optimistically stopped. Derived comparison below
  // means a server refresh (id cleared) or a restart (new id) clears it
  // automatically, with no setState-in-effect.
  const [stoppedSessionId, setStoppedSessionId] = useState<string | null>(null);

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

  const kproject = kprojects.find((p) => p.id === session.kproject_id);
  const hasActiveSession = session.hasActiveSession ?? false;
  const activeSessionId = session.activeSessionIds[0] ?? null;
  const effectiveHasActiveSession =
    hasActiveSession && activeSessionId !== stoppedSessionId;

  const isRunning = effectiveHasActiveSession && session.activeSessionStartedAt !== null;

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
      {/* Title + kproject */}
      <div className="flex items-start gap-2 min-w-0">
        <p className="font-semibold text-sm truncate flex-1 min-w-0">
          {session.title || 'Untitled todo'}
        </p>
        {kproject && (() => {
          const indicator = getKProjectColor(kproject.id);
          return (
            <span
              className="shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border"
              style={{
                backgroundColor: `color-mix(in srgb, ${indicator} 12%, transparent)`,
                color: indicator,
                borderColor: `color-mix(in srgb, ${indicator} 25%, transparent)`,
              }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: indicator }}
              />
              {kproject.name}
            </span>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className={cn(
          'flex items-center gap-1 text-[10px]',
          isRunning ? 'text-success font-medium' : 'text-muted-foreground'
        )}>
          <Clock className="w-3 h-3" />
          {isRunning && session.activeSessionStartedAt != null ? (
            <LiveDuration startedAt={session.activeSessionStartedAt} />
          ) : (
            <span>{`${Math.round((session.duration ?? 0) / 60)} min`}</span>
          )}
        </div>

        <div className="flex items-center">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onEditSession(session);
            }}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
            title="Edit todo"
          >
            <Pencil className="w-3 h-3" />
          </button>

          {!effectiveHasActiveSession ? (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setStoppedSessionId(null);
                onStartSession(session.id);
              }}
              className="p-1 rounded-md bg-primary-highlight text-white shadow-brutal-xs btn-brutal opacity-0 group-hover:opacity-100 transition-opacity"
              title="Start session"
            >
              <Play className="w-3 h-3" />
            </button>
          ) : (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={async (e) => {
                e.stopPropagation();
                if (!activeSessionId || isStopping) return;
                setIsStopping(true);
                setStoppedSessionId(activeSessionId);
                try {
                  await onStopSession(activeSessionId);
                } catch (error) {
                  const message = error instanceof Error ? error.message : String(error);
                  if (!message.includes('already stopped')) {
                    console.error('Failed to stop session:', error);
                  }
                  // Revert optimistic state on any error
                  setStoppedSessionId(null);
                } finally {
                  setIsStopping(false);
                }
              }}
              disabled={isStopping}
              className="p-1 rounded-md bg-warning text-white shadow-brutal-xs btn-brutal opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-70"
              title="Pause session"
            >
              {isStopping ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Pause className="w-3 h-3 fill-current" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
