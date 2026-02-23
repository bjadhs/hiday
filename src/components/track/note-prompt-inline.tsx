'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ActiveSessionState } from '@/lib/stores/active-sessions-store';
import { Check, X, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotePromptInlineProps = {
  session: ActiveSessionState;
  onSave: (note: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onCancel: () => void;
  isStopping: boolean;
};

/**
 * NotePromptInline
 * 
 * An inline note prompt view that fills the entire parent container.
 * Similar to ExpandedSessionView - renders within the same space instead of as a modal.
 * 
 * @example
 * ```tsx
 * <NotePromptInline
 *   session={session}
 *   onSave={handleSave}
 *   onDelete={handleDelete}
 *   onCancel={handleCancel}
 *   isStopping={false}
 * />
 * ```
 */
export function NotePromptInline({
  session,
  onSave,
  onDelete,
  onCancel,
  isStopping,
}: NotePromptInlineProps) {
  const [note, setNote] = useState('');

  // Reset note when component mounts with a new session
  useEffect(() => {
    setNote(session.note || '');
  }, [session.id]);

  return (
    <div className="flex flex-col h-full">
      {/* Header row with icon, title, and cancel button */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        {/* Task icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 border-black/10 shadow-brutal-xs shrink-0"
          style={{ backgroundColor: session.task.color }}
        >
          {session.task.icon}
        </div>

        {/* Title and task info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold truncate text-foreground dark:text-foreground-dark">
            {session.title || session.task.name}
          </h3>
          <span className="text-[10px] text-muted-foreground">
            Add a note before stopping
          </span>
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          disabled={isStopping}
          className="w-8 h-8 rounded-md bg-muted dark:bg-muted-dark text-muted-foreground dark:text-muted-foreground-dark border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal flex items-center justify-center hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors disabled:opacity-50"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Note textarea - takes remaining space */}
      <div className="flex-1 flex flex-col min-h-0 bg-surface dark:bg-surface-dark rounded-xl border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-sm overflow-hidden">
        <Label
          htmlFor="note-inline"
          className="sr-only"
        >
          What did you accomplish?
        </Label>
        <textarea
          id="note-inline"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What did you accomplish during this session? (auto-saves)..."
          disabled={isStopping}
          autoFocus
          className={cn(
            'flex-1 w-full px-3 py-2.5 text-sm bg-transparent resize-none focus:outline-hidden focus:bg-surface-elevated/50 dark:focus:bg-surface-elevated-dark/50 transition-colors',
            'placeholder:text-muted-foreground/50 text-foreground dark:text-foreground-dark'
          )}
        />
      </div>

      {/* Action buttons footer */}
      <div className="flex items-center justify-between gap-2 mt-3 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          disabled={isStopping}
          className="border-2 border-destructive dark:border-destructive shadow-brutal-xs btn-brutal bg-surface dark:bg-surface-dark text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/10"
        >
          {isStopping ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Trash2 className="w-4 h-4 mr-1" />
          )}
          Delete
        </Button>

        <Button
          size="sm"
          onClick={() => onSave(note)}
          disabled={isStopping}
          className="bg-primary text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal disabled:opacity-50 hover:bg-primary-dark"
        >
          {isStopping ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Check className="w-4 h-4 mr-1" />
          )}
          Save & Stop
        </Button>
      </div>
    </div>
  );
}
