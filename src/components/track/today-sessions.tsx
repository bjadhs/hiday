'use client';

import { Pencil } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { Task, HistorySession } from '@/lib/types';

// Database session type from Supabase - matching the actual type
interface DbSession {
  id: string;
  task_id: string;
  tasks: {
    id: string;
    name: string;
    color: string;
    icon: string | null;
  } | null;
  started_at: number | null;
  ended_at: number | null;
  duration: number | null;
  title: string | null;
  note: string | null;
}

interface TodaySessionsProps {
  sessions: DbSession[];
  onEditSession: (session: HistorySession) => void;
}

/**
 * TodaySessions
 * 
 * Displays a list of today's completed sessions with
 * task info, duration, and edit capability.
 * 
 * @example
 * ```tsx
 * <TodaySessions
 *   sessions={todaySessions}
 *   onEditSession={handleEditSession}
 * />
 * ```
 */
export function TodaySessions({ sessions, onEditSession }: TodaySessionsProps) {
  const convertToHistorySession = (session: DbSession): HistorySession => {
    const task: Task = session.tasks ? {
      id: session.tasks.id,
      name: session.tasks.name,
      color: session.tasks.color,
      icon: session.tasks.icon,
    } : {
      id: session.task_id,
      name: 'Unknown',
      color: '#6B7280',
      icon: '❓',
    };

    return {
      id: session.id,
      taskId: session.task_id,
      task,
      startedAt: session.started_at || 0,
      endedAt: session.ended_at,
      duration: session.duration || 0,
      title: session.title || undefined,
      note: session.note || undefined,
    };
  };

  return (
    <div className="bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark rounded-xl shadow-brutal dark:shadow-brutal-dark h-full min-h-0 flex flex-col overflow-hidden">
      <div className="p-2 lg:p-3 border-b-2 border-border dark:border-border-dark shrink-0">
        <h2 className="text-xl font-bold tracking-tight">
          Today&apos;s Sessions ({sessions.length})
        </h2>
      </div>
      <div className="p-4 lg:p-6 space-y-3 flex-1 overflow-y-auto min-h-0">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Today you haven&apos;t started any session.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const historySession = convertToHistorySession(session);

            return (
              <div
                key={session.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border dark:border-border-dark group/session hover:border-primary/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 border-black/10 shrink-0"
                  style={{ backgroundColor: session.tasks?.color }}
                >
                  {session.tasks?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {session.title || session.tasks?.name}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full mt-1"
                    style={{
                      backgroundColor: `${session.tasks?.color}20`,
                      color: session.tasks?.color,
                    }}
                  >
                    {session.tasks?.icon} {session.tasks?.name}
                  </span>
                  {session.note && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {session.note}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-sm">
                    {formatDuration(session.duration || 0)}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <p className="text-xs text-muted-foreground">
                      {session.ended_at &&
                        new Date(session.ended_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        })}
                    </p>
                    <button
                      onClick={() => onEditSession(historySession)}
                      className="opacity-0 group-hover/session:opacity-100 p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                      title="Edit session"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
