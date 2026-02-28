'use client';

import { useEffect } from 'react';
import { useSettingsStore, applyFontSize } from '@/lib/stores';

/**
 * SettingsProvider
 *
 * Applies user settings (font size, etc.) on app initialization.
 * This ensures settings are restored from localStorage before the UI renders.
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { fontSize } = useSettingsStore();

  // Apply font size on mount and when it changes
  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  return <>{children}</>;
}
