'use client';

import { Pencil, Clock, Play } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { Task, HistorySession } from '@/lib/types';
import { useNow } from '@/lib/hooks/use-now';

// Database session type from Supabase - matching the actual type
interface DbSession {
  id: string;
  task_id: string | null;
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
  const now = useNow(1000);

  const isRunning = (session: DbSession) =>
    !session.ended_at && typeof session.started_at === 'number';

  const getDuration = (session: DbSession): number => {
    if (session.duration) return session.duration;
    if (isRunning(session) && session.started_at) {
      return Math.floor((now - session.started_at) / 1000);
    }
    return 0;
  };

  const convertToHistorySession = (session: DbSession): HistorySession => {
    const task: Task = session.tasks ? {
      id: session.tasks.id,
      name: session.tasks.name,
      color: session.tasks.color,
      icon: session.tasks.icon,
    } : {
      id: session.task_id || 'unknown',
      name: 'Unknown',
      color: '#6B7280',
      icon: '❓',
    };

    return {
      id: session.id,
      taskId: session.task_id || '',
      task,
      startedAt: session.started_at || 0,
      endedAt: session.ended_at,
      duration: session.duration || 0,
      title: session.title || undefined,
      note: session.note || undefined,
    };
  };

  return (
    <div className="bg-surface border-2 border-border-strong rounded-xl shadow-brutal h-full min-h-0 flex flex-col overflow-hidden">
      <div className="p-2 lg:p-3 border-b-2 border-border shrink-0">
        <h2 className="text-xl font-bold tracking-tight">
          Today&apos;s Sessions ({sessions.length})
        </h2>
      </div>
      <div className="p-4 lg:p-6 space-y-3 flex-1 overflow-y-auto min-h-0">
        {sessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-5 shadow-brutal-sm">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-black mb-2">No sessions yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
              A session is a focused block of time you spend on a task. Start one from a task to see it here.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated border-2 border-border text-xs font-bold text-muted-foreground">
              <Play className="w-3.5 h-3.5 text-primary" />
              Press start on any task to begin
            </div>
          </div>
        ) : (
          sessions.map((session) => {
            const historySession = convertToHistorySession(session);

            return (
              <div
                key={session.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated border-2 border-border group/session hover:border-primary/50 transition-colors"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 border-black/10 dark:border-white/25 shrink-0"
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
                    <p className="text-xs text-foreground-muted truncate mt-1">
                      {session.note}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-sm">
                    {formatDuration(getDuration(session))}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    {isRunning(session) ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        Running
                      </span>
                    ) : (
                      <p className="text-xs text-foreground-muted">
                        {session.ended_at &&
                          new Date(session.ended_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                      </p>
                    )}
                    <button
                      onClick={() => onEditSession(historySession)}
                      className="opacity-0 group-hover/session:opacity-100 p-1.5 rounded-md hover:bg-primary/10 text-foreground-muted hover:text-primary dark:hover:text-foreground-dark transition-all"
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
