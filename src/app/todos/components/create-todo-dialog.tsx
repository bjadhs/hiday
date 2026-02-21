'use client';

import { useState, useEffect } from 'react';
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
    plannedStartTime: number;
    plannedDuration: number;
    title?: string;
    note?: string;
  }) => void;
  onUpdate: (sessionId: string, data: {
    plannedStartTime?: number;
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

  const isEditing = !!editingSession;

  // Initialize form when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (editingSession) {
        // Editing existing session
        setTaskId(editingSession.taskId);
        setTitle(editingSession.title || '');
        setStartTime(formatTimeForInput(editingSession.plannedStartTime));
        setDuration(formatDurationForInput(editingSession.plannedDuration));
        setNote(editingSession.note || '');
      } else {
        // Creating new session
        setTaskId(preselectedTaskId || '');
        setTitle('');
        setStartTime(preselectedTime ? formatTimeForInput(preselectedTime) : '09:00');
        setDuration('01:00');
        setNote('');
      }
    }
  }, [isOpen, editingSession, preselectedTaskId, preselectedTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('Form submitted', { taskId, isEditing });

    const plannedStartTime = parseTimeFromInput(startTime, selectedDate);
    const plannedDuration = parseDurationFromInput(duration);

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
      <DialogContent className="sm:max-w-[425px] bg-surface dark:bg-surface-dark border-border-strong dark:border-border-strong-dark text-foreground dark:text-foreground-dark">
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
                className="flex h-9 w-full rounded-md border border-input bg-surface dark:bg-surface-dark px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-foreground dark:text-foreground-dark"
                required
                disabled={isEditing} // Can't change task when editing
              >
                <option value="" className="bg-surface dark:bg-surface-dark">Select a task</option>
                {activeTasks.map((task) => (
                  <option key={task.id} value={task.id} className="bg-surface dark:bg-surface-dark">
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
                className="bg-surface dark:bg-surface-dark"
              />
            </div>

            {/* Start Time */}
            <div className="grid gap-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="bg-surface dark:bg-surface-dark"
              />
            </div>

            {/* Duration */}
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                type="time"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                className="bg-surface dark:bg-surface-dark"
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
                className="flex min-h-[80px] w-full rounded-md border border-input bg-surface dark:bg-surface-dark px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none text-foreground dark:text-foreground-dark"
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
