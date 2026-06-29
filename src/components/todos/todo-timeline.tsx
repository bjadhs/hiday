'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { HOURS, HOUR_HEIGHT, MIN_CONTENT_WIDTH } from '@/components/timeline/constants';
import { PlannedSessionBlock } from './planned-session-block';
import { TimerSessionBlock } from './timer-session-block';
import type { Database } from '@/lib/supabase/database.types';
import type { PlannedSession, TimelinePlannedSession } from '@/lib/types';
import { useNow } from '@/lib/hooks/use-now';
import { useScrollToNow } from '@/lib/hooks/use-scroll-to-now';

type DBSession = Database['public']['Tables']['sessions']['Row'] & { projects: Database['public']['Tables']['projects']['Row'] | null };

interface TodoTimelineProps {
  plannedSessions: DBSession[];
  /** View-only timer/session blocks (e.g. tracked sessions) — no drag, resize or edit. */
  readOnlySessions?: DBSession[];
  selectedDate: Date;
  onSessionClick: (session: PlannedSession) => void;
  onTimeSlotClick: (timestamp: number, durationMs?: number) => void;
  onSessionUpdate?: (sessionId: string, updates: { plannedStartTime?: number; plannedEndTime?: number }) => void;
  onProjectDrop?: (projectId: string, startTime: number, sessionId?: string) => void;
  onSessionUnschedule?: (sessionId: string) => void;
  onSessionStart?: (sessionId: string) => void;
  onSessionPause?: (sessionId: string) => void;
  onSessionStop?: (sessionId: string) => void;
  onSessionDelete?: (sessionId: string) => void;
  showTimeLabels?: boolean;
  showHeader?: boolean;
  /** Shared scroll container (used for drag coordinate math when embedded). */
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  /** When true, renders only the grid column (no own scroll container / now-line)
   *  so it can live inside a shared scroll container alongside another timeline. */
  embedded?: boolean;
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

/**
 * Calculate layout for planned sessions on the timeline
 */
function calculatePlannedSessionsLayout(
  sessions: DBSession[],
  dayStart: number,
  dayEnd: number
): TimelinePlannedSession[] {
  if (!sessions.length) return [];

  const initialLayout = sessions.map(s => {
    const startedAt = s.started_at;
    if (!startedAt) return null; // Skip sessions without start time
    const endedAt = s.ended_at || startedAt + (s.duration || 0) * 1000;

    const visualStart = Math.max(startedAt, dayStart);
    const visualEnd = Math.min(endedAt, dayEnd);

    if (visualStart >= dayEnd || visualEnd <= dayStart) {
      return null;
    }

    const top = timestampToPixel(visualStart, dayStart);
    const height = Math.max(timestampToPixel(visualEnd, dayStart) - top, 20);

    return {
      id: s.id,
      projectId: s.project_id || '',
      project: s.projects ? {
        id: s.projects.id,
        name: s.projects.name,
        color: s.projects.color,
        icon: s.projects.icon,
        goal_duration: s.projects.goal_duration,
        goal_value: s.projects.goal_value,
        goal_type: s.projects.goal_type,
      } : { id: '', name: 'Unknown', color: '#gray', icon: null },
      plannedStartTime: startedAt,
      plannedEndTime: endedAt,
      plannedDuration: s.duration || 0,
      plannedDate: s.session_date,
      status: s.status as 'planned' | 'active' | 'completed' | 'cancelled',
      title: s.title,
      note: s.note,
      top,
      height,
      isCrossDayStart: startedAt < dayStart,
      isCrossDayEnd: endedAt > dayEnd,
    };
  }).filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.top - b.top || b.height - a.height);

  // Group sessions into visually overlapping connected components
  const groups: typeof initialLayout[] = [];
  const visited = new Set<string>();

