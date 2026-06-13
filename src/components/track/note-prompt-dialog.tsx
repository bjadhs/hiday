'use client';

import { useState } from 'react';
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
  const [note, setNote] = useState(session?.note || '');

  if (!session) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isStopping && onClose()}
    >
      <DialogContent className='sm:max-w-md bg-surface border-2 border-border-strong shadow-brutal'>
        <DialogHeader>
          <DialogTitle className='text-xl font-bold flex items-center gap-2 text-foreground'>
            <span className='text-2xl'>📝</span>
            Session Reflection
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-sm font-medium text-muted-foreground'>
              Stopping session:
            </span>
            <div className='flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-elevated border-2 border-border'>
              <span
                className='w-5 h-5 rounded flex items-center justify-center text-xs border border-black/10 dark:border-white/25'
                style={{ backgroundColor: session.task.color }}
              >
                {session.task.icon}
              </span>
              <span className='font-semibold text-foreground capitalize'>
                {session.title || session.task.name}
              </span>
            </div>
          </div>

          <div className='space-y-2'>
            <Label
              htmlFor='note'
              className='text-sm font-semibold text-foreground'
            >
              What did you accomplish?
            </Label>
            <textarea
              id='note'
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Add a quick note about your progress...'
              className={cn(
                'w-full min-h-30 p-3 rounded-md border-2 border-border-strong bg-transparent text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none',
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
            className='border-2 border-destructive dark:border-destructive shadow-brutal-xs btn-brutal bg-surface text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/10 w-full sm:w-auto'
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
              className='border-2 border-border-strong shadow-brutal-xs btn-brutal bg-surface text-foreground hover:bg-surface-elevated order-2 sm:order-1'
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
