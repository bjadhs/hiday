'use client';

import { useEffect } from 'react';
import { useSettingsStore, applyFontSize, applyTheme } from '@/lib/stores';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';

/**
 * SettingsProvider
 *
 * Applies user settings (font size, theme preset, etc.) on app initialization
 * and registers global keyboard shortcuts.
 * This ensures settings are restored from localStorage before the UI renders.
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { fontSize, theme } = useSettingsStore();

  // Apply font size on mount and when it changes
  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  // Apply theme preset on mount and when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Global keyboard shortcuts
  useKeyboardShortcuts();

  return <>{children}</>;
}
