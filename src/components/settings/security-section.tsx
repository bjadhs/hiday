'use client';

import { Shield } from 'lucide-react';
import { SettingsSection, SettingsItem } from './settings-section';

/**
 * SecuritySection
 * 
 * Settings section for security-related options.
 * 
 * @example
 * ```tsx
 * <SecuritySection />
 * ```
 */
export function SecuritySection() {
  return (
    <SettingsSection title='Security' icon={Shield}>
      <SettingsItem
        label='Change Password'
        value='••••••••'
        description='Update your account password'
        action
      />
    </SettingsSection>
  );
}
