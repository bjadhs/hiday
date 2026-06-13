'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/supabase/database.types';
import type { Project, KanbanStatus } from '@/lib/types';
import type { PlannedSessionWithTask } from '@/actions/planned-sessions';
import { createKanbanTodoSchema, formatZodErrors } from '@/lib/validation';

type DBTask = Database['public']['Tables']['tasks']['Row'];

interface CreateKanbanTodoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: DBTask[];
  projects: Project[];
  defaultProjectId: string | null;
  defaultKanbanStatus: KanbanStatus;
  editingSession: PlannedSessionWithTask | null;
  onCreate: (data: {
    taskId: string;
    projectId: string | null;
    kanbanStatus: KanbanStatus;
    duration: number;
    title?: string;
    note?: string;
  }) => void;
  onUpdate: (
    sessionId: string,
    data: {
      taskId?: string | null;
      projectId?: string | null;
      kanbanStatus?: KanbanStatus;
      duration?: number;
      title?: string | null;
      note?: string | null;
    }
  ) => void;
  onDelete?: (sessionId: string) => void;
  isSubmitting: boolean;
  isDeleting?: boolean;
}

const DURATION_PRESETS = [15, 30, 60] as const;

const ALL_STATUSES: { id: KanbanStatus; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'next', label: 'Next' },
  { id: 'doing', label: 'Doing' },
  { id: 'done', label: 'Done' },
];

const BOARD_STATUSES: { id: KanbanStatus; label: string }[] = [
  { id: 'next', label: 'Next' },
  { id: 'doing', label: 'Doing' },
  { id: 'done', label: 'Done' },
];

function clampDurationMinutes(minutes: number): number {
  return Math.max(0, Math.min(1440, Math.floor(minutes) || 0));
}

export function CreateKanbanTodoDialog({
  isOpen,
  onClose,
  tasks,
  projects,
  defaultProjectId,
  defaultKanbanStatus,
  editingSession,
  onCreate,
  onUpdate,
  onDelete,
  isSubmitting,
  isDeleting,
}: CreateKanbanTodoDialogProps) {
  const isEditing = !!editingSession;

  const activeTasks = tasks
    .filter((task) => !task.archived)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const firstActiveTaskId = activeTasks[0]?.id ?? '';
  const defaultTaskId = editingSession?.task_id ?? firstActiveTaskId;

  const [taskId, setTaskId] = useState(defaultTaskId);
  const [projectId, setProjectId] = useState<string | null>(
    editingSession?.project_id ?? defaultProjectId
  );
  const [kanbanStatus, setKanbanStatus] = useState<KanbanStatus>(
    (editingSession?.kanban_status as KanbanStatus) ?? defaultKanbanStatus
  );
  const [durationMinutes, setDurationMinutes] = useState(
    Math.round((editingSession?.duration ?? 3600) / 60)
  );
  const [title, setTitle] = useState(editingSession?.title ?? '');
  const [note, setNote] = useState(editingSession?.note ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  const durationSeconds = durationMinutes * 60;
  const isInbox = kanbanStatus === 'inbox';
  const canSubmit = isInbox ? !!title.trim() : !!taskId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (isEditing && editingSession) {
      onUpdate(editingSession.id, {
        taskId: taskId || null,
        projectId,
        kanbanStatus,
        duration: durationSeconds,
        title: title || null,
        note: note || null,
      });
      return;
    }

    const result = createKanbanTodoSchema.safeParse({
      taskId: taskId || undefined,
      projectId,
      kanbanStatus,
      duration: durationSeconds,
      title: title || undefined,
      note: note || undefined,
    });

    if (!result.success) {
      const fieldErrors = formatZodErrors(result.error);
      setFormError(fieldErrors._form || Object.values(fieldErrors)[0] || 'Invalid todo');
      return;
    }
    setFormError(null);

    onCreate({
      taskId,
      projectId,
      kanbanStatus,
      duration: durationSeconds,
      title: title || undefined,
      note: note || undefined,
    });
  };

  const handleDelete = () => {
    if (!isEditing || !editingSession || !onDelete) return;
    onDelete(editingSession.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] bg-surface border-2 border-border-strong text-foreground shadow-brutal">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Todo' : 'Create New Todo'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update this todo’s details, project, or column.'
                : 'Add a todo to the Kanban board. It will be draggable across columns.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Task */}
            <div className="grid gap-2">
              <Label htmlFor="task">{isInbox ? 'Task' : 'Task *'}</Label>
              <select
                id="task"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                required={!isInbox}
                className="w-full px-3 py-2 rounded-lg border-2 border-border-strong bg-surface text-sm focus:outline-none focus:border-primary"
              >
                <option value="" disabled>{isInbox ? 'No task (inbox)' : 'Select a task...'}</option>
                {activeTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project */}
            <div className="grid gap-2">
              <Label htmlFor="project">Project</Label>
              <select
                id="project"
                value={projectId ?? ''}
                onChange={(e) =>
                  setProjectId(e.target.value || null)
                }
                className="w-full px-3 py-2 rounded-lg border-2 border-border-strong bg-surface text-sm focus:outline-none focus:border-primary"
              >
                <option value="">DEFAULT</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Column + Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="column">Column</Label>
                <select
                  id="column"
                  value={kanbanStatus}
                  onChange={(e) =>
                    setKanbanStatus(e.target.value as KanbanStatus)
                  }
                  className="w-full px-3 py-2 rounded-lg border-2 border-border-strong bg-surface text-sm focus:outline-none focus:border-primary"
                >
                  {(isEditing ? ALL_STATUSES : BOARD_STATUSES).map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={0}
                  max={1440}
                  value={durationMinutes}
                  onChange={(e) =>
                    setDurationMinutes(clampDurationMinutes(Number(e.target.value)))
                  }
                  className="border-2 border-border-strong bg-surface"
                />
                <div className="flex gap-1">
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDurationMinutes(preset)}
                      className={cn(
                        'flex-1 px-2 py-1 rounded-md text-[10px] font-bold border-2 transition-colors',
                        durationMinutes === preset
                          ? 'bg-primary text-white border-primary'
                          : 'bg-surface-elevated border-border-strong hover:border-primary/50'
                      )}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">{isInbox ? 'Title *' : 'Title'}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Todo title..."
                className="border-2 border-border-strong bg-surface"
              />
            </div>

            {/* Note */}
            <div className="grid gap-2">
              <Label htmlFor="note">Note</Label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border-2 border-border-strong bg-surface text-sm resize-none focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {formError && (
            <p className="mb-2 text-sm font-semibold text-destructive">{formError}</p>
          )}

          <DialogFooter className="gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="mr-auto"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || isDeleting}
              className="bg-primary text-primary-foreground"
            >
              {isSubmitting
                ? 'Saving...'
                : isEditing
                ? 'Save Changes'
                : 'Create Todo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
