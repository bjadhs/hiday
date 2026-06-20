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
import { ProjectCard } from '../project-card';
import { DBProject } from '../types';
import { Sparkles, Clock, ListTodo, Pencil, Plus } from 'lucide-react';

interface ProjectsListProps {
    sortedProjects: DBProject[];
    orderedProjects: DBProject[];
    viewMode: 'grid' | 'list';
    sortBy: 'name' | 'order' | 'newest';
    onDragEnd: (event: DragEndEvent) => void;
    onEdit: (id: string) => void;
    onAnalytics: (id: string) => void;
    onCreate: () => void;
}

export function ProjectsList({
    sortedProjects,
    orderedProjects,
    viewMode,
    sortBy,
    onDragEnd,
    onEdit,
    onAnalytics,
    onCreate,
}: ProjectsListProps) {
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
                        items={sortedProjects.map(t => t.id)}
                        strategy={viewMode === 'list' ? verticalListSortingStrategy : rectSortingStrategy}
                    >
                        {sortedProjects.map((project) => (
                            <ProjectCard
                                key={project.id}
                                project={project}
                                viewMode={viewMode}
                                isSortable={sortBy === 'order'}
                                onEdit={(e) => { e.stopPropagation(); onEdit(project.id); }}
                                onClick={() => onAnalytics(project.id)}
                            />
                        ))}
                    </SortableContext>
                </div>
            </DndContext>

            {orderedProjects.length === 0 && (
                <div className='relative overflow-hidden text-center py-16 lg:py-24 border-4 border-dashed border-border-strong rounded-[2rem] bg-gradient-to-br from-muted/40 via-muted/20 to-primary/5 dark:from-muted/20 dark:via-muted/10 dark:to-primary/10'>
                    {/* Decorative background blobs */}
                    <div className='absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none' />
                    <div className='absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl pointer-events-none' />

                    <div className='relative z-10 max-w-2xl mx-auto px-6'>
                        {/* Hero icon */}
                        <div className='w-24 h-24 rounded-3xl bg-surface border-4 border-border-strong flex items-center justify-center mx-auto mb-8 shadow-brutal rotate-3 hover:rotate-0 transition-transform duration-300'>
                            <Sparkles className='w-12 h-12 text-primary' />
                        </div>

                        {/* Headline */}
                        <h3 className='text-3xl lg:text-4xl font-black mb-4 tracking-tight'>
                            Your project blueprint is empty
                        </h3>

                        {/* What is a project */}
                        <p className='text-muted-foreground text-lg mb-8 max-w-lg mx-auto font-medium leading-relaxed'>
                            A <span className='text-foreground font-bold'>project</span> is anything you want to spend focused time on — deep work, a kproject, a habit, or a hobby.
                        </p>

                        {/* Feature cards */}
                        <div className='grid sm:grid-cols-2 gap-4 mb-10 text-left'>
                            <div className='p-5 rounded-2xl bg-surface border-2 border-border-strong shadow-brutal-sm'>
                                <div className='w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3'>
                                    <Clock className='w-5 h-5 text-primary' />
                                </div>
                                <h4 className='font-bold mb-1'>What is a session?</h4>
                                <p className='text-sm text-muted-foreground leading-relaxed'>
                                    A session is a single focused period of work on a project. Every time you press start, a new session begins.
                                </p>
                            </div>

                            <div className='p-5 rounded-2xl bg-surface border-2 border-border-strong shadow-brutal-sm'>
                                <div className='w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mb-3'>
                                    <Pencil className='w-5 h-5 text-secondary-foreground' />
                                </div>
                                <h4 className='font-bold mb-1'>Manage anytime</h4>
                                <p className='text-sm text-muted-foreground leading-relaxed'>
                                    You can edit, reorder, or analyze your projects anytime from the <span className='inline-flex items-center gap-1 font-semibold text-foreground'><ListTodo className='w-3.5 h-3.5' /> Projects</span> page in the sidebar.
                                </p>
                            </div>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={onCreate}
                            className='inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-primary-highlight text-white text-xl font-black border-4 border-border-strong shadow-brutal btn-brutal hover:shadow-brutal-sm transition-shadow'
                        >
                            <Plus className='w-6 h-6' />
                            Create your first project
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
