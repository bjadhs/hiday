import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useReorderTasks } from '@/lib/hooks/use-tasks';
import { DBTask, EditableTask } from '@/app/components/tasks/types';
import { TASK_COLORS, TASK_ICONS } from '@/lib/constant';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export function useTasksPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const analyticsId = searchParams.get('analytics');

    const { data: tasksData = [], isLoading: isLoadingTasks } = useTasks();
    const createTaskMutation = useCreateTask();
    const updateTaskMutation = useUpdateTask();
    const deleteTaskMutation = useDeleteTask();
    const reorderTasksMutation = useReorderTasks();

    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [sortBy, setSortBy] = useState<'name' | 'order' | 'newest'>('order');
    const [orderedTasks, setOrderedTasks] = useState<DBTask[]>([]);

    useEffect(() => {
        if (tasksData.length > 0) {
            setOrderedTasks([...tasksData]);
        }
    }, [tasksData]);

    const editingTask = useMemo(() =>
        editId && editId !== 'new' ? orderedTasks.find((t) => t.id === editId) : null
        , [editId, orderedTasks]);

    const analyzingTask = useMemo(() =>
        analyticsId ? orderedTasks.find((t) => t.id === analyticsId) : null
        , [analyticsId, orderedTasks]);

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            if (over && active.id !== over.id) {
                const oldIndex = orderedTasks.findIndex((t) => t.id === active.id);
                const newIndex = orderedTasks.findIndex((t) => t.id === over.id);
                const newOrder = arrayMove(orderedTasks, oldIndex, newIndex);
                setOrderedTasks(newOrder);
                try {
                    await reorderTasksMutation.mutateAsync(newOrder.map((t) => ({ id: t.id, name: t.name })));
                } catch (error) {
                    console.error('Failed to reorder tasks:', error);
                    setOrderedTasks(tasksData);
                }
            }
        },
        [orderedTasks, reorderTasksMutation, tasksData]
    );

    const handleSaveTask = useCallback(
        async (updatedTask: EditableTask) => {
            try {
                if (!updatedTask.id || updatedTask.id.startsWith('new-')) {
                    const { id, ...cleanTask } = updatedTask;
                    await createTaskMutation.mutateAsync({
                        ...cleanTask,
                        archived: false,
                        sort_order: -1, // Ensure new tasks come first
                    } as any);
                } else {
                    const { id, ...updates } = updatedTask;
                    await updateTaskMutation.mutateAsync({ id: id!, updates: updates as any });
                }
                router.push('/tasks');
                setIsCreating(false);
            } catch (error) {
                console.error('Failed to save task:', error);
            }
        },
        [router, createTaskMutation, updateTaskMutation]
    );

    const handleDeleteTask = useCallback(
        async (taskId: string) => {
            try {
                await deleteTaskMutation.mutateAsync(taskId);
                router.push('/tasks');
            } catch (error) {
                console.error('Failed to delete task:', error);
            }
        },
        [router, deleteTaskMutation]
    );

    const sortedTasks = useMemo(() => {
        if (sortBy === 'order') return orderedTasks;
        return [...orderedTasks].sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'newest') return (b.created_at || 0) - (a.created_at || 0);
            return (a.sort_order || 0) - (b.sort_order || 0);
        });
    }, [orderedTasks, sortBy]);

    const newInitialTask: EditableTask = {
        name: '',
        color: TASK_COLORS[0],
        icon: TASK_ICONS[0],
        goal_duration: 30,
        goal_type: 'none',
        task_tags: [],
        note_prompt: false,
        default_note: '',
    };

    return {
        isLoadingTasks,
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        orderedTasks,
        sortedTasks,
        editingTask,
        analyzingTask,
        isCreating,
        setIsCreating,
        editId,
        newInitialTask,
        isSaving: createTaskMutation.isPending || updateTaskMutation.isPending,
        isDeleting: deleteTaskMutation.isPending,
        handleDragEnd,
        handleSaveTask,
        handleDeleteTask,
        router,
    };
}
