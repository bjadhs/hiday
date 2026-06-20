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
import type { KProject, KanbanStatus } from '@/lib/types';
import type { PlannedSessionWithProject } from '@/actions/planned-sessions';
import { createKanbanTodoSchema, formatZodErrors } from '@/lib/validation';

type DBProject = Database['public']['Tables']['projects']['Row'];

interface CreateKanbanTodoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projects: DBProject[];
  kprojects: KProject[];
  defaultKProjectId: string | null;
  defaultKanbanStatus: KanbanStatus;
  editingSession:
    | (PlannedSessionWithProject & { activeSessionStartedAt?: number | null })
    | null;
  onCreate: (data: {
    projectId: string;
    kprojectId: string | null;
    kanbanStatus: KanbanStatus;
    duration: number;
    title?: string;
    note?: string;
  }) => void;
  onUpdate: (
    sessionId: string,
    data: {
      projectId?: string | null;
      kprojectId?: string | null;
      kanbanStatus?: KanbanStatus;
      duration?: number;
      plannedStartTime?: number | null;
      plannedEndTime?: number | null;
      title?: string | null;
      note?: string | null;
    },
  ) => void;
  onDelete?: (sessionId: string) => void;
  isSubmitting: boolean;
  isDeleting?: boolean;
}

const DURATION_PRESETS = [15, 30, 60] as const;

/**
 * Format a Unix timestamp (ms) for input[type="datetime-local"] in local time.
 */
function formatDateTimeLocal(timestamp: number | null | undefined): string {
  if (timestamp == null) return '';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Parse a datetime-local string to a Unix timestamp (ms).
 */
function parseDateTimeLocal(value: string): number | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

const ALL_STATUSES: { id: KanbanStatus; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'next', label: 'Next' },
  { id: 'doing', label: 'Doing' },
  { id: 'revise', label: 'Revise' },
  { id: 'done', label: 'Done' },
];

const BOARD_STATUSES: { id: KanbanStatus; label: string }[] = [
  { id: 'next', label: 'Next' },
  { id: 'doing', label: 'Doing' },
  { id: 'revise', label: 'Revise' },
  { id: 'done', label: 'Done' },
];

function clampDurationMinutes(minutes: number): number {
  return Math.max(0, Math.min(1440, Math.floor(minutes) || 0));
}

