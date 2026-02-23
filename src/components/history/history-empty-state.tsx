import { Clock } from 'lucide-react';

interface EmptyStateProps {
    message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
    return (
        <div className='p-12 text-center'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border-strong dark:border-border-strong-dark flex items-center justify-center shadow-brutal-sm dark:shadow-brutal-dark-sm'>
                <Clock className='w-8 h-8 text-muted-foreground' />
            </div>
            <p className='text-muted-foreground'>{message}</p>
        </div>
    );
}
