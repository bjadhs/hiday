'use client';

import { useEffect, useCallback, useState, useMemo, useTransition, useOptimistic } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { Task } from '@/lib/types';
import { useNow } from '@/lib/hooks/use-now';
import { useActiveSessionsStore, ActiveSessionState } from '@/lib/stores/active-sessions-store';
import { ExpandedSessionView } from './expanded-session-view';
import { NotePromptInline } from './note-prompt-inline';
import type { Database } from '@/lib/supabase/database.types';

type SessionRow = Database['public']['Tables']['sessions']['Row'];
type TaskRow = Database['public']['Tables']['tasks']['Row'];
type SessionWithTask = SessionRow & { tasks: TaskRow | null };

interface ActiveTimerCardProps {
  firstTask: Task;
  recentTasks: Task[];
  todaySessions: SessionWithTask[];
  onStartTask: (task: Task, startTime?: number) => Promise<void>;
  onStopSession: (sessionId: string) => Promise<void>;
  onUpdateSession: (sessionId: string, updates: { title?: string; note?: string; taskId?: string; started_at?: number }) => Promise<void>;
  isStarting?: boolean;
  isStopping?: boolean;
  tasks?: Task[];
}

/**
 * ActiveTimerCard - Time Tracking Component
 * 
 * Best Practices Applied:
 * - React 19 useTransition for non-blocking async operations
 * - useOptimistic for instant UI feedback
 * - WCAG 2.2 AA accessibility compliance
 * - Independent loading states per button
 * - Proper focus management and ARIA attributes
 * - Server Actions ready architecture
 */
