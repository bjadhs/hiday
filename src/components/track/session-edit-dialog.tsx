'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Task, HistorySession } from '@/lib/types';
import { useTasks } from '@/lib/hooks/use-tasks';
import { useUpdateSession, useDeleteSession } from '@/lib/hooks/use-sessions';
import { ChevronDown, Trash2, Loader2, Clock } from 'lucide-react';
import { formatDuration, formatTime, cn } from '@/lib/utils';

export type SessionEditDialogProps = {
  session: HistorySession | null;
  isOpen: boolean;
  onClose: () => void;
};

export function SessionEditDialog({
  session,
  isOpen,
  onClose,
}: SessionEditDialogProps) {
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();

  const [title, setTitle] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Initialize form when session changes
  useEffect(() => {
    if (session) {
      setTitle(session.title || session.task.name);
      setSelectedTask(session.task);
      
      // Format times for datetime-local input (YYYY-MM-DDTHH:mm)
      const startDate = new Date(session.startedAt);
      setStartTime(formatDateTimeLocal(startDate));
      
      if (session.endedAt) {
        const endDate = new Date(session.endedAt);
        setEndTime(formatDateTimeLocal(endDate));
      } else {
        setEndTime('');
      }
    }
  }, [session]);

  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSave = async () => {
    if (!session || !selectedTask) return;

    const startedAt = new Date(startTime).getTime();
    const endedAt = endTime ? new Date(endTime).getTime() : null;
    
    // Calculate duration in seconds
    const duration = endedAt 
      ? Math.floor((endedAt - startedAt) / 1000)
      : Math.floor((Date.now() - startedAt) / 1000);

    try {
      await updateSessionMutation.mutateAsync({
        id: session.id,
        updates: {
          title: title.trim() || null,
          task_id: selectedTask.id,
          started_at: startedAt,
          ended_at: endedAt,
          duration: duration > 0 ? duration : 0,
        },
      });
      onClose();
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const handleDelete = async () => {
    if (!session) return;

    try {
      await deleteSessionMutation.mutateAsync(session.id);
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const calculateDuration = (): string => {
    if (!startTime) return '--:--';
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    return formatDuration(seconds > 0 ? seconds : 0);
  };

  const isValid = 
    title.trim() && 
    selectedTask && 
    startTime && 
    (!endTime || new Date(endTime) > new Date(startTime));

  if (!session) return null;

  return (
    <>
      <Dialog open={isOpen && !isDeleteConfirmOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground dark:text-foreground-dark">
              <span className="text-2xl">✏️</span>
              Edit Session
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Session Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-foreground dark:text-foreground-dark">
                Session Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What did you work on?"
                className="border-2 border-border-strong dark:border-border-strong-dark focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Task Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground dark:text-foreground-dark">Task</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isLoadingTasks}
                    className="w-full justify-between border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-xs btn-brutal bg-surface dark:bg-surface-dark text-foreground dark:text-foreground-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark"
                  >
                    {selectedTask ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-sm border-2 border-black/10"
                          style={{ backgroundColor: selectedTask.color }}
                        >
                          {selectedTask.icon}
                        </span>
                        <span className="text-foreground dark:text-foreground-dark">{selectedTask.name}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground dark:text-muted-foreground-dark">Select a task</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-muted-foreground dark:text-muted-foreground-dark" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 max-h-60 overflow-y-auto bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark"
                >
                  {tasks.map((task) => (
                    <DropdownMenuItem
                      key={task.id}
                      onClick={() => setSelectedTask(task as Task)}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer text-foreground dark:text-foreground-dark hover:text-foreground dark:hover:text-foreground-dark',
                        selectedTask?.id === task.id && 'bg-primary/10'
                      )}
                    >
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-sm border-2 border-black/10"
                        style={{ backgroundColor: task.color }}
                      >
                        {task.icon}
                      </span>
                      <span>{task.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Start and End Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-semibold flex items-center gap-1 text-foreground dark:text-foreground-dark">
                  <Clock className="w-3.5 h-3.5" />
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="border-2 border-border-strong dark:border-border-strong-dark focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-semibold flex items-center gap-1 text-foreground dark:text-foreground-dark">
                  <Clock className="w-3.5 h-3.5" />
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="Still ongoing..."
                  className="border-2 border-border-strong dark:border-border-strong-dark focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
            </div>

            {/* Duration Preview */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border dark:border-border-dark">
              <span className="text-sm text-muted-foreground dark:text-muted-foreground-dark">Duration</span>
              <span className="font-mono font-semibold text-primary">
                {calculateDuration()}
              </span>
            </div>
          </div>

          <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="border-2 border-danger text-danger dark:text-danger-dark hover:bg-danger/10 shadow-brutal-xs btn-brutal bg-surface dark:bg-surface-dark"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-xs btn-brutal bg-surface dark:bg-surface-dark text-foreground dark:text-foreground-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isValid || updateSessionMutation.isPending}
                className="bg-primary text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal disabled:opacity-50 hover:bg-primary-dark"
              >
                {updateSessionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={(open) => !open && setIsDeleteConfirmOpen(false)}>
        <DialogContent className="sm:max-w-sm bg-surface dark:bg-surface-dark border-2 border-danger shadow-brutal dark:shadow-brutal-dark">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-danger dark:text-danger-dark flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Session?
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground dark:text-muted-foreground-dark py-4">
            This will permanently delete the session &quot;{session.title || session.task.name}&quot;. 
            This action cannot be undone.
          </p>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-xs btn-brutal bg-surface dark:bg-surface-dark text-foreground dark:text-foreground-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteSessionMutation.isPending}
              className="bg-danger dark:bg-danger-dark text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal disabled:opacity-50 hover:bg-danger-dark dark:hover:bg-danger"
            >
              {deleteSessionMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
