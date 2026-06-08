'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Play, Trash2, Pencil, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/supabase/database.types';
import type { PlannedSession } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

type DBTask = Database['public']['Tables']['tasks']['Row'];
type DBSession = Database['public']['Tables']['sessions']['Row'] & { tasks: DBTask | null };

interface TaskColumnProps {
  tasks: DBTask[];
  plannedSessions: DBSession[];
  unscheduledSessions?: DBSession[];
  onCreateTodo: (taskId: string) => void;
  onEditSession: (session: PlannedSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onStartSession: (sessionId: string) => void;
  onTaskDragStart?: (taskId: string) => void;
  onSessionUnschedule?: (sessionId: string) => void;
  onUnscheduledDrop?: (e: React.DragEvent) => void;
}

/**
 * Convert database session to app PlannedSession format
 */
function convertToPlannedSession(session: DBSession): PlannedSession {
  const isUnscheduled = session.started_at === null;

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
    plannedEndTime: session.ended_at || (session.started_at ? session.started_at + (session.duration || 0) * 1000 : null),
    plannedDuration: session.duration || 0,
    plannedDate: session.session_date,
    status: session.status as 'planned' | 'active' | 'completed' | 'cancelled',
    note: session.note,
    isUnscheduled,
  };
}

/**
 * Format time from timestamp (e.g., "9:00 AM")
 * Returns 'Not set' for null timestamps
 */
