'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn, formatDuration } from '@/lib/utils';
import { TimelineSession } from '../types';
import { formatTime } from '../utils';
import { GripVertical } from 'lucide-react';

interface SessionBlockProps {
    session: TimelineSession;
    isDragging?: boolean;
    previewPosition?: { top: number; height: number } | null;
    onClick: () => void;
    onDragStart: (sessionId: string, type: 'move' | 'resize-top' | 'resize-bottom', startY: number) => void;
    onSessionUpdate?: (sessionId: string, updates: { startedAt?: number; endedAt?: number }) => void;
}

// Constants
const RESIZE_HANDLE_HEIGHT = 6;

export function SessionBlock({
    session,
    isDragging,
    previewPosition,
    onClick,
    onDragStart,
    onSessionUpdate
}: SessionBlockProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
    const [now, setNow] = useState(Date.now());
    const blockRef = useRef<HTMLDivElement>(null);

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

    // Handle mouse down for drag/resize
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (!onSessionUpdate || isRunning) return;

        e.preventDefault();
        e.stopPropagation();

        const rect = blockRef.current?.getBoundingClientRect();
        if (!rect) return;

        const relativeY = e.clientY - rect.top;

        // Determine action based on click position
        let action: 'move' | 'resize-top' | 'resize-bottom';
        if (relativeY <= RESIZE_HANDLE_HEIGHT) {
            action = 'resize-top';
            setIsResizing('top');
        } else if (relativeY >= rect.height - RESIZE_HANDLE_HEIGHT) {
            action = 'resize-bottom';
            setIsResizing('bottom');
        } else {
            action = 'move';
        }

        onDragStart(session.id, action, e.clientY);

        const handleMouseUp = () => {
            setIsResizing(null);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mouseup', handleMouseUp);
    }, [onSessionUpdate, session.id, isRunning, onDragStart]);

    // Determine cursor style
    let cursorStyle = 'pointer';
    if (isDragging) cursorStyle = 'grabbing';
    else if (isResizing) cursorStyle = 'ns-resize';
    else if (isHovered && onSessionUpdate && !isRunning) cursorStyle = 'grab';

    // Use preview position if dragging, otherwise use session position
    const top = previewPosition?.top ?? session.top;
    const height = previewPosition?.height ?? session.height;

    return (
        <div
            ref={blockRef}
            className={cn(
                'absolute py-1 px-1.5',
                (isHovered || isDragging) && 'z-10',
                isDragging && 'opacity-30'
            )}
            style={{
                top,
                height,
                left: `${session.left}%`,
                width: `${session.width}%`,
                cursor: cursorStyle,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onMouseDown={handleMouseDown}
            onClick={onClick}
        >
            <div
                className={cn(
                    'h-full rounded-xl border-2 overflow-hidden transition-all',
                    isRunning && 'ring-2 ring-primary ring-offset-2 animate-pulse-soft',
                    isHovered && !isDragging
                        ? 'ring-2 ring-primary/50 shadow-brutal-sm scale-[1.02] z-10'
                        : 'shadow-sm'
                )}
                style={{
                    // User requested brighter background color
                    backgroundColor: `${session.task.color}35`,
                    borderColor: session.task.color,
                }}
            >
                {/* Top resize handle */}
                {onSessionUpdate && !isRunning && (
                    <div
                        className="absolute top-0 left-0 right-0 cursor-ns-resize z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        style={{ height: RESIZE_HANDLE_HEIGHT }}
                    >
                        <div className="w-8 h-1 rounded-full bg-white/50" />
                    </div>
                )}

                {/* Bottom resize handle */}
                {onSessionUpdate && !isRunning && (
                    <div
                        className="absolute bottom-0 left-0 right-0 cursor-ns-resize z-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        style={{ height: RESIZE_HANDLE_HEIGHT }}
                    >
                        <div className="w-8 h-1 rounded-full bg-white/50" />
                    </div>
                )}

                <div className='p-3 h-full flex flex-col gap-2 overflow-hidden'>
                    {/* Top: Icon and Task Name */}
                    <div className='flex items-center gap-3 min-w-0'>
                        <span
                            className='w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border-2 border-black/10 dark:border-white/25 shadow-brutal-xs'
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
                    <div className='mt-auto flex items-end justify-between gap-2 pt-2 border-t border-black/10 dark:border-white/25'>
                        <div className='flex flex-col min-w-0'>
                            <p className='text-[10px] sm:text-xs font-mono font-bold whitespace-nowrap overflow-hidden text-ellipsis'>
                                {formatTime(session.startedAt)} - {isRunning ? 'Now' : formatTime(session.endedAt)}
                            </p>
                            <p className='text-[10px] text-muted-foreground font-medium'>
                                {isRunning ? 'Currently tracking...' : 'Completed'}
                            </p>
                        </div>
                        <p
                            className='text-xs font-black px-2.5 py-1 rounded-lg shrink-0 border-2 border-black/10 dark:border-white/25 shadow-brutal-xs'
                            style={{
                                backgroundColor: 'white',
                                color: 'black'
                            }}
                        >
                            {formatDuration(currentDuration)}
                        </p>
                    </div>

                    {/* Drag hint */}
                    {isHovered && !isDragging && onSessionUpdate && !isRunning && (
                        <div className="absolute top-1 right-1">
                            <GripVertical className="w-3 h-3 text-white/70" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
