import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Task, HistorySession } from '@/lib/types';
import { useTasks } from '@/lib/hooks/use-tasks';
import {
    useTodaySessions,
    useActiveSessions,
    useStartSession,
    useStopSession,
    useUpdateSession,
} from '@/lib/hooks/use-sessions';
import { useActiveSessionsStore } from '@/lib/stores/active-sessions-store';

// Default task when no tasks exist
const defaultTask: Task = {
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
        data: tasks = [],
        isLoading: isLoadingTasks,
        error: tasksError,
    } = useTasks();

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


    // Calculate recent tasks (unique tasks from today sessions, max 4)
    const recentTasks = useMemo(() => {
        const taskMap = new Map<string, Task>();
        
        // Iterate through today's sessions to find unique tasks
        for (const session of todaySessions) {
            if (session.tasks && !taskMap.has(session.tasks.id)) {
                taskMap.set(session.tasks.id, {
                    id: session.tasks.id,
                    name: session.tasks.name,
                    color: session.tasks.color,
                    icon: session.tasks.icon,
                });
            }
            if (taskMap.size >= 4) break;
        }
        
        // If we don't have 4 tasks from today, add from all tasks
        if (taskMap.size < 4) {
            for (const task of tasks) {
                if (!taskMap.has(task.id)) {
                    taskMap.set(task.id, task);
                }
                if (taskMap.size >= 4) break;
            }
        }
        
        return Array.from(taskMap.values());
    }, [todaySessions, tasks]);

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
            task: dbSession.tasks,
            title: dbSession.title || '',
            note: dbSession.note || '',
            started_at: dbSession.started_at,
        }));

        syncFromDatabase(sessionsForSync);
    }, [activeDbSessions, isLoadingActiveSessions, syncFromDatabase]);

    const startTask = useCallback(async (task: Task, startTime?: number) => {
        try {
            isAddingSessionRef.current = true; // Mark that we're adding

            const newSession = await startSessionMutation.mutateAsync({
                taskId: task.id,
                title: task.name,
                startTime,
            });

            // Add to Zustand store with the correct start time (prepend to maintain order)
            useActiveSessionsStore.getState().addSession({
                id: newSession.id,
                task,
                title: task.name,
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



    const updateSession = useCallback(async (sessionId: string, updates: { title?: string; note?: string; taskId?: string; started_at?: number }) => {
        try {
            // Convert camelCase to snake_case for the database
            const dbUpdates: { title?: string; note?: string; task_id?: string; started_at?: number } = {};
            if (updates.title !== undefined) dbUpdates.title = updates.title;
            if (updates.note !== undefined) dbUpdates.note = updates.note;
            if (updates.taskId !== undefined) dbUpdates.task_id = updates.taskId;
            if (updates.started_at !== undefined) dbUpdates.started_at = updates.started_at;

            await updateSessionMutation.mutateAsync({
                id: sessionId,
                updates: dbUpdates,
            });

            // If task changed, update the local store
            if (updates.taskId) {
                const newTask = tasks.find(t => t.id === updates.taskId);
                if (newTask) {
                    const { activeSessions } = useActiveSessionsStore.getState();
                    const session = activeSessions.find(s => s.id === sessionId);
                    if (session) {
                        // Update the session in the store with the new task
                        // The title will be updated separately when user saves in edit mode
                        useActiveSessionsStore.getState().updateSession(sessionId, { task: newTask });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to update session:', error);
        }
    }, [updateSessionMutation, tasks]);

    const handleEditSession = useCallback((session: HistorySession) => {
        setEditingSession(session);
        setIsEditDialogOpen(true);
    }, []);

    const handleCloseEditDialog = useCallback(() => {
        setIsEditDialogOpen(false);
        setEditingSession(null);
    }, []);

    // Get first task as default or use fallback
    const firstTask = tasks[0] || defaultTask;

    // Listen for global shortcut to start a default session
    useEffect(() => {
        function handleStartDefaultSession() {
            startTask(firstTask);
        }
        window.addEventListener('hiday:start-default-session', handleStartDefaultSession);
        return () => window.removeEventListener('hiday:start-default-session', handleStartDefaultSession);
    }, [firstTask, startTask]);

    return {
        activeSessions,
        editingSession,
        isEditDialogOpen,
        tasks,
        todaySessions,
        isLoadingTasks,
        isLoadingSessions,
        tasksError,
        startSessionMutation,
        stopSessionMutation,
        recentTasks,
        startTask,
        stopSession,
        updateSession,
        handleEditSession,
        handleCloseEditDialog,
        refetchTodaySessions,
        firstTask,
    };
}
