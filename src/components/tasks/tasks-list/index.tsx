import {
    DndContext,
    closestCorners,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { TaskCard } from '../task-card';
import { DBTask } from '../types';
import { Activity } from 'lucide-react';

interface TasksListProps {
    sortedTasks: DBTask[];
    orderedTasks: DBTask[];
    viewMode: 'grid' | 'list';
    sortBy: 'name' | 'order' | 'newest';
    onDragEnd: (event: DragEndEvent) => void;
    onEdit: (id: string) => void;
    onAnalytics: (id: string) => void;
    onCreate: () => void;
}

export function TasksList({
    sortedTasks,
    orderedTasks,
    viewMode,
    sortBy,
    onDragEnd,
    onEdit,
    onAnalytics,
    onCreate,
}: TasksListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    return (
        <>
            <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
                <div className={cn(
                    'animate-in fade-in slide-in-from-bottom-6 duration-700',
                    viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6' : 'space-y-4'
                )}>
                    <SortableContext
                        items={sortedTasks.map(t => t.id)}
                        strategy={viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy}
                    >
                        {sortedTasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                viewMode={viewMode}
                                isSortable={sortBy === 'order'}
                                onEdit={(e) => { e.stopPropagation(); onEdit(task.id); }}
                                onClick={() => onAnalytics(task.id)}
                            />
                        ))}
                    </SortableContext>
                </div>
            </DndContext>

            {orderedTasks.length === 0 && (
                <div className='text-center py-24 border-4 border-dashed border-border-strong rounded-[2rem] bg-muted/20 dark:bg-muted/10'>
                    <div className='w-24 h-24 rounded-3xl bg-surface border-4 border-border-strong flex items-center justify-center mx-auto mb-8 shadow-brutal'>
                        <Activity className='w-12 h-12 text-primary' />
                    </div>
                    <h3 className='text-3xl font-black mb-4'>PROTOCOL EMPTY</h3>
                    <p className='text-muted-foreground mb-10 max-w-sm mx-auto font-bold'>
                        Establish your first task blueprint to begin tracking your evolution.
                    </p>
                    <button
                        onClick={onCreate}
                        className='px-10 py-4 rounded-2xl bg-primary text-white text-xl font-black border-4 border-border-strong shadow-brutal btn-brutal'
                    >
                        INITIALIZE
                    </button>
                </div>
            )}
        </>
    );
}
