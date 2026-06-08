import { HistorySession } from '@/lib/types';
import { HistoryTimelineRow } from './history-timeline-row';
import { getSessionsForHour, getUniqueTasks } from './utils';

interface HistoryTimelineViewProps {
    sessions: HistorySession[];
    onEditSession: (session: HistorySession) => void;
}

export function HistoryTimelineView({
    sessions,
    onEditSession,
}: HistoryTimelineViewProps) {
    const hours = Array.from({ length: 25 }, (_, i) => i);

    return (
        <div className='bg-surface border-2 border-border-strong rounded-xl shadow-brutal overflow-hidden'>
            <div className='p-4 lg:p-6 border-b-2 border-border'>
                <h2 className='text-xl font-bold tracking-tight'>Day Timeline</h2>
                <p className='text-sm text-muted-foreground mt-1'>
                    Visual overview of your day from 00:00 to 24:00
                </p>
            </div>

            <div className='overflow-x-auto'>
                <div className='min-w-[600px] p-4 lg:p-6'>
                    {/* Timeline Header */}
                    <div className='flex items-center gap-4 mb-4'>
                        <div className='w-16 flex-shrink-0' />
                        <div className='flex-1 flex items-center justify-between text-xs text-muted-foreground font-mono'>
                            <span>00:00</span>
                            <span>06:00</span>
                            <span>12:00</span>
                            <span>18:00</span>
                            <span>24:00</span>
                        </div>
                    </div>

                    {/* Timeline Grid */}
                    <div className='relative'>
                        {hours.map((hour) => (
                            <HistoryTimelineRow
                                key={hour}
                                hour={hour}
                                sessions={getSessionsForHour(sessions, hour)}
                                onEditSession={onEditSession}
                            />
                        ))}

                        {/* Current Time Indicator */}
                        <CurrentTimeIndicator />
                    </div>

                    {/* Legend */}
                    <div className='mt-6 pt-4 border-t-2 border-border'>
                        <p className='text-sm font-semibold mb-3'>Tasks</p>
                        <div className='flex flex-wrap gap-3'>
                            {getUniqueTasks(sessions).map((task) => (
                                <div key={task.id} className='flex items-center gap-2'>
                                    <div
                                        className='w-4 h-4 rounded border-2 border-black/10 dark:border-white/25 shadow-brutal-xs'
                                        style={{ backgroundColor: task.color }}
                                    />
                                    <span className='text-sm'>{task.icon}</span>
                                    <span className='text-sm text-muted-foreground'>{task.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CurrentTimeIndicator() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const topPosition = currentHour * 56 + (currentMinute / 60) * 56; // 56px per row

    // Only show if within 0-24 hours
    if (currentHour < 0 || currentHour > 23) return null;

    return (
        <div
            className='absolute left-16 right-0 flex items-center pointer-events-none z-20'
            style={{ top: `${topPosition}px` }}
        >
            <div className='w-2 h-2 rounded-full bg-danger-dark dark:bg-danger -ml-1' />
            <div className='flex-1 h-0.5 bg-danger-dark/50 dark:bg-danger/50' />
        </div>
    );
}
