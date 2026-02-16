'use client';

import { User } from 'lucide-react';
import { SettingsSection, SettingsItem } from './settings-section';

/**
 * AccountSection
 * 
 * Settings section for account-related information.
 * 
 * @example
 * ```tsx
 * <AccountSection />
 * ```
 */
export function AccountSection() {
  return (
    <SettingsSection title='Account' icon={User}>
      <SettingsItem
        label='Email'
        value='user@example.com'
        description='Your account email address'
      />
      <SettingsItem
        label='Display Name'
        value='User'
        description='How you appear in the app'
      />
    </SettingsSection>
  );
}
