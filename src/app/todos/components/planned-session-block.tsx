'use client';

import { useState } from 'react';
import { cn, formatDuration } from '@/lib/utils';
import { Play, Clock } from 'lucide-react';
import type { TimelinePlannedSession } from '@/lib/types';

interface PlannedSessionBlockProps {
  session: TimelinePlannedSession;
  onClick: () => void;
}

/**
 * Format time from timestamp (e.g., "9:00 AM")
 */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Convert hex color to rgba with opacity
 */
function hexToRgba(hex: string, alpha: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse r, g, b
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function PlannedSessionBlock({ session, onClick }: PlannedSessionBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get the task color
  const taskColor = session.task.color || '#6b7280';

  // Light mode: 20% opacity background
  // Dark mode: 15% opacity background (darker looks better in dark mode)
  const bgColorLight = hexToRgba(taskColor, 0.2);
  const bgColorDark = hexToRgba(taskColor, 0.15);

  return (
    <div
      className="absolute py-1 px-1.5"
      style={{
        top: session.top,
        height: session.height,
        left: `${session.left}%`,
        width: `${session.width}%`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'h-full rounded-xl border-2 overflow-hidden cursor-pointer transition-all',
          isHovered
            ? 'ring-2 ring-primary/50 shadow-brutal-sm dark:shadow-brutal-dark-sm scale-[1.02] z-10'
            : 'shadow-sm'
        )}
        style={{
          borderColor: taskColor,
          borderStyle: 'dashed',
        }}
        onClick={onClick}
      >
        {/* Light mode background */}
        <div
          className="absolute inset-0 dark:hidden"
          style={{ backgroundColor: bgColorLight }}
        />
        {/* Dark mode background */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{ backgroundColor: bgColorDark }}
        />

        <div className="relative p-2 h-full flex flex-col gap-1 overflow-hidden">
          {/* Top: Icon and Task Name */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-sm shrink-0 border border-black/10 dark:border-white/10 shadow-sm"
              style={{ backgroundColor: taskColor }}
            >
              <span className="filter drop-shadow-sm">
                {session.task.icon}
              </span>
            </span>
            <span
              className="text-xs font-bold truncate"
              style={{ color: taskColor }}
            >
              {session.task.name}
            </span>
          </div>

          {/* Session Title */}
          {session.title && (
            <div className="min-w-0">
              <p className="text-xs font-medium truncate text-foreground dark:text-foreground-dark">
                {session.title}
              </p>
            </div>
          )}

          {/* Bottom: Time and Duration */}
          <div className="mt-auto flex items-center justify-between gap-1 pt-1 border-t border-black/10 dark:border-white/20">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatTime(session.plannedStartTime)}</span>
            </div>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-black/10 dark:border-white/20 bg-white dark:bg-surface-elevated-dark text-black dark:text-foreground-dark"
            >
              {formatDuration(session.plannedDuration)}
            </span>
          </div>

          {/* Hover actions overlay */}
          {isHovered && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/20 rounded-xl backdrop-blur-[1px]">
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-full bg-primary text-white shadow-brutal-xs hover:scale-110 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Start session - this will be handled by parent
                  }}
                  title="Start session"
                >
                  <Play className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
