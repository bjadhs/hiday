'use client';

import { useState, useEffect, useCallback } from 'react';
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
import type { Database } from '@/lib/supabase/database.types';
import type { PlannedSession } from '@/lib/types';
import { createPlannedSessionSchema, formatZodErrors } from '@/lib/validation';

type DBProject = Database['public']['Tables']['projects']['Row'];

interface CreateTodoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projects: DBProject[];
  preselectedProjectId: string | null;
  preselectedTime: number | null;
  selectedDate: Date;
  editingSession: PlannedSession | null;
  onCreate: (data: {
    projectId: string;
    plannedDate: string;
    plannedStartTime: number | null;  // Null for unscheduled
    plannedDuration: number;
    title?: string;
    note?: string;
  }) => void;
  onUpdate: (sessionId: string, data: {
    plannedStartTime?: number | null;
    plannedDuration?: number;
    title?: string;
    note?: string;
  }) => void;
  isSubmitting: boolean;
  error?: string | null;
}

/**
 * Format time for input[type="time"] (HH:MM)
 */
function formatTimeForInput(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toTimeString().slice(0, 5);
}

/**
 * Parse time from input[type="time"] to timestamp
 */
function parseTimeFromInput(timeStr: string, baseDate: Date): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date.getTime();
}

/**
 * Current local time as "HH:MM", rounded to the nearest 15 minutes so it lines
 * up with the timeline's snapping grid.
 */
function nowTimeForInput(): string {
  const date = new Date();
  const snapped = Math.round(date.getMinutes() / 15) * 15;
  date.setMinutes(snapped, 0, 0);
  return date.toTimeString().slice(0, 5);
}

/**
 * Convert a "HH:MM" time string to minutes-since-midnight.
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes-since-midnight to a "HH:MM" string, wrapping past midnight.
 */
