'use client';

import { Clock, Target, TrendingUp, MoreHorizontal } from 'lucide-react';
import { QuickStatCard } from '@/components/stats/stat-card';
import { formatDuration } from '@/lib/utils';

interface QuickStatsProps {
  totalTrackedToday: number;
  sessionsCount: number;
  topProjectName: string;
}

/**
 * QuickStats
 * 
 * Displays a grid of quick statistics cards showing:
 * - Today's total tracked time
 * - Number of sessions
 * - Goal progress percentage
 * - Top project by duration
 * 
 * @example
 * ```tsx
 * <QuickStats
 *   totalTrackedToday={14400}
 *   sessionsCount={5}
 *   topProjectName="Coding"
 * />
 * ```
 */
export function QuickStats({ 
  totalTrackedToday, 
  sessionsCount, 
  topProjectName 
}: QuickStatsProps) {
  // Calculate goal progress (assuming 4 hour goal)
  const goalProgress = Math.min(
    Math.round((totalTrackedToday / (4 * 60 * 60)) * 100), 
    100
  );

  return (
    <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
      <QuickStatCard
        label="Today's Total"
        value={formatDuration(totalTrackedToday)}
        icon={Clock}
        color='text-primary'
        bgColor='bg-primary/10'
      />
      <QuickStatCard
        label='Sessions'
        value={sessionsCount.toString()}
        icon={Target}
        color='text-success'
        bgColor='bg-success-bg'
      />
      <QuickStatCard
        label='Goal Progress'
        value={`${goalProgress}%`}
        icon={TrendingUp}
        color='text-info'
        bgColor='bg-info-bg'
      />
      <QuickStatCard
        label='Top Project'
        value={topProjectName || 'None'}
        icon={MoreHorizontal}
        color='text-primary'
        bgColor='bg-primary/10'
      />
    </div>
  );
}
