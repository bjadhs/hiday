import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Project, HistorySession } from '@/lib/types';
import { useProjects } from '@/lib/hooks/use-projects';
import {
    useTodaySessions,
    useActiveSessions,
    useStartSession,
    useStopSession,
    useUpdateSession,
} from '@/lib/hooks/use-sessions';
import { useActiveSessionsStore } from '@/lib/stores/active-sessions-store';

// Default project when no projects exist
const defaultProject: Project = {
    id: 'inbox',
    name: 'Inbox',
    color: '#6B7280',
    icon: '📥',
};

export function useTrackPage() {
    // Zustand store
    const {
        activeSessions,
        removeSession,
        syncFromDatabase
    } = useActiveSessionsStore();

    // Edit dialog state (kept in component as it's UI-specific)
    const [editingSession, setEditingSession] = useState<HistorySession | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Fetch data using React Query
    const {
        data: projects = [],
        isLoading: isLoadingProjects,
        error: projectsError,
    } = useProjects();

    const {
        data: todaySessions = [],
        isLoading: isLoadingSessions,
        refetch: refetchTodaySessions,
    } = useTodaySessions();

    // Use the hook that returns ALL active sessions
    const { data: activeDbSessions = [], isLoading: isLoadingActiveSessions } = useActiveSessions();

    // Mutations
    const startSessionMutation = useStartSession();
    const stopSessionMutation = useStopSession();
    const updateSessionMutation = useUpdateSession();


    // Calculate recent projects (unique projects from today sessions, max 4)
    const recentProjects = useMemo(() => {
        const projectMap = new Map<string, Project>();
        
        // Iterate through today's sessions to find unique projects
        for (const session of todaySessions) {
            if (session.projects && !projectMap.has(session.projects.id)) {
                projectMap.set(session.projects.id, {
                    id: session.projects.id,
                    name: session.projects.name,
                    color: session.projects.color,
                    icon: session.projects.icon,
                });
            }
            if (projectMap.size >= 4) break;
        }
        
        // If we don't have 4 projects from today, add from all projects
        if (projectMap.size < 4) {
            for (const project of projects) {
                if (!projectMap.has(project.id)) {
                    projectMap.set(project.id, project);
                }
                if (projectMap.size >= 4) break;
            }
        }
        
        return Array.from(projectMap.values());
    }, [todaySessions, projects]);

    // Track if we're in the middle of adding a session to prevent sync conflicts
    const isAddingSessionRef = useRef(false);

    // Sync with database active sessions - ONE WAY sync from DB to local
    // BUT skip if we're actively adding a session to prevent flickering
    useEffect(() => {
        if (isLoadingActiveSessions) return;
        if (isAddingSessionRef.current) return; // Skip while adding
        if (!activeDbSessions.length) return;

        // Convert DB sessions to the format expected by the store
        const sessionsForSync = activeDbSessions.map((dbSession) => ({
            id: dbSession.id,
            project: dbSession.projects,
            title: dbSession.title || '',
            note: dbSession.note || '',
            started_at: dbSession.started_at,
        }));

        syncFromDatabase(sessionsForSync);
    }, [activeDbSessions, isLoadingActiveSessions, syncFromDatabase]);

    const startProject = useCallback(async (project: Project, startTime?: number) => {
        try {
            isAddingSessionRef.current = true; // Mark that we're adding

            const newSession = await startSessionMutation.mutateAsync({
                projectId: project.id,
                title: project.name,
                startTime,
            });

            // Add to Zustand store with the correct start time (prepend to maintain order)
            useActiveSessionsStore.getState().addSession({
                id: newSession.id,
                project,
                title: project.name,
                note: '',
                startTime: startTime || Date.now(),
            });

            // Keep flag true briefly to let React Query stabilize
            setTimeout(() => {
                isAddingSessionRef.current = false;
            }, 2000);
        } catch (error) {
            console.error('Failed to start session:', error);
            isAddingSessionRef.current = false;
        }
    }, [startSessionMutation]);

    const stopSession = useCallback(async (sessionId: string) => {
        // Immediately remove from local state for instant UI feedback
        removeSession(sessionId);

        try {
            await stopSessionMutation.mutateAsync(sessionId);
        } catch (error) {
            console.error('Failed to stop session:', error);
            alert('Failed to stop session. Please try again.');
        }
    }, [removeSession, stopSessionMutation]);



    const updateSession = useCallback(async (sessionId: string, updates: { title?: string; note?: string; projectId?: string; started_at?: number }) => {
        try {
            // Convert camelCase to snake_case for the database
            const dbUpdates: { title?: string; note?: string; project_id?: string; started_at?: number } = {};
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.note !== undefined) dbUpdates.note = updates.note;
            if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
            if (updates.started_at !== undefined) dbUpdates.started_at = updates.started_at;

            await updateSessionMutation.mutateAsync({
                id: sessionId,
                updates: dbUpdates,
            });

            // If project changed, update the local store
            if (updates.projectId) {
                const newProject = projects.find(t => t.id === updates.projectId);
                if (newProject) {
                    const { activeSessions } = useActiveSessionsStore.getState();
                    const session = activeSessions.find(s => s.id === sessionId);
                    if (session) {
                        // Update the session in the store with the new project
                        // The title will be updated separately when user saves in edit mode
                        useActiveSessionsStore.getState().updateSession(sessionId, { project: newProject });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to update session:', error);
        }
    }, [updateSessionMutation, projects]);

    const handleEditSession = useCallback((session: HistorySession) => {
        setEditingSession(session);
        setIsEditDialogOpen(true);
    }, []);

    const handleCloseEditDialog = useCallback(() => {
        setIsEditDialogOpen(false);
        setEditingSession(null);
    }, []);

    // Get first project as default or use fallback
    const firstProject = projects[0] || defaultProject;

    // Listen for global shortcut to start a default session
    useEffect(() => {
        function handleStartDefaultSession() {
            startProject(firstProject);
        }
        window.addEventListener('hiday:start-default-session', handleStartDefaultSession);
        return () => window.removeEventListener('hiday:start-default-session', handleStartDefaultSession);
    }, [firstProject, startProject]);

    return {
        activeSessions,
        editingSession,
        isEditDialogOpen,
        projects,
        todaySessions,
        isLoadingProjects,
        isLoadingSessions,
        projectsError,
        startSessionMutation,
        stopSessionMutation,
        recentProjects,
        startProject,
        stopSession,
        updateSession,
        handleEditSession,
        handleCloseEditDialog,
        refetchTodaySessions,
        firstProject,
    };
}
