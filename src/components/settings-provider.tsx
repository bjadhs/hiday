'use client';

import { useEffect } from 'react';
import { useSettingsStore, applyFontSize, applyAccentColor } from '@/lib/stores';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';

/**
 * SettingsProvider
 *
 * Applies user settings (font size, accent color, etc.) on app initialization
 * and registers global keyboard shortcuts.
 * This ensures settings are restored from localStorage before the UI renders.
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { fontSize, accentColor } = useSettingsStore();

  // Apply font size and accent color on mount and when they change
  useEffect(() => {
    applyFontSize(fontSize);
  }, [fontSize]);

  useEffect(() => {
    applyAccentColor(accentColor);
  }, [accentColor]);

  // Global keyboard shortcuts
  useKeyboardShortcuts();

  return <>{children}</>;
}
