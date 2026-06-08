'use client';

import { ChevronRight } from 'lucide-react';
import { SettingsSectionProps, SettingsItemProps } from '@/lib/types';

export function SettingsSection({
  title,
  icon: Icon,
  children,
}: SettingsSectionProps) {
  return (
    <div className='bg-surface border-2 border-border-strong rounded-xl shadow-brutal overflow-hidden'>
      <div className='p-4 lg:p-6 border-b-2 border-border flex items-center gap-3'>
        <div className='p-2 rounded-lg bg-primary/10 border border-primary/20'>
          <Icon className='w-5 h-5 text-primary' />
        </div>
        <h2 className='text-lg font-bold tracking-tight'>{title}</h2>
      </div>
      <div className='p-4 lg:p-6 divide-y divide-border dark:divide-border-dark'>
        {children}
      </div>
    </div>
  );
}

export function SettingsItem({
  label,
  value,
  description,
  action,
}: SettingsItemProps) {
  return (
    <div className='flex items-center justify-between py-3 first:pt-0 last:pb-0'>
      <div>
        <p className='font-semibold'>{label}</p>
        {description && (
          <p className='text-sm text-muted-foreground'>{description}</p>
        )}
      </div>
      {action ? (
        <button className='flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated text-foreground font-medium border-2 border-border-strong shadow-brutal-xs btn-brutal text-sm'>
          Manage
          <ChevronRight className='w-4 h-4' />
        </button>
      ) : (
        <span className='text-muted-foreground text-sm font-medium'>
          {value}
        </span>
      )}
    </div>
  );
}
