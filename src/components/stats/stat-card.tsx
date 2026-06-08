'use client';

import { cn } from '@/lib/utils';
import { StatCardProps } from '@/lib/types';

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: StatCardProps) {
  return (
    <div className='bg-surface border-2 border-border-strong rounded-xl shadow-brutal p-4 card-interactive'>
      <div className='flex items-center gap-3 mb-2'>
        <div className={cn('p-2 rounded-lg', bgColor)}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
        <span className='text-xs text-muted-foreground uppercase tracking-wide font-semibold'>
          {label}
        </span>
      </div>
      <p className='text-2xl font-bold tracking-tight'>{value}</p>
    </div>
  );
}

// Alias for Track page usage
export const QuickStatCard = StatCard;
