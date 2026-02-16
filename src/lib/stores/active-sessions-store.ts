'use client';

import { create } from 'zustand';
import { Task } from '@/lib/types';

// Single active session state
export interface ActiveSessionState {
  id: string;
  task: Task;
  title: string;
  note: string;
  startTime: number;
}

// Store state interface
interface ActiveSessionsState {
  // Sessions
  activeSessions: ActiveSessionState[];
  elapsedTimes: Record<string, number>;
  syncedSessionIds: Set<string>;
  
  // UI State
  editingSessionId: string | null;
  editTitle: string;
  expandedSessionId: string | null;
  sessionNotes: Record<string, string>;
  
  // Actions
  addSession: (session: ActiveSessionState) => void;
  removeSession: (sessionId: string) => void;
  updateSession: (sessionId: string, updates: Partial<ActiveSessionState>) => void;
  setElapsedTime: (sessionId: string, time: number) => void;
  updateAllElapsedTimes: () => void;
  clearAllElapsedTimes: () => void;
  
  // Editing actions
  startEditingTitle: (sessionId: string) => void;
  setEditTitle: (title: string) => void;
  saveTitle: (sessionId: string, newTitle: string) => void;
  cancelEditTitle: () => void;
  
  // Note actions
  setSessionNote: (sessionId: string, note: string) => void;
  saveNote: (sessionId: string) => void;
  
  // Expand actions
  toggleExpand: (sessionId: string) => void;
  closeExpand: () => void;
  
  // Sync tracking
  markAsSynced: (sessionId: string) => void;
  removeSyncedId: (sessionId: string) => void;
  
  // Hydration from DB
  syncFromDatabase: (dbSessions: Array<{
    id: string;
    task: Task;
    title: string;
    note: string;
    started_at: number;
  }>) => void;
}

export const useActiveSessionsStore = create<ActiveSessionsState>((set, get) => ({
  // Initial state
  activeSessions: [],
  elapsedTimes: {},
  syncedSessionIds: new Set(),
  editingSessionId: null,
  editTitle: '',
  expandedSessionId: null,
  sessionNotes: {},

  // Add a new session
  addSession: (session) => {
    set((state) => ({
      activeSessions: [...state.activeSessions, session],
      elapsedTimes: { ...state.elapsedTimes, [session.id]: 0 },
      syncedSessionIds: new Set([...state.syncedSessionIds, session.id]),
      sessionNotes: { ...state.sessionNotes, [session.id]: session.note || '' },
    }));
  },

  // Remove a session (when stopped)
  removeSession: (sessionId) => {
    set((state) => {
      const { [sessionId]: _, ...restElapsed } = state.elapsedTimes;
      const { [sessionId]: __, ...restNotes } = state.sessionNotes;
      const newSyncedIds = new Set(state.syncedSessionIds);
      newSyncedIds.delete(sessionId);
      
      return {
        activeSessions: state.activeSessions.filter((s) => s.id !== sessionId),
        elapsedTimes: restElapsed,
        sessionNotes: restNotes,
        syncedSessionIds: newSyncedIds,
        editingSessionId: state.editingSessionId === sessionId ? null : state.editingSessionId,
        expandedSessionId: state.expandedSessionId === sessionId ? null : state.expandedSessionId,
      };
    });
  },

  // Update session properties
  updateSession: (sessionId, updates) => {
    set((state) => ({
      activeSessions: state.activeSessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    }));
  },

  // Set elapsed time for a specific session
  setElapsedTime: (sessionId, time) => {
    set((state) => ({
      elapsedTimes: { ...state.elapsedTimes, [sessionId]: time },
    }));
  },

  // Update all elapsed times based on current time
  updateAllElapsedTimes: () => {
    const state = get();
    const now = Date.now();
    const newElapsedTimes: Record<string, number> = {};
    
    state.activeSessions.forEach((session) => {
      newElapsedTimes[session.id] = Math.floor((now - session.startTime) / 1000);
    });
    
    set({ elapsedTimes: newElapsedTimes });
  },

  // Clear all elapsed times
  clearAllElapsedTimes: () => {
    set({ elapsedTimes: {} });
  },

  // Start editing title
  startEditingTitle: (sessionId) => {
    const session = get().activeSessions.find((s) => s.id === sessionId);
    if (session) {
      set({
        editingSessionId: sessionId,
        editTitle: session.title,
      });
    }
  },

  // Update edit title value
  setEditTitle: (title) => {
    set({ editTitle: title });
  },

  // Save the edited title
  saveTitle: (sessionId, newTitle) => {
    set((state) => ({
      activeSessions: state.activeSessions.map((s) =>
        s.id === sessionId ? { ...s, title: newTitle } : s
      ),
      editingSessionId: null,
      editTitle: '',
    }));
  },

  // Cancel editing
  cancelEditTitle: () => {
    set({
      editingSessionId: null,
      editTitle: '',
    });
  },

  // Set note for a session (local state)
  setSessionNote: (sessionId, note) => {
    set((state) => ({
      sessionNotes: { ...state.sessionNotes, [sessionId]: note },
    }));
  },

  // Save note to session
  saveNote: (sessionId) => {
    const note = get().sessionNotes[sessionId] || '';
    set((state) => ({
      activeSessions: state.activeSessions.map((s) =>
        s.id === sessionId ? { ...s, note } : s
      ),
    }));
  },

  // Toggle expand view
  toggleExpand: (sessionId) => {
    set((state) => ({
      expandedSessionId: state.expandedSessionId === sessionId ? null : sessionId,
    }));
  },

  // Close expand view
  closeExpand: () => {
    set({ expandedSessionId: null });
  },

  // Mark session as synced with DB
  markAsSynced: (sessionId) => {
    set((state) => ({
      syncedSessionIds: new Set([...state.syncedSessionIds, sessionId]),
    }));
  },

  // Remove synced ID
  removeSyncedId: (sessionId) => {
    set((state) => {
      const newSyncedIds = new Set(state.syncedSessionIds);
      newSyncedIds.delete(sessionId);
      return { syncedSessionIds: newSyncedIds };
    });
  },

  // Sync from database - only adds sessions not already synced
  syncFromDatabase: (dbSessions) => {
    set((state) => {
      const localSessionIds = new Set(state.activeSessions.map((s) => s.id));
      const newSyncedIds = new Set(state.syncedSessionIds);
      let hasChanges = false;
      const newSessions: ActiveSessionState[] = [];

      dbSessions.forEach((dbSession) => {
        if (!localSessionIds.has(dbSession.id) && !state.syncedSessionIds.has(dbSession.id)) {
          newSessions.push({
            id: dbSession.id,
            task: dbSession.task,
            title: dbSession.title || '',
            note: dbSession.note || '',
            startTime: dbSession.started_at,
          });
          newSyncedIds.add(dbSession.id);
          hasChanges = true;
        }
      });

      if (!hasChanges) return state;

      const newElapsedTimes: Record<string, number> = { ...state.elapsedTimes };
      const newNotes: Record<string, string> = { ...state.sessionNotes };
      const now = Date.now();

      newSessions.forEach((session) => {
        newElapsedTimes[session.id] = Math.floor((now - session.startTime) / 1000);
        newNotes[session.id] = session.note || '';
      });

      return {
        activeSessions: [...state.activeSessions, ...newSessions],
        syncedSessionIds: newSyncedIds,
        elapsedTimes: newElapsedTimes,
        sessionNotes: newNotes,
      };
    });
  },
}));
