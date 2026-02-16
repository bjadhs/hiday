'use client';

import { Moon } from 'lucide-react';
import { SettingsSection } from './settings-section';
import { ThemeToggle } from '@/components/theme-toggle';

/**
 * AppearanceSection
 * 
 * Settings section for appearance-related options like dark mode.
 * 
 * @example
 * ```tsx
 * <AppearanceSection />
 * ```
 */
export function AppearanceSection() {
  return (
    <SettingsSection title='Appearance' icon={Moon}>
      <div className='flex items-center justify-between py-3'>
        <div>
          <p className='font-semibold'>Dark Mode</p>
          <p className='text-sm text-muted-foreground'>
            Toggle between light and dark theme
          </p>
        </div>
        <ThemeToggle />
      </div>
    </SettingsSection>
  );
}
