'use client';

import { Loader2 } from 'lucide-react';
import { useTodaySessions } from '@/lib/hooks/use-sessions';
import { useTasks } from '@/lib/hooks/use-tasks';
import { QuickStats, ComingSoonPlaceholder } from '@/components/analyze';

/**
 * AnalyzePage
 * 
 * Analytics dashboard showing productivity metrics and insights.
 * Currently displays quick stats with more detailed analytics coming soon.
 */
export default function AnalyzePage() {
  const { data: todaySessions = [], isLoading: isLoadingSessions } = useTodaySessions();
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();

  // Calculate total tracked time
  const totalTrackedToday = todaySessions.reduce(
    (sum, s) => sum + (s.duration || 0),
    0,
  );

  // Find top task by duration
  const taskDurations = todaySessions.reduce((acc, session) => {
    const taskId = session.task_id;
    acc[taskId] = (acc[taskId] || 0) + (session.duration || 0);
    return acc;
  }, {} as Record<string, number>);

  const topTaskId = Object.entries(taskDurations)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  
  const topTask = tasks.find(t => t.id === topTaskId);

  // Loading state
  if (isLoadingSessions || isLoadingTasks) {
    return (
      <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
        <div className='flex-1 p-4 lg:p-8 flex items-center justify-center'>
          <div className='flex flex-col items-center gap-4'>
            <Loader2 className='w-8 h-8 animate-spin text-primary' />
            <p className='text-muted-foreground'>Loading analytics...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
      <div className='flex-1 p-4 lg:p-8 space-y-6'>
        {/* Quick Stats */}
        <QuickStats
          totalTrackedToday={totalTrackedToday}
          sessionsCount={todaySessions.length}
          topTaskName={topTask?.name || 'None'}
        />

        {/* Coming Soon */}
        <ComingSoonPlaceholder
          title="Analytics Coming Soon"
          description="Detailed analytics and insights are being built. Soon you'll be able to view trends, patterns, and productivity insights."
        />
      </div>
    </main>
  );
}