  for (const session of initialLayout) {
    if (visited.has(session.id)) continue;

    const group: typeof initialLayout = [];
    const queue = [session];
    visited.add(session.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);

      for (const other of initialLayout) {
        if (visited.has(other.id)) continue;

        const overlap = current.top < other.top + other.height &&
          current.top + current.height > other.top;

        if (overlap) {
          visited.add(other.id);
          queue.push(other);
        }
      }
    }
    groups.push(group);
  }

  // For each group, assign to columns
  const result: TimelinePlannedSession[] = [];

  for (const group of groups) {
    group.sort((a, b) => a.top - b.top || b.height - a.height);

    const columns: typeof initialLayout = [];
    const sessionToColumn = new Map<string, number>();

    for (const session of group) {
      let assignedColumn = -1;

      for (let c = 0; c < columns.length; c++) {
        const lastInColumn = columns[c];
        const overlap = session.top < lastInColumn.top + lastInColumn.height &&
          session.top + session.height > lastInColumn.top;

        if (!overlap) {
          assignedColumn = c;
          break;
        }
      }

      if (assignedColumn === -1) {
        columns.push(session);
        sessionToColumn.set(session.id, columns.length - 1);
      } else {
        columns[assignedColumn] = session;
        sessionToColumn.set(session.id, assignedColumn);
      }
    }

    const totalColumns = columns.length;

    for (const session of group) {
      const column = sessionToColumn.get(session.id) || 0;
      const left = (column / totalColumns) * 100;
      const width = 100 / totalColumns;

      result.push({
        ...session,
        left,
        width,
      });
    }
  }

  return result.sort((a, b) => (a.plannedStartTime || 0) - (b.plannedStartTime || 0));
}

