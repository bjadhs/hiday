import { useState, useEffect } from 'react';
import { cn, formatDuration } from '@/lib/utils';
import { TimelineSession } from '../types';
import { formatTime } from '../utils';

interface SessionBlockProps {
    session: TimelineSession;
    onClick: () => void;
}

export function SessionBlock({ session, onClick }: SessionBlockProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [now, setNow] = useState(Date.now());

    // Check if session is actually running based on source data
    const isRunning = session.isRunning;

    useEffect(() => {
        if (isRunning) {
            const interval = setInterval(() => setNow(Date.now()), 1000);
            return () => clearInterval(interval);
        }
    }, [isRunning]);

    const currentDuration = isRunning
        ? Math.floor((now - session.startedAt) / 1000)
        : session.duration;

    return (
        <div
            className='absolute py-1 px-1.5'
            style={{
                top: session.top,
                height: session.height,
                left: `${session.left}%`,
                width: `${session.width}%`,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            <div
                className={cn(
                    'h-full rounded-xl border-2 overflow-hidden cursor-pointer transition-all',
                    isRunning && 'ring-2 ring-primary ring-offset-2 animate-pulse-soft',
                    isHovered
                        ? 'ring-2 ring-primary/50 shadow-brutal-sm dark:shadow-brutal-dark-sm scale-[1.02] z-10'
                        : 'shadow-sm'
                )}
                style={{
                    // User requested brighter background color
                    backgroundColor: `${session.task.color}35`,
                    borderColor: session.task.color,
                }}
            >
                <div className='p-3 h-full flex flex-col gap-2 overflow-hidden'>
                    {/* Top: Icon and Task Name */}
                    <div className='flex items-center gap-3 min-w-0'>
                        <span
                            className='w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border-2 border-black/10 dark:border-white/10 shadow-brutal-xs'
                            style={{ backgroundColor: session.task.color }} // Solid color icon
                        >
                            <div className="filter drop-shadow-sm">
                                {session.task.icon}
                            </div>
                        </span>
                        <div className='min-w-0 flex-1 flex flex-col'>
                            <span
                                className='text-sm font-black truncate block uppercase tracking-tight'
                                style={{ color: session.task.color }}
                            >
                                {session.task.name}
                            </span>
                            {isRunning && (
                                <span className='text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-wider mt-0.5'>
                                    <span className='w-1.5 h-1.5 rounded-full bg-primary animate-pulse' />
                                    Running
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Middle: Session Title (if any) */}
                    <div className='min-w-0'>
                        <p className={cn(
                            'text-sm font-bold truncate leading-tight',
                            session.title && session.title !== session.task.name
                                ? 'text-foreground dark:text-foreground'
                                : 'text-muted-foreground/50 italic'
                        )}>
                            {session.title && session.title !== session.task.name
                                ? session.title
                                : 'Untitled Session'}
                        </p>
                    </div>

                    {/* Bottom: Time and Duration */}
                    <div className='mt-auto flex items-end justify-between gap-2 pt-2 border-t border-black/10 dark:border-white/10'>
                        <div className='flex flex-col min-w-0'>
                            <p className='text-[10px] sm:text-xs font-mono font-bold whitespace-nowrap overflow-hidden text-ellipsis'>
                                {formatTime(session.startedAt)} - {isRunning ? 'Now' : formatTime(session.endedAt)}
                            </p>
                            <p className='text-[10px] text-muted-foreground font-medium'>
                                {isRunning ? 'Currently tracking...' : 'Completed'}
                            </p>
                        </div>
                        <p
                            className='text-xs font-black px-2.5 py-1 rounded-lg shrink-0 border-2 border-black/10 shadow-brutal-xs'
                            style={{
                                backgroundColor: 'white',
                                color: 'black'
                            }}
                        >
                            {formatDuration(currentDuration)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
