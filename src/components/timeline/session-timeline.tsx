'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { HOURS, HOUR_HEIGHT, MIN_CONTENT_WIDTH } from './constants';
import { TimelineSession } from './types';
import { CurrentTimeIndicator } from './current-time-indicator';
import { SessionBlock } from './session-block';
import { useScrollToNow } from '@/lib/hooks/use-scroll-to-now';

interface SessionTimelineProps {
  totalHeight: number;
  isToday: boolean;
  now: number;
  startOfDay: number;
  sessions: TimelineSession[];
  onEditSession: (session: TimelineSession) => void;
  onSessionUpdate?: (sessionId: string, updates: { startedAt?: number; endedAt?: number }) => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  showTimeLabels?: boolean;
  /** When true, renders only the grid column (no own scroll container / now-line)
   *  so it can live inside a shared scroll container alongside another timeline. */
  embedded?: boolean;
  className?: string;
}

// Constants for interaction
const SNAP_MINUTES = 15;
const SNAP_MS = SNAP_MINUTES * 60 * 1000;

/**
 * Calculate pixel position from timestamp
 */
function timestampToPixel(timestamp: number, dayStart: number): number {
  const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
  return (timestamp - dayStart) / msPerPixel;
}

/**
 * Calculate timestamp from pixel position with snapping
 */
function pixelToTimestamp(pixel: number, dayStart: number): number {
  const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
  const timestamp = dayStart + pixel * msPerPixel;
  return Math.round(timestamp / SNAP_MS) * SNAP_MS;
}

