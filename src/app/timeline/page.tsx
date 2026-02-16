'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useSessions } from '@/lib/hooks/use-sessions';
import { Task, HistorySession } from '@/lib/types';
import { SessionEditDialog } from '@/components/track/session-edit-dialog';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';

// Hour labels from 12 AM to 12 AM next day
const HOURS = Array.from({ length: 25 }, (_, i) => i);

// Width of the timeline content area
const MIN_CONTENT_WIDTH = 600;
const HOUR_HEIGHT = 120;
const TIME_COLUMN_WIDTH = 80;
const MIN_SESSION_HEIGHT_PX = 80;

// Session with computed layout info
type TimelineSession = {
  id: string;
  task: Task;
  startedAt: number;
  endedAt: number;
  duration: number;
  title?: string;
  note?: string;
  // Layout (pixels for vertical positioning)
  top: number;
  height: number;
  // Layout (percentages for horizontal)
  left: number;
  width: number;
};

// Check if two sessions overlap
function sessionsOverlap(a: { started_at: number; ended_at: number }, b: { started_at: number; ended_at: number }): boolean {
  return a.started_at < b.ended_at && a.ended_at > b.started_at;
}

// Group overlapping sessions using connected components
// If A overlaps B and B overlaps C, then A, B, C are all in the same group
function groupOverlappingSessions<T extends { id: string; started_at: number; ended_at: number }>(
  sessions: T[]
): T[][] {
  if (!sessions.length) return [];

  const visited = new Set<string>();
  const groups: T[][] = [];

  for (const session of sessions) {
    if (visited.has(session.id)) continue;

    // BFS to find all connected sessions
    const group: T[] = [];
    const queue: T[] = [session];
    visited.add(session.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      group.push(current);

      // Find all sessions that overlap with current (directly or indirectly)
      for (const other of sessions) {
        if (visited.has(other.id)) continue;
        
        // Check if other overlaps with any session in the current group
        const overlapsWithGroup = group.some((g) => sessionsOverlap(g, other));
        if (overlapsWithGroup) {
          visited.add(other.id);
          queue.push(other);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

// Calculate layout for sessions
function calculateTimelineLayout(
  sessions: { id: string; started_at: number; ended_at: number | null; duration: number | null; title: string | null; note: string | null; tasks: Task | null }[],
  dayStart: number
): TimelineSession[] {
  if (!sessions.length) return [];

  // Filter out sessions without end time
  const completedSessions = sessions
    .filter((s): s is typeof s & { ended_at: number } => s.ended_at !== null)
    .sort((a, b) => a.started_at - b.started_at);

  if (!completedSessions.length) return [];

  const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;

  // Group overlapping sessions
  const groups = groupOverlappingSessions(completedSessions);

  // Calculate layout for each group
  const result: TimelineSession[] = [];

  for (const group of groups) {
    // Sort by start time for consistent ordering
    group.sort((a, b) => a.started_at - b.started_at);

    const totalSessions = group.length;

    // Each session gets equal width
    for (let i = 0; i < group.length; i++) {
      const session = group[i];
      const top = (session.started_at - dayStart) / msPerPixel;
      const actualHeight = (session.ended_at - session.started_at) / msPerPixel;
      const height = Math.max(actualHeight, MIN_SESSION_HEIGHT_PX);
      const left = (i / totalSessions) * 100;
      const width = 100 / totalSessions;

      result.push({
        id: session.id,
        task: session.tasks || { id: 'unknown', name: 'Unknown', color: '#999', icon: '❓' },
        startedAt: session.started_at,
        endedAt: session.ended_at,
        duration: session.duration || 0,
        title: session.title || undefined,
        note: session.note || undefined,
        top,
        height,
        left,
        width,
      });
    }
  }

  return result.sort((a, b) => a.startedAt - b.startedAt);
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 24) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export default function TimelinePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Edit dialog state
  const [editingSession, setEditingSession] = useState<HistorySession | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Calculate start and end of selected date
  const startOfDay = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, [selectedDate]);

  const endOfDay = useMemo(() => {
    return startOfDay + 24 * 60 * 60 * 1000;
  }, [startOfDay]);

  const { data: sessions = [], isLoading } = useSessions(startOfDay, endOfDay);

  const timelineSessions = useMemo(
    () => calculateTimelineLayout(sessions, startOfDay),
    [sessions, startOfDay]
  );

  // Scroll to current time on mount and when date changes
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    
    if (isToday) {
      const now = Date.now();
      const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
      const scrollPosition = (now - startOfDay) / msPerPixel - 200;
      scrollContainerRef.current.scrollTop = Math.max(0, scrollPosition);
    } else {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedDate, startOfDay]);

  const goToPreviousDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return newDate;
    });
  };

  const goToNextDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const handleEditSession = (session: TimelineSession) => {
    const historySession: HistorySession = {
      id: session.id,
      taskId: session.task.id,
      task: session.task,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      duration: session.duration,
      title: session.title,
      note: session.note,
    };
    setEditingSession(historySession);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingSession(null);
  };

  if (isLoading) {
    return (
      <main className='flex-1 flex items-center justify-center pb-20 lg:pb-0'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='w-8 h-8 animate-spin text-primary' />
          <p className='text-muted-foreground'>Loading timeline...</p>
        </div>
      </main>
    );
  }

  const totalHeight = HOURS.length * HOUR_HEIGHT;

  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-0 overflow-hidden'>
      <div className='flex-1 p-4 lg:p-6 space-y-4 min-h-0'>
        {/* Header with date navigation */}
        <div className='flex items-center justify-between gap-4 flex-shrink-0'>
          <h1 className='text-2xl font-bold tracking-tight'>Timeline</h1>
          <div className='flex items-center gap-2'>
            <button
              onClick={goToPreviousDay}
              className='p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors'
            >
              <ChevronLeft className='w-5 h-5' />
            </button>
            <div className='flex flex-col items-center min-w-[140px]'>
              <span className='font-semibold'>
                {selectedDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              {!isToday && (
                <button
                  onClick={goToToday}
                  className='text-xs text-primary hover:underline'
                >
                  Go to today
                </button>
              )}
            </div>
            <button
              onClick={goToNextDay}
              className='p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors'
            >
              <ChevronRight className='w-5 h-5' />
            </button>
          </div>
        </div>

        {/* Timeline Container */}
        <div className='flex-1 bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark rounded-xl shadow-brutal dark:shadow-brutal-dark overflow-hidden flex flex-col min-h-0'>
          {/* Scrollable Area */}
          <div
            ref={scrollContainerRef}
            className='flex-1 overflow-auto'
          >
            <div className='flex min-w-full'>
              {/* Time Labels Column - Sticky */}
              <div 
                className='sticky left-0 z-20 flex-shrink-0 border-r-2 border-border dark:border-border-dark bg-surface-elevated dark:bg-surface-elevated-dark'
                style={{ width: TIME_COLUMN_WIDTH }}
              >
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className='flex items-start justify-end pr-3 pt-3 border-b border-border/50 dark:border-border-dark/50'
                    style={{ height: HOUR_HEIGHT }}
                  >
                    <span className='text-xs font-semibold text-muted-foreground'>
                      {formatHour(hour)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Timeline Content - Wider and Scrollable */}
              <div 
                className='relative flex-1'
                style={{ minWidth: MIN_CONTENT_WIDTH, height: totalHeight }}
              >
                {/* Hour grid lines */}
                <div className='absolute inset-0'>
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className='border-b border-border/30 dark:border-border-dark/30'
                      style={{ height: HOUR_HEIGHT }}
                    />
                  ))}
                </div>

                {/* Current time indicator */}
                {isToday && <CurrentTimeIndicator startOfDay={startOfDay} totalHeight={totalHeight} />}

                {/* Sessions */}
                <div className='relative h-full'>
                  {timelineSessions.length === 0 ? (
                    <div className='absolute inset-0 flex items-center justify-center'>
                      <p className='text-muted-foreground text-sm'>
                        No sessions for this day
                      </p>
                    </div>
                  ) : (
                    timelineSessions.map((session) => (
                      <SessionBlock 
                        key={session.id} 
                        session={session} 
                        onClick={() => handleEditSession(session)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Session Dialog */}
      <SessionEditDialog
        session={editingSession}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
      />
    </main>
  );
}

function CurrentTimeIndicator({ startOfDay, totalHeight }: { startOfDay: number; totalHeight: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const msPerPixel = (60 * 60 * 1000) / HOUR_HEIGHT;
  const top = (now - startOfDay) / msPerPixel;

  // Only show if within the 24-hour range
  if (top < 0 || top > totalHeight) return null;

  return (
    <div
      className='absolute left-0 right-0 z-30 pointer-events-none'
      style={{ top }}
    >
      <div className='flex items-center'>
        <div className='w-2 h-2 rounded-full bg-danger -ml-1 shadow-sm' />
        <div className='flex-1 h-0.5 bg-danger shadow-sm' />
      </div>
      <div className='absolute -top-5 right-2 bg-danger text-white text-[10px] px-2 py-0.5 rounded font-medium shadow-sm'>
        {formatTime(now)}
      </div>
    </div>
  );
}

function SessionBlock({ session, onClick }: { session: TimelineSession; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className='absolute py-1 px-1.5'
      style={{
        top: session.top,
        height: session.height,
        left: `${session.left}%`,
        width: `${session.width}%`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div
        className={cn(
          'h-full rounded-xl border-2 overflow-hidden cursor-pointer transition-all',
          isHovered 
            ? 'ring-2 ring-primary/50 shadow-brutal-sm dark:shadow-brutal-dark-sm scale-[1.02] z-10' 
            : 'shadow-sm'
        )}
        style={{
          backgroundColor: `${session.task.color}25`,
          borderColor: session.task.color,
        }}
      >
        <div className='p-3 h-full flex flex-col justify-between overflow-hidden'>
          {/* Top: Icon and Task Name */}
          <div className='flex items-center gap-2 min-w-0'>
            <span 
              className='w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0 border border-black/10 dark:border-white/10'
              style={{ backgroundColor: `${session.task.color}50` }}
            >
              {session.task.icon}
            </span>
            <div className='min-w-0 flex-1'>
              <span
                className='text-sm font-bold truncate block'
                style={{ color: session.task.color }}
              >
                {session.task.name}
              </span>
            </div>
          </div>

          {/* Middle: Session Title */}
          <div className='flex-1 flex items-center min-w-0 py-1'>
            <p className={cn(
              'text-sm font-medium truncate',
              session.title && session.title !== session.task.name 
                ? 'text-foreground dark:text-foreground' 
                : 'text-muted-foreground dark:text-muted-foreground italic'
            )}>
              {session.title && session.title !== session.task.name 
                ? session.title 
                : 'No title'}
            </p>
          </div>

          {/* Bottom: Time and Duration */}
          <div className='flex items-center justify-between gap-2 pt-2 border-t border-border/40 dark:border-border-dark/40'>
            <p className='text-xs text-muted-foreground font-mono truncate'>
              {formatTime(session.startedAt)} - {formatTime(session.endedAt)}
            </p>
            <p
              className='text-xs font-bold px-2 py-0.5 rounded-full shrink-0'
              style={{ 
                backgroundColor: `${session.task.color}40`,
                color: session.task.color 
              }}
            >
              {formatDuration(session.duration)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
