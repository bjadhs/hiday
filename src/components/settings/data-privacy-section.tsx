'use client';

import { Database } from 'lucide-react';
import { SettingsSection, SettingsItem } from './settings-section';

/**
 * DataPrivacySection
 * 
 * Settings section for data and privacy options.
 * 
 * @example
 * ```tsx
 * <DataPrivacySection />
 * ```
 */
export function DataPrivacySection() {
  return (
    <SettingsSection title='Data & Privacy' icon={Database}>
      <SettingsItem
        label='Export Data'
        value='CSV'
        description='Download your time tracking data'
        action
      />
      <SettingsItem
        label='Sync Status'
        value='Synced'
        description='Last synced: Just now'
      />
    </SettingsSection>
  );
}
