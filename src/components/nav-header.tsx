'use client';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface NavHeaderProps {
  title: string;
}

export function NavHeader({ title }: NavHeaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a stable date string only after mounting
  const [dateStr, setDateStr] = useState<string>('');

  useEffect(() => {
    if (mounted) {
      setDateStr(new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }));
    }
  }, [mounted]);

  return (
    <>
      {/* Mobile Header - Shows app logo and page title */}
      <header className='lg:hidden flex items-center justify-between px-4 py-4 bg-surface border-b-2 border-border-strong sticky top-0 z-40'>
        <h1 className='text-xl font-bold text-primary tracking-tight'>
          ATracker
        </h1>
        <h2 className='text-lg font-semibold'>{title}</h2>
      </header>

      {/* Desktop Header - Shows page title and current date */}
      <header className='hidden lg:flex items-center justify-between px-8 py-6 border-b-2 border-border-strong bg-surface'>
        <h1 className='text-3xl font-bold tracking-tight'>{title}</h1>
        <div className='flex items-center gap-3 text-muted-foreground'>
          <Calendar className='w-5 h-5' />
          <span
            className='font-medium'
            suppressHydrationWarning
          >
            {dateStr}
          </span>
        </div>
      </header>
    </>
  );
}
