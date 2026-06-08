import { Pencil } from 'lucide-react';
import { HistorySession } from '@/lib/types';
import { formatTime, formatDuration } from '@/lib/utils';

interface HistorySessionItemProps {
    session: HistorySession;
    index: number;
    onEdit: (session: HistorySession) => void;
}

export function HistorySessionItem({
    session,
    index,
    onEdit,
}: HistorySessionItemProps) {
    // Determine display title: use custom title if different from task name
    const displayTitle = session.title || session.task.name;
    const hasCustomTitle = session.title && session.title !== session.task.name;

    return (
        <div
            className='p-4 lg:p-6 hover:bg-surface-elevated transition-colors group cursor-pointer'
            onClick={() => onEdit(session)}
        >
            <div className='flex items-start gap-4'>
                {/* Index */}
                <div className='flex-shrink-0 w-8 h-8 rounded-full bg-surface-elevated border-2 border-border-strong flex items-center justify-center text-sm font-mono text-muted-foreground shadow-brutal-xs'>
                    {index}
                </div>

                {/* Task Icon */}
                <div
                    className='flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2 border-black/10 dark:border-white/25 shadow-brutal-xs'
                    style={{ backgroundColor: session.task.color + '20' }}
                >
                    {session.task.icon}
                </div>

                {/* Content */}
                <div className='flex-1 min-w-0'>
                    <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2'>
                        <div className='min-w-0'>
                            {/* Title - shows custom title if set, otherwise task name */}
                            <div className='flex items-center gap-2 flex-wrap'>
                                <h3 className='font-semibold text-lg'>{displayTitle}</h3>
                                {hasCustomTitle && (
                                    <span
                                        className='inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full'
                                        style={{
                                            backgroundColor: `${session.task.color}20`,
                                            color: session.task.color,
                                        }}
                                    >
                                        {session.task.icon} {session.task.name}
                                    </span>
                                )}
                            </div>

                            {/* Time range */}
                            <p className='text-sm text-muted-foreground'>
                                {session.startedAt ? formatTime(session.startedAt) : '--:--'} -{' '}
                                {session.endedAt ? formatTime(session.endedAt) : 'Ongoing'}
                            </p>
                        </div>

                        <div className='flex items-center gap-3 shrink-0'>
                            {/* Duration Badge */}
                            <div className='px-3 py-1.5 rounded-lg bg-surface-elevated border-2 border-border-strong font-mono text-sm font-semibold shadow-brutal-xs'>
                                {formatDuration(session.duration)}
                            </div>

                            {/* Edit Button - visible on hover */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(session);
                                }}
                                className='opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all border-2 border-transparent hover:border-primary/20'
                                title='Edit session'
                            >
                                <Pencil className='w-4 h-4' />
                            </button>

                            {/* Status Indicator */}
                            <div
                                className='w-3 h-3 rounded-full border border-white/20'
                                style={{ backgroundColor: session.task.color }}
                            />
                        </div>
                    </div>

                    {/* Note */}
                    {session.note && (
                        <div className='mt-2 flex items-start gap-2'>
                            <div className='w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0' />
                            <p className='text-sm text-muted-foreground'>{session.note}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
