'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useHistoryPage } from '@/lib/hooks/use-history-page';
import { SessionEditDialog } from '@/components/track';
import {
  HistoryControls,
  HistoryStats,
  HistoryListView,
  HistoryTimelineView,
} from '@/components/history';

function HistoryPageContent() {
  const {
    viewMode,
    setViewMode,
    selectedDate,
    sessions,
    isLoading,
    navigateDate,
    goToToday,
    editingSession,
    isEditDialogOpen,
    handleEditSession,
    handleCloseEditDialog,
  } = useHistoryPage();

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
    <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
      <div className='flex-1 p-4 lg:p-8 space-y-6'>
        {/* Controls Card */}
        <HistoryControls
          selectedDate={selectedDate}
          viewMode={viewMode}
          onNavigateDate={navigateDate}
          onSetViewMode={setViewMode}
          onGoToToday={goToToday}
        />

        {/* Summary Stats */}
        <HistoryStats sessions={sessions} />

        {/* Content */}
        {viewMode === 'list' ? (
          <HistoryListView
            sessions={sessions}
            onEditSession={handleEditSession}
          />
        ) : (
          <HistoryTimelineView
            sessions={sessions}
            onEditSession={handleEditSession}
          />
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
