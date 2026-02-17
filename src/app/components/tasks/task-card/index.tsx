import { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical, Pencil, Target, ChevronRight } from 'lucide-react';
import { DBTask } from '../types';

interface TaskCardProps {
    task: DBTask;
    viewMode: 'grid' | 'list';
    onEdit: (e: React.MouseEvent) => void;
    onClick: () => void;
    isSortable: boolean;
}

export function TaskCard({
    task,
    viewMode,
    onEdit,
    onClick,
    isSortable,
}: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, disabled: !isSortable });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
    };

    const goalText = useMemo(() => {
        if (!task.goal_type || task.goal_type === 'none') return 'No goal';
        if (task.goal_type === 'daily') return `${task.goal_duration}m/day`;
        if (task.goal_type === 'weekly') return `${task.goal_duration}m/week`;
        if (task.goal_type === 'hour') return `${task.goal_value}h total`;
        if (task.goal_type === 'count') return `${task.goal_value} sessions`;
        return 'No goal';
    }, [task]);

    if (viewMode === 'grid') {
        return (
            <div
                ref={setNodeRef}
                style={style}
                onClick={onClick}
                className={cn(
                    'group relative flex flex-col items-center gap-3 p-6 rounded-2xl bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark card-interactive cursor-pointer text-center',
                    isDragging && 'opacity-50 ring-4 ring-primary ring-inset border-primary'
                )}
            >
                {isSortable && (
                    <div
                        {...attributes}
                        {...listeners}
                        className='absolute top-3 left-3 p-1 rounded-lg hover:bg-muted dark:hover:bg-muted-dark cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity'
                    >
                        <GripVertical className='w-4 h-4 text-muted-foreground' />
                    </div>
                )}
                <div
                    className='w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 border-black/10 dark:border-white/10 shadow-brutal-sm shrink-0'
                    style={{ backgroundColor: task.color }}
                >
                    {task.icon}
                </div>
                <div className='min-w-0 w-full'>
                    <h3 className='font-bold text-lg leading-tight mb-1 truncate w-full'>{task.name}</h3>
                    <p className='text-xs text-muted-foreground'>
                        {goalText}
                    </p>
                </div>
                <button
                    onClick={onEdit}
                    className='absolute top-2 right-2 p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark bg-surface-elevated dark:bg-surface-elevated-dark shadow-brutal-xs dark:shadow-brutal-dark-xs btn-brutal sm:opacity-0 group-hover:opacity-100 transition-opacity'
                    title='Edit task'
                >
                    <Pencil className='w-3 h-3 text-muted-foreground' />
                </button>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onClick}
            className={cn(
                'group flex items-center gap-4 p-4 rounded-xl bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark card-interactive cursor-pointer',
                isDragging && 'opacity-50 ring-4 ring-primary border-primary'
            )}
        >
            {isSortable && (
                <div
                    {...attributes}
                    {...listeners}
                    className='p-1 rounded-lg hover:bg-muted dark:hover:bg-muted-dark cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors'
                >
                    <GripVertical className='w-5 h-5' />
                </div>
            )}

            <div
                className='w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 border-black/10 dark:border-white/10 shadow-brutal-xs shrink-0'
                style={{ backgroundColor: task.color }}
            >
                {task.icon}
            </div>

            <div className='flex-1 min-w-0'>
                <h3 className='font-semibold text-lg truncate'>{task.name}</h3>
                <div className='flex items-center gap-3 mt-1'>
                    <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
                        <Target className='w-3 h-3' />
                        {goalText}
                    </span>
                    {task.task_tags && task.task_tags.length > 0 && (
                        <div className='flex items-center gap-1 overflow-hidden h-5'>
                            {task.task_tags.slice(0, 2).map((tag, i) => (
                                <span key={i} className='text-[10px] px-1.5 py-0 border border-border dark:border-border-dark rounded-md bg-muted dark:bg-muted-dark uppercase font-bold'>
                                    {tag}
                                </span>
                            ))}
                            {task.task_tags.length > 2 && <span className='text-[10px] text-muted-foreground'>+{task.task_tags.length - 2}</span>}
                        </div>
                    )}
                </div>
            </div>

            <div className='flex items-center gap-2'>
                <button
                    onClick={onEdit}
                    className='p-2.5 rounded-lg border-2 border-border-strong dark:border-border-strong-dark bg-surface-elevated dark:bg-surface-elevated-dark shadow-brutal-xs dark:shadow-brutal-dark-xs btn-brutal sm:opacity-0 group-hover:opacity-100 transition-opacity'
                    title='Edit task'
                >
                    <Pencil className='w-4 h-4 text-muted-foreground' />
                </button>
                <ChevronRight className='w-5 h-5 text-muted-foreground/30' />
            </div>
        </div>
    );
}
