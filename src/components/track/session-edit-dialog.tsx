'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Project, HistorySession } from '@/lib/types';
import { useProjects } from '@/lib/hooks/use-projects';
import { useUpdateSession, useDeleteSession } from '@/lib/hooks/use-sessions';
import { useNow } from '@/lib/hooks/use-now';
import { ChevronDown, Trash2, Loader2, Clock } from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';
import { sessionUpdateSchema, formatZodErrors } from '@/lib/validation';

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
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const updateSessionMutation = useUpdateSession();
  const deleteSessionMutation = useDeleteSession();

  const [title, setTitle] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const now = useNow(1000);

  const formatDateTimeLocal = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, []);

  const getInitialValues = useCallback(() => {
    if (!session) return null;
    return {
      title: session.title || session.project.name,
      selectedProject: session.project,
      startTime: session.startedAt ? formatDateTimeLocal(new Date(session.startedAt)) : '',
      endTime: session.endedAt ? formatDateTimeLocal(new Date(session.endedAt)) : '',
    };
  }, [session, formatDateTimeLocal]);

  // Initialize form when session changes
  useEffect(() => {
    const initial = getInitialValues();
    if (!initial) return;
    requestAnimationFrame(() => {
      setTitle(initial.title);
      setSelectedProject(initial.selectedProject);
      setStartTime(initial.startTime);
      setEndTime(initial.endTime);
    });
  }, [getInitialValues]);

  const handleSave = async () => {
    if (!session || !selectedProject) return;

    const startedAt = new Date(startTime).getTime();
    const endedAt = endTime ? new Date(endTime).getTime() : null;

    // Calculate duration in seconds
    const duration = endedAt
      ? Math.floor((endedAt - startedAt) / 1000)
      : Math.floor((now - startedAt) / 1000);

    const updates = {
      title: title.trim() || null,
      project_id: selectedProject.id,
      started_at: startedAt,
      ended_at: endedAt,
      duration: duration > 0 ? duration : 0,
    };

    const result = sessionUpdateSchema.safeParse(updates);
    if (!result.success) {
      const fieldErrors = formatZodErrors(result.error);
      setFormError(fieldErrors.ended_at || fieldErrors._form || Object.values(fieldErrors)[0] || 'Invalid session');
      return;
    }
    setFormError(null);

    try {
      await updateSessionMutation.mutateAsync({
        id: session.id,
        updates,
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
    const end = endTime ? new Date(endTime).getTime() : now;
    const seconds = Math.floor((end - start) / 1000);
    return formatDuration(seconds > 0 ? seconds : 0);
  };

  const isValid = 
    title.trim() && 
    selectedProject && 
    startTime && 
    (!endTime || new Date(endTime) > new Date(startTime));

  if (!session) return null;

  return (
    <>
      <Dialog open={isOpen && !isDeleteConfirmOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md bg-surface border-2 border-border-strong shadow-brutal">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <span className="text-2xl">✏️</span>
              Edit Session
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Session Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-foreground">
                Session Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What did you work on?"
                className="border-2 border-border-strong focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Project Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Project</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isLoadingProjects}
                    className="w-full justify-between border-2 border-border-strong shadow-brutal-xs btn-brutal bg-surface text-foreground hover:bg-surface-elevated"
                  >
                    {selectedProject ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-sm border-2 border-black/10 dark:border-white/25"
                          style={{ backgroundColor: selectedProject.color }}
                        >
                          {selectedProject.icon}
                        </span>
                        <span className="text-foreground">{selectedProject.name}</span>
                      </span>
                    ) : (
                      <span className="text-foreground-muted">Select a project</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-foreground-muted" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-56 max-h-60 overflow-y-auto bg-surface border-2 border-border-strong shadow-brutal"
                >
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => setSelectedProject(project as Project)}
                      className={cn(
                        'flex items-center gap-2 cursor-pointer text-foreground hover:text-foreground',
                        selectedProject?.id === project.id && 'bg-primary/10'
                      )}
                    >
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-sm border-2 border-black/10 dark:border-white/25"
                        style={{ backgroundColor: project.color }}
                      >
                        {project.icon}
                      </span>
                      <span>{project.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Start and End Times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-semibold flex items-center gap-1 text-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Start Time
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="border-2 border-border-strong focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-semibold flex items-center gap-1 text-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  End Time
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder="Still ongoing..."
                  className="border-2 border-border-strong focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
            </div>

            {/* Duration Preview */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-elevated border-2 border-border">
              <span className="text-sm text-foreground-muted">Duration</span>
              <span className="font-mono font-semibold text-primary">
                {calculateDuration()}
              </span>
            </div>

            {formError && (
              <p className="text-sm font-semibold text-danger">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="border-2 border-danger text-danger hover:bg-danger/10 shadow-brutal-xs btn-brutal bg-surface"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                className="border-2 border-border-strong shadow-brutal-xs btn-brutal bg-surface text-foreground hover:bg-surface-elevated"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isValid || updateSessionMutation.isPending}
                className="bg-primary-highlight text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal disabled:opacity-50 hover:bg-primary-highlight/90"
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
        <DialogContent className="sm:max-w-sm bg-surface border-2 border-danger shadow-brutal">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-danger flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Session?
            </DialogTitle>
          </DialogHeader>
          <p className="text-foreground-muted py-4">
            This will permanently delete the session &quot;{session.title || session.project.name}&quot;. 
            This action cannot be undone.
          </p>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="border-2 border-border-strong shadow-brutal-xs btn-brutal bg-surface text-foreground hover:bg-surface-elevated"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteSessionMutation.isPending}
              className="bg-danger text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal disabled:opacity-50 hover:bg-danger/90"
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
