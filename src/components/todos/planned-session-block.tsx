'use client';

import { useState, useRef, useCallback } from 'react';
import { cn, formatDuration } from '@/lib/utils';
import { Play, Clock, GripVertical } from 'lucide-react';
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
  dayStart: number;
  dayEnd: number;
}

// Constants
const RESIZE_HANDLE_HEIGHT = 6;

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
}: PlannedSessionBlockProps) {
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const blockRef = useRef<HTMLDivElement>(null);

  const taskColor = session.task.color || '#6b7280';
  const bgColorLight = hexToRgba(taskColor, 0.2);
  const bgColorDark = hexToRgba(taskColor, 0.15);

  // Handle mouse down for drag/resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!onSessionUpdate) return;

    e.preventDefault();
    e.stopPropagation();

    const rect = blockRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeY = e.clientY - rect.top;

    // Determine action based on click position
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

    const handleMouseUp = () => {
      setIsResizing(null);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mouseup', handleMouseUp);
  }, [onSessionUpdate, session.id, onDragStart]);

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
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div
        className={cn(
          'h-full rounded-xl border-2 overflow-hidden transition-all relative',
          isSelected
            ? 'ring-2 ring-primary shadow-brutal dark:shadow-brutal-dark scale-[1.02] z-10'
            : isHovered
            ? 'ring-2 ring-primary/50 shadow-brutal-sm dark:shadow-brutal-dark-sm scale-[1.02] z-10'
            : 'shadow-sm'
        )}
        style={{
          borderColor: taskColor,
          borderStyle: session.isCrossDayStart || session.isCrossDayEnd ? 'solid' : 'dashed',
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

        {/* Top resize handle */}
        {onSessionUpdate && (
          <div
            className="absolute top-0 left-0 right-0 cursor-ns-resize z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            style={{ height: RESIZE_HANDLE_HEIGHT }}
          >
            <div className="w-8 h-1 rounded-full bg-white/50" />
          </div>
        )}

        {/* Bottom resize handle */}
        {onSessionUpdate && (
          <div
            className="absolute bottom-0 left-0 right-0 cursor-ns-resize z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
            style={{ height: RESIZE_HANDLE_HEIGHT }}
          >
            <div className="w-8 h-1 rounded-full bg-white/50" />
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
              {session.isCrossDayEnd && (
                <span className="text-[8px] opacity-70">+</span>
              )}
            </div>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-black/10 dark:border-white/20 bg-white dark:bg-surface-elevated-dark text-black dark:text-foreground-dark"
            >
              {formatDuration(session.plannedDuration)}
            </span>
          </div>

          {/* Hover actions overlay */}
          {isHovered && !isDragging && (
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

          {/* Drag hint */}
          {isHovered && !isDragging && onSessionUpdate && (
            <div className="absolute top-1 right-1">
              <GripVertical className="w-3 h-3 text-white/70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
