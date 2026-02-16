'use client';

import { useState, useCallback, Suspense, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Task, Session } from '@/lib/types';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, useReorderTasks } from '@/lib/hooks/use-tasks';
import { useTodaySessions } from '@/lib/hooks/use-sessions';
import { TASK_ICONS, TASK_COLORS } from '@/lib/constant';
import { cn, formatDuration } from '@/lib/utils';
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
  LayoutGrid,
  List,
  ArrowUpDown,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  History,
  Activity,
  Calendar,
  Tag as TagIcon,
  StickyNote,
  BellRing,
  GripVertical,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

// DND Kit Imports
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Using Database type directly to avoid name collisions and property mapping issues
import type { Database } from '@/lib/supabase/database.types';
type DBTask = Database['public']['Tables']['tasks']['Row'];
type EditableTask = Omit<Database['public']['Tables']['tasks']['Insert'], 'user_id' | 'created_at' | 'updated_at'> & { id?: string };

// --- Components ---

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

// Task Card Component
function TaskCard({
  task,
  viewMode,
  onEdit,
  onClick,
  isSortable,
}: {
  task: DBTask;
  viewMode: 'grid' | 'list';
  onEdit: (e: React.MouseEvent) => void;
  onClick: () => void;
  isSortable: boolean;
}) {
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

// Analytics Modal (same as before)
// Analytics Modal
function TaskAnalyticsModal({
  task,
  onClose,
}: {
  task: DBTask;
  onClose: () => void;
}) {
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

// Tag Input Component
function TagInput({
  tags,
  onChange
}: {
  tags: string[];
  onChange: (tags: string[]) => void
}) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmedValue = inputValue.trim().replace(/,/g, '');
    if (trimmedValue && !tags.includes(trimmedValue)) {
      onChange([...tags, trimmedValue]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div className='space-y-2'>
      <div className='flex flex-wrap gap-2 mb-2'>
        {tags.map(tag => (
          <span key={tag} className='inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark text-xs font-bold shadow-brutal-xs dark:shadow-brutal-dark-xs'>
            {tag}
            <button onClick={() => removeTag(tag)} className='hover:text-red-500 transition-colors'>
              <X className='w-3 h-3' />
            </button>
          </span>
        ))}
      </div>
      <div className='relative'>
        <Input
          type='text'
          placeholder='Add tags (comma or enter)...'
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag();
            }
          }}
          className='pr-10 border-2 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark rounded-xl h-12'
        />
        <button
          onClick={addTag}
          className='absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-xs dark:shadow-brutal-dark-xs active:shadow-none transition-all'
        >
          <Plus className='w-4 h-4' />
        </button>
      </div>
    </div>
  );
}

