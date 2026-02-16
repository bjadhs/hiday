'use client';

import { Sparkles } from 'lucide-react';

interface ComingSoonPlaceholderProps {
  title?: string;
  description?: string;
}

/**
 * ComingSoonPlaceholder
 * 
 * A placeholder component to show when features are not yet implemented.
 * Displays a centered card with an icon and message.
 * 
 * @example
 * ```tsx
 * <ComingSoonPlaceholder
 *   title="Analytics Coming Soon"
 *   description="Detailed analytics and insights are being built..."
 * />
 * ```
 */
export function ComingSoonPlaceholder({
  title = 'Coming Soon',
  description = 'This feature is being built. Check back later for updates.',
}: ComingSoonPlaceholderProps) {
  return (
    <div className='bg-surface dark:bg-surface-dark border-2 border-border-strong dark:border-border-strong-dark rounded-xl shadow-brutal dark:shadow-brutal-dark p-12 text-center'>
      <div className='w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center shadow-brutal-sm'>
        <Sparkles className='w-10 h-10 text-primary' />
      </div>
      <h2 className='text-2xl font-bold mb-2 tracking-tight'>
        {title}
      </h2>
      <p className='text-muted-foreground max-w-md mx-auto'>
        {description}
      </p>
    </div>
  );
}
