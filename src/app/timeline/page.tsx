'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTimeline } from '@/lib/hooks/use-timeline';
import { DayNavigation } from '@/app/components/timeline/day-navigation';
import { TimeLabels } from '@/app/components/timeline/time-labels';
import { TimelineGrid } from '@/app/components/timeline/timeline-grid';
import { HOURS, HOUR_HEIGHT } from '@/app/components/timeline/constants';
import { TimelineSession } from '@/app/components/timeline/types';
import { SessionEditDialog } from '@/app/components/track/session-edit-dialog';
import { HistorySession } from '@/lib/types';

export default function TimelinePage() {
  const {
    selectedDate,
    isMounted,
    now,
    startOfDay,
    isLoading,
    timelineSessions,
    scrollContainerRef,
    goToPreviousDay,
    goToNextDay,
    goToToday,
    isToday,
  } = useTimeline();

  // Edit dialog state
  const [editingSession, setEditingSession] = useState<HistorySession | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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
        <DayNavigation
          selectedDate={selectedDate}
          isMounted={isMounted}
          isToday={isToday}
          onPrev={goToPreviousDay}
          onNext={goToNextDay}
          onToday={goToToday}
        />

        {/* Timeline Container */}
        <div className='flex-1 bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark rounded-xl shadow-brutal dark:shadow-brutal-dark overflow-hidden flex flex-col min-h-0'>
          {/* Scrollable Area */}
          <div
            ref={scrollContainerRef}
            className='flex-1 overflow-auto'
          >
            <div className='flex min-w-full'>
              {/* Time Labels Column - Sticky */}
              <TimeLabels />

              {/* Timeline Content - Wider and Scrollable */}
              <TimelineGrid
                totalHeight={totalHeight}
                isToday={isToday}
                now={now}
                startOfDay={startOfDay}
                timelineSessions={timelineSessions}
                onEditSession={handleEditSession}
              />
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
