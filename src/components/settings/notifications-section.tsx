'use client';

import { Bell } from 'lucide-react';
import { SettingsSection, SettingsItem } from './settings-section';

/**
 * NotificationsSection
 * 
 * Settings section for notification preferences.
 * 
 * @example
 * ```tsx
 * <NotificationsSection />
 * ```
 */
export function NotificationsSection() {
  return (
    <SettingsSection title='Notifications' icon={Bell}>
      <SettingsItem
        label='Daily Reminders'
        value='Enabled'
        description='Get reminded to track your time'
        action
      />
      <SettingsItem
        label='Goal Alerts'
        value='Enabled'
        description='Notifications when you reach goals'
        action
      />
    </SettingsSection>
  );
}
