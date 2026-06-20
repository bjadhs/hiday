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
    // Determine display title: use custom title if different from project name
    const displayTitle = session.title || session.project.name;
    const hasCustomTitle = session.title && session.title !== session.project.name;

    return (
        <div
            className='px-4 py-2.5 hover:bg-surface-elevated transition-colors group cursor-pointer'
            onClick={() => onEdit(session)}
        >
            <div className='flex items-center gap-3'>
                {/* Index */}
                <div className='flex-shrink-0 w-5 h-5 rounded-full bg-surface-elevated border border-border-strong flex items-center justify-center text-[10px] font-mono text-muted-foreground'>
                    {index}
                </div>

                {/* Project Icon */}
                <div
                    className='flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-base border border-black/10 dark:border-white/25'
                    style={{ backgroundColor: session.project.color + '20' }}
                >
                    {session.project.icon}
                </div>

                {/* Content */}
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                        <h3 className='font-semibold text-sm truncate'>{displayTitle}</h3>
                        {hasCustomTitle && (
                            <span
                                className='inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full shrink-0'
                                style={{
                                    backgroundColor: `${session.project.color}20`,
                                    color: session.project.color,
                                }}
                            >
                                {session.project.icon} {session.project.name}
                            </span>
                        )}
                    </div>
                    {/* Time range + optional note (compact, single line) */}
                    <p className='text-xs text-muted-foreground truncate'>
                        {session.startedAt ? formatTime(session.startedAt) : '--:--'} -{' '}
                        {session.endedAt ? formatTime(session.endedAt) : 'Ongoing'}
                        {session.note && <span className='text-muted-foreground/70'> · {session.note}</span>}
                    </p>
                </div>

                {/* Duration + actions */}
                <div className='flex items-center gap-2 shrink-0'>
                    <div className='px-2 py-1 rounded-md bg-surface-elevated border border-border-strong font-mono text-xs font-semibold'>
                        {formatDuration(session.duration)}
                    </div>

                    {/* Edit Button - visible on hover */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(session);
                        }}
                        className='opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all'
                        title='Edit session'
                    >
                        <Pencil className='w-3.5 h-3.5' />
                    </button>

                    {/* Status Indicator */}
                    <div
                        className='w-2.5 h-2.5 rounded-full border border-white/20'
                        style={{ backgroundColor: session.project.color }}
                    />
                </div>
            </div>
        </div>
    );
}
