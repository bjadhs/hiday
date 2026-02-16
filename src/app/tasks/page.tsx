'use client';

import { useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Task } from '@/lib/types';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/lib/hooks/use-tasks';
import { TASK_ICONS, TASK_COLORS } from '@/lib/constant';
import { cn } from '@/lib/utils';
import {
  Pencil,
  Plus,
  ArrowLeft,
  Check,
  X,
  Trash2,
  Target,
  Clock,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

// Loading fallback
function TasksPageLoading() {
  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
      <div className='flex-1 p-4 lg:p-8 max-w-3xl mx-auto w-full'>
        <div className='animate-pulse space-y-4'>
          <div className='h-8 w-32 bg-muted rounded' />
          <div className='h-20 bg-muted rounded-xl' />
          <div className='h-20 bg-muted rounded-xl' />
        </div>
      </div>
    </main>
  );
}

// Main page with Suspense
export default function TasksPage() {
  return (
    <Suspense fallback={<TasksPageLoading />}>
      <TasksPageContent />
    </Suspense>
  );
}

// Extended task type with goal settings
type EditableTask = Task & {
  goalType?: 'daily' | 'weekly' | 'none';
};

function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  // Fetch tasks using React Query
  const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  
  const [isCreating, setIsCreating] = useState(false);

  // Find task being edited
  const editingTask = editId && editId !== 'new'
    ? tasks.find((t) => t.id === editId) || null
    : null;

  const handleSaveTask = useCallback(
    async (updatedTask: EditableTask) => {
      const isNew = isCreating || editId === 'new' || !tasks.find(t => t.id === updatedTask.id);
      
      try {
        if (isNew) {
          await createTaskMutation.mutateAsync({
            name: updatedTask.name,
            icon: updatedTask.icon,
            color: updatedTask.color,
            goal_duration: updatedTask.goalDuration || null,
            goal_type: updatedTask.goalDuration ? 'daily' : 'none',
            archived: false,
            sort_order: tasks.length,
          });
        } else {
          await updateTaskMutation.mutateAsync({
            id: updatedTask.id,
            updates: {
              name: updatedTask.name,
              icon: updatedTask.icon,
              color: updatedTask.color,
              goal_duration: updatedTask.goalDuration || null,
              goal_type: updatedTask.goalDuration ? 'daily' : 'none',
            },
          });
        }
        
        // Close edit mode
        router.push('/tasks');
        setIsCreating(false);
      } catch (error) {
        console.error('Failed to save task:', error);
      }
    },
    [router, isCreating, editId, tasks, createTaskMutation, updateTaskMutation]
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

  const handleCreateNew = () => {
    setIsCreating(true);
    router.push('/tasks?edit=new');
  };

  // Loading state
  if (isLoadingTasks) {
    return (
      <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
        <div className='flex-1 p-4 lg:p-8 max-w-3xl mx-auto w-full flex items-center justify-center'>
          <div className='flex flex-col items-center gap-4'>
            <Loader2 className='w-8 h-8 animate-spin text-primary' />
            <p className='text-muted-foreground'>Loading tasks...</p>
          </div>
        </div>
      </main>
    );
  }

  // Show edit form
  if (editId || isCreating) {
    const isNew = isCreating || editId === 'new';
    const taskToEdit = isNew
      ? {
          id: `new-${Date.now()}`,
          name: '',
          color: TASK_COLORS[0],
          icon: TASK_ICONS[0],
          goalDuration: undefined,
          goalType: 'none' as const,
        }
      : editingTask;

    if (!isNew && !taskToEdit) {
      return (
        <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
          <div className='flex-1 p-4 lg:p-8 max-w-3xl mx-auto w-full'>
            <div className='text-center py-12'>
              <p className='text-muted-foreground'>Task not found</p>
              <Link
                href='/tasks'
                className='mt-4 inline-flex items-center gap-2 text-primary hover:underline'
              >
                <ArrowLeft className='w-4 h-4' />
                Back to Tasks
              </Link>
            </div>
          </div>
        </main>
      );
    }

    return (
      <TaskEditForm
        task={taskToEdit as EditableTask}
        isNew={isNew}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        onCancel={() => {
          router.push('/tasks');
          setIsCreating(false);
        }}
        isSaving={createTaskMutation.isPending || updateTaskMutation.isPending}
        isDeleting={deleteTaskMutation.isPending}
      />
    );
  }

  // Show task list
  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
      <div className='flex-1 p-4 lg:p-8 max-w-3xl mx-auto w-full space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Tasks</h1>
            <p className='text-muted-foreground text-sm mt-1'>
              Manage your tracking tasks
            </p>
          </div>
          <button
            onClick={handleCreateNew}
            className='flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold border-2 border-border-strong dark:border-white/20 shadow-brutal-sm btn-brutal'
          >
            <Plus className='w-4 h-4' />
            <span>New Task</span>
          </button>
        </div>

        {/* Task List */}
        <div className='space-y-3'>
          {tasks.map((task) => (
            <TaskListItem
              key={task.id}
              task={task as EditableTask}
              onEdit={() => router.push(`/tasks?edit=${task.id}`)}
            />
          ))}
        </div>

        {tasks.length === 0 && (
          <div className='text-center py-12 border-2 border-dashed border-border-strong dark:border-border-strong-dark rounded-xl'>
            <p className='text-muted-foreground'>No tasks yet</p>
            <button
              onClick={handleCreateNew}
              className='mt-4 text-primary hover:underline font-medium'
            >
              Create your first task
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// Task List Item Component
function TaskListItem({
  task,
  onEdit,
}: {
  task: EditableTask;
  onEdit: () => void;
}) {
  return (
    <div className='group flex items-center gap-4 p-4 rounded-xl bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark card-interactive'>
      {/* Task Icon */}
      <div
        className='w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 border-black/10 shadow-brutal-xs shrink-0'
        style={{ backgroundColor: task.color }}
      >
        {task.icon}
      </div>

      {/* Task Info */}
      <div className='flex-1 min-w-0'>
        <h3 className='font-semibold text-lg truncate'>{task.name}</h3>
        <div className='flex items-center gap-3 mt-1'>
          {task.goalDuration ? (
            <span className='inline-flex items-center gap-1 text-xs text-muted-foreground'>
              <Target className='w-3 h-3' />
              {task.goalDuration} min/day
            </span>
          ) : (
            <span className='text-xs text-muted-foreground'>No goal set</span>
          )}
        </div>
      </div>

      {/* Edit Button */}
      <button
        onClick={onEdit}
        className='p-2.5 rounded-lg border-2 border-border-strong dark:border-border-strong-dark bg-surface-elevated dark:bg-surface-elevated-dark shadow-brutal-xs dark:shadow-brutal-dark-xs btn-brutal opacity-0 group-hover:opacity-100 transition-opacity'
        title='Edit task'
      >
        <Pencil className='w-4 h-4 text-muted-foreground' />
      </button>
    </div>
  );
}

// Task Edit Form Component
function TaskEditForm({
  task,
  isNew,
  onSave,
  onDelete,
  onCancel,
  isSaving,
  isDeleting,
}: {
  task: EditableTask;
  isNew: boolean;
  onSave: (task: EditableTask) => void;
  onDelete: (taskId: string) => void;
  onCancel: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [formData, setFormData] = useState<EditableTask>({ ...task });
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hasGoal, setHasGoal] = useState(!!task.goalDuration);

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave({
      ...formData,
      goalDuration: hasGoal ? formData.goalDuration || 30 : undefined,
    });
  };

  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
      <div className='flex-1 p-4 lg:p-8 max-w-2xl mx-auto w-full space-y-6'>
        {/* Header */}
        <div className='flex items-center gap-4'>
          <button
            onClick={onCancel}
            disabled={isSaving || isDeleting}
            className='p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark shadow-brutal-xs dark:shadow-brutal-dark-xs btn-brutal disabled:opacity-50'
          >
            <ArrowLeft className='w-5 h-5' />
          </button>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              {isNew ? 'New Task' : 'Edit Task'}
            </h1>
          </div>
        </div>

        {/* Form */}
        <div className='space-y-6'>
          {/* Preview Card */}
          <div className='p-6 rounded-xl bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark'>
            <p className='text-xs text-muted-foreground uppercase tracking-wide font-medium mb-4'>
              Preview
            </p>
            <div className='flex items-center gap-4'>
              <div
                className='w-16 h-16 rounded-xl flex items-center justify-center text-3xl border-2 border-black/10 shadow-brutal-sm'
                style={{ backgroundColor: formData.color }}
              >
                {formData.icon}
              </div>
              <div>
                <h3 className='text-xl font-bold'>
                  {formData.name || 'Task Name'}
                </h3>
                <span
                  className='inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1'
                  style={{
                    backgroundColor: `${formData.color}20`,
                    color: formData.color,
                  }}
                >
                  {formData.icon} {formData.name || 'Task'}
                </span>
              </div>
            </div>
          </div>

          {/* Task Name */}
          <div className='space-y-2'>
            <Label htmlFor='task-name' className='text-base font-semibold'>
              Task Name
            </Label>
            <Input
              id='task-name'
              type='text'
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder='e.g., Coding, Gym, Reading'
              className='h-12 text-lg border-2 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark rounded-lg focus:ring-2 focus:ring-primary/20'
            />
          </div>

          {/* Icon Picker */}
          <div className='space-y-3'>
            <Label className='text-base font-semibold'>Icon</Label>
            <div className='flex flex-wrap gap-2'>
              {TASK_ICONS.slice(0, showIconPicker ? undefined : 20).map(
                (icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                    className={cn(
                      'w-10 h-10 rounded-lg text-xl flex items-center justify-center border-2 transition-all btn-brutal',
                      formData.icon === icon
                        ? 'bg-primary/10 border-primary shadow-brutal-colored'
                        : 'bg-surface dark:bg-surface-dark border-border-strong dark:border-border-strong-dark shadow-brutal-xs dark:shadow-brutal-dark-xs hover:border-primary/50'
                    )}
                  >
                    {icon}
                  </button>
                )
              )}
              {!showIconPicker && (
                <button
                  onClick={() => setShowIconPicker(true)}
                  className='w-10 h-10 rounded-lg flex items-center justify-center border-2 border-dashed border-border-strong dark:border-border-strong-dark text-muted-foreground hover:border-primary hover:text-primary transition-colors'
                >
                  <Plus className='w-4 h-4' />
                </button>
              )}
            </div>
          </div>

          {/* Color Picker */}
          <div className='space-y-3'>
            <Label className='text-base font-semibold'>Color</Label>
            <div className='flex flex-wrap gap-2'>
              {TASK_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  className={cn(
                    'w-10 h-10 rounded-lg border-2 transition-all btn-brutal',
                    formData.color === color
                      ? 'border-foreground dark:border-foreground-dark scale-110 shadow-brutal-sm'
                      : 'border-transparent hover:scale-105'
                  )}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Goal Settings */}
          <div className='p-4 rounded-xl bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark space-y-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Target className='w-5 h-5 text-primary' />
                <Label className='text-base font-semibold'>Daily Goal</Label>
              </div>
              <Switch
                checked={hasGoal}
                onCheckedChange={setHasGoal}
              />
            </div>

            {hasGoal && (
              <div className='pt-2 border-t-2 border-border dark:border-border-dark space-y-3'>
                <div className='flex items-center gap-3'>
                  <Clock className='w-4 h-4 text-muted-foreground' />
                  <div className='flex items-center gap-2'>
                    <Input
                      type='number'
                      value={formData.goalDuration || 30}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          goalDuration: parseInt(e.target.value) || 0,
                        }))
                      }
                      min={1}
                      max={1440}
                      className='w-20 h-10 text-center border-2 border-border-strong dark:border-border-strong-dark'
                    />
                    <span className='text-muted-foreground'>minutes</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className='flex items-center gap-3 pt-4'>
            <button
              onClick={handleSave}
              disabled={!formData.name.trim() || isSaving}
              className='flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold border-2 border-border-strong dark:border-white/20 shadow-brutal btn-brutal disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isSaving ? (
                <Loader2 className='w-5 h-5 animate-spin' />
              ) : (
                <Check className='w-5 h-5' />
              )}
              {isNew ? 'Create Task' : 'Save Changes'}
            </button>

            {!isNew && (
              <button
                onClick={() => onDelete(task.id)}
                disabled={isDeleting}
                className='flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-danger dark:bg-danger-dark text-white font-semibold border-2 border-border-strong dark:border-white/20 shadow-brutal btn-brutal disabled:opacity-50'
                title='Delete task'
              >
                {isDeleting ? (
                  <Loader2 className='w-5 h-5 animate-spin' />
                ) : (
                  <Trash2 className='w-5 h-5' />
                )}
              </button>
            )}

            <button
              onClick={onCancel}
              disabled={isSaving || isDeleting}
              className='flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-surface dark:bg-surface-dark text-foreground dark:text-foreground-dark font-semibold border-2 border-border-strong dark:border-border-strong-dark shadow-brutal btn-brutal disabled:opacity-50'
            >
              <X className='w-5 h-5' />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