export function SessionTimeline({
  totalHeight,
  isToday,
  now,
  startOfDay,
  sessions,
  onEditSession,
  onSessionUpdate,
  scrollContainerRef,
  showTimeLabels = true,
  embedded = false,
}: SessionTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const containerRef = scrollContainerRef ?? internalScrollRef;

  // Center the timeline on the current time when viewing today.
  // Skipped when embedded — the parent owns the shared scroll container.
  useScrollToNow(containerRef, startOfDay, isToday && !embedded);

  // Active drag operation for sessions
  const [activeDrag, setActiveDrag] = useState<{
    type: 'move' | 'resize-top' | 'resize-bottom';
    sessionId: string;
    startY: number;
    originalStart: number;
    originalEnd: number;
    currentStart: number;
    currentEnd: number;
  } | null>(null);

  // Handle drag start from session block
  const handleDragStart = useCallback((sessionId: string, type: 'move' | 'resize-top' | 'resize-bottom', startY: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;

    setActiveDrag({
      type,
      sessionId,
      startY,
      originalStart: session.startedAt,
      originalEnd: session.endedAt,
      currentStart: session.startedAt,
      currentEnd: session.endedAt,
    });
  }, [sessions]);

  // Handle mouse move anywhere in timeline
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    void rect;

    // Handle active drag (move or resize)
    if (activeDrag) {
      const deltaY = e.clientY - activeDrag.startY;

      let newStart = activeDrag.originalStart;
      let newEnd = activeDrag.originalEnd;

      if (activeDrag.type === 'move') {
        newStart = pixelToTimestamp(timestampToPixel(activeDrag.originalStart, startOfDay) + deltaY, startOfDay);
        const duration = activeDrag.originalEnd - activeDrag.originalStart;
        newEnd = newStart + duration;
      } else if (activeDrag.type === 'resize-top') {
        newStart = pixelToTimestamp(timestampToPixel(activeDrag.originalStart, startOfDay) + deltaY, startOfDay);
        if (newEnd - newStart < 15 * 60 * 1000) {
          newStart = newEnd - 15 * 60 * 1000;
        }
      } else if (activeDrag.type === 'resize-bottom') {
        newEnd = pixelToTimestamp(timestampToPixel(activeDrag.originalEnd, startOfDay) + deltaY, startOfDay);
        if (newEnd - newStart < 15 * 60 * 1000) {
          newEnd = newStart + 15 * 60 * 1000;
        }
      }

      // Clamp to day boundaries
      const dayEnd = startOfDay + 24 * 60 * 60 * 1000;
      newStart = Math.max(startOfDay, newStart);
      newEnd = Math.min(dayEnd, newEnd);

      setActiveDrag({
        ...activeDrag,
        currentStart: newStart,
        currentEnd: newEnd,
      });
    }
  }, [activeDrag, startOfDay]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Complete active drag
    if (activeDrag && onSessionUpdate) {
      const hasChanged =
        Math.abs(activeDrag.currentStart - activeDrag.originalStart) > 60000 ||
        Math.abs(activeDrag.currentEnd - activeDrag.originalEnd) > 60000;

      if (hasChanged) {
        onSessionUpdate(activeDrag.sessionId, {
          startedAt: activeDrag.currentStart,
          endedAt: activeDrag.currentEnd,
        });
      }
    }

    setActiveDrag(null);
  }, [activeDrag, onSessionUpdate]);

  // Calculate preview for active drag
  const dragPreview = useMemo(() => {
    if (!activeDrag) return null;

    const top = timestampToPixel(activeDrag.currentStart, startOfDay);
    const height = Math.max(timestampToPixel(activeDrag.currentEnd, startOfDay) - top, 20);

    return {
      top,
      height,
      startTime: activeDrag.currentStart,
      endTime: activeDrag.currentEnd,
    };
  }, [activeDrag, startOfDay]);

  // Generate 15-minute grid lines for visual feedback
  const quarterHourLines = useMemo(() => {
    const lines = [];
    const dayEnd = startOfDay + 24 * 60 * 60 * 1000;
    const msPerQuarterHour = 15 * 60 * 1000;
    for (let t = startOfDay; t < dayEnd; t += msPerQuarterHour) {
      const isHour = new Date(t).getMinutes() === 0;
      lines.push({
        top: timestampToPixel(t, startOfDay),
        isHour,
        time: new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      });
    }
    return lines;
  }, [startOfDay]);

  const grid = (
    <div
      ref={timelineRef}
      className={`relative flex-1 select-none ${embedded ? 'min-w-0 border-l-2 border-border-strong' : ''}`}
      style={{ minWidth: embedded ? undefined : MIN_CONTENT_WIDTH, height: totalHeight }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
            {/* Hour grid lines */}
            <div className="absolute inset-0">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-border/30 border-border/30"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}
            </div>

            {/* Quarter-hour grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {quarterHourLines.map((line, index) => (
                <div
                  key={index}
                  className={`absolute left-0 right-0 ${line.isHour ? '' : 'border-t border-dashed border-border/10 border-border/10'}`}
                  style={{ top: line.top }}
                />
              ))}
            </div>

            {/* Current time indicator (parent renders a shared one when embedded) */}
            {!embedded && isToday && <CurrentTimeIndicator now={now} startOfDay={startOfDay} totalHeight={totalHeight} />}

            {/* Sessions */}
            <div className="relative h-full">
              {sessions.length === 0 && !activeDrag && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    No sessions for this day
                  </p>
                </div>
              )}

              {sessions.map((session) => (
                <SessionBlock
                  key={session.id}
                  session={session}
                  isDragging={activeDrag?.sessionId === session.id}
                  previewPosition={activeDrag?.sessionId === session.id && activeDrag ? {
                    top: timestampToPixel(activeDrag.currentStart, startOfDay),
                    height: Math.max(timestampToPixel(activeDrag.currentEnd, startOfDay) - timestampToPixel(activeDrag.currentStart, startOfDay), 20)
                  } : null}
                  onClick={() => onEditSession(session)}
                  onDragStart={handleDragStart}
                  onSessionUpdate={onSessionUpdate}
                />
              ))}

              {/* Active drag preview with time indicator */}
              {dragPreview && activeDrag && (
                <div
                  className="absolute left-0 right-0 pointer-events-none z-30"
                  style={{ top: dragPreview.top }}
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 h-0.5 bg-primary" />
                    <div className="px-2 py-1 bg-primary-highlight text-primary-foreground text-xs rounded shadow whitespace-nowrap">
                      {new Date(dragPreview.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(dragPreview.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </div>
                  </div>
                </div>
              )}
            </div>
    </div>
  );

  // Embedded: just the grid column, to be placed in a shared scroll container.
  if (embedded) return grid;

  return (
    <div className="flex flex-col h-full">
      {/* Timeline Content */}
      <div ref={containerRef} className="flex-1 overflow-auto relative">
        <div className="flex" style={{ minHeight: totalHeight }}>
          {/* Time Labels Column - Optional */}
          {showTimeLabels && (
            <div className="shrink-0 border-r-2 border-border-strong bg-surface-elevated/30">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex items-start justify-end px-3 text-sm font-medium text-muted-foreground border-b border-border/30 border-border/30"
                  style={{ height: HOUR_HEIGHT, paddingTop: 8 }}
                >
                  {hour === 0 || hour === 24 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
                </div>
              ))}
            </div>
          )}

          {grid}
        </div>
      </div>
    </div>
  );
}
