'use client';

import {
  AppearanceSection,
  NotificationsSection,
  DataPrivacySection,
  SecuritySection,
  KeyboardShortcutsSection,
  AppVersion,
} from '@/components/settings';

/**
 * SettingsPage
 * 
 * User settings and configuration page with sections for:
 * - Appearance (dark mode, font size, accent color)
 * - Notifications
 * - Data & Privacy
 * - Security
 * - Keyboard Shortcuts
 */
export default function SettingsPage() {
  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
      <div className='flex-1 p-4 lg:p-8 max-w-3xl mx-auto w-full space-y-6'>
        {/* Appearance */}
        <AppearanceSection />

        {/* Notifications */}
        <NotificationsSection />

        {/* Data */}
        <DataPrivacySection />

        {/* Security */}
        <SecuritySection />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcutsSection />

        {/* Version */}
        <AppVersion version="1.0.0" />
      </div>
    </main>
  );
}
