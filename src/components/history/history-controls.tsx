import { ChevronLeft, ChevronRight, List, CalendarDays } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { ViewMode } from '@/lib/types';
import { isToday } from './utils';

interface HistoryControlsProps {
    selectedDate: Date;
    viewMode: ViewMode;
    onNavigateDate: (days: number) => void;
    onSetViewMode: (mode: ViewMode) => void;
    onGoToToday: () => void;
}

export function HistoryControls({
    selectedDate,
    viewMode,
    onNavigateDate,
    onSetViewMode,
    onGoToToday,
}: HistoryControlsProps) {
    return (
        <div className='bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark rounded-xl shadow-brutal dark:shadow-brutal-dark p-4 lg:p-6'>
            <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                {/* Date Navigation */}
                <div className='flex items-center gap-3'>
                    <button
                        onClick={() => onNavigateDate(-1)}
                        className='p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors shadow-brutal-xs btn-brutal'
                    >
                        <ChevronLeft className='w-5 h-5' />
                    </button>

                    <div className='flex flex-col items-center min-w-[140px]'>
                        <span className='text-lg font-bold'>{formatDate(selectedDate)}</span>
                        {!isToday(selectedDate) && (
                            <button
                                onClick={onGoToToday}
                                className='text-xs text-primary hover:underline font-medium'
                            >
                                Go to today
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => onNavigateDate(1)}
                        className='p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors shadow-brutal-xs btn-brutal'
                    >
                        <ChevronRight className='w-5 h-5' />
                    </button>
                </div>

                {/* View Toggle */}
                <div className='flex items-center gap-1 p-1 bg-surface-elevated dark:bg-surface-elevated-dark rounded-lg border-2 border-border dark:border-border-dark shadow-brutal-xs dark:shadow-brutal-dark-xs'>
                    <button
                        onClick={() => onSetViewMode('list')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all',
                            viewMode === 'list'
                                ? 'bg-primary text-white shadow-brutal-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <List className='w-4 h-4' />
                        <span className='hidden sm:inline'>List</span>
                    </button>
                    <button
                        onClick={() => onSetViewMode('timeline')}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-md font-semibold transition-all',
                            viewMode === 'timeline'
                                ? 'bg-primary text-white shadow-brutal-xs'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        <CalendarDays className='w-4 h-4' />
                        <span className='hidden sm:inline'>Timeline</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
