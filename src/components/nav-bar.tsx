'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Zap,
  BarChart3,
  Settings,
  History,
  Calendar,
  ListTodo,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { label: 'Track', href: '/track', icon: Zap },
  { label: 'Timeline', href: '/timeline', icon: Clock },
  { label: 'History', href: '/history', icon: History },
  { label: 'Analyze', href: '/analyze', icon: BarChart3 },
  { label: 'Tasks', href: '/tasks', icon: ListTodo },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface NavBarProps {
  pomodoroCompletions?: number;
}

export function NavBar({ }: NavBarProps) {
  const pathname = usePathname();
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
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }));
    }
  }, [mounted]);

  return (
    <>
      {/* Desktop Sidebar - 280px width per Design.md */}
      <aside className='hidden lg:flex w-[280px] flex-col border-r-2 border-border-strong dark:border-border-strong-dark bg-surface dark:bg-surface-dark h-screen sticky top-0'>
        {/* Logo Area */}
        <div className='p-6 border-b-2 border-border-strong dark:border-border-strong-dark'>
          <h1 className='text-2xl font-bold tracking-tight text-primary'>
            Hiday
          </h1>
          <div className='flex items-center gap-2 text-muted-foreground mt-2'>
            <Calendar className='w-4 h-4' />
            <span
              className='text-sm font-medium'
              suppressHydrationWarning
            >
              {dateStr}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className='flex-1 p-4 space-y-2 pt-6'>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200',
                  'border-2',
                  isActive
                    ? 'bg-primary/10 text-primary border-transparent border-l-[3px] border-l-primary border-l-solid'
                    : 'text-muted-foreground border-transparent hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark hover:text-foreground',
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className='p-4 border-t-2 border-border-strong dark:border-border-strong-dark'>
          <div className='flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-elevated dark:bg-surface-elevated-dark border-2 border-border-strong dark:border-border-strong-dark shadow-brutal-sm dark:shadow-brutal-dark-sm'>
            {/* Avatar - 40px (MD) per Design.md */}
            <div className='w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm border-2 border-white dark:border-surface-dark'>
              U
            </div>
            <div className='flex-1 min-w-0'>
              <p className='font-medium text-sm truncate'>User</p>
              <p className='text-xs text-muted-foreground truncate'>
                user@example.com
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - 64px height per Design.md */}
      <nav className='lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface dark:bg-surface-dark border-t-2 border-border-strong dark:border-border-strong-dark z-50'>
        <div className='flex items-center justify-around h-full'>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                <span className='text-[11px] font-medium'>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
