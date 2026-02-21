'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, MoreVertical, Play, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/supabase/database.types';
import type { PlannedSession } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

type DBTask = Database['public']['Tables']['tasks']['Row'];
type DBSession = Database['public']['Tables']['sessions']['Row'] & { tasks: DBTask | null };

interface TaskColumnProps {
  tasks: DBTask[];
  plannedSessions: DBSession[];
  onCreateTodo: (taskId: string) => void;
  onEditSession: (session: PlannedSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onStartSession: (sessionId: string) => void;
}

/**
 * Convert database session to app PlannedSession format
 */
function convertToPlannedSession(session: DBSession): PlannedSession {
  return {
    id: session.id,
    taskId: session.task_id,
    task: session.tasks ? {
      id: session.tasks.id,
      name: session.tasks.name,
      color: session.tasks.color,
      icon: session.tasks.icon,
    } : { id: '', name: 'Unknown', color: '#gray', icon: null },
    title: session.title,
    plannedStartTime: session.started_at,
    plannedEndTime: session.ended_at || session.started_at + (session.duration || 0) * 1000,
    plannedDuration: session.duration || 0,
    plannedDate: session.session_date,
    status: session.status as 'planned' | 'active' | 'completed' | 'cancelled',
    note: session.note,
  };
}

/**
 * Format time from timestamp (e.g., "9:00 AM")
 */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface TaskGroupProps {
  task: DBTask;
  sessions: DBSession[];
  onCreateTodo: (taskId: string) => void;
  onEditSession: (session: PlannedSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onStartSession: (sessionId: string) => void;
}

function TaskGroup({
  task,
  sessions,
  onCreateTodo,
  onEditSession,
  onDeleteSession,
  onStartSession,
}: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const sortedSessions = [...sessions].sort((a, b) => a.started_at - b.started_at);

  return (
    <div className="border-b border-border-strong dark:border-border-strong-dark last:border-b-0">
      {/* Task Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors"
      >
        <div
          className="w-1 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: task.color }}
        />
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
        <span className="font-medium flex-1 text-left truncate">{task.name}</span>
        <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {sessions.length}
        </span>
      </button>

      {/* Sessions List */}
      {isExpanded && (
        <div className="px-3 pb-3">
          {sortedSessions.length === 0 ? (
            <div className="text-sm text-muted-foreground py-2 px-8 bg-surface-elevated/30 dark:bg-surface-elevated-dark/30 rounded-lg">
              No planned sessions
            </div>
          ) : (
            <div className="space-y-2">
              {sortedSessions.map((session) => (
                <TodoItem
                  key={session.id}
                  session={convertToPlannedSession(session)}
                  taskColor={task.color}
                  onEdit={() => onEditSession(convertToPlannedSession(session))}
                  onDelete={() => onDeleteSession(session.id)}
                  onStart={() => onStartSession(session.id)}
                />
              ))}
            </div>
          )}
          {/* Add Todo Button */}
          <button
            onClick={() => onCreateTodo(task.id)}
            className="w-full mt-2 flex items-center gap-2 px-8 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Todo
          </button>
        </div>
      )}
    </div>
  );
}

interface TodoItemProps {
  session: PlannedSession;
  taskColor: string;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
}

function TodoItem({ session, taskColor, onEdit, onDelete, onStart }: TodoItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={cn(
        'group relative flex items-center gap-2 p-2 rounded-lg border-2 transition-all',
        'bg-white dark:bg-surface-dark',
        'border-border-strong dark:border-border-strong-dark',
        'hover:border-primary/50 dark:hover:border-primary-dark/50',
        'shadow-sm dark:shadow-none'
      )}
      style={{ borderLeftColor: taskColor, borderLeftWidth: '4px' }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Session Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">
          {session.title || session.task.name}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatTime(session.plannedStartTime)}</span>
          <span>•</span>
          <span>{formatDuration(session.plannedDuration)}</span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1">
          <button
            onClick={onStart}
            className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"
            title="Start session"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export function TaskColumn({
  tasks,
  plannedSessions,
  onCreateTodo,
  onEditSession,
  onDeleteSession,
  onStartSession,
}: TaskColumnProps) {
  // Filter out archived tasks and sort by sort_order
  const activeTasks = tasks
    .filter((task) => !task.archived)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Group sessions by task
  const sessionsByTask = plannedSessions.reduce((acc, session) => {
    const taskId = session.task_id;
    if (!acc[taskId]) {
      acc[taskId] = [];
    }
    acc[taskId].push(session);
    return acc;
  }, {} as Record<string, DBSession[]>);

  return (
    <div className="flex flex-col h-full border-r-2 border-border-strong dark:border-border-strong-dark bg-surface-elevated/50 dark:bg-surface-elevated-dark/50">
      {/* Column Header */}
      <div className="p-4 border-b-2 border-border-strong dark:border-border-strong-dark">
        <h2 className="font-semibold text-lg">Tasks</h2>
        <p className="text-sm text-muted-foreground">
          {activeTasks.length} tasks • {plannedSessions.length} planned
        </p>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {activeTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-muted-foreground mb-4">No tasks available</p>
            <p className="text-sm text-muted-foreground">
              Create tasks in the Tasks page first
            </p>
          </div>
        ) : (
          activeTasks.map((task) => (
            <TaskGroup
              key={task.id}
              task={task}
              sessions={sessionsByTask[task.id] || []}
              onCreateTodo={onCreateTodo}
              onEditSession={onEditSession}
              onDeleteSession={onDeleteSession}
              onStartSession={onStartSession}
            />
          ))
        )}
      </div>
    </div>
  );
}
