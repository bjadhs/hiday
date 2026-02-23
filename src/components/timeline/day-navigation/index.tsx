import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DayNavigationProps {
    selectedDate: Date;
    isMounted: boolean;
    isToday: boolean;
    onPrev: () => void;
    onNext: () => void;
    onToday: () => void;
}

export function DayNavigation({
    selectedDate,
    isMounted,
    isToday,
    onPrev,
    onNext,
    onToday,
}: DayNavigationProps) {
    return (
        <div className='flex items-center justify-between gap-4 flex-shrink-0'>
            <h1 className='text-2xl font-bold tracking-tight'>Timeline</h1>
            <div className='flex items-center gap-2'>
                <button
                    onClick={onPrev}
                    className='p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors'
                >
                    <ChevronLeft className='w-5 h-5' />
                </button>
                <div className='flex flex-col items-center min-w-[140px]'>
                    <span className='font-semibold'>
                        {isMounted
                            ? selectedDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                            })
                            : ''}
                    </span>
                    {!isToday && (
                        <button
                            onClick={onToday}
                            className='text-xs text-primary hover:underline'
                        >
                            Go to today
                        </button>
                    )}
                </div>
                <button
                    onClick={onNext}
                    className='p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors'
                >
                    <ChevronRight className='w-5 h-5' />
                </button>
            </div>
        </div>
    );
}
