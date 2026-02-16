'use client';

import { useState, useMemo } from 'react';
import { StatCard } from '@/components/stats/stat-card';
import { cn, formatDuration, formatTime, formatDate } from '@/lib/utils';
import { Task, ViewMode, HistorySession } from '@/lib/types';
import { useSessions } from '@/lib/hooks/use-sessions';
import { useTasks } from '@/lib/hooks/use-tasks';
import { SessionEditDialog } from '@/components/track/session-edit-dialog';
import {
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Play,
  Square,
  Clock,
  MoreHorizontal,
  Loader2,
  Pencil,
} from 'lucide-react';

// Note: HistorySession type is now imported from '@/lib/types'

export default function HistoryPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Edit dialog state
  const [editingSession, setEditingSession] = useState<HistorySession | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Calculate date range for fetching sessions
  const startOfDay = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, [selectedDate]);

  const endOfDay = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(23, 59, 59, 999);
    return date.getTime();
  }, [selectedDate]);

  // Fetch real sessions and tasks
  const { data: dbSessions = [], isLoading: isLoadingSessions } = useSessions(startOfDay, endOfDay);
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();

  // Transform DB sessions to HistorySession format
  const sessions: HistorySession[] = useMemo(() => {
    return dbSessions.map(session => {
      const task = tasks.find(t => t.id === session.task_id) || {
        id: session.task_id,
        name: 'Unknown Task',
        color: '#6B7280',
        icon: '❓',
      };
      return {
        id: session.id,
        taskId: session.task_id,
        task: task as Task,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        duration: session.duration || 0,
        title: session.title || undefined,
        note: session.note || undefined,
      };
    });
  }, [dbSessions, tasks]);

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => setSelectedDate(new Date());

  const handleEditSession = (session: HistorySession) => {
    setEditingSession(session);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingSession(null);
  };

  // Loading state
  if (isLoadingSessions || isLoadingTasks) {
    return (
      <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
        <div className='flex-1 p-4 lg:p-8 flex items-center justify-center'>
          <div className='flex flex-col items-center gap-4'>
            <Loader2 className='w-8 h-8 animate-spin text-primary' />
            <p className='text-muted-foreground'>Loading history...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
      <div className='flex-1 p-4 lg:p-8 space-y-6'>
        {/* Controls Card */}
        <div className='bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark rounded-xl shadow-brutal dark:shadow-brutal-dark p-4 lg:p-6'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            {/* Date Navigation */}
            <div className='flex items-center gap-3'>
              <button
                onClick={() => navigateDate(-1)}
                className='p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors shadow-brutal-xs btn-brutal'
              >
                <ChevronLeft className='w-5 h-5' />
              </button>

              <div className='flex flex-col items-center min-w-[140px]'>
                <span className='text-lg font-bold'>
                  {formatDate(selectedDate)}
                </span>
                {!isToday(selectedDate) && (
                  <button
                    onClick={goToToday}
                    className='text-xs text-primary hover:underline font-medium'
                  >
                    Go to today
                  </button>
                )}
              </div>

              <button
                onClick={() => navigateDate(1)}
                className='p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors shadow-brutal-xs btn-brutal'
              >
                <ChevronRight className='w-5 h-5' />
              </button>
            </div>

            {/* View Toggle */}
            <div className='flex items-center gap-1 p-1 bg-surface-elevated dark:bg-surface-elevated-dark rounded-lg border-2 border-border dark:border-border-dark shadow-brutal-xs dark:shadow-brutal-dark-xs'>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all',
                  viewMode === 'list'
                    ? 'bg-primary text-white shadow-brutal-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <List className='w-4 h-4' />
                <span className='hidden sm:inline'>List</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all',
                  viewMode === 'timeline'
                    ? 'bg-primary text-white shadow-brutal-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <CalendarDays className='w-4 h-4' />
                <span className='hidden sm:inline'>Timeline</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <StatCard
            label='Total Sessions'
            value={sessions.length.toString()}
            icon={Play}
            color='text-primary'
            bgColor='bg-primary/10'
          />
          <StatCard
            label='Total Time'
            value={formatTotalDuration(sessions)}
            icon={Clock}
            color='text-success-dark dark:text-success'
            bgColor='bg-success-bg dark:bg-success-bg-dark'
          />
          <StatCard
            label='Active Tasks'
            value={new Set(sessions.map((s) => s.taskId)).size.toString()}
            icon={Square}
            color='text-info-dark dark:text-info'
            bgColor='bg-blue-100 dark:bg-blue-900/30'
          />
          <StatCard
            label='Longest Session'
            value={formatLongestSession(sessions)}
            icon={MoreHorizontal}
            color='text-warning-dark dark:text-warning'
            bgColor='bg-warning-bg dark:bg-warning-bg-dark'
          />
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <ListView sessions={sessions} onEditSession={handleEditSession} />
        ) : (
          <TimelineView sessions={sessions} onEditSession={handleEditSession} />
        )}
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

