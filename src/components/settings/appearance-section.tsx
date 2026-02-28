'use client';

import { Moon, Type } from 'lucide-react';
import { SettingsSection } from './settings-section';
import { ThemeToggle } from '@/components/theme-toggle';
import { FontSizeToggle } from '@/components/font-size-toggle';

/**
 * AppearanceSection
 *
 * Settings section for appearance-related options like dark mode and font size.
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
      <div className='flex items-center justify-between py-3 border-t border-border dark:border-border-dark'>
        <div>
          <p className='font-semibold'>Font Size</p>
          <p className='text-sm text-muted-foreground'>
            Adjust the text size throughout the app
          </p>
        </div>
        <FontSizeToggle />
      </div>
    </SettingsSection>
  );
}