export function ActiveTimerCard({
  firstTask,
  recentTasks,
  todaySessions,
  onStartTask,
  onStopSession,
  onUpdateSession,
  tasks = [],
}: ActiveTimerCardProps) {
  // React 19 Transitions for async operations
  const [, startTransition] = useTransition();
  const [, adjustTransition] = useTransition();
  const [, stopTransition] = useTransition();

  // Track which specific operation is in progress
  const [activeOperation, setActiveOperation] = useState<{
    type: 'start' | 'adjust' | 'stop';
    id: string;
  } | null>(null);
  
  // Get sessions from store
  const storeSessions = useActiveSessionsStore((state) => state.activeSessions);
  
  // Optimistic UI state - prepend to match store behavior
  // Filters out duplicate optimistic sessions for the same task
  const [optimisticSessions, addOptimisticSession] = useOptimistic(
    storeSessions,
    (state: ActiveSessionState[], newSession: { id: string; task: Task; title: string; startTime: number; isOptimistic?: boolean }) => {
      // Remove any existing optimistic sessions for the same task to prevent duplicates
      const filteredState = state.filter((s) => {
        const isOptimisticForThisTask = s.id.startsWith('optimistic-') && s.task.id === newSession.task.id;
        return !isOptimisticForThisTask;
      });
      return [{ ...newSession, note: '' }, ...filteredState];
    }
  );
  
  // Zustand store state
  const {
    elapsedTimes,
    editingSessionId,
    editTitle,
    expandedSessionId,
    promptingSessionId,
    sessionNotes,
    updateAllElapsedTimes,
    startEditingTitle,
    setEditTitle,
    saveTitle,
    cancelEditTitle,
    toggleExpand,
    closeExpand,
    setSessionNote,
    updateSession,
    removeSession,
    cancelPromptNote,
  } = useActiveSessionsStore();

  const activeSessions = optimisticSessions;

  // Timer effect - only tick via interval to avoid synchronous setState loop
  useEffect(() => {
    if (activeSessions.length === 0) return;
    const interval = setInterval(() => updateAllElapsedTimes(), 1000);
    return () => clearInterval(interval);
  }, [activeSessions.length, updateAllElapsedTimes]);

  const hasActiveSessions = activeSessions.length > 0;

  // Get unique recent tasks
  const uniqueRecentTasks = useMemo(() => {
    const seen = new Set<string>();
    const result: Task[] = [];
    
    const sortedSessions = [...todaySessions].sort((a, b) => (b.started_at || 0) - (a.started_at || 0));
    for (const session of sortedSessions) {
      if (session.tasks && !seen.has(session.tasks.id)) {
        seen.add(session.tasks.id);
        result.push({
          id: session.tasks.id,
          name: session.tasks.name,
          color: session.tasks.color,
          icon: session.tasks.icon,
        } as Task);
      }
      if (result.length >= 4) break;
    }
    
    for (const task of recentTasks) {
      if (!seen.has(task.id)) {
        seen.add(task.id);
        result.push(task);
      }
      if (result.length >= 4) break;
    }
    
    return result.length > 0 ? result : [firstTask];
  }, [recentTasks, todaySessions, firstTask]);

  // Calculate last session end time
  const now = useNow(1000);
  const lastSessionInfo = useMemo(() => {
    if (todaySessions.length === 0) return null;
    const sortedSessions = [...todaySessions]
      .filter(s => s.ended_at !== null)
      .sort((a, b) => (b.ended_at || 0) - (a.ended_at || 0));
    if (sortedSessions.length === 0) return null;

    const lastSession = sortedSessions[0];
    const lastEndTime = lastSession.ended_at || 0;
    const gapDuration = Math.floor((now - lastEndTime) / 1000);

    return { lastEndTime, gapDuration, taskName: lastSession.tasks?.name || 'Unknown' };
  }, [todaySessions, now]);

  // Handlers with proper error handling and transitions
  const handleSaveTitle = useCallback((sessionId: string) => {
    // Skip optimistic sessions that haven't been saved to database yet
    if (sessionId.startsWith('optimistic-')) {
      console.warn('Cannot save title for optimistic session - waiting for server confirmation');
      return;
    }

    const session = activeSessions.find(s => s.id === sessionId);
    if (!session) {
      console.warn('Cannot save title - session not found in active sessions:', sessionId);
      return;
    }

    const trimmedTitle = editTitle.trim();
    const newTitle = trimmedTitle || session.task.name || '';
    saveTitle(sessionId, newTitle);
    onUpdateSession(sessionId, { title: newTitle }).catch(console.error);
  }, [editTitle, activeSessions, saveTitle, onUpdateSession]);

  const handleSaveNote = useCallback((sessionId: string) => {
    // Skip optimistic sessions that haven't been saved to database yet
    if (sessionId.startsWith('optimistic-')) {
      console.warn('Cannot save note for optimistic session - waiting for server confirmation');
      return;
    }

    const note = sessionNotes[sessionId] || '';
    onUpdateSession(sessionId, { note }).catch(console.error);
  }, [sessionNotes, onUpdateSession]);

  // Start session with optimistic UI
  const handleStartSession = useCallback((task: Task, offsetMinutes: number = 0) => {
    const operationId = `start-${task.id}-${offsetMinutes}`;
    
    startTransition(async () => {
      setActiveOperation({ type: 'start', id: operationId });
      
      try {
        const startTime = offsetMinutes > 0 
          ? Date.now() - (offsetMinutes * 60 * 1000)
          : Date.now();
        
        // Optimistic update - use a unique ID that won't conflict with real sessions
        const optimisticId = `optimistic-${task.id}-${Date.now()}`;
        addOptimisticSession({
          id: optimisticId,
          task,
          title: task.name,
          startTime,
          isOptimistic: true,
        });
        
        await onStartTask(task, startTime);
      } finally {
        setActiveOperation(null);
      }
    });
  }, [onStartTask, addOptimisticSession, startTransition]);

  // Adjust time with transition
  const handleAdjustTime = useCallback((sessionId: string, offsetMinutes: number) => {
    // Skip optimistic sessions that haven't been saved to database yet
    if (sessionId.startsWith('optimistic-')) {
      console.warn('Cannot adjust time for optimistic session - waiting for server confirmation');
      return;
    }

    adjustTransition(async () => {
      setActiveOperation({ type: 'adjust', id: `${sessionId}-${offsetMinutes}` });

      try {
        const session = activeSessions.find((s: { id: string; startTime: number }) => s.id === sessionId);
        if (!session) return;

        const newStartTime = session.startTime + (offsetMinutes * 60 * 1000);
        updateSession(sessionId, { startTime: newStartTime });
        await onUpdateSession(sessionId, { started_at: newStartTime });
      } finally {
        setActiveOperation(null);
      }
    });
  }, [activeSessions, updateSession, onUpdateSession, adjustTransition]);

  // Stop session with transition
  const handleStopSession = useCallback((sessionId: string) => {
    // Skip optimistic sessions that haven't been saved to database yet
    if (sessionId.startsWith('optimistic-')) {
      console.warn('Cannot stop optimistic session - waiting for server confirmation');
      return;
    }

    const session = activeSessions.find((s: { id: string }) => s.id === sessionId);

    // Check if this session's task requires a note prompt
    if (session?.task.note_prompt) {
      // Show inline note prompt instead of modal
      useActiveSessionsStore.getState().startPromptingNote(sessionId);
      // Also expand the session if not already expanded
      if (expandedSessionId !== sessionId) {
        toggleExpand(sessionId);
      }
      return;
    }

    stopTransition(async () => {
      setActiveOperation({ type: 'stop', id: sessionId });

      try {
        removeSession(sessionId);
        await onStopSession(sessionId);
      } finally {
        setActiveOperation(null);
      }
    });
  }, [activeSessions, expandedSessionId, toggleExpand, onStopSession, removeSession, stopTransition]);
  
  // Handle save note and stop (from inline prompt)
  const handleSaveNoteAndStop = useCallback(async (sessionId: string, note: string) => {
    if (!promptingSessionId) return;

    // Skip optimistic sessions that haven't been saved to database yet
    if (sessionId?.startsWith('optimistic-')) {
      console.warn('Cannot stop optimistic session - waiting for server confirmation');
      return;
    }

    stopTransition(async () => {
      setActiveOperation({ type: 'stop', id: sessionId });

      try {
        // 1. Update session with the note (only if note is not empty)
        const trimmedNote = note.trim();
        if (trimmedNote) {
          await onUpdateSession(sessionId, { note: trimmedNote });
        }
        // 2. Save note to local state
        setSessionNote(sessionId, note);
        // 3. Remove from local state and stop
        removeSession(sessionId);
        await onStopSession(sessionId);
        // 4. Close the prompt
        cancelPromptNote();
      } catch (error) {
        console.error('Failed to save note and stop:', error);
      } finally {
        setActiveOperation(null);
      }
    });
  }, [promptingSessionId, onUpdateSession, setSessionNote, removeSession, onStopSession, cancelPromptNote, stopTransition]);
  
  // Handle delete session (from inline prompt)
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!promptingSessionId) return;

    // Skip optimistic sessions that haven't been saved to database yet
    if (sessionId.startsWith('optimistic-')) {
      console.warn('Cannot delete optimistic session - waiting for server confirmation');
      return;
    }

    stopTransition(async () => {
      setActiveOperation({ type: 'stop', id: sessionId });

      try {
        // Remove from local state
        removeSession(sessionId);
        // Delete the session from database (not saved to history)
        // The parent will handle the actual delete via API
        await onStopSession(sessionId);
        // Close the prompt
        cancelPromptNote();
      } catch (error) {
        console.error('Failed to delete session:', error);
      } finally {
        setActiveOperation(null);
      }
    });
  }, [promptingSessionId, removeSession, onStopSession, cancelPromptNote, stopTransition]);

  // Check if specific operation is loading
  const isOperationLoading = (type: 'start' | 'adjust' | 'stop', id: string) => {
    return activeOperation?.type === type && activeOperation?.id === id;
  };

  return (
    <div className="relative h-full min-h-0">
      <div
        className={cn(
          'p-4 rounded-xl border-2 transition-all duration-200 h-full flex flex-col overflow-hidden',
          hasActiveSessions
            ? 'bg-primary/5 border-primary dark:border-primary shadow-brutal-colored'
            : 'bg-surface border-border-strong shadow-brutal'
        )}
      >
        {/* ARIA Live region for announcements */}
        <div 
          role="status" 
          aria-live="polite" 
          aria-atomic="true"
          className="sr-only"
        >
          {activeOperation?.type === 'start' && 'Starting new session'}
          {activeOperation?.type === 'stop' && 'Stopping session'}
          {activeOperation?.type === 'adjust' && 'Adjusting session time'}
        </div>

        {expandedSessionId ? (
          promptingSessionId === expandedSessionId ? (
            <NotePromptInline
              session={activeSessions.find((s: { id: string }) => s.id === expandedSessionId)!}
              onSave={(note) => handleSaveNoteAndStop(expandedSessionId, note)}
              onDelete={() => handleDeleteSession(expandedSessionId)}
              onCancel={cancelPromptNote}
              isStopping={isOperationLoading('stop', expandedSessionId)}
            />
          ) : (
            <ExpandedSessionView
              session={activeSessions.find((s: { id: string }) => s.id === expandedSessionId)!}
              isOptimistic={expandedSessionId?.startsWith('optimistic-') ?? false}
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
              onStop={() => handleStopSession(expandedSessionId)}
              isStopping={isOperationLoading('stop', expandedSessionId)}
              tasks={tasks}
              onTaskChange={(task) => {
                // Skip optimistic sessions that haven't been saved to database yet
                if (expandedSessionId?.startsWith('optimistic-')) {
                  console.warn('Cannot change task for optimistic session - waiting for server confirmation');
                  return;
                }
                onUpdateSession(expandedSessionId, { taskId: task.id });
              }}
            />
          )
        ) : (
          <div className="flex flex-col h-full gap-2">
            {/* === TOP ROW: Quick Start Buttons === */}
            <div 
              className="shrink-0 grid grid-cols-5 gap-1.5"
              role="toolbar"
              aria-label="Quick start timer options"
            >
              {/* Start Now */}
              <StartButton
                onClick={() => handleStartSession(firstTask, 0)}
                isLoading={isOperationLoading('start', `start-${firstTask.id}-0`)}
                label="Start now"
                icon={<Play className="w-3 h-3 fill-current" />}
                text="Now"
                variant="primary"
              />

              {/* 5m ago */}
              <StartButton
                onClick={() => handleStartSession(firstTask, 5)}
                isLoading={isOperationLoading('start', `start-${firstTask.id}-5`)}
                label="Start from 5 minutes ago"
                text="5m"
                variant="secondary"
              />

              {/* 15m ago */}
              <StartButton
                onClick={() => handleStartSession(firstTask, 15)}
                isLoading={isOperationLoading('start', `start-${firstTask.id}-15`)}
                label="Start from 15 minutes ago"
                text="15m"
                variant="secondary"
              />

              {/* 30m ago */}
              <StartButton
                onClick={() => handleStartSession(firstTask, 30)}
                isLoading={isOperationLoading('start', `start-${firstTask.id}-30`)}
                label="Start from 30 minutes ago"
                text="30m"
                variant="secondary"
              />

              {/* Fill Gap */}
              <StartButton
                onClick={() => lastSessionInfo && handleStartSession(firstTask, Math.floor(lastSessionInfo.gapDuration / 60))}
                isLoading={isOperationLoading('start', `start-${firstTask.id}-${Math.floor(lastSessionInfo?.gapDuration || 0 / 60)}`)}
                label={lastSessionInfo ? `Fill gap from last session (${Math.floor(lastSessionInfo.gapDuration / 60)}m)` : 'No previous session'}
                text={lastSessionInfo ? `${Math.floor(lastSessionInfo.gapDuration / 60)}m` : '--'}
                variant="gap"
                disabled={!lastSessionInfo}
              />
            </div>

            {/* === SCROLLABLE CONTENT === */}
            <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
              <div className="space-y-2 flex flex-col h-full">
                {/* Recent Tasks Row - Grid layout for equal width */}
                <div 
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${uniqueRecentTasks.length}, 1fr)` }}
                  role="group"
                  aria-label="Recent tasks"
                >
                  {uniqueRecentTasks.map((task) => (
                    <TaskButton
                      key={task.id}
                      task={task}
                      onClick={() => handleStartSession(task, 0)}
                      isLoading={isOperationLoading('start', `start-${task.id}-0`)}
                    />
                  ))}
                </div>

                {/* Active Sessions List */}
                {hasActiveSessions && (
                  <div 
                    className="space-y-1.5 pt-1 border-t border-border"
                    role="list"
                    aria-label="Active sessions"
                  >
                    {activeSessions.map((session: { id: string; task: Task; title: string }) => (
                      <CompactSessionItem
                        key={session.id}
                        session={session}
                        elapsedTime={elapsedTimes[session.id] || 0}
                        onExpand={() => toggleExpand(session.id)}
                        onStop={() => handleStopSession(session.id)}
                        onAdjustTime={(offset) => handleAdjustTime(session.id, offset)}
                        isStopping={isOperationLoading('stop', session.id)}
                        activeOperation={activeOperation}
                      />
                    ))}
                  </div>
                )}

                {/* Empty state - Motivational Quote - takes remaining height and centers */}
                {!hasActiveSessions && (
                  <div className="flex-1 min-h-[120px] flex items-center justify-center">
                    <MotivationalQuote />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Motivational quotes array with unique colors
const motivationalQuotes = [
  { text: "The best time to start was yesterday. The second best time is now.", author: "Chinese Proverb" },
  { text: "Small steps every day lead to big results.", author: "Unknown" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Time is what we want most, but what we use worst.", author: "William Penn" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Lost time is never found again.", author: "Benjamin Franklin" },
  { text: "Productivity is being able to do things that you were never able to do before.", author: "Franz Kafka" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
];

// Vibrant colors for quotes (no red)
const quoteColors = [
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#A855F7", // Purple
  "#14B8A6", // Teal
  "#6366F1", // Indigo
];

// Motivational Quote Component - Auto-rotates every 5 seconds
function MotivationalQuote() {
  const [currentIndex, setCurrentIndex] = useState(() => 
    Math.floor(Math.random() * motivationalQuotes.length)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % motivationalQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const quote = motivationalQuotes[currentIndex];
  const color = quoteColors[currentIndex % quoteColors.length];

  return (
    <div className="relative text-center px-4">
      {/* Big background quote mark - centered behind text */}
      <span
        className="absolute text-[100px] font-serif leading-none opacity-[0.06] pointer-events-none select-none -z-10"
        style={{
          color,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
        aria-hidden="true"
      >
        &ldquo;
      </span>
      
      {/* Quote text */}
      <blockquote 
        className="text-base font-bold leading-tight mb-2 line-clamp-3"
        style={{ color }}
      >
        {quote.text}
      </blockquote>
      
      {/* Author */}
      <cite 
        className="text-xs font-medium not-italic opacity-60 block"
        style={{ color }}
      >
        — {quote.author}
      </cite>
    </div>
  );
}

// Accessible Start Button Component
interface StartButtonProps {
  onClick: () => void;
  isLoading: boolean;
  label: string;
  icon?: React.ReactNode;
  text: string;
  variant: 'primary' | 'secondary' | 'gap';
  disabled?: boolean;
}

function StartButton({ onClick, isLoading, label, icon, text, variant, disabled }: StartButtonProps) {
  const baseClasses = "flex items-center justify-center px-1.5 py-1.5 rounded-md border-2 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-primary text-white border-border-strong dark:border-white/20 shadow-brutal-xs hover:opacity-90",
    secondary: "bg-surface-elevated text-primary border-border hover:border-primary/50 hover:bg-primary/5",
    gap: "bg-primary/10 dark:bg-primary/20 text-primary border-primary hover:bg-primary/20"
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={label}
      aria-busy={isLoading}
      title={label}
      className={cn(baseClasses, variantClasses[variant])}
    >
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
      ) : (
        <>
          {icon}
          {text && <span className={icon ? "text-[10px] ml-1" : ""}>{text}</span>}
        </>
      )}
    </button>
  );
}

// Accessible Task Button Component
interface TaskButtonProps {
  task: Task;
  onClick: () => void;
  isLoading: boolean;
}

function TaskButton({ task, onClick, isLoading }: TaskButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-label={`Start ${task.name} session`}
      aria-busy={isLoading}
      title={`Start ${task.name}`}
      className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md bg-surface-elevated border-2 border-border hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 w-full min-w-0"
      style={{ borderColor: isLoading ? undefined : `${task.color}40` }}
    >
      <span className="text-sm" aria-hidden="true">{task.icon}</span>
      <span className="text-xs font-semibold truncate">{task.name}</span>
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" aria-hidden="true" />
      ) : (
        <Play className="w-3 h-3 text-primary text-foreground fill-current shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}

// Accessible Compact Session Item
interface SessionItem {
  id: string;
  task: Task;
  title: string;
}

interface CompactSessionItemProps {
  session: SessionItem;
  elapsedTime: number;
  onExpand: () => void;
  onStop: () => void;
  onAdjustTime: (offsetMinutes: number) => void;
  isStopping: boolean;
  activeOperation: { type: 'start' | 'adjust' | 'stop'; id: string } | null;
}

function CompactSessionItem({
  session,
  elapsedTime,
  onExpand,
  onStop,
  onAdjustTime,
  isStopping,
  activeOperation,
}: CompactSessionItemProps) {
  const isAdjusting5 = activeOperation?.type === 'adjust' && activeOperation?.id === `${session.id}--5`;
  const isAdjusting15 = activeOperation?.type === 'adjust' && activeOperation?.id === `${session.id}--15`;
  const isAdjusting30 = activeOperation?.type === 'adjust' && activeOperation?.id === `${session.id}--30`;
  const isAnyAdjusting = activeOperation?.type === 'adjust';

  return (
    <div
      className="w-full flex items-center gap-1 p-1.5 rounded-lg bg-surface border-2 border-border-strong shadow-brutal-sm"
      role="listitem"
    >
      {/* Task info - clickable to expand */}
      <button
        type="button"
        onClick={onExpand}
        className="flex-1 flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
        aria-label={`${session.title || session.task.name}, duration ${formatDuration(elapsedTime)}. Click to expand`}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-sm border-2 border-black/10 dark:border-white/25 shadow-brutal-xs shrink-0"
          style={{ backgroundColor: session.task.color }}
          aria-hidden="true"
        >
          {session.task.icon}
        </div>
        <span className="flex-1 min-w-0 text-xs font-semibold truncate">
          {session.title || session.task.name}
        </span>
      </button>

      {/* Time adjustment buttons */}
      <div 
        className="flex items-center gap-0.5 shrink-0"
        role="group"
        aria-label="Time adjustment"
      >
        <AdjustButton
          onClick={() => onAdjustTime(-5)}
          isLoading={isAdjusting5}
          disabled={isAnyAdjusting && !isAdjusting5}
          label="Start 5 minutes earlier"
          text="-5"
        />
        <AdjustButton
          onClick={() => onAdjustTime(-15)}
          isLoading={isAdjusting15}
          disabled={isAnyAdjusting && !isAdjusting15}
          label="Start 15 minutes earlier"
          text="-15"
        />
        <AdjustButton
          onClick={() => onAdjustTime(-30)}
          isLoading={isAdjusting30}
          disabled={isAnyAdjusting && !isAdjusting30}
          label="Start 30 minutes earlier"
          text="-30"
        />
      </div>

      {/* Duration */}
      <span 
        className="text-xs font-mono font-bold shrink-0 px-1 min-w-[44px] text-right"
        aria-label={`Current duration ${formatDuration(elapsedTime)}`}
      >
        {formatDuration(elapsedTime)}
      </span>

      {/* Stop button */}
      <button
        type="button"
        onClick={onStop}
        disabled={isStopping}
        aria-label={`Stop ${session.title || session.task.name} session`}
        aria-busy={isStopping}
        title="Stop session"
        className="w-7 h-7 rounded-md bg-danger dark:bg-danger-dark text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal flex items-center justify-center disabled:opacity-50 shrink-0 focus:outline-none focus:ring-2 focus:ring-danger focus:ring-offset-1"
      >
        {isStopping ? (
          <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
        ) : (
          <span className="w-2.5 h-2.5 bg-white rounded-sm" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

// Time Adjustment Button
interface AdjustButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled: boolean;
  label: string;
  text: string;
}

function AdjustButton({ onClick, isLoading, disabled, label, text }: AdjustButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-busy={isLoading}
      title={label}
      className="px-1.5 py-1 rounded bg-muted dark:bg-muted-dark text-foreground-muted hover:text-foreground border border-border flex items-center justify-center disabled:opacity-50 text-[10px] font-bold min-w-[28px] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
    >
      {isLoading ? (
        <Loader2 className="w-2.5 h-2.5 animate-spin" aria-hidden="true" />
      ) : (
        text
      )}
    </button>
  );
}
