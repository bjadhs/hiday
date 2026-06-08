import { formatTime, formatDuration } from '@/lib/utils';
import { HistorySession } from '@/lib/types';
import { calculateBlockPosition } from './utils';

interface HistoryTimelineRowProps {
    hour: number;
    sessions: HistorySession[];
    onEditSession: (session: HistorySession) => void;
}

export function HistoryTimelineRow({
    hour,
    sessions,
    onEditSession,
}: HistoryTimelineRowProps) {
    const hourLabel = `${hour.toString().padStart(2, '0')}:00`;

    return (
        <div className='flex items-center gap-4 h-14 border-b border-border/50 border-border/50'>
            {/* Hour Label */}
            <div className='w-16 flex-shrink-0 text-sm text-muted-foreground font-mono'>
                {hourLabel}
            </div>

            {/* Hour Cell */}
            <div className='flex-1 relative h-full'>
                {/* Hour background grid lines */}
                <div className='absolute inset-0 flex'>
                    <div className='flex-1 border-r border-border/30 border-border/30' />
                    <div className='flex-1 border-r border-border/30 border-border/30' />
                    <div className='flex-1 border-r border-border/30 border-border/30' />
                    <div className='flex-1' />
                </div>

                {/* Task Blocks */}
                {sessions.filter(s => s.startedAt !== null).map((session) => {
                    const { left, width } = calculateBlockPosition(
                        session.startedAt!,
                        session.endedAt,
                        hour
                    );

                    return (
                        <div
                            key={session.id}
                            onClick={() => onEditSession(session)}
                            className='absolute top-1 bottom-1 rounded-md border-2 border-black/20 dark:border-white/20 shadow-brutal-xs hover:shadow-brutal-sm hover:shadow-brutal-dark-sm hover:scale-[1.02] transition-all cursor-pointer group'
                            style={{
                                left: `${left}%`,
                                width: `${width}%`,
                                backgroundColor: session.task.color,
                            }}
                            title={`${session.task.name}: ${session.startedAt ? formatTime(
                                session.startedAt
                            ) : '--:--'} - ${session.endedAt ? formatTime(session.endedAt) : 'Ongoing'}`}
                        >
                            {/* Tooltip */}
                            <div className='absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-surface border-2 border-border-strong rounded-lg shadow-brutal opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 whitespace-nowrap'>
                                <div className='flex items-center gap-2'>
                                    <span>{session.task.icon}</span>
                                    <span className='font-semibold'>
                                        {session.title || session.task.name}
                                    </span>
                                    {session.title && session.title !== session.task.name && (
                                        <span className='text-xs text-muted-foreground'>
                                            ({session.task.name})
                                        </span>
                                    )}
                                </div>
                                {session.note && (
                                    <div className='text-xs text-muted-foreground mt-1 max-w-[200px] truncate'>
                                        {session.note}
                                    </div>
                                )}
                                <div className='text-xs text-muted-foreground mt-1'>
                                    {session.startedAt ? formatTime(session.startedAt) : '--:--'} -{' '}
                                    {session.endedAt ? formatTime(session.endedAt) : 'Ongoing'} (
                                    {formatDuration(session.duration)})
                                </div>
                                <div className='text-xs text-primary mt-1 pt-1 border-t border-border'>
                                    Click to edit
                                </div>
                            </div>

                            {/* Block Label (if wide enough) */}
                            {width > 15 && (
                                <div className='absolute inset-0 flex items-center px-2 overflow-hidden'>
                                    <span className='text-xs font-semibold text-white truncate drop-shadow-md'>
                                        {session.title || session.task.name}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