// Task Form Modal
function TaskFormModal({
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
  const [formData, setFormData] = useState<EditableTask>({
    ...task,
    task_tags: task.task_tags || [],
    goal_type: task.goal_type || 'none',
    note_prompt: task.note_prompt ?? false,
    default_note: task.default_note || '',
  });
  const [showAllOptions, setShowAllOptions] = useState(false);
  const INITIAL_OPTIONS_COUNT = 12;

  const handleSave = () => {
    if (!formData.name.trim()) return;
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && !isSaving && !isDeleting && onCancel()}>
      <DialogContent showCloseButton={false} className='max-w-2xl p-0 overflow-y-auto max-h-[90vh] border-4 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark rounded-3xl shadow-brutal dark:shadow-brutal-dark custom-scrollbar'>
        <div className='p-6 border-b-4 border-border-strong dark:border-border-strong-dark bg-muted/10 flex items-center justify-between'>
          <div className='space-y-1'>
            <DialogTitle className='text-3xl font-black tracking-tighter'>
              {isNew ? 'CREATE TASK' : 'REFINE TASK'}
            </DialogTitle>
            <DialogDescription className='sr-only'>
              {isNew ? 'Create a new task blueprint' : 'Refine your existing task configuration'}
            </DialogDescription>
          </div>
          <button
            onClick={onCancel}
            disabled={isSaving || isDeleting}
            className='p-2 rounded-xl border-2 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark hover:bg-muted dark:hover:bg-muted-dark transition-colors'
          >
            <X className='w-5 h-5' />
          </button>
        </div>

        <div className='p-6 space-y-8'>
          {/* Identity Section */}
          <div className='p-6 rounded-2xl bg-surface-elevated dark:bg-surface-elevated-dark border-4 border-border-strong dark:border-border-strong-dark shadow-brutal-xs dark:shadow-brutal-dark-xs space-y-6'>
            <div className='flex items-center gap-3 mb-2'>
              <div
                className='w-10 h-10 rounded-xl flex items-center justify-center text-2xl border-2 border-black/10 dark:border-white/10 shadow-brutal-xs shrink-0 transition-all'
                style={{ backgroundColor: formData.color }}
              >
                {formData.icon}
              </div>
              <h3 className='text-xl font-black uppercase tracking-tight'>Identity</h3>
            </div>

            <div className='space-y-2'>
              <Label className='text-sm font-bold'>Task Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder='What are we tracking?'
                className='h-14 text-xl font-bold border-2 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark rounded-xl'
              />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-8'>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <Label className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>Icon Selection</Label>
                  {!showAllOptions && (
                    <button
                      onClick={() => setShowAllOptions(true)}
                      className='text-[10px] font-black uppercase px-2 py-1 rounded-md bg-muted hover:bg-primary/20 transition-colors'
                    >
                      More
                    </button>
                  )}
                </div>
                <div className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
                  {TASK_ICONS.slice(0, showAllOptions ? undefined : INITIAL_OPTIONS_COUNT).map(icon => (
                    <button
                      key={icon}
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={cn(
                        'w-11 h-11 rounded-xl text-2xl flex items-center justify-center border-2 transition-all btn-brutal',
                        formData.icon === icon
                          ? 'bg-primary/20 border-primary shadow-brutal-xs ring-2 ring-primary/20'
                          : 'bg-surface dark:bg-surface-dark border-border-strong dark:border-border-strong-dark'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <Label className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>Color Pallet</Label>
                  {!showAllOptions && (
                    <button
                      onClick={() => setShowAllOptions(true)}
                      className='text-[10px] font-black uppercase px-2 py-1 rounded-md bg-muted hover:bg-primary/20 transition-colors'
                    >
                      More
                    </button>
                  )}
                </div>
                <div className='grid grid-cols-4 sm:grid-cols-6 gap-2'>
                  {TASK_COLORS.slice(0, showAllOptions ? undefined : INITIAL_OPTIONS_COUNT).map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 transition-all',
                        formData.color === color ? 'border-foreground ring-4 ring-foreground/20 scale-110' : 'border-transparent hover:scale-105'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            {showAllOptions && (
              <button
                onClick={() => setShowAllOptions(false)}
                className='w-full py-2 text-[10px] font-black uppercase bg-muted/50 hover:bg-muted rounded-xl transition-colors'
              >
                Show Less
              </button>
            )}
          </div>

          {/* Classification Section */}
          <div className='p-6 rounded-2xl bg-surface-elevated dark:bg-surface-elevated-dark border-4 border-border-strong dark:border-border-strong-dark shadow-brutal-xs dark:shadow-brutal-dark-xs space-y-4'>
            <div className='flex items-center gap-2'>
              <TagIcon className='w-5 h-5 text-secondary' />
              <h3 className='text-lg font-bold uppercase tracking-tight'>Classification</h3>
            </div>
            <TagInput
              tags={formData.task_tags || []}
              onChange={(tags) => setFormData(prev => ({ ...prev, task_tags: tags }))}
            />
          </div>

          {/* Ambition Section */}
          <div className='p-6 rounded-2xl bg-surface-elevated dark:bg-surface-elevated-dark border-4 border-border-strong dark:border-border-strong-dark shadow-brutal-xs dark:shadow-brutal-dark-xs space-y-6'>
            <div className='flex items-center gap-2'>
              <Target className='w-5 h-5 text-accent' />
              <h3 className='text-lg font-bold uppercase tracking-tight'>Ambition</h3>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label className='text-sm font-bold'>Goal Strategy</Label>
                <select
                  className='w-full h-12 px-4 rounded-xl border-2 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark font-bold appearance-none cursor-pointer'
                  value={formData.goal_type || 'none'}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal_type: e.target.value as any }))}
                >
                  <option value='none'>No specific goal</option>
                  <option value='daily'>Daily Duration (min)</option>
                  <option value='weekly'>Weekly Duration (min)</option>
                  <option value='hour'>Target Total Hours</option>
                  <option value='count'>Target Session Count</option>
                </select>
              </div>

              {formData.goal_type !== 'none' && (
                <div className='space-y-2 animate-in slide-in-from-top-2'>
                  <Label className='text-sm font-bold'>Target Value</Label>
                  <div className='relative'>
                    <Input
                      type='number'
                      value={formData.goal_type === 'hour' || formData.goal_type === 'count' ? (formData.goal_value || 0) : (formData.goal_duration || 0)}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        if (formData.goal_type === 'hour' || formData.goal_type === 'count') {
                          setFormData(prev => ({ ...prev, goal_value: val }));
                        } else {
                          setFormData(prev => ({ ...prev, goal_duration: val }));
                        }
                      }}
                      className='h-12 pl-10 border-2 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark rounded-xl font-bold'
                    />
                    <div className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
                      {formData.goal_type === 'count' ? <History className='w-4 h-4' /> : <Clock className='w-4 h-4' />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Intelligence Section */}
          <div className='p-6 rounded-2xl bg-surface-elevated dark:bg-surface-elevated-dark border-4 border-border-strong dark:border-border-strong-dark shadow-brutal-xs dark:shadow-brutal-dark-xs space-y-6'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <StickyNote className='w-5 h-5 text-primary' />
                <h3 className='text-lg font-bold uppercase tracking-tight'>Intelligence</h3>
              </div>
              <div className='flex items-center gap-3'>
                <span className='text-xs font-bold uppercase'>Prompt Note</span>
                <Switch
                  checked={formData.note_prompt || false}
                  onCheckedChange={(val) => setFormData(prev => ({ ...prev, note_prompt: val }))}
                />
              </div>
            </div>
            <textarea
              value={formData.default_note || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, default_note: e.target.value }))}
              placeholder='Default session note...'
              className='w-full min-h-[100px] p-4 rounded-xl border-2 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all'
            />
          </div>

          {/* Actions */}
          <div className='flex items-center gap-4 pt-4'>
            <button
              onClick={handleSave}
              disabled={!formData.name.trim() || isSaving}
              className='flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white text-lg font-black border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark btn-brutal disabled:opacity-50'
            >
              {isSaving ? <Loader2 className='w-6 h-6 animate-spin' /> : <Check className='w-6 h-6' />}
              {isNew ? 'ESTABLISH TASK' : 'LOCK CHANGES'}
            </button>

            {!isNew && (
              <button
                onClick={() => onDelete(task.id!)}
                disabled={isDeleting}
                className='flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-500 text-white font-black border-2 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark btn-brutal disabled:opacity-50'
              >
                {isDeleting ? <Loader2 className='w-6 h-6 animate-spin' /> : <Trash2 className='w-6 h-6' />}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Content
function TasksPageContent() {
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  if (isLoadingTasks) return <TasksPageLoading />;

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

  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
      {analyzingTask && (
        <TaskAnalyticsModal
          task={analyzingTask}
          onClose={() => router.push('/tasks')}
        />
      )}

      {(editId || isCreating) && (
        <TaskFormModal
          task={editId === 'new' ? newInitialTask : (editingTask || newInitialTask)}
          isNew={editId === 'new' || isCreating}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onCancel={() => { setIsCreating(false); router.push('/tasks'); }}
          isSaving={createTaskMutation.isPending || updateTaskMutation.isPending}
          isDeleting={deleteTaskMutation.isPending}
        />
      )}

      <div className='flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full space-y-8'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6'>
          <div>
            <h1 className='text-5xl font-black tracking-tighter'>TASKS</h1>
            <p className='text-muted-foreground text-sm font-bold uppercase tracking-widest mt-1'>
              Blueprint • Track • Evolve
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <div className='flex items-center border-4 border-border-strong dark:border-border-strong-dark rounded-2xl overflow-hidden shadow-brutal-xs dark:shadow-brutal-dark-xs'>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-3', viewMode === 'list' ? 'bg-primary text-white' : 'bg-surface dark:bg-surface-dark hover:bg-muted dark:hover:bg-muted-dark')}
              >
                <List className='w-5 h-5' />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-3', viewMode === 'grid' ? 'bg-primary text-white' : 'bg-surface dark:bg-surface-dark hover:bg-muted dark:hover:bg-muted-dark')}
              >
                <LayoutGrid className='w-5 h-5' />
              </button>
            </div>

            <div className='relative group/sort'>
              <button className='flex items-center gap-2 px-5 py-3 rounded-2xl bg-surface dark:bg-surface-dark border-4 border-border-strong dark:border-border-strong-dark shadow-brutal-xs dark:shadow-brutal-dark-xs font-black text-sm btn-brutal'>
                <ArrowUpDown className='w-5 h-5' />
                <span className='hidden sm:inline'>{sortBy.toUpperCase()}</span>
              </button>
              <div className='absolute right-0 top-full mt-2 w-56 bg-surface dark:bg-surface-dark border-4 border-border-strong dark:border-border-strong-dark rounded-2xl shadow-brutal dark:shadow-brutal-dark z-30 opacity-0 invisible group-hover/sort:opacity-100 group-hover/sort:visible transition-all overflow-hidden'>
                {['order', 'name', 'newest'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s as any)}
                    className={cn('w-full text-left px-5 py-4 hover:bg-primary/10 dark:hover:bg-primary/5 font-black border-b-2 border-border/10 last:border-0', sortBy === s && 'text-primary')}
                  >
                    {s.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setIsCreating(true); router.push('/tasks?edit=new'); }}
              className='flex items-center gap-2 px-6 py-4 rounded-2xl bg-primary text-white font-black border-4 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark btn-brutal'
            >
              <Plus className='w-6 h-6' />
              <span className='hidden sm:inline'>NEW TASK</span>
            </button>
          </div>
        </div>

        {/* Task List/Grid */}
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
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
                  onEdit={(e) => { e.stopPropagation(); router.push(`/tasks?edit=${task.id}`); }}
                  onClick={() => router.push(`/tasks?analytics=${task.id}`)}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>

        {orderedTasks.length === 0 && (
          <div className='text-center py-24 border-4 border-dashed border-border-strong dark:border-border-strong-dark rounded-[2rem] bg-muted/20 dark:bg-muted/10'>
            <div className='w-24 h-24 rounded-3xl bg-surface dark:bg-surface-dark border-4 border-border-strong dark:border-border-strong-dark flex items-center justify-center mx-auto mb-8 shadow-brutal dark:shadow-brutal-dark'>
              <Activity className='w-12 h-12 text-primary' />
            </div>
            <h3 className='text-3xl font-black mb-4'>PROTOCOL EMPTY</h3>
            <p className='text-muted-foreground mb-10 max-w-sm mx-auto font-bold'>
              Establish your first task blueprint to begin tracking your evolution.
            </p>
            <button
              onClick={() => { setIsCreating(true); router.push('/tasks?edit=new'); }}
              className='px-10 py-4 rounded-2xl bg-primary text-white text-xl font-black border-4 border-border-strong dark:border-border-strong-dark shadow-brutal dark:shadow-brutal-dark btn-brutal'
            >
              INITIALIZE
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
