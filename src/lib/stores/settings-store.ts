'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontSize = 'small' | 'medium' | 'large';

export type AccentColor =
  | 'violet'
  | 'emerald'
  | 'rose'
  | 'amber'
  | 'blue'
  | 'orange'
  | 'zinc'
  | 'slate';

interface SettingsState {
  // Font size preference
  fontSize: FontSize;

  // Accent color preference
  accentColor: AccentColor;

  // Actions
  setFontSize: (size: FontSize) => void;
  setAccentColor: (color: AccentColor) => void;
}

const fontSizeMap: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

const accentPalettes: Record<AccentColor, { light: string; dark: string }> = {
  violet: { light: '#6D28D9', dark: '#8B5CF6' },
  emerald: { light: '#059669', dark: '#34D399' },
  rose: { light: '#E11D48', dark: '#FB7185' },
  amber: { light: '#F59E0B', dark: '#FBBF24' },
  blue: { light: '#2563EB', dark: '#60A5FA' },
  orange: { light: '#EA580C', dark: '#FB923C' },
  zinc: { light: '#52525B', dark: '#A1A1AA' },
  slate: { light: '#475569', dark: '#94A3B8' },
};

function setAccentColorVariables(color: AccentColor) {
  if (typeof document === 'undefined') return;
  const palette = accentPalettes[color];
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');
  const primary = isDark ? palette.dark : palette.light;
  const primaryHover = isDark
    ? color === 'violet'
      ? '#A78BFA'
      : palette.light
    : palette.light;

  root.style.setProperty('--primary', primary);
  root.style.setProperty('--primary-hover', primaryHover);
  root.style.setProperty('--ring', primary);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      fontSize: 'medium',
      accentColor: 'violet',

      // Set font size and apply immediately
      setFontSize: (size) => {
        set({ fontSize: size });
        if (typeof document !== 'undefined') {
          document.documentElement.style.fontSize = fontSizeMap[size];
        }
      },

      // Set accent color and apply immediately
      setAccentColor: (color) => {
        set({ accentColor: color });
        setAccentColorVariables(color);
      },
    }),
    {
      name: 'hiday-settings',
      // Apply settings on rehydrate
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (typeof document !== 'undefined') {
          document.documentElement.style.fontSize = fontSizeMap[state.fontSize];
          setAccentColorVariables(state.accentColor);
        }
      },
    }
  )
);

// Helper to apply font size on app initialization
export function applyFontSize(size: FontSize) {
  if (typeof document !== 'undefined') {
    document.documentElement.style.fontSize = fontSizeMap[size];
  }
}

// Helper to apply accent color on app initialization
export function applyAccentColor(color: AccentColor) {
  setAccentColorVariables(color);
}
