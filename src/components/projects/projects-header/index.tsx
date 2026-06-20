import { List, LayoutGrid, Plus, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectsHeaderProps {
    viewMode: 'grid' | 'list';
    setViewMode: (mode: 'grid' | 'list') => void;
    sortBy: 'name' | 'order' | 'newest';
    setSortBy: (sort: 'name' | 'order' | 'newest') => void;
    onCreate: () => void;
}

export function ProjectsHeader({
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    onCreate,
}: ProjectsHeaderProps) {
    return (
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-6'>
            <div>
                <h1 className='text-5xl font-black tracking-tighter'>PROJECTS</h1>
                <p className='text-muted-foreground text-sm font-bold uppercase tracking-widest mt-1'>
                    Blueprint • Track • Evolve
                </p>
            </div>

            <div className='flex items-center gap-3'>
                <div className='flex items-center border-4 border-border-strong rounded-2xl overflow-hidden shadow-brutal-xs'>
                    <button
                        onClick={() => setViewMode('list')}
                        className={cn('p-3', viewMode === 'list' ? 'bg-primary-highlight text-white' : 'bg-surface hover:bg-muted')}
                    >
                        <List className='w-5 h-5' />
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={cn('p-3', viewMode === 'grid' ? 'bg-primary-highlight text-white' : 'bg-surface hover:bg-muted')}
                    >
                        <LayoutGrid className='w-5 h-5' />
                    </button>
                </div>

                <div className='relative group/sort'>
                    <button className='flex items-center gap-2 px-5 py-3 rounded-2xl bg-surface border-4 border-border-strong shadow-brutal-xs font-black text-sm btn-brutal'>
                        <ArrowUpDown className='w-5 h-5' />
                        <span className='hidden sm:inline'>{sortBy.toUpperCase()}</span>
                    </button>
                    <div className='absolute right-0 top-full mt-2 w-56 bg-surface border-4 border-border-strong rounded-2xl shadow-brutal z-30 opacity-0 invisible group-hover/sort:opacity-100 group-hover/sort:visible transition-all overflow-hidden'>
                        {['order', 'name', 'newest'].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSortBy(s as ProjectsHeaderProps['sortBy'])}
                                className={cn('w-full text-left px-5 py-4 hover:bg-primary/10 dark:hover:bg-primary/5 font-black border-b-2 border-border/10 last:border-0', sortBy === s && 'text-primary')}
                            >
                                {s.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onCreate}
                    className='flex items-center gap-2 px-6 py-4 rounded-2xl bg-primary-highlight text-white font-black border-4 border-border-strong shadow-brutal btn-brutal'
                >
                    <Plus className='w-6 h-6' />
                    <span className='hidden sm:inline'>NEW PROJECT</span>
                </button>
            </div>
        </div>
    );
}
