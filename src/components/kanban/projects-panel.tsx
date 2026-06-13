'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateProject } from '@/lib/hooks/use-projects';
import type { PlannedSessionWithTask } from '@/actions/planned-sessions';
import type { Project } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';

type DBTask = Database['public']['Tables']['tasks']['Row'];

interface ProjectsPanelProps {
  projects: Project[];
  inboxSessions: PlannedSessionWithTask[];
  kanbanSessions?: PlannedSessionWithTask[];
  expandedProjectIds: Set<string>;
  onToggleExpand: (projectId: string) => void;
  onCreateInbox: (projectId: string | null, defaultTaskId?: string) => void;
  onEditSession: (session: PlannedSessionWithTask) => void;
  pendingInbox: { projectId: string | null; title: string; defaultTaskId?: string } | null;
  onPendingTitleChange: (title: string) => void;
  onSavePendingInbox: (projectId: string | null) => void;
  onCancelPendingInbox: () => void;
  tasks?: DBTask[];
}

export function ProjectsPanel({
  projects,
  inboxSessions,
  kanbanSessions = [],
  expandedProjectIds,
  onToggleExpand,
  onCreateInbox,
  onEditSession,
  pendingInbox,
  onPendingTitleChange,
  onSavePendingInbox,
  onCancelPendingInbox,
  tasks = [],
}: ProjectsPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const createProject = useCreateProject();

  const inboxCounts = useMemo(() => {
    return inboxSessions.reduce(
      (acc, session) => {
        const pid = session.project_id ?? 'default';
        acc[pid] = (acc[pid] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [inboxSessions]);

  const kanbanCounts = useMemo(() => {
    return kanbanSessions.reduce(
      (acc, session) => {
        const pid = session.project_id ?? 'default';
        acc[pid] = (acc[pid] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [kanbanSessions]);

  const defaultInboxCount = inboxCounts['default'] || 0;
  const defaultKanbanCount = kanbanCounts['default'] || 0;
  const defaultInbox = inboxSessions.filter((s) => s.project_id === null);
  const defaultKanban = kanbanSessions.filter((s) => s.project_id === null);
  const isDefaultExpanded = expandedProjectIds.has('default');

  const toggleDefaultExpand = () => {
    toggleExpand('default');
  };

  const toggleExpand = (projectId: string) => {
    onToggleExpand(projectId);
  };

  const handleCreateProject = () => {
    const name = newProjectName.trim();
    if (!name) return;

    createProject.mutate(
      { name },
      {
        onSuccess: () => {
          setNewProjectName('');
          setIsCreating(false);
        },
      }
    );
  };

  return (
    <div className="w-64 flex-shrink-0 border-r-2 border-border-strong flex flex-col bg-surface-elevated/30 h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border-strong">
        <h2 className="font-bold text-sm uppercase tracking-wide">Projects</h2>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
          title="New project"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Default bucket */}
        <div>
          <div
            className={cn(
              'group flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors hover:bg-surface-elevated text-foreground-muted'
            )}
          >
            <button
              type="button"
              onClick={toggleDefaultExpand}
              className="p-1 rounded hover:bg-surface-elevated/80 transition-colors"
            >
              {isDefaultExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={toggleDefaultExpand}
              className="flex-1 flex items-center gap-2 min-w-0 text-left"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--project-indicator)' }}
              />
              <span className="text-sm font-medium truncate">DEFAULT</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {defaultInboxCount + defaultKanbanCount}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const firstActiveTask = tasks
                  .filter((task) => !task.archived)
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
                onCreateInbox(null, firstActiveTask?.id);
              }}
              className="p-1 rounded hover:bg-surface-elevated/80 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Add default inbox todo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isDefaultExpanded && (
            <div className="ml-7 mt-1 space-y-1">
              {pendingInbox?.projectId === null && (
                <div className="p-0 rounded-md">
                  <input
                    type="text"
                    value={pendingInbox.title}
                    onChange={(e) => onPendingTitleChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onSavePendingInbox(null);
                      }
                      if (e.key === 'Escape') {
                        onCancelPendingInbox();
                      }
                    }}
                    onBlur={() => onSavePendingInbox(null)}
                    placeholder="Todo title..."
                    className="w-full px-3 py-1.5 rounded-md border-2 border-primary bg-surface text-xs focus:outline-none"
                    autoFocus
                  />
                </div>
              )}

              {defaultInbox.map((session) => (
                <div
                  key={session.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('sessionId', session.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-surface-elevated cursor-grab active:cursor-grabbing truncate transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onEditSession(session)}
                    className="w-full text-left truncate"
                  >
                    {session.title || 'Untitled inbox todo'}
                  </button>
                </div>
              ))}

              {defaultKanban.map((session) => (
                <div
                  key={session.id}
                  className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-surface-elevated truncate transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onEditSession(session)}
                    className="w-full flex items-center gap-2 text-left truncate"
                  >
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-surface-elevated border border-border-strong shrink-0">
                      {session.kanban_status}
                    </span>
                    <span className="truncate">
                      {session.title || 'Untitled todo'}
                    </span>
                  </button>
                </div>
              ))}
              {defaultInbox.length === 0 && defaultKanban.length === 0 && !pendingInbox && (
                <p className="px-3 py-1.5 text-xs text-muted-foreground/50 italic">
                  No todos
                </p>
              )}
            </div>
          )}
        </div>

        {/* Individual projects */}
        {projects.map((project) => {
          const isExpanded = expandedProjectIds.has(project.id);
          const count =
            (inboxCounts[project.id] || 0) + (kanbanCounts[project.id] || 0);
          const projectInbox = inboxSessions.filter(
            (s) => s.project_id === project.id
          );
          const projectKanban = kanbanSessions.filter(
            (s) => s.project_id === project.id
          );

          return (
            <div key={project.id}>
              <div
                className={cn(
                  'group flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors hover:bg-surface-elevated text-foreground-muted'
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleExpand(project.id)}
                  className="p-1 rounded hover:bg-surface-elevated/80 transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleExpand(project.id)}
                  className="flex-1 flex items-center gap-2 min-w-0 text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: 'var(--project-indicator)' }}
                  />
                  <span className="text-sm font-medium truncate">{project.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{count}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const firstActiveTask = tasks
                      .filter((task) => !task.archived)
                      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
                    onCreateInbox(project.id, firstActiveTask?.id);
                  }}
                  className="p-1 rounded hover:bg-surface-elevated/80 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Add inbox todo"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Expanded inbox items */}
              {isExpanded && (
                <div className="ml-7 mt-1 space-y-1">
                  {pendingInbox?.projectId === project.id && (
                    <div className="p-0 rounded-md">
                      <input
                        type="text"
                        value={pendingInbox.title}
                        onChange={(e) => onPendingTitleChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            onSavePendingInbox(project.id);
                          }
                          if (e.key === 'Escape') {
                            onCancelPendingInbox();
                          }
                        }}
                        onBlur={() => onSavePendingInbox(project.id)}
                        placeholder="Todo title..."
                        className="w-full px-3 py-1.5 rounded-md border-2 border-primary bg-surface text-xs focus:outline-none"
                        autoFocus
                      />
                    </div>
                  )}

                  {projectInbox.map((session) => (
                    <div
                      key={session.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('sessionId', session.id);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-surface-elevated cursor-grab active:cursor-grabbing truncate transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onEditSession(session)}
                        className="w-full text-left truncate"
                      >
                        {session.title || 'Untitled inbox todo'}
                      </button>
                    </div>
                  ))}

                  {projectKanban.map((session) => (
                    <div
                      key={session.id}
                      className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-surface-elevated truncate transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onEditSession(session)}
                        className="w-full flex items-center gap-2 text-left truncate"
                      >
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-surface-elevated border border-border-strong shrink-0">
                          {session.kanban_status}
                        </span>
                        <span className="truncate">
                          {session.title || 'Untitled todo'}
                        </span>
                      </button>
                    </div>
                  ))}
                  {projectInbox.length === 0 && projectKanban.length === 0 && !pendingInbox && (
                    <p className="px-3 py-1.5 text-xs text-muted-foreground/50 italic">
                      No todos
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Inline project creation */}
        {isCreating && (
          <div className="px-3 py-2 space-y-2">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name..."
              className="w-full px-3 py-2 rounded-lg border-2 border-border-strong bg-surface text-sm focus:outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateProject();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewProjectName('');
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateProject}
                disabled={createProject.isPending}
                className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold btn-brutal disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewProjectName('');
                }}
                className="px-3 py-1.5 rounded-lg border-2 border-border-strong text-xs font-medium hover:bg-surface-elevated"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
