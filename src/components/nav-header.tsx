'use client';

import { Calendar } from 'lucide-react';

interface NavHeaderProps {
  title: string;
}
const INITIAL_DATE_STR = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const currentDateStr = INITIAL_DATE_STR;

export function NavHeader({ title }: NavHeaderProps) {
  return (
    <>
      {/* Mobile Header - Shows app logo and page title */}
      <header className='lg:hidden flex items-center justify-between px-4 py-4 bg-surface dark:bg-surface-dark border-b-2 border-border-strong dark:border-border-strong-dark sticky top-0 z-40'>
        <h1 className='text-xl font-bold text-primary tracking-tight'>
          ATracker
        </h1>
        <h2 className='text-lg font-semibold'>{title}</h2>
      </header>

      {/* Desktop Header - Shows page title and current date */}
      <header className='hidden lg:flex items-center justify-between px-8 py-6 border-b-2 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark'>
        <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
        <div className='flex items-center gap-3 text-muted-foreground'>
          <Calendar className='w-5 h-5' />
          <span className='font-medium'>{currentDateStr}</span>
        </div>
      </header>
    </>
  );
}
