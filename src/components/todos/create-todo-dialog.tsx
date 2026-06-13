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

type DBTask = Database['public']['Tables']['tasks']['Row'];

interface CreateTodoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: DBTask[];
  preselectedTaskId: string | null;
  preselectedTime: number | null;
  selectedDate: Date;
  editingSession: PlannedSession | null;
  onCreate: (data: {
    taskId: string;
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
 * Format duration for display (HH:MM)
 */
function formatDurationForInput(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parse duration from input (HH:MM) to seconds
 */
function parseDurationFromInput(durationStr: string): number {
  const [hours, minutes] = durationStr.split(':').map(Number);
  return hours * 3600 + minutes * 60;
}

export function CreateTodoDialog({
  isOpen,
  onClose,
  tasks,
  preselectedTaskId,
  preselectedTime,
  selectedDate,
  editingSession,
  onCreate,
  onUpdate,
  isSubmitting,
  error,
}: CreateTodoDialogProps) {
  const [taskId, setTaskId] = useState('');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState('01:00');
  const [note, setNote] = useState('');
  const [isScheduled, setIsScheduled] = useState(false); // Default to unscheduled

  const isEditing = !!editingSession;

  // Derive default form values from props/session
  const getDefaultValues = useCallback(() => {
    if (editingSession) {
      const hasTime = editingSession.plannedStartTime !== null;
      return {
        taskId: editingSession.taskId,
        title: editingSession.title || '',
        isScheduled: hasTime,
        startTime: hasTime ? formatTimeForInput(editingSession.plannedStartTime!) : '09:00',
        duration: formatDurationForInput(editingSession.plannedDuration),
        note: editingSession.note || '',
      };
    }
    const defaultScheduled = !!preselectedTime;
    return {
      taskId: preselectedTaskId || '',
      title: '',
      isScheduled: defaultScheduled,
      startTime: preselectedTime ? formatTimeForInput(preselectedTime) : '09:00',
      duration: '01:00',
      note: '',
    };
  }, [editingSession, preselectedTaskId, preselectedTime]);

  // Reset form when dialog opens or session changes
  useEffect(() => {
    if (!isOpen) return;
    const defaults = getDefaultValues();
    requestAnimationFrame(() => {
      setTaskId(defaults.taskId);
      setTitle(defaults.title);
      setIsScheduled(defaults.isScheduled);
      setStartTime(defaults.startTime);
      setDuration(defaults.duration);
      setNote(defaults.note);
    });
  }, [isOpen, getDefaultValues]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Form submitted', { taskId, isEditing, isScheduled });

    const plannedDuration = parseDurationFromInput(duration);
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
      console.log('Creating todo with data:', {
        taskId,
        plannedDate,
        plannedStartTime,
        plannedDuration,
        isScheduled,
      });
      onCreate({
        taskId,
        plannedDate,
        plannedStartTime,
        plannedDuration,
        title: title || undefined,
        note: note || undefined,
      });
    }
  };

  const activeTasks = tasks
    .filter((task) => !task.archived)
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
            <DialogDescription>
              {isEditing
                ? 'Update your planned session details'
                : 'Plan a session for your task'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Task Selection */}
            <div className="grid gap-2">
              <Label htmlFor="task">Task</Label>
              <select
                id="task"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-surface px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                required
                disabled={isEditing} // Can't change task when editing
              >
                <option value="" className="bg-surface">Select a task</option>
                {activeTasks.map((task) => (
                  <option key={task.id} value={task.id} className="bg-surface">
                    {task.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                Title <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Session title"
                className="bg-surface"
              />
            </div>

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

            {/* Start Time - Only show if scheduled */}
            {isScheduled && (
              <div className="grid gap-2 animate-in slide-in-from-top-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required={isScheduled}
                  className="bg-surface"
                />
              </div>
            )}

            {/* Duration */}
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                type="time"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                className="bg-surface"
              />
              <p className="text-xs text-muted-foreground">
                Format: hours:minutes (e.g., 01:30 for 1 hour 30 minutes)
              </p>
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

          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm">
              {error}
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
              disabled={!taskId || isSubmitting}
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
