'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { HOURS, HOUR_HEIGHT, MIN_CONTENT_WIDTH } from '@/app/components/timeline/constants';
import { PlannedSessionBlock } from './planned-session-block';
import type { Database } from '@/lib/supabase/database.types';
import type { PlannedSession, TimelinePlannedSession } from '@/lib/types';

type DBSession = Database['public']['Tables']['sessions']['Row'] & { tasks: Database['public']['Tables']['tasks']['Row'] | null };

interface PlanningTimelineProps {
  plannedSessions: DBSession[];
  selectedDate: Date;
  onSessionClick: (session: PlannedSession) => void;
  onTimeSlotClick: (timestamp: number) => void;
}

/**
 * Calculate layout for planned sessions on the timeline
 * Similar to calculateTimelineLayout but for planned sessions
 */
function calculatePlannedSessionsLayout(
  sessions: DBSession[],
  dayStart: number
): TimelinePlannedSession[] {
  if (!sessions.length) return [];

  const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;

  // 1. Prepare visual layout data
  const initialLayout = sessions.map(s => {
    const startedAt = s.started_at;
    const endedAt = s.ended_at || startedAt + (s.duration || 0) * 1000;
    const top = (startedAt - dayStart) / msPerPixel;
    const height = Math.max((endedAt - startedAt) / msPerPixel, 20); // Minimum 20px height

    return {
      id: s.id,
      taskId: s.task_id,
      task: s.tasks ? {
        id: s.tasks.id,
        name: s.tasks.name,
        color: s.tasks.color,
        icon: s.tasks.icon,
        goal_duration: s.tasks.goal_duration,
        goal_value: s.tasks.goal_value,
        goal_type: s.tasks.goal_type,
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
      original: s
    };
  }).sort((a, b) => a.top - b.top || b.height - a.height);

  // 2. Group sessions into visually overlapping connected components
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

        // Visual overlap check
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

  // 3. For each group, assign to columns (slots)
  const result: TimelinePlannedSession[] = [];

  for (const group of groups) {
    // Sort group by top position
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

    // 4. Calculate final position and width
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

  return result.sort((a, b) => a.plannedStartTime - b.plannedStartTime);
}

export function PlanningTimeline({
  plannedSessions,
  selectedDate,
  onSessionClick,
  onTimeSlotClick,
}: PlanningTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ y: number; timestamp: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  const totalHeight = HOURS.length * HOUR_HEIGHT;

  // Calculate start of day
  const startOfDay = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, [selectedDate]);

  // Calculate layout for planned sessions
  const timelineSessions = useMemo(
    () => calculatePlannedSessionsLayout(plannedSessions, startOfDay),
    [plannedSessions, startOfDay]
  );

  // Check if selected date is today
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
    const eightAM = startOfDay + 8 * 60 * 60 * 1000;
    const scrollPosition = (eightAM - startOfDay) / msPerPixel - 100;
    scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
  }, [startOfDay]);

  // Handle mouse down on timeline to create new session
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top + (scrollContainerRef.current?.scrollTop || 0);

    // Calculate timestamp from y position
    const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
    const timestamp = startOfDay + y * msPerPixel;

    // Round to nearest 30 minutes
    const thirtyMinutes = 30 * 60 * 1000;
    const roundedTimestamp = Math.round(timestamp / thirtyMinutes) * thirtyMinutes;

    setIsDragging(true);
    setDragStart({ y, timestamp: roundedTimestamp });
    setDragEnd(roundedTimestamp + 60 * 60 * 1000); // Default 1 hour duration
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top + (scrollContainerRef.current?.scrollTop || 0);

    const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
    const timestamp = startOfDay + y * msPerPixel;

    // Round to nearest 15 minutes
    const fifteenMinutes = 15 * 60 * 1000;
    const roundedTimestamp = Math.round(timestamp / fifteenMinutes) * fifteenMinutes;

    setDragEnd(roundedTimestamp);
  };

  const handleMouseUp = () => {
    if (isDragging && dragStart && dragEnd) {
      const startTime = Math.min(dragStart.timestamp, dragEnd);
      onTimeSlotClick(startTime);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Calculate drag selection box
  const dragSelection = useMemo(() => {
    if (!isDragging || !dragStart || !dragEnd) return null;

    const startTime = Math.min(dragStart.timestamp, dragEnd);
    const endTime = Math.max(dragStart.timestamp, dragEnd);
    const duration = endTime - startTime;

    const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
    const top = (startTime - startOfDay) / msPerPixel;
    const height = Math.max(duration / msPerPixel, 20);

    return { top, height, startTime, endTime };
  }, [isDragging, dragStart, dragEnd, startOfDay]);

  return (
    <div className="flex flex-col h-full">
      {/* Timeline Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-border-strong dark:border-border-strong-dark">
        <h2 className="font-semibold text-lg">Timeline</h2>
        <p className="text-sm text-muted-foreground">
          Click and drag to create new todo
        </p>
      </div>

      {/* Timeline Content */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-auto"
      >
        <div className="flex" style={{ minHeight: totalHeight }}>
          {/* Time Labels Column */}
          <div className="flex-shrink-0 border-r-2 border-border-strong dark:border-border-strong-dark bg-surface-elevated/30 dark:bg-surface-elevated-dark/30">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex items-start justify-end px-3 text-sm font-medium text-muted-foreground border-b border-border/30 dark:border-border-dark/30"
                style={{ height: HOUR_HEIGHT, paddingTop: 8 }}
              >
                {hour === 0 || hour === 24 ? '12 AM' : hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {/* Timeline Grid */}
          <div
            className="relative flex-1"
            style={{ minWidth: MIN_CONTENT_WIDTH, height: totalHeight }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Hour grid lines */}
            <div className="absolute inset-0">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-b border-border/30 dark:border-border-dark/30"
                  style={{ height: HOUR_HEIGHT }}
                />
              ))}
            </div>

            {/* Half-hour grid lines */}
            <div className="absolute inset-0 pointer-events-none">
              {HOURS.map((hour) => (
                <div
                  key={`half-${hour}`}
                  className="border-b border-dashed border-border/20 dark:border-border-dark/20"
                  style={{
                    position: 'absolute',
                    top: hour * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                    left: 0,
                    right: 0,
                    height: 1
                  }}
                />
              ))}
            </div>

            {/* Current time indicator */}
            {isToday && (
              <CurrentTimeIndicator
                startOfDay={startOfDay}
                totalHeight={totalHeight}
              />
            )}

            {/* Planned Sessions */}
            <div className="relative h-full">
              {timelineSessions.length === 0 && !isDragging && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    Click and drag to create a new todo
                  </p>
                </div>
              )}

              {timelineSessions.map((session) => (
                <PlannedSessionBlock
                  key={session.id}
                  session={session}
                  onClick={() => onSessionClick(session)}
                />
              ))}

              {/* Drag selection preview */}
              {dragSelection && (
                <div
                  className="absolute left-0 right-0 mx-4 bg-primary/20 border-2 border-dashed border-primary rounded-lg pointer-events-none"
                  style={{
                    top: dragSelection.top,
                    height: dragSelection.height,
                  }}
                >
                  <div className="p-2 text-xs font-medium text-primary">
                    New todo
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Current time indicator component
 */
function CurrentTimeIndicator({ startOfDay, totalHeight }: { startOfDay: number; totalHeight: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
  const top = (now - startOfDay) / msPerPixel;

  // Only show if within the 24-hour range
  if (top < 0 || top > totalHeight) return null;

  return (
    <div
      className="absolute left-0 right-0 flex items-center pointer-events-none z-20"
      style={{ top }}
    >
      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 -ml-1" />
      <div className="flex-1 h-0.5 bg-primary" />
    </div>
  );
}
