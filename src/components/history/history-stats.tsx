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
                color='text-success'
                bgColor='bg-success-bg'
            />
            <StatCard
                label='Active Projects'
                value={new Set(sessions.map((s) => s.projectId)).size.toString()}
                icon={Square}
                color='text-info'
                bgColor='bg-info-bg'
            />
            <StatCard
                label='Longest Session'
                value={formatLongestSession(sessions)}
                icon={MoreHorizontal}
                color='text-warning'
                bgColor='bg-warning-bg'
            />
        </div>
    );
}
