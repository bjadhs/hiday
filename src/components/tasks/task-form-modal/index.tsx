import { useState } from 'react';
import { TASK_ICONS, TASK_COLORS } from '@/lib/constant';
import { EditableTask } from '../types';
import { cn } from '@/lib/utils';
import {
    X, Check, Trash2, Loader2, Tag as TagIcon, Target,
    StickyNote, Plus, History, Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

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
                    <span key={tag} className='inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-surface border-2 border-border-strong text-xs font-bold shadow-brutal-xs'>
                        {tag}
                        <button onClick={() => removeTag(tag)} className='hover:text-destructive transition-colors'>
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
                    className='pr-10 border-2 border-border-strong bg-surface rounded-xl h-12'
                />
                <button
                    onClick={addTag}
                    className='absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-surface border-2 border-border-strong shadow-brutal-xs active:shadow-none transition-all'
                >
                    <Plus className='w-4 h-4' />
                </button>
            </div>
        </div>
    );
}

interface TaskFormModalProps {
    task: EditableTask;
    isNew: boolean;
    onSave: (task: EditableTask) => void;
    onDelete: (taskId: string) => void;
    onCancel: () => void;
    isSaving: boolean;
    isDeleting: boolean;
}

export function TaskFormModal({
    task,
    isNew,
    onSave,
    onDelete,
    onCancel,
    isSaving,
    isDeleting,
}: TaskFormModalProps) {
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
            <DialogContent showCloseButton={false} className='max-w-2xl p-0 overflow-y-auto max-h-[90vh] border-4 border-border-strong bg-surface rounded-3xl shadow-brutal custom-scrollbar'>
                <div className='p-6 border-b-4 border-border-strong bg-muted/10 flex items-center justify-between'>
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
                        className='p-2 rounded-xl border-2 border-border-strong bg-surface hover:bg-muted transition-colors'
                    >
                        <X className='w-5 h-5' />
                    </button>
                </div>

                <div className='p-6 space-y-8'>
                    {/* Identity Section */}
                    <div className='p-6 rounded-2xl bg-surface-elevated border-4 border-border-strong shadow-brutal-xs space-y-6'>
                        <div className='flex items-center gap-3 mb-2'>
                            <div
                                className='w-10 h-10 rounded-xl flex items-center justify-center text-2xl border-2 border-black/10 dark:border-white/25 shadow-brutal-xs shrink-0 transition-all'
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
                                className='h-14 text-xl font-bold border-2 border-border-strong bg-surface rounded-xl'
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
                                                    : 'bg-surface border-border-strong'
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
                    <div className='p-6 rounded-2xl bg-surface-elevated border-4 border-border-strong shadow-brutal-xs space-y-4'>
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
                    <div className='p-6 rounded-2xl bg-surface-elevated border-4 border-border-strong shadow-brutal-xs space-y-6'>
                        <div className='flex items-center gap-2'>
                            <Target className='w-5 h-5 text-accent' />
                            <h3 className='text-lg font-bold uppercase tracking-tight'>Ambition</h3>
                        </div>

                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <Label className='text-sm font-bold'>Goal Strategy</Label>
                                <select
                                    className='w-full h-12 px-4 rounded-xl border-2 border-border-strong bg-surface font-bold appearance-none cursor-pointer'
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
                                            className='h-12 pl-10 border-2 border-border-strong bg-surface rounded-xl font-bold'
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
                    <div className='p-6 rounded-2xl bg-surface-elevated border-4 border-border-strong shadow-brutal-xs space-y-6'>
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
                            className='w-full min-h-[100px] p-4 rounded-xl border-2 border-border-strong bg-surface text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all'
                        />
                    </div>

                    {/* Actions */}
                    <div className='flex items-center gap-4 pt-4'>
                        <button
                            onClick={handleSave}
                            disabled={!formData.name.trim() || isSaving}
                            className='flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white text-lg font-black border-2 border-border-strong shadow-brutal btn-brutal disabled:opacity-50'
                        >
                            {isSaving ? <Loader2 className='w-6 h-6 animate-spin' /> : <Check className='w-6 h-6' />}
                            {isNew ? 'ESTABLISH TASK' : 'LOCK CHANGES'}
                        </button>

                        {!isNew && (
                            <button
                                onClick={() => onDelete(task.id!)}
                                disabled={isDeleting}
                                className='flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-500 text-white font-black border-2 border-border-strong shadow-brutal btn-brutal disabled:opacity-50'
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
