'use client';

import { User } from 'lucide-react';
import { useUser } from '@/lib/supabase';
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
  const { user } = useUser();

  const email = user?.email ?? 'user@example.com';
  const name =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    email.split('@')[0] ??
    'User';

  return (
    <SettingsSection title='Account' icon={User}>
      <SettingsItem
        label='Email'
        value={email}
        description='Your account email address'
      />
      <SettingsItem
        label='Display Name'
        value={name}
        description='How you appear in the app'
      />
    </SettingsSection>
  );
}