export function TodoTimeline({
  plannedSessions,
  readOnlySessions = [],
  selectedDate,
  onSessionClick,
  onTimeSlotClick,
  onSessionUpdate,
  onProjectDrop,
  onSessionStart,
  onSessionPause,
  onSessionStop,
  onSessionDelete,
  showTimeLabels = true,
  showHeader = false,
  scrollContainerRef: scrollContainerRefProp,
  embedded = false,
}: TodoTimelineProps) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = scrollContainerRefProp ?? internalScrollRef;
  const timelineRef = useRef<HTMLDivElement>(null);
  const now = useNow(60000);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ y: number; timestamp: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  // Active drag operation for existing sessions
  const [activeDrag, setActiveDrag] = useState<{
    type: 'move' | 'resize-top' | 'resize-bottom';
    sessionId: string;
    startY: number;
    originalStart: number | null;
    originalEnd: number | null;
    currentStart: number | null;
    currentEnd: number | null;
  } | null>(null);

  // Selection and hover state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  // Drag over state for external drops (from project column)
  const [dragOver, setDragOver] = useState(false);

  const totalHeight = HOURS.length * HOUR_HEIGHT;

  // Calculate day boundaries
  const { startOfDay, endOfDay } = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { startOfDay: start.getTime(), endOfDay: end.getTime() };
  }, [selectedDate]);

  // Calculate layout for planned sessions
  const timelineSessions = useMemo(
    () => calculatePlannedSessionsLayout(plannedSessions, startOfDay, endOfDay),
    [plannedSessions, startOfDay, endOfDay]
  );

  // Layout for view-only timer/session blocks — pinned to a thin rail on the
  // right edge rather than column-packed against plan blocks, so they never
  // need collision-aware positioning (deliberately simpler than
  // calculatePlannedSessionsLayout: these are markers, not editable blocks).
  const readOnlyLayout = useMemo(() => {
    return readOnlySessions
      .map((s) => {
        if (!s.started_at) return null;
        const endedAt = s.ended_at ?? Math.min(now, endOfDay);
        const visualStart = Math.max(s.started_at, startOfDay);
        const visualEnd = Math.min(Math.max(endedAt, visualStart + 60000), endOfDay);
        if (visualStart >= endOfDay || visualEnd <= startOfDay) return null;

        const top = timestampToPixel(visualStart, startOfDay);
        const height = Math.max(timestampToPixel(visualEnd, startOfDay) - top, 14);
        return { session: s, top, height };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [readOnlySessions, startOfDay, endOfDay, now]);

  // Check if selected date is today
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Center the timeline on the current time when viewing today.
  // Skipped when embedded — the parent owns the shared scroll container.
  useScrollToNow(scrollContainerRef, startOfDay, isToday && !embedded);

  // Handle drag start from session block
  const handleDragStart = useCallback((sessionId: string, type: 'move' | 'resize-top' | 'resize-bottom', startY: number) => {
    const session = timelineSessions.find(s => s.id === sessionId);
    if (!session || !session.plannedStartTime) return;

    setActiveDrag({
      type,
      sessionId,
      startY,
      originalStart: session.plannedStartTime,
      originalEnd: session.plannedEndTime,
      currentStart: session.plannedStartTime,
      currentEnd: session.plannedEndTime,
    });
    setSelectedSessionId(sessionId);
  }, [timelineSessions]);

  // Handle mouse move anywhere in timeline
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;

    // getBoundingClientRect().top already reflects the scroll offset (it goes
    // negative as the grid scrolls up), so clientY - rect.top is already the
    // content-relative pixel. Do NOT add scrollTop — that double-counts it.
    const rect = timelineRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Handle active drag (move or resize)
    if (activeDrag) {
      const deltaY = e.clientY - activeDrag.startY;

      let newStart = activeDrag.originalStart!;
      let newEnd = activeDrag.originalEnd!;

      if (activeDrag.type === 'move') {
        newStart = pixelToTimestamp(timestampToPixel(activeDrag.originalStart!, startOfDay) + deltaY, startOfDay);
        const duration = activeDrag.originalEnd! - activeDrag.originalStart!;
        newEnd = newStart + duration;
      } else if (activeDrag.type === 'resize-top') {
        newStart = pixelToTimestamp(timestampToPixel(activeDrag.originalStart!, startOfDay) + deltaY, startOfDay);
        if (newEnd - newStart < 15 * 60 * 1000) {
          newStart = newEnd - 15 * 60 * 1000;
        }
      } else if (activeDrag.type === 'resize-bottom') {
        newEnd = pixelToTimestamp(timestampToPixel(activeDrag.originalEnd!, startOfDay) + deltaY, startOfDay);
        if (newEnd - newStart < 15 * 60 * 1000) {
          newEnd = newStart + 15 * 60 * 1000;
        }
      }

      // Clamp to day boundaries
      newStart = Math.max(startOfDay, newStart);
      newEnd = Math.min(endOfDay, newEnd);

      setActiveDrag({
        ...activeDrag,
        currentStart: newStart,
        currentEnd: newEnd,
      });
      return;
    }

    // Handle new session drag
    if (!isDragging || !dragStart) return;

    const timestamp = pixelToTimestamp(y, startOfDay);
    setDragEnd(timestamp);
  }, [activeDrag, isDragging, dragStart, startOfDay, endOfDay]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Complete active drag
    if (activeDrag && onSessionUpdate && activeDrag.currentStart && activeDrag.currentEnd) {
      const hasChanged =
        Math.abs(activeDrag.currentStart - activeDrag.originalStart!) > 60000 ||
        Math.abs(activeDrag.currentEnd - activeDrag.originalEnd!) > 60000;

      if (hasChanged) {
        onSessionUpdate(activeDrag.sessionId, {
          plannedStartTime: activeDrag.currentStart,
          plannedEndTime: activeDrag.currentEnd,
        });
      }
    }

    // Complete new session drag
    if (isDragging && dragStart && dragEnd) {
      const startTime = Math.min(dragStart.timestamp, dragEnd);
      const durationMs = Math.abs(dragEnd - dragStart.timestamp);
      // A near-zero drag is treated as a plain click (no duration) so the
      // caller applies its default duration.
      onTimeSlotClick(startTime, durationMs > 60 * 1000 ? durationMs : undefined);
    }

    setActiveDrag(null);
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [activeDrag, isDragging, dragStart, dragEnd, onSessionUpdate, onTimeSlotClick]);

  // Handle mouse down for new session creation
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeDrag) return;

    // rect.top already reflects scroll position; do not add scrollTop.
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const timestamp = pixelToTimestamp(y, startOfDay);

    setIsDragging(true);
    setDragStart({ y, timestamp });
    setDragEnd(timestamp + 60 * 60 * 1000);
    setSelectedSessionId(null);
  }, [activeDrag, startOfDay]);

  // Handle drag over for external drops
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    // rect.top already reflects scroll position; do not add scrollTop.
    const y = e.clientY - rect.top;
    // Clamp into the visible day so a drop near the boundary can't push the
    // session outside the rendered day window (which would hide it).
    const rawTimestamp = pixelToTimestamp(y, startOfDay);
    const timestamp = Math.min(Math.max(rawTimestamp, startOfDay), endOfDay - 60 * 1000);

    // Check if dropping a session (unscheduled -> scheduled)
    const sessionId = e.dataTransfer.getData('sessionId');
    // projectId is written by the project column for both project drags and
    // unscheduled-session drags, so prefer it over a separate lookup (the
    // dropped session may not be present in the scheduled-only `plannedSessions` prop).
    const projectId = e.dataTransfer.getData('projectId');
    if (sessionId && onProjectDrop && projectId) {
      onProjectDrop(projectId, timestamp, sessionId);
      return;
    }
    if (sessionId && onProjectDrop) {
      // Fallback: resolve project from the rendered sessions
      const session = plannedSessions.find(s => s.id === sessionId);
      if (session && session.project_id) {
        onProjectDrop(session.project_id, timestamp, sessionId);
      }
      return;
    }

    // Check if dropping a project
    if (projectId && onProjectDrop) {
      onProjectDrop(projectId, timestamp);
    }
  }, [onProjectDrop, startOfDay, endOfDay, plannedSessions]);

  // Calculate drag selection box
  const dragSelection = useMemo(() => {
    if (!isDragging || !dragStart || !dragEnd) return null;

    const startTime = Math.min(dragStart.timestamp, dragEnd);
    const endTime = Math.max(dragStart.timestamp, dragEnd);
    const duration = endTime - startTime;

    const top = timestampToPixel(startTime, startOfDay);
    const height = Math.max(duration / ((60 * 60 * 1000) / HOUR_HEIGHT), 20);

    return { top, height, startTime, endTime };
  }, [isDragging, dragStart, dragEnd, startOfDay]);

  // Calculate preview for active drag
  const dragPreview = useMemo(() => {
    if (!activeDrag || !activeDrag.currentStart || !activeDrag.currentEnd) return null;

    const top = timestampToPixel(activeDrag.currentStart, startOfDay);
    const height = Math.max(timestampToPixel(activeDrag.currentEnd, startOfDay) - top, 20);

    return {
      top,
      height,
      startTime: activeDrag.currentStart,
      endTime: activeDrag.currentEnd,
    };
  }, [activeDrag, startOfDay]);

  // Generate 15-minute grid lines
  const quarterHourLines = useMemo(() => {
    const lines = [];
    const msPerQuarterHour = 15 * 60 * 1000;
    for (let t = startOfDay; t < endOfDay; t += msPerQuarterHour) {
      const isHour = new Date(t).getMinutes() === 0;
      lines.push({
        top: timestampToPixel(t, startOfDay),
        isHour,
        time: new Date(t).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      });
    }
    return lines;
  }, [startOfDay, endOfDay]);

  const grid = (
    <div
      ref={timelineRef}
      className={cn(
        "relative flex-1 select-none",
        embedded && "min-w-0",
        dragOver && "bg-primary/5"
      )}
      style={{ minWidth: embedded ? undefined : MIN_CONTENT_WIDTH, height: totalHeight }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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
                  className={cn(
                    "absolute left-0 right-0",
                    line.isHour ? "" : "border-t border-dashed border-border/10 border-border/10"
                  )}
                  style={{ top: line.top }}
                />
              ))}
            </div>

            {/* Current time indicator (parent renders a shared one when embedded) */}
            {!embedded && isToday && (
              <CurrentTimeIndicator
                now={now}
                startOfDay={startOfDay}
                totalHeight={totalHeight}
              />
            )}

            {/* Planned Sessions */}
            <div className="relative h-full">
              {timelineSessions.length === 0 && !isDragging && !dragOver && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    Click and drag to create a new todo
                  </p>
                </div>
              )}

              {/* Drag over indicator */}
              {dragOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-primary/20 border-2 border-dashed border-primary rounded-lg p-4">
                    <p className="text-primary font-medium">Drop project here</p>
                  </div>
                </div>
              )}

              {timelineSessions.map((session) => (
                <PlannedSessionBlock
                  key={session.id}
                  session={session}
                  isSelected={selectedSessionId === session.id}
                  isHovered={hoveredSessionId === session.id}
                  isDragging={activeDrag?.sessionId === session.id}
                  previewPosition={activeDrag?.sessionId === session.id && activeDrag && activeDrag.currentStart && activeDrag.currentEnd ? {
                    top: timestampToPixel(activeDrag.currentStart, startOfDay),
                    height: Math.max(timestampToPixel(activeDrag.currentEnd, startOfDay) - timestampToPixel(activeDrag.currentStart, startOfDay), 20)
                  } : null}
                  onClick={() => onSessionClick(session as unknown as PlannedSession)}
                  onDoubleClick={() => onSessionClick(session as unknown as PlannedSession)}
                  onMouseEnter={() => setHoveredSessionId(session.id)}
                  onMouseLeave={() => setHoveredSessionId(null)}
                  onDragStart={handleDragStart}
                  onSessionUpdate={onSessionUpdate}
                  onStart={onSessionStart ? () => onSessionStart(session.id) : undefined}
                  onPause={onSessionPause ? () => onSessionPause(session.id) : undefined}
                  onStop={onSessionStop ? () => onSessionStop(session.id) : undefined}
                  onDelete={onSessionDelete ? () => onSessionDelete(session.id) : undefined}
                  now={now}
                  dayStart={startOfDay}
                  dayEnd={endOfDay}
                />
              ))}

              {/* View-only timer/session blocks */}
              {readOnlyLayout.map(({ session, top, height }) => (
                <TimerSessionBlock key={session.id} session={session} top={top} height={height} />
              ))}

              {/* New session drag preview */}
              {dragSelection && (
                <div
                  className="absolute left-0 right-0 mx-4 bg-primary/20 border-2 border-dashed border-primary rounded-lg pointer-events-none z-10"
                  style={{
                    top: dragSelection.top,
                    height: dragSelection.height,
                  }}
                >
                  <div className="p-2 text-xs font-medium text-primary">
                    {new Date(dragSelection.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - {new Date(dragSelection.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </div>
                </div>
              )}

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
      {/* Optional Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b-2 border-border-strong">
          <h2 className="font-semibold text-lg">Timeline</h2>
          <p className="text-sm text-muted-foreground">
            Click and drag to create • Drag sessions to move • Resize edges • Drop projects here
          </p>
        </div>
      )}

      {/* Timeline Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">
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

// Helper for className
function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Current time indicator component
 */
function CurrentTimeIndicator({ now, startOfDay, totalHeight }: { now: number; startOfDay: number; totalHeight: number }) {
  const top = timestampToPixel(now, startOfDay);

  if (top < 0 || top > totalHeight) return null;

  return (
    <div
      className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
      style={{ top }}
    >
      <div className="w-2 h-2 rounded-full bg-primary shrink-0 -ml-1" />
      <div className="flex-1 h-0.5 bg-primary" />
    </div>
  );
}
