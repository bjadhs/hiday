'use client';

import { useEffect, useCallback, useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { Task } from '@/lib/types';
import { useActiveSessionsStore } from '@/lib/stores/active-sessions-store';
import { CompactSessionItem } from './compact-session-item';
import { ExpandedSessionView } from './expanded-session-view';

interface ActiveTimerCardProps {
  firstTask: Task;
  recentTasks: Task[];
  onStartTask: (task: Task) => void;
  onStopSession: (sessionId: string) => Promise<void> | void;
  onUpdateSession: (sessionId: string, updates: { title?: string; note?: string; taskId?: string; }) => void;
  isStarting: boolean;
  isStopping: boolean;
  /** All available tasks for the task dropdown */
  tasks?: Task[];
}

/**
 * ActiveTimerCard
 * 
 * The main active tracking card that displays either:
 * - An expanded single session view
 * - A list of active sessions
 * - A "ready to track" state with recent tasks and sessions
 * 
 * Uses Zustand store for state management.
 */
export function ActiveTimerCard({
  firstTask,
  recentTasks,
  onStartTask,
  onStopSession,
  onUpdateSession,
  isStarting,
  isStopping,
  tasks = [],
}: ActiveTimerCardProps) {
  // Local state to track which specific session is being stopped
  const [stoppingSessionId, setStoppingSessionId] = useState<string | null>(null);
  
  // Zustand store state
  const {
    activeSessions,
    elapsedTimes,
    editingSessionId,
    editTitle,
    expandedSessionId,
    sessionNotes,
    updateAllElapsedTimes,
    startEditingTitle,
    setEditTitle,
    saveTitle,
    cancelEditTitle,
    toggleExpand,
    closeExpand,
    setSessionNote,
  } = useActiveSessionsStore();

  // Timer effect - updates all elapsed times every second
  useEffect(() => {
    if (activeSessions.length === 0) return;

    // Initial update
    updateAllElapsedTimes();

    // Set up interval
    const interval = setInterval(() => {
      updateAllElapsedTimes();
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSessions.length, updateAllElapsedTimes]);

  const hasActiveSessions = activeSessions.length > 0;

  // Handlers
  const handleSaveTitle = useCallback((sessionId: string) => {
    const trimmedTitle = editTitle.trim();
    const newTitle = trimmedTitle || activeSessions.find(s => s.id === sessionId)?.task.name || '';
    
    saveTitle(sessionId, newTitle);
    onUpdateSession(sessionId, { title: newTitle });
  }, [editTitle, activeSessions, saveTitle, onUpdateSession]);

  const handleSaveNote = useCallback((sessionId: string) => {
    const note = sessionNotes[sessionId] || '';
    onUpdateSession(sessionId, { note });
  }, [sessionNotes, onUpdateSession]);

  return (
    <div className="relative h-full min-h-0">
      <div
        className={cn(
          'p-6 lg:p-8 rounded-xl border-2 transition-all duration-200 h-full flex flex-col overflow-hidden',
          hasActiveSessions
            ? 'bg-primary/5 border-primary dark:border-primary shadow-brutal-colored'
            : 'bg-surface dark:bg-surface-dark border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark'
        )}
      >
        {hasActiveSessions ? (
          expandedSessionId ? (
            /* Expanded Single Session View - Full card size */
            <ExpandedSessionView
              session={activeSessions.find(s => s.id === expandedSessionId)!}
              elapsedTime={elapsedTimes[expandedSessionId] || 0}
              isEditing={editingSessionId === expandedSessionId}
              editTitle={editTitle}
              editNote={sessionNotes[expandedSessionId] || ''}
              onEditTitleChange={setEditTitle}
              onEditNoteChange={(value) => setSessionNote(expandedSessionId, value)}
              onSaveTitle={() => handleSaveTitle(expandedSessionId)}
              onSaveNote={() => handleSaveNote(expandedSessionId)}
              onCancelEdit={cancelEditTitle}
              onStartEdit={() => startEditingTitle(expandedSessionId)}
              onClose={closeExpand}
              onStop={async () => {
                setStoppingSessionId(expandedSessionId);
                try {
                  await onStopSession(expandedSessionId);
                } finally {
                  setStoppingSessionId(null);
                }
              }}
              isStopping={stoppingSessionId === expandedSessionId}
              tasks={tasks}
              onTaskChange={(task) => onUpdateSession(expandedSessionId, { taskId: task.id })}
            />
          ) : (
            /* Active Sessions List - Multiple sessions */
            <div className="flex flex-col h-full">
              {/* Header with count */}
              <div className="flex items-center justify-between mb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold">
                    {activeSessions.length}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    Active {activeSessions.length === 1 ? 'session' : 'sessions'}
                  </span>
                </div>
              </div>

              {/* Sessions list - grid 2 columns when more than 2 sessions */}
              <div
                className={cn(
                  'flex-1 overflow-y-auto -mx-2 px-2 min-h-0 content-start',
                  activeSessions.length > 2
                    ? 'grid grid-cols-2 gap-2 auto-rows-min'
                    : 'space-y-2'
                )}
              >
                {activeSessions.map((session) => (
                  <CompactSessionItem
                    key={session.id}
                    session={session}
                    elapsedTime={elapsedTimes[session.id] || 0}
                    onExpand={() => toggleExpand(session.id)}
                    onStop={async () => {
                      setStoppingSessionId(session.id);
                      try {
                        await onStopSession(session.id);
                      } finally {
                        setStoppingSessionId(null);
                      }
                    }}
                    isStopping={stoppingSessionId === session.id}
                  />
                ))}
              </div>
            </div>
          )
        ) : (
          /* Ready to Track Content */
          <div className="flex flex-col h-full">
            {/* Top row: Start tracking header */}
            <div className="flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border-strong dark:border-border-strong-dark flex items-center justify-center text-2xl shadow-brutal-sm dark:shadow-brutal-dark-sm">
                  ⏱️
                </div>
                <div>
                  <h2 className="text-lg lg:text-xl font-bold">Start tracking</h2>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border-2 shadow-brutal-xs"
                      style={{
                        backgroundColor: `${firstTask.color}20`,
                        borderColor: firstTask.color,
                        color: firstTask.color,
                      }}
                    >
                      <span>{firstTask.icon}</span>
                      <span className="font-semibold">{firstTask.name}</span>
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onStartTask(firstTask)}
                disabled={isStarting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white font-semibold border-2 border-border-strong dark:border-white/20 shadow-brutal-sm btn-brutal text-sm disabled:opacity-50"
              >
                {isStarting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                Start
              </button>
            </div>

            {/* Recent tasks grid - 3 columns x 2 rows with icons and titles */}
            {recentTasks.length > 0 && (
              <div className="flex-1 min-h-0 mt-4">
                <div className="grid grid-cols-3 grid-rows-2 gap-2 h-full">
                  {recentTasks.slice(0, 6).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => onStartTask(task)}
                      disabled={isStarting}
                      className="flex items-center gap-2 px-3 rounded-lg bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border dark:border-border-dark hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
                      style={{ borderColor: `${task.color}40` }}
                    >
                      <span className="text-xl">{task.icon}</span>
                      <span className="text-sm font-medium truncate">{task.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state if no recent tasks */}
            {recentTasks.length === 0 && (
              <div className="flex-1 flex items-center justify-center mt-4">
                <p className="text-sm text-muted-foreground text-center">
                  Select a task below to start tracking your time
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
