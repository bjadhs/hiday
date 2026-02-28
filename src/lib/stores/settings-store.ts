'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type FontSize = 'small' | 'medium' | 'large';

interface SettingsState {
  // Font size preference
  fontSize: FontSize;

  // Actions
  setFontSize: (size: FontSize) => void;
}

const fontSizeMap: Record<FontSize, string> = {
  small: '14px',
  medium: '16px',
  large: '18px',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      fontSize: 'medium',

      // Set font size and apply immediately
      setFontSize: (size) => {
        set({ fontSize: size });
        // Apply to document root immediately
        if (typeof document !== 'undefined') {
          document.documentElement.style.fontSize = fontSizeMap[size];
        }
      },
    }),
    {
      name: 'hiday-settings',
      // Apply font size on rehydrate
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          document.documentElement.style.fontSize = fontSizeMap[state.fontSize];
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
