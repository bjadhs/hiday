'use client';

import { useState, useMemo, useCallback, Suspense } from 'react';
import { Loader2, List, Clock } from 'lucide-react';
import { useHistoryPage } from '@/lib/hooks/use-history-page';
import { useUpdateSession } from '@/lib/hooks/use-sessions';
import { SessionEditDialog } from '@/components/track';
import { HistoryControls, HistoryStats, HistorySessionItem } from '@/components/history';
import { SessionTimeline } from '@/components/timeline/session-timeline';
import { HOURS, HOUR_HEIGHT } from '@/components/timeline/constants';
import { calculateTimelineLayout } from '@/components/timeline/utils';
import { TimelineSession } from '@/components/timeline/types';
import { HistorySession } from '@/lib/types';
import { EmptyState } from '@/components/history/history-empty-state';

function HistoryPageContent() {
  const {
    selectedDate,
    sessions,
    isLoading,
    navigateDate,
    goToToday,
    editingSession,
    isEditDialogOpen,
    handleEditSession,
    handleCloseEditDialog,
    isToday,
  } = useHistoryPage();

  const updateSessionMutation = useUpdateSession();

  // Calculate timeline sessions
  const now = Date.now();
  const startOfDay = useMemo(() => {
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, [selectedDate]);

  const timelineSessions = useMemo(() => {
    // Convert HistorySession to the format expected by calculateTimelineLayout
    const layoutSessions = sessions.map(s => ({
      id: s.id,
      started_at: s.startedAt,
      ended_at: s.endedAt,
      duration: s.duration,
      title: s.title || null,
      note: s.note || null,
      tasks: s.task,
    }));
    return calculateTimelineLayout(layoutSessions, startOfDay, now);
  }, [sessions, startOfDay, now]);

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

  // Handle edit from timeline
  const handleTimelineEdit = useCallback((session: TimelineSession) => {
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
    handleEditSession(historySession);
  }, [handleEditSession]);

  const totalHeight = HOURS.length * HOUR_HEIGHT;

  // Loading state
  if (isLoading) {
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
    <main className='flex-1 flex flex-col pb-20 lg:pb-0 overflow-hidden'>
      <div className='flex-1 p-4 lg:p-6 space-y-4 min-h-0'>
        {/* Controls Card */}
        <HistoryControls
          selectedDate={selectedDate}
          viewMode="list"
          onNavigateDate={navigateDate}
          onSetViewMode={() => {}}
          onGoToToday={goToToday}
        />

        {/* Summary Stats */}
        <HistoryStats sessions={sessions} />

        {/* Split View: Session List | Session Timeline */}
        <div className='flex-1 bg-surface border-2 border-border-strong rounded-xl shadow-brutal overflow-hidden flex flex-col min-h-0'>
          {/* Headers */}
          <div className="flex border-b-2 border-border-strong">
            {/* Left Header - Session List */}
            <div className="w-96 flex-shrink-0 flex items-center gap-2 p-3 border-r-2 border-border-strong bg-primary/5 dark:bg-primary/10">
              <List className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Session Log</span>
            </div>
            {/* Right Header - Timeline */}
            <div className="flex-1 flex items-center gap-2 p-3 bg-surface-elevated/30">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold text-sm">Day Timeline (12am - 12am)</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Side - Session List */}
            <div className="w-96 flex-shrink-0 border-r-2 border-border-strong overflow-auto">
              {sessions.length === 0 ? (
                <div className="p-8">
                  <EmptyState message='No sessions recorded for this date' />
                </div>
              ) : (
                <div className="divide-y divide-border dark:divide-border-dark">
                  {sessions.map((session, index) => (
                    <HistorySessionItem
                      key={session.id}
                      session={session}
                      index={index + 1}
                      onEdit={handleEditSession}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Side - Session Timeline */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <SessionTimeline
                totalHeight={totalHeight}
                isToday={isToday}
                now={now}
                startOfDay={startOfDay}
                sessions={timelineSessions}
                onEditSession={handleTimelineEdit}
                onSessionUpdate={handleSessionUpdate}
                showTimeLabels={true}
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

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className='flex-1 flex items-center justify-center'>
          <Loader2 className='w-8 h-8 animate-spin' />
        </div>
      }
    >
      <HistoryPageContent />
    </Suspense>
  );
}
