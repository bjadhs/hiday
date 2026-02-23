'use client';

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useTimeline } from '@/lib/hooks/use-timeline';
import { useUpdateSession } from '@/lib/hooks/use-sessions';
import { DayNavigation } from '@/components/timeline/day-navigation';
import { TimeLabels } from '@/components/timeline/time-labels';
import { TimelineGrid } from '@/components/timeline/timeline-grid';
import { HOURS, HOUR_HEIGHT } from '@/components/timeline/constants';
import { TimelineSession } from '@/components/timeline/types';
import { SessionEditDialog } from '@/components/track/session-edit-dialog';
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

  // Update session mutation
  const updateSessionMutation = useUpdateSession();

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

  // Handle session drag/resize updates
  const handleSessionUpdate = useCallback((sessionId: string, updates: { startedAt?: number; endedAt?: number }) => {
    const updateData: { started_at?: number; ended_at?: number; duration?: number } = {};

    if (updates.startedAt !== undefined) {
      updateData.started_at = updates.startedAt;
    }

    if (updates.endedAt !== undefined) {
      updateData.ended_at = updates.endedAt;
    }

    // Recalculate duration if both times are available
    if (updates.startedAt && updates.endedAt) {
      updateData.duration = Math.round((updates.endedAt - updates.startedAt) / 1000);
    }

    updateSessionMutation.mutate({
      id: sessionId,
      updates: updateData,
    });
  }, [updateSessionMutation]);

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
                onSessionUpdate={handleSessionUpdate}
                scrollContainerRef={scrollContainerRef}
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
