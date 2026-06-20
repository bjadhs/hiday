'use client';

import { memo } from 'react';
import { Square, Loader2 } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { ActiveSessionState } from '@/lib/stores/active-sessions-store';

interface CompactSessionItemProps {
  session: ActiveSessionState;
  elapsedTime: number;
  onExpand: () => void;
  onStop: () => void;
  isStopping: boolean;
}

/**
 * CompactSessionItem
 * 
 * A compact view of an active session for the list view.
 * Shows project icon, session title, elapsed time, and stop button.
 * 
 * @example
 * ```tsx
 * <CompactSessionItem
 *   session={session}
 *   elapsedTime={120}
 *   onExpand={() => setExpandedSessionId(session.id)}
 *   onStop={() => stopSession(session.id)}
 *   isStopping={false}
 * />
 * ```
 */
export const CompactSessionItem = memo(function CompactSessionItem({
  session,
  elapsedTime,
  onExpand,
  onStop,
  isStopping,
}: CompactSessionItemProps) {
  return (
    <div className="w-full flex items-center gap-2 p-2 rounded-lg bg-surface border-2 border-border-strong shadow-brutal-sm">
      {/* Clickable area for expanding */}
      <button
        onClick={onExpand}
        className="flex-1 flex items-center gap-2 min-w-0 text-left hover:opacity-80 transition-opacity"
      >
        {/* Small Project icon */}
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center text-base border-2 border-black/10 dark:border-white/25 shadow-brutal-xs shrink-0"
          style={{ backgroundColor: session.project.color }}
        >
          {session.project.icon}
        </div>

        {/* Session title only */}
        <span className="flex-1 min-w-0 text-sm font-semibold truncate">
          {session.title || session.project.name}
        </span>

        {/* Timer */}
        <span className="text-sm font-mono font-bold shrink-0">
          {formatDuration(elapsedTime)}
        </span>
      </button>

      {/* Stop button - separate from clickable area */}
      <button
        onClick={onStop}
        disabled={isStopping}
        className="w-7 h-7 rounded-md bg-danger text-white border-2 border-border-strong dark:border-white/20 shadow-brutal-xs btn-brutal flex items-center justify-center disabled:opacity-50 shrink-0"
      >
        {isStopping ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Square className="w-3 h-3 fill-current" />
        )}
      </button>
    </div>
  );
});
