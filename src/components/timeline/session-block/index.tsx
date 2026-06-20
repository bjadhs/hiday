'use client';

import { useState, useRef, useCallback } from 'react';
import { cn, formatDuration } from '@/lib/utils';
import { useNow } from '@/lib/hooks/use-now';
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
    const now = useNow(1000);
    const blockRef = useRef<HTMLDivElement>(null);

    const isRunning = session.isRunning;

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
                    backgroundColor: `${session.project.color}35`,
                    borderColor: session.project.color,
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

                <div className='p-2 h-full flex flex-col gap-1 overflow-hidden'>
                    {/* Top: Icon and Project Name */}
                    <div className='flex items-center gap-2 min-w-0'>
                        <span
                            className='w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 border border-black/10 dark:border-white/25'
                            style={{ backgroundColor: session.project.color }} // Solid color icon
                        >
                            <div className="filter drop-shadow-sm">
                                {session.project.icon}
                            </div>
                        </span>
                        <div className='min-w-0 flex-1 flex flex-col'>
                            <span
                                className='text-xs font-black truncate block uppercase tracking-tight'
                                style={{ color: session.project.color }}
                            >
                                {session.project.name}
                            </span>
                            {isRunning && (
                                <span className='text-[9px] font-bold text-primary flex items-center gap-1 uppercase tracking-wider'>
                                    <span className='w-1.5 h-1.5 rounded-full bg-primary animate-pulse' />
                                    Running
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Bottom: Time and Duration */}
                    <div className='mt-auto flex items-center justify-between gap-2 pt-1 border-t border-black/10 dark:border-white/25'>
                        <p className='text-[10px] font-mono font-bold whitespace-nowrap overflow-hidden text-ellipsis min-w-0'>
                            {formatTime(session.startedAt)} - {isRunning ? 'Now' : formatTime(session.endedAt)}
                        </p>
                        <p
                            className='text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 border border-black/10 dark:border-white/25'
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
