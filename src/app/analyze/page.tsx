'use client';

import { Loader2 } from 'lucide-react';
import { useTodaySessions } from '@/lib/hooks/use-sessions';
import { useProjects } from '@/lib/hooks/use-projects';
import { QuickStats, ComingSoonPlaceholder } from '@/components/analyze';

/**
 * AnalyzePage
 * 
 * Analytics dashboard showing productivity metrics and insights.
 * Currently displays quick stats with more detailed analytics coming soon.
 */
export default function AnalyzePage() {
  const { data: todaySessions = [], isLoading: isLoadingSessions } = useTodaySessions();
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();

  // Calculate total tracked time
  const totalTrackedToday = todaySessions.reduce(
    (sum, s) => sum + (s.duration || 0),
    0,
  );

  // Find top project by duration (skip sessions without a project)
  const projectDurations = todaySessions.reduce((acc, session) => {
    const projectId = session.project_id;
    if (!projectId) return acc;
    acc[projectId] = (acc[projectId] || 0) + (session.duration || 0);
    return acc;
  }, {} as Record<string, number>);

  const topProjectId = Object.entries(projectDurations)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  
  const topProject = projects.find(t => t.id === topProjectId);

  // Loading state
  if (isLoadingSessions || isLoadingProjects) {
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
          topProjectName={topProject?.name || 'None'}
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
