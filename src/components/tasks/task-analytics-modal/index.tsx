import { useMemo } from 'react';
import { useTodaySessions } from '@/lib/hooks/use-sessions';
import { formatDuration } from '@/lib/utils';
import { DBTask } from '../types';
import { Loader2, X, Calendar, TrendingUp, Activity, History } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

interface TaskAnalyticsModalProps {
    task: DBTask;
    onClose: () => void;
}

export function TaskAnalyticsModal({
    task,
    onClose,
}: TaskAnalyticsModalProps) {
    const { data: sessions = [], isLoading } = useTodaySessions();

    const stats = useMemo(() => {
        const taskSessions = sessions.filter(s => s.task_id === task.id);
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
        const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

        const todayDuration = taskSessions
            .filter(s => s.started_at >= todayStart)
            .reduce((acc, s) => acc + (s.duration || 0), 0);

        const weekDuration = taskSessions
            .filter(s => (s.started_at || 0) >= weekStart)
            .reduce((acc, s) => acc + (s.duration || 0), 0);

        const monthDuration = taskSessions
            .filter(s => (s.started_at || 0) >= monthStart)
            .reduce((acc, s) => acc + (s.duration || 0), 0);

        return {
            today: formatDuration(todayDuration),
            week: formatDuration(weekDuration),
            month: formatDuration(monthDuration),
            count: taskSessions.length,
        };
    }, [sessions, task.id]);

    return (
        <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
            <DialogContent showCloseButton={false} className='sm:max-w-md p-0 overflow-hidden border-4 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark rounded-3xl shadow-brutal dark:shadow-brutal-dark'>
                <div className='relative p-6 border-b-4 border-border-strong dark:border-border-strong-dark flex items-center gap-4' style={{ backgroundColor: `${task.color}15` }}>
                    <div
                        className='w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 border-black/10 dark:border-white/10 shadow-brutal-sm'
                        style={{ backgroundColor: task.color }}
                    >
                        {task.icon}
                    </div>
                    <div>
                        <DialogTitle className='text-2xl font-bold'>{task.name}</DialogTitle>
                        <DialogDescription className='text-sm text-muted-foreground'>Task Analytics</DialogDescription>
                    </div>
                    <button
                        onClick={onClose}
                        className='absolute top-6 right-6 p-2 rounded-xl bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-xs dark:shadow-brutal-dark-xs hover:bg-muted transition-colors'
                    >
                        <X className='w-5 h-5' />
                    </button>
                </div>

                <div className='p-6 space-y-6'>
                    {isLoading ? (
                        <div className='py-12 flex flex-col items-center gap-3'>
                            <Loader2 className='w-8 h-8 animate-spin text-primary' />
                            <p className='text-sm text-muted-foreground'>Calculating stats...</p>
                        </div>
                    ) : (
                        <>
                            <div className='grid grid-cols-2 gap-4'>
                                <div className='p-4 rounded-2xl border-2 border-border-strong dark:border-border-strong-dark bg-secondary/10 space-y-1 shadow-brutal-xs dark:shadow-brutal-dark-xs'>
                                    <div className='flex items-center gap-2 text-secondary'>
                                        <Calendar className='w-4 h-4' />
                                        <span className='text-xs font-bold uppercase tracking-wider'>Today</span>
                                    </div>
                                    <p className='text-2xl font-black text-foreground'>{stats.today}</p>
                                </div>
                                <div className='p-4 rounded-2xl border-2 border-border-strong dark:border-border-strong-dark bg-primary/10 space-y-1 shadow-brutal-xs dark:shadow-brutal-dark-xs'>
                                    <div className='flex items-center gap-2 text-primary'>
                                        <TrendingUp className='w-4 h-4' />
                                        <span className='text-xs font-bold uppercase tracking-wider'>7 Days</span>
                                    </div>
                                    <p className='text-2xl font-black text-foreground'>{stats.week}</p>
                                </div>
                                <div className='p-4 rounded-2xl border-2 border-border-strong dark:border-border-strong-dark bg-accent/10 space-y-1 shadow-brutal-xs dark:shadow-brutal-dark-xs'>
                                    <div className='flex items-center gap-2 text-accent'>
                                        <Activity className='w-4 h-4' />
                                        <span className='text-xs font-bold uppercase tracking-wider'>30 Days</span>
                                    </div>
                                    <p className='text-2xl font-black text-foreground'>{stats.month}</p>
                                </div>
                                <div className='p-4 rounded-2xl border-2 border-border-strong dark:border-border-strong-dark bg-muted/50 dark:bg-muted/20 space-y-1 shadow-brutal-xs dark:shadow-brutal-dark-xs'>
                                    <div className='flex items-center gap-2 text-muted-foreground'>
                                        <History className='w-4 h-4' />
                                        <span className='text-xs font-bold uppercase tracking-wider'>Sessions</span>
                                    </div>
                                    <p className='text-2xl font-black text-foreground'>{stats.count}</p>
                                </div>
                            </div>

                            <div className='pt-4 border-t-2 border-border/50'>
                                <button
                                    onClick={onClose}
                                    className='w-full py-3 rounded-xl bg-primary text-white font-bold border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark btn-brutal'
                                >
                                    Close Insights
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
