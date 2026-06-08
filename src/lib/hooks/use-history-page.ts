import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSessions } from '@/lib/hooks/use-sessions';
import { useTasks } from '@/lib/hooks/use-tasks';
import { HistorySession, Task, ViewMode } from '@/lib/types';
import { isToday } from '@/components/history/utils';

export function useHistoryPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    // Use fixed epoch date for SSR, sync to real date after hydration
    const [selectedDate, setSelectedDate] = useState<Date>(new Date(0));

    // Sync to real current date after hydration
    useEffect(() => {
        setSelectedDate(new Date());
    }, []);

    // Edit dialog state
    const [editingSession, setEditingSession] = useState<HistorySession | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    // Calculate date range for fetching sessions
    const startOfDay = useMemo(() => {
        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
    }, [selectedDate]);

    const endOfDay = useMemo(() => {
        const date = new Date(selectedDate);
        date.setHours(23, 59, 59, 999);
        return date.getTime();
    }, [selectedDate]);

    // Fetch real sessions and tasks
    const { data: dbSessions = [], isLoading: isLoadingSessions } = useSessions(startOfDay, endOfDay);
    const { data: tasks = [], isLoading: isLoadingTasks } = useTasks();

    // Transform DB sessions to HistorySession format
    const sessions: HistorySession[] = useMemo(() => {
        return dbSessions.map(session => {
            const task = tasks.find(t => t.id === session.task_id) || {
                id: session.task_id,
                name: 'Unknown Task',
                color: '#6B7280',
                icon: '❓',
            };
            return {
                id: session.id,
                taskId: session.task_id,
                task: task as Task,
                startedAt: session.started_at,
                endedAt: session.ended_at,
                duration: session.duration || 0,
                title: session.title || undefined,
                note: session.note || undefined,
            };
        });
    }, [dbSessions, tasks]);

    const navigateDate = useCallback((days: number) => {
        setSelectedDate((prev) => {
            const newDate = new Date(prev);
            newDate.setDate(newDate.getDate() + days);
            return newDate;
        });
    }, []);

    const goToToday = useCallback(() => setSelectedDate(new Date()), []);

    const handleEditSession = useCallback((session: HistorySession) => {
        setEditingSession(session);
        setIsEditDialogOpen(true);
    }, []);

    const handleCloseEditDialog = useCallback(() => {
        setIsEditDialogOpen(false);
        setEditingSession(null);
    }, []);

    return {
        viewMode,
        setViewMode,
        selectedDate,
        sessions,
        isLoading: isLoadingSessions || isLoadingTasks,
        navigateDate,
        goToToday,
        editingSession,
        isEditDialogOpen,
        handleEditSession,
        handleCloseEditDialog,
        isToday: isToday(selectedDate),
    };
}
