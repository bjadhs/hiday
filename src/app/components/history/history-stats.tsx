import { Play, Clock, Square, MoreHorizontal } from 'lucide-react';
import { StatCard } from '@/components/stats/stat-card';
import { HistorySession } from '@/lib/types';
import { formatTotalDuration, formatLongestSession } from './utils';

interface HistoryStatsProps {
    sessions: HistorySession[];
}

export function HistoryStats({ sessions }: HistoryStatsProps) {
    return (
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
    );
}
