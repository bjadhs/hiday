'use client';

import { useState, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { cn, getKProjectColor } from '@/lib/utils';
import { useCreateKProject } from '@/lib/hooks/use-kprojects';
import type { PlannedSessionWithProject } from '@/actions/planned-sessions';
import type { KanbanStatus, KProject } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';

type DBProject = Database['public']['Tables']['projects']['Row'];

const STATUS_LABELS: Record<KanbanStatus, string> = {
  inbox: 'Inbox',
  next: 'Next',
  doing: 'Doing',
  revise: 'Revise',
  done: 'Done',
};

function statusLabel(status: string | null | undefined): string {
  return STATUS_LABELS[status as KanbanStatus] ?? status ?? '';
}

interface KProjectsPanelProps {
  kprojects: KProject[];
  inboxSessions: PlannedSessionWithProject[];
  kanbanSessions?: PlannedSessionWithProject[];
  expandedKProjectIds: Set<string>;
  onToggleExpand: (kprojectId: string) => void;
  onCreateInbox: (kprojectId: string | null, defaultProjectId?: string) => void;
  onEditSession: (session: PlannedSessionWithProject) => void;
  pendingInbox: { kprojectId: string | null; title: string; defaultProjectId?: string } | null;
  onPendingTitleChange: (title: string) => void;
  onSavePendingInbox: (kprojectId: string | null) => void;
  onCancelPendingInbox: () => void;
  projects?: DBProject[];
}

export function KProjectsPanel({
  kprojects,
  inboxSessions,
  kanbanSessions = [],
  expandedKProjectIds,
  onToggleExpand,
  onCreateInbox,
  onEditSession,
  pendingInbox,
  onPendingTitleChange,
  onSavePendingInbox,
  onCancelPendingInbox,
  projects = [],
}: KProjectsPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newKProjectName, setNewKProjectName] = useState('');
  const createKProject = useCreateKProject();

  // Set by the pending-inbox key handlers (Enter/Escape) so the input's onBlur
  // doesn't fire a second save after the key already saved or cancelled.
  const pendingKeyHandledRef = useRef(false);

  const handlePendingBlur = (kprojectId: string | null) => {
    if (pendingKeyHandledRef.current) {
      pendingKeyHandledRef.current = false;
      return;
    }
    onSavePendingInbox(kprojectId);
  };

  const inboxCounts = useMemo(() => {
    return inboxSessions.reduce(
      (acc, session) => {
        const pid = session.kproject_id ?? 'default';
        acc[pid] = (acc[pid] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [inboxSessions]);

  const kanbanCounts = useMemo(() => {
    return kanbanSessions.reduce(
      (acc, session) => {
        const pid = session.kproject_id ?? 'default';
        acc[pid] = (acc[pid] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }, [kanbanSessions]);

  const defaultInboxCount = inboxCounts['default'] || 0;
  const defaultKanbanCount = kanbanCounts['default'] || 0;
  const defaultInbox = inboxSessions.filter((s) => s.kproject_id === null);
  const defaultKanban = kanbanSessions.filter((s) => s.kproject_id === null);
  const isDefaultExpanded = expandedKProjectIds.has('default');

  const handleCreateKProject = () => {
    const name = newKProjectName.trim();
    if (!name) return;

    createKProject.mutate(
      { name },
      {
        onSuccess: () => {
          setNewKProjectName('');
          setIsCreating(false);
        },
      }
    );
  };

  return (
    <div className="w-64 flex-shrink-0 border-r-2 border-border-strong flex flex-col bg-surface-elevated/30 h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border-strong">
        <h2 className="font-bold text-sm uppercase tracking-wide">KProjects</h2>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors"
          title="New kproject"
        >
          <Plus className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* KProject list */}
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
              onClick={() => onToggleExpand('default')}
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
              onClick={() => onToggleExpand('default')}
              className="flex-1 flex items-center gap-2 min-w-0 text-left"
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--kproject-indicator)' }}
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
                const firstActiveProject = projects
                  .filter((project) => !project.archived)
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
                onCreateInbox(null, firstActiveProject?.id);
              }}
              className="p-1 rounded hover:bg-surface-elevated/80 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              title="Add default inbox todo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isDefaultExpanded && (
            <div className="ml-7 mt-1 space-y-1">
              {pendingInbox?.kprojectId === null && (
                <div className="p-0 rounded-md">
                  <input
                    type="text"
                    value={pendingInbox.title}
                    onChange={(e) => onPendingTitleChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        pendingKeyHandledRef.current = true;
                        onSavePendingInbox(null);
                      }
                      if (e.key === 'Escape') {
                        pendingKeyHandledRef.current = true;
                        onCancelPendingInbox();
                      }
                    }}
                    onBlur={() => handlePendingBlur(null)}
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
                    className="w-full flex items-center gap-2 text-left"
                  >
                    <span className="flex-1 truncate">
                      {session.title || 'Untitled todo'}
                    </span>
                    <span className="shrink-0 px-1 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide text-muted-foreground bg-surface-elevated border border-border-strong">
                      {statusLabel(session.kanban_status)}
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

        {/* Individual kprojects */}
        {kprojects.map((kproject) => {
          const isExpanded = expandedKProjectIds.has(kproject.id);
          const count =
            (inboxCounts[kproject.id] || 0) + (kanbanCounts[kproject.id] || 0);
          const kprojectInbox = inboxSessions.filter(
            (s) => s.kproject_id === kproject.id
          );
          const kprojectKanban = kanbanSessions.filter(
            (s) => s.kproject_id === kproject.id
          );

          return (
            <div key={kproject.id}>
              <div
                className={cn(
                  'group flex items-center gap-1 px-2 py-1.5 rounded-lg transition-colors hover:bg-surface-elevated text-foreground-muted'
                )}
              >
                <button
                  type="button"
                  onClick={() => onToggleExpand(kproject.id)}
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
                  onClick={() => onToggleExpand(kproject.id)}
                  className="flex-1 flex items-center gap-2 min-w-0 text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: getKProjectColor(kproject.id) }}
                  />
                  <span className="text-sm font-medium truncate">{kproject.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{count}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const firstActiveProject = projects
                      .filter((project) => !project.archived)
                      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))[0];
                    onCreateInbox(kproject.id, firstActiveProject?.id);
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
                  {pendingInbox?.kprojectId === kproject.id && (
                    <div className="p-0 rounded-md">
                      <input
                        type="text"
                        value={pendingInbox.title}
                        onChange={(e) => onPendingTitleChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            pendingKeyHandledRef.current = true;
                            onSavePendingInbox(kproject.id);
                          }
                          if (e.key === 'Escape') {
                            pendingKeyHandledRef.current = true;
                            onCancelPendingInbox();
                          }
                        }}
                        onBlur={() => handlePendingBlur(kproject.id)}
                        placeholder="Todo title..."
                        className="w-full px-3 py-1.5 rounded-md border-2 border-primary bg-surface text-xs focus:outline-none"
                        autoFocus
                      />
                    </div>
                  )}

                  {kprojectInbox.map((session) => (
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

                  {kprojectKanban.map((session) => (
                    <div
                      key={session.id}
                      className="px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:bg-surface-elevated truncate transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => onEditSession(session)}
                        className="w-full flex items-center gap-2 text-left"
                      >
                        <span className="flex-1 truncate">
                          {session.title || 'Untitled todo'}
                        </span>
                        <span className="shrink-0 px-1 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wide text-muted-foreground bg-surface-elevated border border-border-strong">
                          {statusLabel(session.kanban_status)}
                        </span>
                      </button>
                    </div>
                  ))}
                  {kprojectInbox.length === 0 && kprojectKanban.length === 0 && !pendingInbox && (
                    <p className="px-3 py-1.5 text-xs text-muted-foreground/50 italic">
                      No todos
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Inline kproject creation */}
        {isCreating && (
          <div className="px-3 py-2 space-y-2">
            <input
              type="text"
              value={newKProjectName}
              onChange={(e) => setNewKProjectName(e.target.value)}
              placeholder="KProject name..."
              className="w-full px-3 py-2 rounded-lg border-2 border-border-strong bg-surface text-sm focus:outline-none focus:border-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateKProject();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewKProjectName('');
                }
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreateKProject}
                disabled={createKProject.isPending}
                className="flex-1 px-3 py-1.5 rounded-lg bg-primary-highlight text-white text-xs font-bold btn-brutal disabled:opacity-50"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setNewKProjectName('');
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
