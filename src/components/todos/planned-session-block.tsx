'use client';

import { useState, useRef, useCallback } from 'react';
import { cn, formatDuration } from '@/lib/utils';
import { Play, Pause, Square, Clock, Pencil, Trash2 } from 'lucide-react';
import type { TimelinePlannedSession } from '@/lib/types';

interface PlannedSessionBlockProps {
  session: TimelinePlannedSession & {
    isCrossDayStart?: boolean;
    isCrossDayEnd?: boolean;
  };
  isSelected: boolean;
  isHovered: boolean;
  isDragging?: boolean;
  previewPosition?: { top: number; height: number } | null;
  onClick: () => void;
  onDoubleClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDragStart: (sessionId: string, type: 'move' | 'resize-top' | 'resize-bottom', startY: number) => void;
  onSessionUpdate?: (sessionId: string, updates: { plannedStartTime?: number; plannedEndTime?: number }) => void;
  onStart?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onDelete?: () => void;
  /** Current time (ms) — used to show live end time / elapsed for a running block. */
  now?: number;
  dayStart: number;
  dayEnd: number;
}

// Constants
const RESIZE_HANDLE_HEIGHT = 10;
// Pixels the pointer must travel before a press counts as a drag (vs a click).
const DRAG_THRESHOLD = 3;

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
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function PlannedSessionBlock({
  session,
  isSelected,
  isHovered,
  isDragging,
  previewPosition,
  onClick,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
  onDragStart,
  onSessionUpdate,
  onStart,
  onPause,
  onStop,
  onDelete,
  now,
}: PlannedSessionBlockProps) {
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  // True once the pointer has moved far enough that the press is a drag/resize
  // rather than a click. Used to suppress the click (edit dialog) that the
  // browser fires after a drag finishes.
  const didDragRef = useRef(false);

  const projectColor = session.project.color || '#6b7280';
  // A running (active) session gets a focused look: stronger fill, an always-on
  // emphasized border, and a RUNNING tag so a started todo stands out.
  const isRunning = session.status === 'active';
  const bgColorLight = hexToRgba(projectColor, isRunning ? 0.38 : 0.2);
  const bgColorDark = hexToRgba(projectColor, isRunning ? 0.32 : 0.15);

  // A running block shows a live end time (current time) and live elapsed
  // duration; everything else uses the planned end/duration.
  const displayEnd = isRunning && now ? now : session.plannedEndTime;
  const displayDuration = isRunning && now && session.plannedStartTime
    ? Math.max(0, Math.floor((now - session.plannedStartTime) / 1000))
    : session.plannedDuration;

  // Handle mouse down for drag/resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onSessionUpdate) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = blockRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeY = e.clientY - rect.top;
    const startY = e.clientY;
    didDragRef.current = false;

    // Determine action based on click position:
    // - near the top edge  -> resize-top    (moves ONLY the start time)
    // - near the bottom edge -> resize-bottom (moves ONLY the end time)
    // - anywhere in the middle -> move        (shifts start AND end together)
    let action: 'move' | 'resize-top' | 'resize-bottom';
    if (relativeY <= RESIZE_HANDLE_HEIGHT) {
      action = 'resize-top';
      setIsResizing('top');
    } else if (relativeY >= rect.height - RESIZE_HANDLE_HEIGHT) {
      action = 'resize-bottom';
      setIsResizing('bottom');
    } else {
      action = 'move';
    }

    onDragStart(session.id, action, e.clientY);

    const handleMove = (ev: MouseEvent) => {
      if (Math.abs(ev.clientY - startY) > DRAG_THRESHOLD) {
        didDragRef.current = true;
      }
    };
    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [onSessionUpdate, session.id, onDragStart]);

  // Suppress the click that follows a drag/resize so moving a block doesn't
  // also open the edit dialog. A genuine click (no movement) still edits.
  const handleClick = useCallback(() => {
    if (didDragRef.current) {
      didDragRef.current = false;
      return;
    }
    onClick();
  }, [onClick]);

  // Determine cursor style
  let cursorStyle = 'pointer';
  if (isDragging) cursorStyle = 'grabbing';
  else if (isResizing) cursorStyle = 'ns-resize';
  else if (isHovered && onSessionUpdate) cursorStyle = 'grab';

  // Use preview position if dragging, otherwise use session position
  const top = previewPosition?.top ?? session.top;
  const height = previewPosition?.height ?? session.height;

  return (
    <div
      ref={blockRef}
      className={cn(
        'absolute py-1 px-1.5',
        (isSelected || isHovered) && 'z-10',
        isDragging && 'opacity-30'
      )}
      style={{
        top,
        height,
        left: `${session.left}%`,
        width: `${session.width}%`,
        cursor: cursorStyle,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={onDoubleClick}
    >
      <div
        className={cn(
          'h-full rounded-xl overflow-hidden transition-[border-color,box-shadow] relative',
          isSelected
            ? 'shadow-brutal z-10'
            : isHovered || isRunning
            ? 'shadow-brutal-sm z-10'
            : 'shadow-sm'
        )}
        style={{
          // Light thin border at rest; darker, thicker border on hover/select
          // and while running; dotted border while moving or resizing.
          borderColor: isRunning || isHovered || isSelected ? projectColor : hexToRgba(projectColor, 0.4),
          borderStyle: isDragging || isResizing ? 'dotted' : 'solid',
          borderWidth: isRunning || isHovered || isSelected ? 2 : 1,
        }}
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

        {/* Top resize handle (drag to change ONLY the start time) */}
        {onSessionUpdate && (
          <div
            className={cn(
              'absolute top-0 left-0 right-0 cursor-ns-resize z-20 flex items-center justify-center transition-opacity',
              isHovered || isResizing === 'top' ? 'opacity-100' : 'opacity-0'
            )}
            style={{ height: RESIZE_HANDLE_HEIGHT }}
          >
            <div
              className="w-10 h-1.5 rounded-full shadow-sm"
              style={{ backgroundColor: projectColor }}
            />
          </div>
        )}

        {/* Bottom resize handle (drag to change ONLY the end time) */}
        {onSessionUpdate && (
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 cursor-ns-resize z-20 flex items-center justify-center transition-opacity',
              isHovered || isResizing === 'bottom' ? 'opacity-100' : 'opacity-0'
            )}
            style={{ height: RESIZE_HANDLE_HEIGHT }}
          >
            <div
              className="w-10 h-1.5 rounded-full shadow-sm"
              style={{ backgroundColor: projectColor }}
            />
          </div>
        )}

        {/* Cross-day indicators */}
        {session.isCrossDayStart && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-b from-black/20 to-transparent" />
        )}
        {session.isCrossDayEnd && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-t from-black/20 to-transparent" />
        )}

        <div className="relative p-2 h-full flex flex-col gap-1 overflow-hidden">
          {/* Top: Icon and Project Name */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-sm shrink-0 border border-black/10 dark:border-white/25 shadow-sm"
              style={{ backgroundColor: projectColor }}
            >
              <span className="filter drop-shadow-sm">
                {session.project.icon}
              </span>
            </span>
            <span
              className="text-xs font-bold truncate"
              style={{ color: projectColor }}
            >
              {session.project.name}
            </span>
          </div>

          {/* Session Title */}
          {session.title && (
            <div className="min-w-0">
              <p className="text-xs font-medium truncate text-foreground">
                {session.title}
              </p>
            </div>
          )}

          {/* Bottom: Start–End time · RUNNING · Duration */}
          <div className="mt-auto flex items-center justify-between gap-1 pt-1 border-t border-border">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground min-w-0">
              <Clock className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {session.plannedStartTime ? formatTime(session.plannedStartTime) : '--:--'}
                {' – '}
                {displayEnd ? formatTime(displayEnd) : '--:--'}
              </span>
              {session.isCrossDayEnd && (
                <span className="text-[8px] opacity-70">+</span>
              )}
            </div>

            {/* RUNNING tag — centered between time and duration */}
            {isRunning && (
              <span
                className="shrink-0 flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: projectColor }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Running
              </span>
            )}

            <span
              className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border border-border bg-transparent text-foreground"
            >
              {formatDuration(displayDuration)}
            </span>
          </div>

          {/* Hover action toolbar */}
          {isHovered && !isDragging && (
            <div
              className="absolute top-1 right-1 z-30 flex items-center gap-1"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {onStart && !isRunning && (
                <button
                  className="p-2 rounded-md bg-primary-highlight text-white shadow-brutal-xs hover:brightness-110 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStart();
                  }}
                  title="Start session"
                  aria-label="Start session"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              {onPause && isRunning && (
                <button
                  className="p-2 rounded-md bg-surface-elevated/90 border border-border text-foreground shadow-sm hover:bg-surface-elevated transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPause();
                  }}
                  title="Pause session"
                  aria-label="Pause session"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}
              {onStop && isRunning && (
                <button
                  className="p-2 rounded-md bg-destructive text-white shadow-brutal-xs hover:brightness-110 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    onStop();
                  }}
                  title="Stop session"
                  aria-label="Stop session"
                >
                  <Square className="w-4 h-4" />
                </button>
              )}
              <button
                className="p-2 rounded-md bg-surface-elevated/90 border border-border text-foreground shadow-sm hover:bg-surface-elevated transition"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                title="Edit"
                aria-label="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {onDelete && (
                <button
                  className="p-2 rounded-md bg-surface-elevated/90 border border-border text-muted-foreground shadow-sm hover:bg-destructive/10 hover:text-destructive transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  title="Delete"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