function minutesToTime(totalMinutes: number): string {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function CreateTodoDialog({
  isOpen,
  onClose,
  projects,
  preselectedProjectId,
  preselectedTime,
  selectedDate,
  editingSession,
  onCreate,
  onUpdate,
  isSubmitting,
  error,
}: CreateTodoDialogProps) {
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [note, setNote] = useState('');
  const [isScheduled, setIsScheduled] = useState(false); // Default to unscheduled
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditing = !!editingSession;

  // Derive default form values from props/session
  const getDefaultValues = useCallback(() => {
    if (editingSession) {
      const hasTime = editingSession.plannedStartTime !== null;
      const durationSeconds = editingSession.plannedDuration;
      const dHours = Math.floor(durationSeconds / 3600);
      const dMinutes = Math.floor((durationSeconds % 3600) / 60);
      const start = hasTime ? formatTimeForInput(editingSession.plannedStartTime!) : nowTimeForInput();
      return {
        projectId: editingSession.projectId,
        title: editingSession.title || '',
        isScheduled: hasTime,
        startTime: start,
        endTime: minutesToTime(timeToMinutes(start) + dHours * 60 + dMinutes),
        durationHours: dHours,
        durationMinutes: dMinutes,
        note: editingSession.note || '',
      };
    }
    const defaultScheduled = !!preselectedTime;
    const start = preselectedTime ? formatTimeForInput(preselectedTime) : nowTimeForInput();
    return {
      projectId: preselectedProjectId || '',
      title: '',
      isScheduled: defaultScheduled,
      startTime: start,
      endTime: minutesToTime(timeToMinutes(start) + 60),
      durationHours: 1,
      durationMinutes: 0,
      note: '',
    };
  }, [editingSession, preselectedProjectId, preselectedTime]);

  // Reset form when dialog opens or session changes
  useEffect(() => {
    if (!isOpen) return;
    const defaults = getDefaultValues();
    requestAnimationFrame(() => {
      setProjectId(defaults.projectId);
      setTitle(defaults.title);
      setIsScheduled(defaults.isScheduled);
      setStartTime(defaults.startTime);
      setEndTime(defaults.endTime);
      setDurationHours(defaults.durationHours);
      setDurationMinutes(defaults.durationMinutes);
      setNote(defaults.note);
    });
  }, [isOpen, getDefaultValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Form submitted', { projectId, isEditing, isScheduled });

    const plannedDuration = durationHours * 3600 + durationMinutes * 60;
    // Only set start time if scheduled, otherwise null (unscheduled)
    const plannedStartTime = isScheduled ? parseTimeFromInput(startTime, selectedDate) : null;

    if (isEditing && editingSession) {
      onUpdate(editingSession.id, {
        plannedStartTime,
        plannedDuration,
        title: title || undefined,
        note: note || undefined,
      });
    } else {
      const plannedDate = selectedDate.toISOString().split('T')[0];

      const result = createPlannedSessionSchema.safeParse({
        projectId,
        plannedDate,
        plannedStartTime,
        plannedDuration,
        title: title || undefined,
        note: note || undefined,
      });

      if (!result.success) {
        const fieldErrors = formatZodErrors(result.error);
        setValidationError(
          fieldErrors.projectId || fieldErrors.plannedDuration || Object.values(fieldErrors)[0] || 'Invalid todo'
        );
        return;
      }
      setValidationError(null);

      onCreate({
        projectId,
        plannedDate,
        plannedStartTime,
        plannedDuration,
        title: title || undefined,
        note: note || undefined,
      });
    }
  };

  // Keep start / end / duration in sync.
  // Editing start keeps the duration and shifts the end.
  const handleStartChange = (value: string) => {
    setStartTime(value);
    setEndTime(minutesToTime(timeToMinutes(value) + durationHours * 60 + durationMinutes));
  };

  // Editing end recomputes the duration (end - start), wrapping past midnight.
  const handleEndChange = (value: string) => {
    setEndTime(value);
    let diff = timeToMinutes(value) - timeToMinutes(startTime);
    if (diff <= 0) diff += 1440;
    setDurationHours(Math.floor(diff / 60));
    setDurationMinutes(diff % 60);
  };

  // Editing duration reflects onto the end time (start stays put).
  const handleDurationChange = (hours: number, minutes: number) => {
    const h = Number.isNaN(hours) ? 0 : Math.max(0, Math.min(23, hours));
    const m = Number.isNaN(minutes) ? 0 : Math.max(0, Math.min(59, minutes));
    setDurationHours(h);
    setDurationMinutes(m);
    setEndTime(minutesToTime(timeToMinutes(startTime) + h * 60 + m));
  };

  const activeProjects = projects
    .filter((project) => !project.archived)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        console.log('Dialog closing');
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px] bg-surface border-border-strong text-foreground">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Edit Todo' : 'Create New Todo'}
            </DialogTitle>
            {isEditing && (
              <DialogDescription>
                Update your planned session details
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {(() => {
              const projectField = (
                <div className="grid gap-2" key="project">
                  <Label htmlFor="project">Project</Label>
                  <select
                    id="project"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-surface px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    required
                    disabled={isEditing} // Can't change project when editing
                  >
                    <option value="" className="bg-surface">Select a project</option>
                    {activeProjects.map((project) => (
                      <option key={project.id} value={project.id} className="bg-surface">
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              );

              const titleField = (
                <div className="grid gap-2" key="title">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Your todo"
                    className="bg-surface"
                  />
                </div>
              );

              // Title leads, then Project.
              return [titleField, projectField];
            })()}

            {/* Schedule Toggle */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
              <input
                type="checkbox"
                id="isScheduled"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
              />
              <Label htmlFor="isScheduled" className="text-sm font-medium cursor-pointer flex-1">
                Schedule on timeline
              </Label>
              <span className="text-xs text-muted-foreground">
                {isScheduled ? 'Will appear on timeline' : 'No specific time'}
              </span>
            </div>

            {/* Start & End Time - Only show if scheduled */}
            {isScheduled && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => handleStartChange(e.target.value)}
                    required={isScheduled}
                    className="bg-surface"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => handleEndChange(e.target.value)}
                    required={isScheduled}
                    className="bg-surface"
                  />
                </div>
              </div>
            )}

            {/* Duration (hours / minutes) */}
            <div className="grid gap-2">
              <Label>Duration</Label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    id="durationHours"
                    type="number"
                    min={0}
                    max={23}
                    value={durationHours}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value, 10), durationMinutes)}
                    required
                    className="bg-surface pr-8"
                    aria-label="Duration hours"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
                    H
                  </span>
                </div>
                <div className="relative flex-1">
                  <Input
                    id="durationMinutes"
                    type="number"
                    min={0}
                    max={59}
                    value={durationMinutes}
                    onChange={(e) => handleDurationChange(durationHours, parseInt(e.target.value, 10))}
                    required
                    className="bg-surface pr-8"
                    aria-label="Duration minutes"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground pointer-events-none">
                    m
                  </span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="grid gap-2">
              <Label htmlFor="note">
                Note <span className="text-muted-foreground">(optional)</span>
              </Label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note about this session"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none text-foreground"
              />
            </div>
          </div>

          {(validationError || error) && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
              {validationError || error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!projectId || isSubmitting}
              className="btn-brutal"
            >
              {isSubmitting
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                  ? 'Update Todo'
                  : 'Create Todo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
