'use client';

import { Clock, Target, TrendingUp, MoreHorizontal } from 'lucide-react';
import { QuickStatCard } from '@/components/stats/stat-card';
import { formatDuration } from '@/lib/utils';

interface QuickStatsProps {
  totalTrackedToday: number;
  sessionsCount: number;
  topTaskName: string;
}

/**
 * QuickStats
 * 
 * Displays a grid of quick statistics cards showing:
 * - Today's total tracked time
 * - Number of sessions
 * - Goal progress percentage
 * - Top task by duration
 * 
 * @example
 * ```tsx
 * <QuickStats
 *   totalTrackedToday={14400}
 *   sessionsCount={5}
 *   topTaskName="Coding"
 * />
 * ```
 */
export function QuickStats({ 
  totalTrackedToday, 
  sessionsCount, 
  topTaskName 
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
        color='text-success-dark dark:text-success'
        bgColor='bg-success-bg dark:bg-success-bg-dark'
      />
      <QuickStatCard
        label='Goal Progress'
        value={`${goalProgress}%`}
        icon={TrendingUp}
        color='text-info-dark dark:text-info'
        bgColor='bg-blue-100 dark:bg-blue-900/30'
      />
      <QuickStatCard
        label='Top Task'
        value={topTaskName || 'None'}
        icon={MoreHorizontal}
        color='text-purple-500'
        bgColor='bg-purple-100 dark:bg-purple-900/30'
      />
    </div>
  );
}
