'use client';

import { create } from 'zustand';
import { Project } from '@/lib/types';

// Single active session state
export interface ActiveSessionState {
  id: string;
  project: Project;
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
  promptingSessionId: string | null;
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
  
  // Note prompt actions
  startPromptingNote: (sessionId: string) => void;
  cancelPromptNote: () => void;
  
  // Sync tracking
  markAsSynced: (sessionId: string) => void;
  removeSyncedId: (sessionId: string) => void;
  
  // Hydration from DB
  syncFromDatabase: (dbSessions: Array<{
    id: string;
    project: Project | null;
    title: string;
    note: string;
    started_at: number | null;
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
  promptingSessionId: null,
  sessionNotes: {},

  // Add a new session - prepend to maintain newest-first order
  // Removes any optimistic sessions for the same project to prevent duplicates
  addSession: (session) => {
    set((state) => {
      // Filter out optimistic sessions for the same project
      const filteredSessions = state.activeSessions.filter((s) => {
        // Keep if it's not an optimistic session for this project
        const isOptimisticForThisProject = s.id.startsWith('optimistic-') && s.project.id === session.project.id;
        return !isOptimisticForThisProject;
      });

      return {
        activeSessions: [session, ...filteredSessions],
        elapsedTimes: { ...state.elapsedTimes, [session.id]: 0 },
        syncedSessionIds: new Set([...state.syncedSessionIds, session.id]),
        sessionNotes: { ...state.sessionNotes, [session.id]: session.note || '' },
      };
    });
  },

  // Remove a session (when stopped)
  removeSession: (sessionId) => {
    set((state) => {
      const restElapsed = Object.fromEntries(
        Object.entries(state.elapsedTimes).filter(([key]) => key !== sessionId)
      );
      const restNotes = Object.fromEntries(
        Object.entries(state.sessionNotes).filter(([key]) => key !== sessionId)
      );
      const newSyncedIds = new Set(state.syncedSessionIds);
      newSyncedIds.delete(sessionId);

      return {
        activeSessions: state.activeSessions.filter((s) => s.id !== sessionId),
        elapsedTimes: restElapsed,
        sessionNotes: restNotes,
        syncedSessionIds: newSyncedIds,
        editingSessionId: state.editingSessionId === sessionId ? null : state.editingSessionId,
        expandedSessionId: state.expandedSessionId === sessionId ? null : state.expandedSessionId,
        promptingSessionId: state.promptingSessionId === sessionId ? null : state.promptingSessionId,
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
  
  // Start prompting for note (when stopping a session that requires note)
  startPromptingNote: (sessionId) => {
    set({ promptingSessionId: sessionId });
  },
  
  // Cancel note prompt
  cancelPromptNote: () => {
    set({ promptingSessionId: null });
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

  // Sync from database - adds sessions not already synced and removes optimistic ones
  syncFromDatabase: (dbSessions) => {
    set((state) => {
      const localSessionIds = new Set(state.activeSessions.map((s) => s.id));
      const newSyncedIds = new Set(state.syncedSessionIds);
      let hasChanges = false;
      const newSessions: ActiveSessionState[] = [];

      dbSessions.forEach((dbSession) => {
        // A running timer always has a project; skip project-less rows (e.g. inbox /
        // unscheduled todos) that should never appear as active sessions.
        if (!dbSession.project) return;
        if (!localSessionIds.has(dbSession.id) && !state.syncedSessionIds.has(dbSession.id)) {
          newSessions.push({
            id: dbSession.id,
            project: dbSession.project,
            title: dbSession.title || '',
            note: dbSession.note || '',
            startTime: dbSession.started_at || Date.now(),
          });
          newSyncedIds.add(dbSession.id);
          hasChanges = true;
        }
      });

      if (!hasChanges) return state;

      const newElapsedTimes: Record<string, number> = { ...state.elapsedTimes };
      const newNotes: Record<string, string> = { ...state.sessionNotes };
      const now = Date.now();

      // Remove optimistic sessions for the same projects to prevent duplicates
      const dbProjectIds = new Set(
        dbSessions.map((s) => s.project?.id).filter((id): id is string => id != null),
      );
      const filteredSessions = state.activeSessions.filter((s) => {
        // Keep non-optimistic sessions or optimistic sessions for different projects
        const isOptimistic = s.id.startsWith('optimistic-');
        const isSameProject = dbProjectIds.has(s.project.id);
        if (isOptimistic && isSameProject) {
          // Clean up elapsed time and notes for removed optimistic session
          delete newElapsedTimes[s.id];
          delete newNotes[s.id];
          return false;
        }
        return true;
      });

      newSessions.forEach((session) => {
        newElapsedTimes[session.id] = Math.floor((now - session.startTime) / 1000);
        newNotes[session.id] = session.note || '';
      });

      return {
        activeSessions: [...newSessions, ...filteredSessions],
        syncedSessionIds: newSyncedIds,
        elapsedTimes: newElapsedTimes,
        sessionNotes: newNotes,
      };
    });
  },
}));
