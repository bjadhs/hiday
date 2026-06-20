'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontSize = 'small' | 'medium' | 'large';

/**
 * Available theme presets. Each preset is a complete palette.
 */
export type ThemePreset =
  | 'classic'
  | 'classic-dark'
  | 'midnight-bright'
  | 'warm-paper'
  | 'high-contrast'
  | 'ocean-dark';

/**
 * @deprecated Accent colors are now part of theme presets.
 * Kept for migration and backward compatibility only.
 */
export type AccentColor =
  | 'violet'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'blue'
  | 'orange'
  | 'zinc'
  | 'slate';

export interface ThemeDefinition {
  id: ThemePreset;
  name: string;
  description: string;
  isDark: boolean;
  accentColor: string;
}

export const themeDefinitions: Record<ThemePreset, ThemeDefinition> = {
  classic: {
    id: 'classic',
    name: 'Classic',
    description: 'Clean light theme with violet accents',
    isDark: false,
    accentColor: '#6D28D9',
  },
  'classic-dark': {
    id: 'classic-dark',
    name: 'Classic Dark',
    description: 'Subtle dark theme with muted tones',
    isDark: true,
    accentColor: '#8B5CF6',
  },
  'midnight-bright': {
    id: 'midnight-bright',
    name: 'Midnight Bright',
    description: 'Dark background with vivid pink and teal accents',
    isDark: true,
    accentColor: '#FF6B9D',
  },
  'warm-paper': {
    id: 'warm-paper',
    name: 'Warm Paper',
    description: 'Creamy light theme with warm amber tones',
    isDark: false,
    accentColor: '#B45309',
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum readability with pure black and white',
    isDark: false,
    accentColor: '#0000EE',
  },
  'ocean-dark': {
    id: 'ocean-dark',
    name: 'Ocean Dark',
    description: 'Deep blue dark theme with bright sky accents',
    isDark: true,
    accentColor: '#38BDF8',
  },
};

const fontSizeMap: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

/**
 * Apply a theme preset to the DOM:
 * - sets `data-theme` on <html>
 * - syncs the `.dark` class for next-themes / system preference coherence
 */
export function applyThemeToDOM(theme: ThemePreset) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const definition = themeDefinitions[theme];

  root.setAttribute('data-theme', theme);

  if (definition?.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

interface SettingsState {
  fontSize: FontSize;
  theme: ThemePreset;
  lastLightPreset: ThemePreset;
  lastDarkPreset: ThemePreset;

  /**
   * @deprecated Only present for migration from v1 settings.
   */
  accentColor?: AccentColor;

  setFontSize: (size: FontSize) => void;
  setTheme: (theme: ThemePreset) => void;
}

const STORAGE_KEY = 'hiday-settings-v2';
const LEGACY_STORAGE_KEY = 'hiday-settings';

const darkAccentColors: AccentColor[] = ['blue', 'orange', 'zinc', 'slate'];

function getSystemThemePreset(): ThemePreset {
  if (typeof window === 'undefined') return 'classic';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'classic-dark'
    : 'classic';
}

function migrateLegacySettings(): Partial<SettingsState> | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const oldAccent = parsed?.state?.accentColor as AccentColor | undefined;

    const migratedTheme = oldAccent && darkAccentColors.includes(oldAccent)
      ? 'classic-dark'
      : getSystemThemePreset();

    return {
      fontSize: parsed?.state?.fontSize ?? 'medium',
      theme: migratedTheme,
      lastLightPreset: 'classic',
      lastDarkPreset: 'classic-dark',
    };
  } catch {
    return null;
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontSize: 'medium',
      theme: getSystemThemePreset(),
      lastLightPreset: 'classic',
      lastDarkPreset: 'classic-dark',

      setFontSize: (size) => {
        set({ fontSize: size });
        if (typeof document !== 'undefined') {
          document.documentElement.style.fontSize = fontSizeMap[size];
        }
      },

      setTheme: (theme) => {
        const definition = themeDefinitions[theme];
        set({
          theme,
          ...(definition?.isDark
            ? { lastDarkPreset: theme }
            : { lastLightPreset: theme }),
        });
        applyThemeToDOM(theme);
      },
    }),
    {
      name: STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (typeof document === 'undefined') return;

        if (!state) {
          // First run under v2 — try to migrate from v1 settings.
          const migrated = migrateLegacySettings();
          if (migrated) {
            useSettingsStore.setState(migrated);
            applyThemeToDOM(migrated.theme ?? 'classic');
            document.documentElement.style.fontSize =
              fontSizeMap[migrated.fontSize ?? 'medium'];
          }
          return;
        }

        document.documentElement.style.fontSize = fontSizeMap[state.fontSize];
        applyThemeToDOM(state.theme);
      },
    }
  )
);

// Helpers for initialization
export function applyFontSize(size: FontSize) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = fontSizeMap[size];
  }
}

export function applyTheme(theme: ThemePreset) {
  applyThemeToDOM(theme);
}

/**
 * @deprecated Accent colors are now part of theme presets.
 * Kept as a no-op for any remaining imports.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function applyAccentColor(..._args: unknown[]) {
  // No-op: accent colors are now part of theme presets.
}
