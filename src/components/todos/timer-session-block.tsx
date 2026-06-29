'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { useNow } from '@/lib/hooks/use-now';
import type { Database } from '@/lib/supabase/database.types';

type DBSession = Database['public']['Tables']['sessions']['Row'] & {
  projects: Database['public']['Tables']['projects']['Row'] | null;
};

interface TimerSessionBlockProps {
  session: DBSession;
  top: number;
  height: number;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * View-only marker for a tracked timer session — pinned to a thin rail on
 * the right edge of the timeline so it never needs collision-layout against
 * the editable plan blocks. No drag handles, no resize: click opens a
 * read-only info popover.
 */
export function TimerSessionBlock({ session, top, height }: TimerSessionBlockProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const now = useNow(1000);
  const isRunning = session.ended_at === null;
  const projectColor = session.projects?.color || '#6b7280';
  const projectName = session.projects?.name || 'No project';
  const label = session.title || projectName;
  const durationSeconds =
    session.duration ??
    (isRunning && session.started_at ? Math.max(0, Math.floor((now - session.started_at) / 1000)) : 0);

  return (
    <div
      ref={containerRef}
      className="absolute z-30"
      style={{ top, height, right: 6, width: 22 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn(
          'w-full h-full rounded-md border-2 flex items-center justify-center text-[11px] shadow-sm transition-transform hover:scale-110',
          isRunning && 'animate-pulse'
        )}
        style={{ backgroundColor: `${projectColor}33`, borderColor: projectColor }}
        title={label}
        aria-label={`View session: ${label}`}
      >
        🍅
      </button>

      {open && (
        <div
          className="absolute right-full top-0 mr-2 w-56 rounded-lg border-2 border-border-strong bg-surface shadow-brutal p-3 z-40 text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 mb-1.5 min-w-0">
            <span className="text-base shrink-0">🍅</span>
            <span className="font-bold text-sm truncate">{label}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
            <Clock className="w-3 h-3 shrink-0" />
            <span>
              {session.started_at ? formatTime(session.started_at) : '--:--'}
              {' – '}
              {isRunning ? 'Now' : session.ended_at ? formatTime(session.ended_at) : '--:--'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs mb-1 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: projectColor }} />
            <span className="font-medium truncate">{projectName}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {isRunning ? 'Running…' : `Duration: ${formatDuration(durationSeconds)}`}
          </div>
        </div>
      )}
    </div>
  );
}
