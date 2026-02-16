'use client';

import { create } from 'zustand';

/**
 * UI Store
 * 
 * Global UI state management using Zustand.
 * Handles dialogs, drawers, toasts, and other UI state.
 */
interface UIState {
  // Edit Session Dialog
  isEditDialogOpen: boolean;
  editingSessionId: string | null;
  
  // Navigation drawer (mobile)
  isNavDrawerOpen: boolean;
  
  // Toast notifications
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>;
  
  // Actions
  openEditDialog: (sessionId: string) => void;
  closeEditDialog: () => void;
  
  openNavDrawer: () => void;
  closeNavDrawer: () => void;
  toggleNavDrawer: () => void;
  
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isEditDialogOpen: false,
  editingSessionId: null,
  isNavDrawerOpen: false,
  toasts: [],

  // Edit dialog actions
  openEditDialog: (sessionId) => {
    set({
      isEditDialogOpen: true,
      editingSessionId: sessionId,
    });
  },

  closeEditDialog: () => {
    set({
      isEditDialogOpen: false,
      editingSessionId: null,
    });
  },

  // Nav drawer actions
  openNavDrawer: () => set({ isNavDrawerOpen: true }),
  closeNavDrawer: () => set({ isNavDrawerOpen: false }),
  toggleNavDrawer: () => set((state) => ({ isNavDrawerOpen: !state.isNavDrawerOpen })),

  // Toast actions
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    
    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 3000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
