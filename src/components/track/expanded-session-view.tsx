'use client';

import { memo } from 'react';
import { Square, Loader2, Check, X } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { ActiveSessionState } from '@/lib/stores/active-sessions-store';
import { Task } from '@/lib/types';
import { TaskDropdown } from './task-dropdown';

interface ExpandedSessionViewProps {
  session: ActiveSessionState;
  elapsedTime: number;
  isEditing: boolean;
  editTitle: string;
  editNote: string;
  onEditTitleChange: (value: string) => void;
  onEditNoteChange: (value: string) => void;
  onSaveTitle: () => void;
  onSaveNote: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onClose: () => void;
  onStop: () => void;
  isStopping: boolean;
  /** Available tasks for the dropdown */
  tasks?: Task[];
  /** Callback when task is changed */
  onTaskChange?: (task: Task) => void;
}

/**
 * ExpandedSessionView
 * 
 * A full-size expanded session view that fills the entire active tracking card.
 * Shows all session details including editable title and notes.
 * 
 * @example
 * ```tsx
 * <ExpandedSessionView
 *   session={session}
 *   elapsedTime={120}
 *   isEditing={false}
 *   editTitle=""
 *   editNote=""
 *   onEditTitleChange={setEditTitle}
 *   onEditNoteChange={setEditNote}
 *   onSaveTitle={handleSaveTitle}
 *   onSaveNote={handleSaveNote}
 *   onCancelEdit={handleCancelEdit}
 *   onStartEdit={handleStartEdit}
 *   onClose={handleClose}
 *   onStop={handleStop}
 *   isStopping={false}
 * />
 * ```
 */
export const ExpandedSessionView = memo(function ExpandedSessionView({
  session,
  elapsedTime,
  isEditing,
  editTitle,
  editNote,
  onEditTitleChange,
  onEditNoteChange,
  onSaveTitle,
  onSaveNote,
  onCancelEdit,
  onStartEdit,
  onClose,
  onStop,
  isStopping,
  tasks = [],
  onTaskChange,
}: ExpandedSessionViewProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Main content - single row header with everything */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Single row: Icon | Title/Task (vertical) | Timer+Stop */}
        <div className="flex items-center gap-3 mb-3 shrink-0">
          {/* Task icon */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg border-2 border-black/10 dark:border-white/25 shadow-brutal-xs shrink-0"
            style={{ backgroundColor: session.task.color }}
          >
            {session.task.icon}
          </div>

          {/* Title and Task - vertical column in middle */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => onEditTitleChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveTitle();
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                  placeholder={session.task.name}
                  className="flex-1 min-w-0 px-2 py-1 text-sm font-bold bg-surface border-2 border-primary rounded-md focus:outline-hidden focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
                <button
                  onClick={onSaveTitle}
                  className="p-1 rounded-md bg-success text-white hover:bg-success-dark transition-colors"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={onCancelEdit}
                  className="p-1 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
                {/* Title - clickable for edit */}
                <button
                  onClick={onStartEdit}
                  className="text-left w-fit"
                >
                  <h3 className="text-sm font-bold truncate hover:text-primary transition-colors">
                    {session.title || session.task.name}
                  </h3>
                </button>
                {/* Task dropdown + time - separate row */}
                <div className="flex items-center gap-1.5">
                  {onTaskChange ? (
                    <TaskDropdown
                      selectedTask={session.task}
                      tasks={tasks}
                      onTaskChange={onTaskChange}
                      size="sm"
                    />
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: `${session.task.color}15`,
                        color: session.task.color,
                      }}
                    >
                      {session.task.name}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(session.startTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Timer + Stop + Close - right side */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-mono font-bold text-primary">
              {formatDuration(elapsedTime)}
            </span>
            <button
              onClick={onStop}
              disabled={isStopping}
              className="w-8 h-8 rounded-md bg-danger dark:bg-danger-dark text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal flex items-center justify-center disabled:opacity-50"
            >
              {isStopping ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Square className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-muted dark:bg-muted-dark text-foreground-muted border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal flex items-center justify-center hover:bg-surface-elevated transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Big note text area - takes all remaining space */}
        <div className="flex-1 flex flex-col min-h-0 bg-surface rounded-xl border-2 border-border-strong shadow-brutal-sm overflow-hidden">
          <textarea
            value={editNote}
            onChange={(e) => onEditNoteChange(e.target.value)}
            onBlur={onSaveNote}
            placeholder="Type your notes here... (auto-saves)"
            className="flex-1 w-full px-3 py-2.5 text-sm bg-transparent resize-none focus:outline-hidden focus:bg-surface-elevated/50 dark:focus:bg-surface-elevated-dark/50 transition-colors"
          />
        </div>
      </div>
    </div>
  );
});