export function CreateKanbanTodoDialog({
  isOpen,
  onClose,
  projects,
  kprojects,
  defaultKProjectId,
  defaultKanbanStatus,
  editingSession,
  onCreate,
  onUpdate,
  onDelete,
  isSubmitting,
  isDeleting,
}: CreateKanbanTodoDialogProps) {
  const isEditing = !!editingSession;

  const activeProjects = projects
    .filter((project) => !project.archived)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const firstActiveProjectId = activeProjects[0]?.id ?? '';
  const defaultProjectId = editingSession?.project_id ?? firstActiveProjectId;

  const [projectId, setProjectId] = useState(defaultProjectId);
  const [kprojectId, setKProjectId] = useState<string | null>(
    editingSession?.kproject_id ?? defaultKProjectId,
  );
  const [kanbanStatus, setKanbanStatus] = useState<KanbanStatus>(
    (editingSession?.kanban_status as KanbanStatus) ?? defaultKanbanStatus,
  );
  const [durationMinutes, setDurationMinutes] = useState(
    Math.round((editingSession?.duration ?? 3600) / 60),
  );
  const [startDateTime, setStartDateTime] = useState(
    formatDateTimeLocal(
      editingSession?.started_at ?? editingSession?.activeSessionStartedAt,
    ),
  );
  const [endDateTime, setEndDateTime] = useState(
    formatDateTimeLocal(editingSession?.ended_at),
  );
  const [title, setTitle] = useState(editingSession?.title ?? '');
  const [note, setNote] = useState(editingSession?.note ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  const durationSeconds = durationMinutes * 60;
  const isInbox = kanbanStatus === 'inbox';
  const canSubmit = isInbox ? !!title.trim() : !!projectId;

  const computeDurationMinutes = (start: string, end: string): number => {
    const startTs = parseDateTimeLocal(start);
    const endTs = parseDateTimeLocal(end);
    if (startTs == null || endTs == null) return durationMinutes;
    return Math.max(0, Math.round((endTs - startTs) / 60000));
  };

  const computeEndDateTime = (start: string, minutes: number): string => {
    const startTs = parseDateTimeLocal(start);
    if (startTs == null) return endDateTime;
    return formatDateTimeLocal(startTs + minutes * 60000);
  };

  const handleStartDateTimeChange = (value: string) => {
    setStartDateTime(value);
    if (endDateTime) {
      setDurationMinutes(computeDurationMinutes(value, endDateTime));
    } else if (durationMinutes > 0) {
      setEndDateTime(computeEndDateTime(value, durationMinutes));
    }
  };

  const handleEndDateTimeChange = (value: string) => {
    setEndDateTime(value);
    if (startDateTime) {
      setDurationMinutes(computeDurationMinutes(startDateTime, value));
    }
  };

  const handleDurationChange = (minutes: number) => {
    setDurationMinutes(minutes);
    if (startDateTime) {
      setEndDateTime(computeEndDateTime(startDateTime, minutes));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (isEditing && editingSession) {
      const plannedStartTime = parseDateTimeLocal(startDateTime);
      const plannedEndTime = parseDateTimeLocal(endDateTime);
      onUpdate(editingSession.id, {
        projectId: projectId || null,
        kprojectId,
        kanbanStatus,
        duration: durationSeconds,
        plannedStartTime,
        plannedEndTime,
        title: title || null,
        note: note || null,
      });
      return;
    }

    const result = createKanbanTodoSchema.safeParse({
      projectId: projectId || undefined,
      kprojectId,
      kanbanStatus,
      duration: durationSeconds,
      title: title || undefined,
      note: note || undefined,
    });

    if (!result.success) {
      const fieldErrors = formatZodErrors(result.error);
      setFormError(
        fieldErrors._form || Object.values(fieldErrors)[0] || 'Invalid todo',
      );
      return;
    }
    setFormError(null);

    onCreate({
      projectId,
      kprojectId,
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
      <DialogContent className='sm:max-w-[440px] bg-surface border-2 border-border-strong text-foreground shadow-brutal'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Todo' : 'Create New Todo'}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? 'Update this todo’s details, kproject, or column.'
                : 'Add a todo to the Kanban board. It will be draggable across columns.'}
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            {/* Project */}
            <div className='grid gap-2'>
              <Label htmlFor='project'>{isInbox ? 'Project' : 'Project *'}</Label>
              <select
                id='project'
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required={!isInbox}
                className='w-full px-3 py-2 rounded-lg border-2 border-border-strong bg-surface text-sm focus:outline-none focus:border-primary'
              >
                <option value='' disabled>
                  {isInbox ? 'No project (inbox)' : 'Select a project...'}
                </option>
                {activeProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {!isInbox && activeProjects.length === 0 && (
                <p className='text-xs text-muted-foreground'>
                  No active projects yet. Create a project first, or add this as an
                  inbox item instead.
                </p>
              )}
            </div>

            {/* KProject */}
            <div className='grid gap-2'>
              <Label htmlFor='kproject'>KProject</Label>
              <select
                id='kproject'
                value={kprojectId ?? ''}
                onChange={(e) => setKProjectId(e.target.value || null)}
                className='w-full px-3 py-2 rounded-lg border-2 border-border-strong bg-surface text-sm focus:outline-none focus:border-primary'
              >
                <option value=''>DEFAULT</option>
                {kprojects.map((kproject) => (
                  <option key={kproject.id} value={kproject.id}>
                    {kproject.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Column + Duration */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <Label htmlFor='column'>Column</Label>
                <select
                  id='column'
                  value={kanbanStatus}
                  onChange={(e) =>
                    setKanbanStatus(e.target.value as KanbanStatus)
                  }
                  className='w-full px-3 py-2 rounded-lg border-2 border-border-strong bg-surface text-sm focus:outline-none focus:border-primary'
                >
                  {(isEditing ? ALL_STATUSES : BOARD_STATUSES).map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='duration'>Duration (minutes)</Label>
                <Input
                  id='duration'
                  type='number'
                  min={0}
                  max={1440}
                  value={durationMinutes}
                  onChange={(e) =>
                    handleDurationChange(
                      clampDurationMinutes(Number(e.target.value)),
                    )
                  }
                  className='border-2 border-border-strong bg-surface'
                />
                <div className='flex gap-1'>
                  {DURATION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type='button'
                      onClick={() => handleDurationChange(preset)}
                      className={cn(
                        'flex-1 px-2 py-1 rounded-md text-[10px] font-bold border-2 transition-colors',
                        durationMinutes === preset
                          ? 'bg-primary-highlight text-white border-primary'
                          : 'bg-surface-elevated border-border-strong hover:border-primary/50',
                      )}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Start / End datetime (edit only) */}
            {isEditing && (
              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='startDateTime'>Start</Label>
                  <Input
                    id='startDateTime'
                    type='datetime-local'
                    value={startDateTime}
                    onChange={(e) => handleStartDateTimeChange(e.target.value)}
                    className='border-2 border-border-strong bg-surface'
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='endDateTime'>End</Label>
                  <Input
                    id='endDateTime'
                    type='datetime-local'
                    value={endDateTime}
                    onChange={(e) => handleEndDateTimeChange(e.target.value)}
                    className='border-2 border-border-strong bg-surface'
                  />
                </div>
              </div>
            )}

            {/* Title */}
            <div className='grid gap-2'>
              <Label htmlFor='title'>{isInbox ? 'Title *' : 'Title'}</Label>
              <Input
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='Todo title...'
                className='border-2 border-border-strong bg-surface'
              />
            </div>

            {/* Note */}
            <div className='grid gap-2'>
              <Label htmlFor='note'>Note</Label>
              <textarea
                id='note'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder='Optional note...'
                rows={3}
                className='w-full px-3 py-2 rounded-lg border-2 border-border-strong bg-surface text-sm resize-none focus:outline-none focus:border-primary'
              />
            </div>
          </div>

          {formError && (
            <p className='mb-2 text-sm font-semibold text-destructive'>
              {formError}
            </p>
          )}

          <DialogFooter className='gap-2'>
            {isEditing && onDelete && (
              <Button
                type='button'
                variant='destructive'
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className='mr-auto'
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            )}
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={!canSubmit || isSubmitting || isDeleting}
              className='bg-primary-highlight text-primary-foreground'
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