// List View Component
function ListView({ 
  sessions, 
  onEditSession 
}: { 
  sessions: HistorySession[];
  onEditSession: (session: HistorySession) => void;
}) {
  return (
    <div className='bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark rounded-xl shadow-brutal dark:shadow-brutal-dark overflow-hidden'>
      <div className='p-4 lg:p-6 border-b-2 border-border dark:border-border-dark'>
        <h2 className='text-xl font-bold tracking-tight'>Session Log</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          All tracked sessions for the selected date
        </p>
      </div>

      <div className='divide-y divide-border dark:divide-border-dark'>
        {sessions.length === 0 ? (
          <EmptyState message='No sessions recorded for this date' />
        ) : (
          sessions.map((session, index) => (
            <ListSessionItem 
              key={session.id} 
              session={session} 
              index={index + 1} 
              onEdit={onEditSession}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ListSessionItem({
  session,
  index,
  onEdit,
}: {
  session: HistorySession;
  index: number;
  onEdit: (session: HistorySession) => void;
}) {
  // Determine display title: use custom title if different from task name
  const displayTitle = session.title || session.task.name;
  const hasCustomTitle = session.title && session.title !== session.task.name;

  return (
    <div 
      className='p-4 lg:p-6 hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors group cursor-pointer'
      onClick={() => onEdit(session)}
    >
      <div className='flex items-start gap-4'>
        {/* Index */}
        <div className='flex-shrink-0 w-8 h-8 rounded-full bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border-strong dark:border-border-strong-dark flex items-center justify-center text-sm font-mono text-muted-foreground shadow-brutal-xs dark:shadow-brutal-dark-xs'>
          {index}
        </div>

        {/* Task Icon */}
        <div
          className='flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2 border-black/10 shadow-brutal-xs'
          style={{ backgroundColor: session.task.color + '20' }}
        >
          {session.task.icon}
        </div>

        {/* Content */}
        <div className='flex-1 min-w-0'>
          <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2'>
            <div className='min-w-0'>
              {/* Title - shows custom title if set, otherwise task name */}
              <div className='flex items-center gap-2 flex-wrap'>
                <h3 className='font-semibold text-lg'>{displayTitle}</h3>
                {hasCustomTitle && (
                  <span
                    className='inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full'
                    style={{
                      backgroundColor: `${session.task.color}20`,
                      color: session.task.color,
                    }}
                  >
                    {session.task.icon} {session.task.name}
                  </span>
                )}
              </div>
              
              {/* Time range */}
              <p className='text-sm text-muted-foreground'>
                {formatTime(session.startedAt)} -{' '}
                {session.endedAt ? formatTime(session.endedAt) : 'Ongoing'}
              </p>
            </div>

            <div className='flex items-center gap-3 shrink-0'>
              {/* Duration Badge */}
              <div className='px-3 py-1.5 rounded-lg bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border-strong dark:border-border-strong-dark font-mono text-sm font-semibold shadow-brutal-xs dark:shadow-brutal-dark-xs'>
                {formatDuration(session.duration)}
              </div>

              {/* Edit Button - visible on hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(session);
                }}
                className='opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border-2 border-transparent hover:border-primary/20'
                title='Edit session'
              >
                <Pencil className='w-4 h-4' />
              </button>

              {/* Status Indicator */}
              <div
                className='w-3 h-3 rounded-full border border-white/20'
                style={{ backgroundColor: session.task.color }}
              />
            </div>
          </div>

          {/* Note */}
          {session.note && (
            <div className='mt-2 flex items-start gap-2'>
              <div className='w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0' />
              <p className='text-sm text-muted-foreground'>{session.note}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Timeline View Component
function TimelineView({ 
  sessions,
  onEditSession,
}: { 
  sessions: HistorySession[];
  onEditSession: (session: HistorySession) => void;
}) {
  const hours = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div className='bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark rounded-xl shadow-brutal dark:shadow-brutal-dark overflow-hidden'>
      <div className='p-4 lg:p-6 border-b-2 border-border dark:border-border-dark'>
        <h2 className='text-xl font-bold tracking-tight'>Day Timeline</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Visual overview of your day from 00:00 to 24:00
        </p>
      </div>

      <div className='overflow-x-auto'>
        <div className='min-w-[600px] p-4 lg:p-6'>
          {/* Timeline Header */}
          <div className='flex items-center gap-4 mb-4'>
            <div className='w-16 flex-shrink-0' />
            <div className='flex-1 flex items-center justify-between text-xs text-muted-foreground font-mono'>
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>

          {/* Timeline Grid */}
          <div className='relative'>
            {hours.map((hour) => (
              <TimelineRow
                key={hour}
                hour={hour}
                sessions={getSessionsForHour(sessions, hour)}
                onEditSession={onEditSession}
              />
            ))}

            {/* Current Time Indicator */}
            <CurrentTimeIndicator />
          </div>

          {/* Legend */}
          <div className='mt-6 pt-4 border-t-2 border-border dark:border-border-dark'>
            <p className='text-sm font-semibold mb-3'>Tasks</p>
            <div className='flex flex-wrap gap-3'>
              {getUniqueTasks(sessions).map((task) => (
                <div key={task.id} className='flex items-center gap-2'>
                  <div
                    className='w-4 h-4 rounded border-2 border-black/10 shadow-brutal-xs'
                    style={{ backgroundColor: task.color }}
                  />
                  <span className='text-sm'>{task.icon}</span>
                  <span className='text-sm text-muted-foreground'>
                    {task.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TimelineRow({
  hour,
  sessions,
  onEditSession,
}: {
  hour: number;
  sessions: HistorySession[];
  onEditSession: (session: HistorySession) => void;
}) {
  const hourLabel = `${hour.toString().padStart(2, '0')}:00`;

  return (
    <div className='flex items-center gap-4 h-14 border-b border-border/50 dark:border-border-dark/50'>
      {/* Hour Label */}
      <div className='w-16 flex-shrink-0 text-sm text-muted-foreground font-mono'>
        {hourLabel}
      </div>

      {/* Hour Cell */}
      <div className='flex-1 relative h-full'>
        {/* Hour background grid lines */}
        <div className='absolute inset-0 flex'>
          <div className='flex-1 border-r border-border/30 dark:border-border-dark/30' />
          <div className='flex-1 border-r border-border/30 dark:border-border-dark/30' />
          <div className='flex-1 border-r border-border/30 dark:border-border-dark/30' />
          <div className='flex-1' />
        </div>

        {/* Task Blocks */}
        {sessions.map((session) => {
          const { left, width } = calculateBlockPosition(
            session.startedAt,
            session.endedAt,
            hour,
          );

          return (
            <div
              key={session.id}
              onClick={() => onEditSession(session)}
              className='absolute top-1 bottom-1 rounded-md border-2 border-black/20 shadow-brutal-xs hover:shadow-brutal-sm hover:scale-[1.02] transition-all cursor-pointer group'
              style={{
                left: `${left}%`,
                width: `${width}%`,
                backgroundColor: session.task.color,
              }}
              title={`${session.task.name}: ${formatTime(
                session.startedAt,
              )} - ${session.endedAt ? formatTime(session.endedAt) : 'Ongoing'}`}
            >
              {/* Tooltip */}
              <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark rounded-lg shadow-brutal dark:shadow-brutal-dark opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap'>
                <div className='flex items-center gap-2'>
                  <span>{session.task.icon}</span>
                  <span className='font-semibold'>
                    {session.title || session.task.name}
                  </span>
                  {session.title && session.title !== session.task.name && (
                    <span className='text-xs text-muted-foreground'>
                      ({session.task.name})
                    </span>
                  )}
                </div>
                {session.note && (
                  <div className='text-xs text-muted-foreground mt-1 max-w-[200px] truncate'>
                    {session.note}
                  </div>
                )}
                <div className='text-xs text-muted-foreground mt-1'>
                  {formatTime(session.startedAt)} -{' '}
                  {session.endedAt ? formatTime(session.endedAt) : 'Ongoing'} (
                  {formatDuration(session.duration)})
                </div>
                <div className='text-xs text-primary mt-1 pt-1 border-t border-border dark:border-border-dark'>
                  Click to edit
                </div>
              </div>

              {/* Block Label (if wide enough) */}
              {width > 15 && (
                <div className='absolute inset-0 flex items-center px-2 overflow-hidden'>
                  <span className='text-xs font-semibold text-white truncate drop-shadow-md'>
                    {session.title || session.task.name}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CurrentTimeIndicator() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const topPosition = currentHour * 56 + (currentMinute / 60) * 56; // 56px per row

  // Only show if within 0-24 hours
  if (currentHour < 0 || currentHour > 23) return null;

  return (
    <div
      className='absolute left-16 right-0 flex items-center pointer-events-none z-20'
      style={{ top: `${topPosition}px` }}
    >
      <div className='w-2 h-2 rounded-full bg-danger-dark dark:bg-danger -ml-1' />
      <div className='flex-1 h-0.5 bg-danger-dark/50 dark:bg-danger/50' />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className='p-12 text-center'>
      <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border-strong dark:border-border-strong-dark flex items-center justify-center shadow-brutal-sm dark:shadow-brutal-dark-sm'>
        <Clock className='w-8 h-8 text-muted-foreground' />
      </div>
      <p className='text-muted-foreground'>{message}</p>
    </div>
  );
}

// Helper Functions
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function formatTotalDuration(sessions: HistorySession[]): string {
  const totalSeconds = sessions.reduce((sum, s) => sum + s.duration, 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function formatLongestSession(sessions: HistorySession[]): string {
  if (sessions.length === 0) return '0m';
  const longest = Math.max(...sessions.map((s) => s.duration));
  const hours = Math.floor(longest / 3600);
  const minutes = Math.floor((longest % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function getSessionsForHour(
  sessions: HistorySession[],
  hour: number,
): HistorySession[] {
  const hourStart = hour * 60 * 60 * 1000;
  const hourEnd = (hour + 1) * 60 * 60 * 1000;

  return sessions.filter((session) => {
    const sessionStart = session.startedAt % (24 * 60 * 60 * 1000);
    const sessionEnd = session.endedAt
      ? session.endedAt % (24 * 60 * 60 * 1000)
      : hourEnd;

    // Check if session overlaps with this hour
    return sessionStart < hourEnd && sessionEnd > hourStart;
  });
}

function calculateBlockPosition(
  startedAt: number,
  endedAt: number | null,
  hour: number,
): { left: number; width: number } {
  const hourStart = hour * 60 * 60 * 1000;
  const hourEnd = (hour + 1) * 60 * 60 * 1000;

  const entryStart = startedAt % (24 * 60 * 60 * 1000);
  const entryEnd = endedAt ? endedAt % (24 * 60 * 60 * 1000) : hourEnd;

  // Clamp to hour boundaries
  const blockStart = Math.max(entryStart, hourStart);
  const blockEnd = Math.min(entryEnd, hourEnd);

  const hourDuration = 60 * 60 * 1000;
  const left = ((blockStart - hourStart) / hourDuration) * 100;
  const width = ((blockEnd - blockStart) / hourDuration) * 100;

  return { left: Math.max(0, left), width: Math.max(0, width) };
}

function getUniqueTasks(sessions: HistorySession[]): Task[] {
  const seen = new Set<string>();
  return sessions
    .map((s) => s.task)
    .filter((task) => {
      if (seen.has(task.id)) return false;
      seen.add(task.id);
      return true;
    });
}
