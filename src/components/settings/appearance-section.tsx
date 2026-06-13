'use client';

import { Moon, Palette } from 'lucide-react';
import { SettingsSection } from './settings-section';
import { ThemeToggle } from '@/components/theme-toggle';
import { FontSizeToggle } from '@/components/font-size-toggle';
import { AccentColorToggle } from '@/components/accent-color-toggle';

/**
 * AppearanceSection
 *
 * Settings section for appearance-related options like dark mode, font size,
 * and accent color.
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
      <div className='flex items-center justify-between py-3 border-t border-border'>
        <div>
          <p className='font-semibold'>Font Size</p>
          <p className='text-sm text-muted-foreground'>
            Adjust the text size throughout the app
          </p>
        </div>
        <FontSizeToggle />
      </div>
      <div className='py-4 border-t border-border'>
        <div className='flex items-center gap-3 mb-3'>
          <Palette className='w-5 h-5 text-primary' />
          <div>
            <p className='font-semibold'>Accent Color</p>
            <p className='text-sm text-muted-foreground'>
              Choose a theme that matches your mood
            </p>
          </div>
        </div>
        <AccentColorToggle />
      </div>
    </SettingsSection>
  );
}