function formatTime(timestamp: number | null | undefined): string {
  if (!timestamp) return 'Not set';
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

interface TaskGroupProps {
  task: DBTask;
  sessions: DBSession[];
  unscheduledSessions: DBSession[];
  onCreateTodo: (taskId: string) => void;
  onEditSession: (session: PlannedSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onStartSession: (sessionId: string) => void;
  onTaskDragStart?: (taskId: string) => void;
  onSessionUnschedule?: (sessionId: string) => void;
}

function TaskGroup({
  task,
  sessions,
  unscheduledSessions,
  onCreateTodo,
  onEditSession,
  onDeleteSession,
  onStartSession,
  onTaskDragStart,
  onSessionUnschedule,
}: TaskGroupProps) {
  const hasScheduledSessions = sessions.length > 0;
  const hasUnscheduledSessions = unscheduledSessions.length > 0;
  const hasAnySessions = hasScheduledSessions || hasUnscheduledSessions;
  const [isExpanded, setIsExpanded] = useState(hasAnySessions);
  const [isDragging, setIsDragging] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);

  const sortedScheduledSessions = [...sessions].sort((a, b) => (a.started_at || 0) - (b.started_at || 0));
  const sortedUnscheduledSessions = [...unscheduledSessions].sort((a, b) =>
    (a.created_at || 0) - (b.created_at || 0)
  );

  const handleDragStart = (e: React.DragEvent, sessionId?: string) => {
    if (sessionId) {
      // Dragging an unscheduled session
      e.dataTransfer.setData('sessionId', sessionId);
      e.dataTransfer.effectAllowed = 'move';
    } else {
      // Dragging the task itself
      e.dataTransfer.setData('taskId', task.id);
      e.dataTransfer.effectAllowed = 'copy';
    }
    setIsDragging(true);
    onTaskDragStart?.(task.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDropTarget(false);
  };

  // Handle dropping a scheduled session here to unschedule it
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('sessionId');
    if (sessionId) {
      setIsDropTarget(true);
    }
  };

  const handleDragLeave = () => {
    setIsDropTarget(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDropTarget(false);
    const sessionId = e.dataTransfer.getData('sessionId');
    if (sessionId && onSessionUnschedule) {
      onSessionUnschedule(sessionId);
    }
  };

  return (
    <div
      className={cn(
        "border-b border-border-strong last:border-b-0 transition-colors",
        isDropTarget && "bg-primary/10 border-primary"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Task Header */}
      <button
        onClick={() => hasAnySessions && setIsExpanded(!isExpanded)}
        disabled={!hasAnySessions}
        draggable={true}
        onDragStart={(e) => handleDragStart(e)}
        onDragEnd={handleDragEnd}
        className={cn(
          "w-full flex items-center gap-3 p-3 transition-colors",
          hasAnySessions
            ? "hover:bg-surface-elevated cursor-pointer"
            : "cursor-default",
          isDragging && "opacity-50"
        )}
      >
        <div
          className="w-1 h-8 rounded-full shrink-0"
          style={{ backgroundColor: task.color }}
        />

        {/* Chevron - only show if has sessions */}
        {hasAnySessions ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 fill-muted-foreground/30" />
          )
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
        )}

        <span className="font-medium flex-1 text-left truncate">{task.name}</span>
        <span className={cn(
          "text-sm px-2 py-0.5 rounded-full",
          hasAnySessions
            ? "text-muted-foreground bg-muted"
            : "text-muted-foreground/50 bg-muted/50"
        )}>
          {sessions.length + unscheduledSessions.length}
        </span>

        {/* Drag hint */}
        <div className="text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
          Drag to timeline
        </div>
      </button>

      {/* Sessions List - Tree Structure */}
      {isExpanded && hasAnySessions && (
        <div className="pl-8 pr-3 pb-3">
          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border dark:bg-border-dark" />

            {/* Unscheduled Sessions First */}
            {sortedUnscheduledSessions.map((session, index) => (
              <UnscheduledTodoItem
                key={session.id}
                session={convertToPlannedSession(session)}
                taskColor={task.color}
                onEdit={() => onEditSession(convertToPlannedSession(session))}
                onDelete={() => onDeleteSession(session.id)}
                onDragStart={(e) => handleDragStart(e, session.id)}
                onDragEnd={handleDragEnd}
                isLast={index === sortedUnscheduledSessions.length - 1 && sortedScheduledSessions.length === 0}
              />
            ))}

            {/* Scheduled Sessions */}
            {sortedScheduledSessions.map((session, index) => (
              <TodoItem
                key={session.id}
                session={convertToPlannedSession(session)}
                taskColor={task.color}
                onEdit={() => onEditSession(convertToPlannedSession(session))}
                onDelete={() => onDeleteSession(session.id)}
                onStart={() => onStartSession(session.id)}
                isLast={index === sortedScheduledSessions.length - 1}
              />
            ))}
          </div>
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
  isLast: boolean;
}

interface UnscheduledTodoItemProps {
  session: PlannedSession;
  taskColor: string;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isLast: boolean;
}

function UnscheduledTodoItem({
  session,
  taskColor,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  isLast,
}: UnscheduledTodoItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  return (
    <div
      className="relative flex items-start group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Tree connector lines */}
      <div className="absolute -left-6 top-4 flex items-center">
        {/* Horizontal line pointing right */}
        <div className="w-4 h-px bg-border dark:bg-border-dark" />
        {/* Arrow head */}
        <div
          className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-[6px]"
          style={{ borderLeftColor: taskColor }}
        />
      </div>

      {/* Unscheduled Session card */}
      <div
        className={cn(
          'flex-1 flex items-center gap-2 px-3 py-2 rounded border transition-all mb-2 cursor-grab active:cursor-grabbing',
          'bg-muted/50 dark:bg-muted-dark/50',
          'border-dashed border-border',
          'hover:border-primary/50 dark:hover:border-primary-dark/50',
          isDragging && 'opacity-50',
          isLast && 'mb-0'
        )}
      >
        {/* Drag Handle */}
        <div className="text-muted-foreground/50">
          <GripVertical className="w-3 h-3" />
        </div>

        {/* Session Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs truncate">
            {session.title || session.task.name}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="italic">Unscheduled</span>
            <span>•</span>
            <span>{formatDuration(session.plannedDuration)}</span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1">
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
    </div>
  );
}

function TodoItem({ session, taskColor, onEdit, onDelete, onStart, isLast }: TodoItemProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className="relative flex items-start group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Tree connector lines */}
      <div className="absolute -left-6 top-4 flex items-center">
        {/* Horizontal line pointing right */}
        <div className="w-4 h-px bg-border dark:bg-border-dark" />
        {/* Arrow head */}
        <div
          className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-[6px]"
          style={{ borderLeftColor: taskColor }}
        />
      </div>

      {/* Session card */}
      <div
        className={cn(
          'flex-1 flex items-center gap-2 px-3 py-2 rounded border transition-all mb-2',
          'bg-background-elevated',
          'border-border-strong',
          'hover:border-primary/50 dark:hover:border-primary-dark/50',
          'shadow-sm dark:shadow-none',
          isLast && 'mb-0'
        )}
      >
        {/* Session Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs truncate">
            {session.title || session.task.name}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
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
    </div>
  );
}

export function TaskColumn({
  tasks,
  plannedSessions,
  unscheduledSessions = [],
  onCreateTodo,
  onEditSession,
  onDeleteSession,
  onStartSession,
  onTaskDragStart,
  onSessionUnschedule,
  onUnscheduledDrop,
}: TaskColumnProps) {
  // Filter out archived tasks and sort by sort_order
  const activeTasks = tasks
    .filter((task) => !task.archived)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Group scheduled sessions by task
  const sessionsByTask = plannedSessions.reduce((acc, session) => {
    const taskId = session.task_id;
    if (!acc[taskId]) {
      acc[taskId] = [];
    }
    acc[taskId].push(session);
    return acc;
  }, {} as Record<string, DBSession[]>);

  // Group unscheduled sessions by task
  const unscheduledByTask = unscheduledSessions.reduce((acc, session) => {
    const taskId = session.task_id;
    if (!acc[taskId]) {
      acc[taskId] = [];
    }
    acc[taskId].push(session);
    return acc;
  }, {} as Record<string, DBSession[]>);

  // Handle drag over for the entire column
  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('sessionId');
    if (sessionId && onUnscheduledDrop) {
      onUnscheduledDrop(e);
    }
  };

  return (
    <div
      className="flex flex-col h-full border-r-2 border-border-strong bg-surface-elevated/50 bg-surface-elevated/50"
      onDragOver={handleColumnDragOver}
    >
      {/* Column Header */}
      <div className="p-4 border-b-2 border-border-strong">
        <h2 className="font-semibold text-lg">Tasks</h2>
        <p className="text-sm text-muted-foreground">
          {activeTasks.length} tasks • {plannedSessions.length + unscheduledSessions.length} todos
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
              unscheduledSessions={unscheduledByTask[task.id] || []}
              onCreateTodo={onCreateTodo}
              onEditSession={onEditSession}
              onDeleteSession={onDeleteSession}
              onStartSession={onStartSession}
              onTaskDragStart={onTaskDragStart}
              onSessionUnschedule={onSessionUnschedule}
            />
          ))
        )}
      </div>
    </div>
  );
}
