'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Trash2, Pencil, GripVertical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/supabase/database.types';
import type { PlannedSession } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

type DBProject = Database['public']['Tables']['projects']['Row'];
type DBSession = Database['public']['Tables']['sessions']['Row'] & { projects: DBProject | null };

interface ProjectColumnProps {
  projects: DBProject[];
  /** Unscheduled todos (the backlog). Scheduled todos live on the timeline. */
  unscheduledSessions?: DBSession[];
  /** Count of scheduled todos per project — shown as a subtle "on timeline" badge. */
  scheduledCountByProject?: Record<string, number>;
  onEditSession: (session: PlannedSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onProjectDragStart?: (projectId: string) => void;
  onSessionUnschedule?: (sessionId: string) => void;
  onUnscheduledDrop?: (e: React.DragEvent) => void;
  onAddTodo?: (projectId: string) => void;
}

/**
 * Convert database session to app PlannedSession format
 */
function convertToPlannedSession(session: DBSession): PlannedSession {
  const isUnscheduled = session.started_at === null;

  return {
    id: session.id,
    projectId: session.project_id || '',
    project: session.projects ? {
      id: session.projects.id,
      name: session.projects.name,
      color: session.projects.color,
      icon: session.projects.icon,
    } : { id: '', name: 'Unknown', color: '#6b7280', icon: null },
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

interface ProjectGroupProps {
  project: DBProject;
  unscheduledSessions: DBSession[];
  scheduledCount: number;
  onEditSession: (session: PlannedSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onProjectDragStart?: (projectId: string) => void;
  onSessionUnschedule?: (sessionId: string) => void;
  onAddTodo?: (projectId: string) => void;
}

function ProjectGroup({
  project,
  unscheduledSessions,
  scheduledCount,
  onEditSession,
  onDeleteSession,
  onProjectDragStart,
  onSessionUnschedule,
  onAddTodo,
}: ProjectGroupProps) {
  const hasUnscheduledSessions = unscheduledSessions.length > 0;
  // Rows are open whenever they have todos and the user hasn't manually
  // collapsed them. An empty row is always closed; once it gains a todo it
  // opens automatically (unless previously collapsed by the user).
  const [collapsed, setCollapsed] = useState(false);
  const isExpanded = hasUnscheduledSessions && !collapsed;
  const [isDragging, setIsDragging] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);

  const sortedUnscheduledSessions = [...unscheduledSessions].sort((a, b) =>
    (a.created_at || 0) - (b.created_at || 0)
  );

  const handleDragStart = (e: React.DragEvent, sessionId?: string) => {
    if (sessionId) {
      // Dragging an unscheduled session — also include the project id so the
      // timeline can resolve the project without a separate lookup.
      e.dataTransfer.setData('sessionId', sessionId);
      e.dataTransfer.setData('projectId', project.id);
      e.dataTransfer.effectAllowed = 'move';
    } else {
      // Dragging the project itself
      e.dataTransfer.setData('projectId', project.id);
      e.dataTransfer.effectAllowed = 'copy';
    }
    setIsDragging(true);
    onProjectDragStart?.(project.id);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setIsDropTarget(false);
  };

  // Highlight as a drop target when a scheduled session is dragged here to
  // unschedule it (drag from timeline back to the backlog).
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // getData() only returns a value on drop, not dragover — check the
    // advertised types instead (custom type names are lowercased by the browser).
    if (e.dataTransfer.types.includes('sessionid')) {
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
        'border-b border-border-strong last:border-b-0 transition-colors',
        isDropTarget && 'bg-primary/10 ring-2 ring-inset ring-primary'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Project Header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => hasUnscheduledSessions && setCollapsed((c) => !c)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hasUnscheduledSessions) {
            e.preventDefault();
            setCollapsed((c) => !c);
          }
        }}
        draggable={true}
        onDragStart={(e) => handleDragStart(e)}
        onDragEnd={handleDragEnd}
        className={cn(
          'group w-full flex items-center gap-3 p-3 transition-colors cursor-grab active:cursor-grabbing',
          hasUnscheduledSessions ? 'hover:bg-surface-elevated' : '',
          isDragging && 'opacity-50'
        )}
      >
        <div
          className="w-1 h-8 rounded-full shrink-0"
          style={{ backgroundColor: project.color }}
        />

        {/* Chevron - only show if has unscheduled todos */}
        {hasUnscheduledSessions ? (
          isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
        )}

        <span className="font-medium flex-1 text-left truncate">{project.name}</span>

        {/* Counts: backlog (unscheduled) / on timeline (scheduled) */}
        <span
          className={cn(
            'text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 tabular-nums',
            hasUnscheduledSessions || scheduledCount > 0
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground/40 bg-muted/50'
          )}
          title={`${unscheduledSessions.length} in backlog / ${scheduledCount} on timeline`}
        >
          {unscheduledSessions.length}
          <span className="text-muted-foreground/50 mx-0.5">/</span>
          {scheduledCount}
        </span>

        {/* Add todo button */}
        {onAddTodo && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddTodo(project.id);
            }}
            onDragStart={(e) => e.preventDefault()}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
            title={`Add todo to ${project.name}`}
            aria-label={`Add todo to ${project.name}`}
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Unscheduled todos - Tree Structure */}
      {isExpanded && hasUnscheduledSessions && (
        <div className="pl-8 pr-3 pb-3">
          <div className="relative space-y-0">
            {/* Vertical line */}
            <div className="absolute left-2 top-2 bottom-2 w-px bg-border" />

            {sortedUnscheduledSessions.map((session, index) => (
              <UnscheduledTodoItem
                key={session.id}
                session={convertToPlannedSession(session)}
                projectColor={project.color}
                onEdit={() => onEditSession(convertToPlannedSession(session))}
                onDelete={() => onDeleteSession(session.id)}
                onDragStart={(e) => handleDragStart(e, session.id)}
                onDragEnd={handleDragEnd}
                isLast={index === sortedUnscheduledSessions.length - 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface UnscheduledTodoItemProps {
  session: PlannedSession;
  projectColor: string;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isLast: boolean;
}

function UnscheduledTodoItem({
  session,
  projectColor,
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
        <div className="w-4 h-px bg-border" />
        {/* Arrow head */}
        <div
          className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-[6px]"
          style={{ borderLeftColor: projectColor }}
        />
      </div>

      {/* Unscheduled Session card */}
      <div
        className={cn(
          'flex-1 flex items-center gap-2 px-3 py-2 rounded border transition-all mb-2 cursor-grab active:cursor-grabbing',
          'bg-muted/50',
          'border-dashed border-border',
          'hover:border-primary/50',
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
            {session.title || session.project.name}
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

export function ProjectColumn({
  projects,
  unscheduledSessions = [],
  scheduledCountByProject = {},
  onEditSession,
  onDeleteSession,
  onProjectDragStart,
  onSessionUnschedule,
  onUnscheduledDrop,
  onAddTodo,
}: ProjectColumnProps) {
  // Filter out archived projects and sort by sort_order
  const activeProjects = projects
    .filter((project) => !project.archived)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  // Group unscheduled sessions by project
  const unscheduledByProject = unscheduledSessions.reduce((acc, session) => {
    const projectId = session.project_id;
    if (!projectId) return acc;
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(session);
    return acc;
  }, {} as Record<string, DBSession[]>);

  // Handle drag over for the entire column (drop a scheduled session anywhere
  // in the column to unschedule it).
  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('sessionId');
    if (sessionId && onUnscheduledDrop) {
      onUnscheduledDrop(e);
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-surface-elevated/50"
      onDragOver={handleColumnDragOver}
    >
      {/* Project List */}
      <div className="flex-1 overflow-y-auto">
        {activeProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <p className="text-muted-foreground mb-4">No projects available</p>
            <p className="text-sm text-muted-foreground">
              Create projects in the Projects page first
            </p>
          </div>
        ) : (
          activeProjects.map((project) => (
            <ProjectGroup
              key={project.id}
              project={project}
              unscheduledSessions={unscheduledByProject[project.id] || []}
              scheduledCount={scheduledCountByProject[project.id] || 0}
              onEditSession={onEditSession}
              onDeleteSession={onDeleteSession}
              onProjectDragStart={onProjectDragStart}
              onSessionUnschedule={onSessionUnschedule}
              onAddTodo={onAddTodo}
            />
          ))
        )}
      </div>
    </div>
  );
}
