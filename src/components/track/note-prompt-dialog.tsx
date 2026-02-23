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
import { Label } from '@/components/ui/label';
import { ActiveSessionState } from '@/lib/stores/active-sessions-store';
import { Check, X, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotePromptDialogProps = {
  session: ActiveSessionState | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string) => Promise<void>;
  onDelete: () => Promise<void>;
  isStopping: boolean;
};

export function NotePromptDialog({
  session,
  isOpen,
  onClose,
  onSave,
  onDelete,
  isStopping,
}: NotePromptDialogProps) {
  const [note, setNote] = useState('');

  // Reset note when dialog opens with a new session
  useEffect(() => {
    if (isOpen && session) {
      setNote(session.note || '');
    }
  }, [isOpen, session]);

  if (!session) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isStopping && onClose()}
    >
      <DialogContent className='sm:max-w-md bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold flex items-center gap-2 text-foreground dark:text-foreground-dark'>
            <span className='text-2xl'>📝</span>
            Session Reflection
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-sm font-medium text-muted-foreground'>
              Stopping session:
            </span>
            <div className='flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border dark:border-border-dark'>
              <span
                className='w-5 h-5 rounded flex items-center justify-center text-xs border border-black/10'
                style={{ backgroundColor: session.task.color }}
              >
                {session.task.icon}
              </span>
              <span className='font-semibold text-foreground dark:text-foreground-dark capitalize'>
                {session.title || session.task.name}
              </span>
            </div>
          </div>

          <div className='space-y-2'>
            <Label
              htmlFor='note'
              className='text-sm font-semibold text-foreground dark:text-foreground-dark'
            >
              What did you accomplish?
            </Label>
            <textarea
              id='note'
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Add a quick note about your progress...'
              className={cn(
                'w-full min-h-30 p-3 rounded-md border-2 border-border-strong dark:border-border-strong-dark bg-transparent text-foreground dark:text-foreground-dark focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none',
                'placeholder:text-muted-foreground/50 text-sm',
              )}
              disabled={isStopping}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter className='flex-col sm:flex-row gap-2 sm:justify-between'>
          <Button
            size={'sm'}
            variant='outline'
            onClick={onDelete}
            disabled={isStopping}
            className='border-2 border-destructive dark:border-destructive shadow-brutal-xs btn-brutal bg-surface dark:bg-surface-dark text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/10 w-full sm:w-auto'
          >
            {isStopping ? (
              <Loader2 className='w-4 h-4 animate-spin mr-1' />
            ) : (
              <Trash2 className='w-4 h-4 mr-1' />
            )}
            Delete
          </Button>
          <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
            <Button
              size={'sm'}
              variant='outline'
              onClick={onClose}
              disabled={isStopping}
              className='border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-xs btn-brutal bg-surface dark:bg-surface-dark text-foreground dark:text-foreground-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark order-2 sm:order-1'
            >
              <X className='w-4 h-4 mr-1' />
              Cancel
            </Button>
            <Button
              size={'sm'}
              onClick={() => onSave(note)}
              disabled={isStopping}
              className='bg-primary text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal disabled:opacity-50 hover:bg-primary-dark order-1 sm:order-2'
            >
              {isStopping ? (
                <Loader2 className='w-4 h-4 animate-spin mr-1' />
              ) : (
                <Check className='w-4 h-4 mr-1' />
              )}
              Save & Stop
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
