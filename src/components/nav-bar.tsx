'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Zap,
  BarChart3,
  Settings,
  History,
  Calendar,
  ListTodo,
  Clock,
  CalendarCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, useSupabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
};

const navItems: NavItem[] = [
  { label: 'Track', href: '/track', icon: Zap },
  { label: 'Timeline', href: '/timeline', icon: Clock },
  { label: 'Todos', href: '/todos', icon: CalendarCheck },
  { label: 'History', href: '/history', icon: History },
  { label: 'Analyze', href: '/analyze', icon: BarChart3 },
  { label: 'Tasks', href: '/tasks', icon: ListTodo },
  { label: 'Settings', href: '/settings', icon: Settings },
];

interface NavBarProps {
  pomodoroCompletions?: number;
}

export function NavBar({}: NavBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Use a stable date string only after mounting
  const dateStr = useSyncExternalStore(
    () => () => {},
    () => new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    () => ''
  );

  // Derive user display info
  const email = user?.email ?? 'user@example.com';
  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    email.split('@')[0] ??
    'User';
  const initial = name.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setDialogOpen(false);
    router.push('/login');
  };

  return (
    <>
      {/* Desktop Sidebar - 280px width per Design.md */}
      <aside className='hidden lg:flex w-70 flex-col border-r-2 border-border-strong bg-surface h-screen sticky top-0'>
        {/* Logo Area */}
        <div className='p-6 border-b-2 border-border-strong'>
          <h1 className='text-2xl font-bold tracking-tight text-primary'>
            Hiday
          </h1>
          <div className='flex items-center gap-2 text-foreground-muted mt-2'>
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
                    : 'text-foreground-muted border-transparent hover:bg-surface-elevated hover:text-foreground',
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className='p-4 border-t-2 border-border-strong'>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className='w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-elevated border-2 border-border-strong shadow-brutal-sm cursor-pointer hover:bg-surface-elevated/80 hover:bg-surface-elevated/80 transition-colors text-left'>
                {/* Avatar - 40px (MD) per Design.md */}
                <div className='w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm border-2 border-background shrink-0'>
                  {initial}
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='font-medium text-sm truncate'>{name}</p>
                  <p className='text-xs text-foreground-muted truncate'>
                    {email}
                  </p>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className='bg-surface border-2 border-border-strong shadow-brutal'>
              <DialogHeader>
                <DialogTitle>Account</DialogTitle>
                <DialogDescription>
                  Signed in as {email}
                </DialogDescription>
              </DialogHeader>
              <div className='flex flex-col items-center gap-4 py-4'>
                <div className='w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl border-2 border-background'>
                  {initial}
                </div>
                <div className='text-center'>
                  <p className='font-semibold text-base'>{name}</p>
                  <p className='text-sm text-foreground-muted'>
                    {email}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant='destructive'
                  onClick={handleLogout}
                  className='w-full sm:w-auto'
                >
                  <LogOut className='w-4 h-4 mr-2' />
                  Log out
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - 64px height per Design.md */}
      <nav className='lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface border-t-2 border-border-strong z-50'>
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
                  isActive ? 'text-primary' : 'text-foreground-muted',
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