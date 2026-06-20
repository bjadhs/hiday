import { useState, useMemo, useCallback } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useSessions } from '@/lib/hooks/use-sessions';
import { useProjects } from '@/lib/hooks/use-projects';
import { HistorySession, Project, ViewMode } from '@/lib/types';
import { isToday } from '@/components/history/utils';

export function useHistoryPage() {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    // History content is client-only (ssr: false), so we can use the real date immediately.
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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

    // Fetch real sessions and projects
    const { data: dbSessions = [], isLoading: isLoadingSessions } = useSessions(startOfDay, endOfDay, {
      placeholderData: keepPreviousData,
    });
    const { data: projects = [], isLoading: isLoadingProjects } = useProjects();

    // Transform DB sessions to HistorySession format
    const sessions: HistorySession[] = useMemo(() => {
        return dbSessions.map(session => {
            const project = projects.find(t => t.id === session.project_id) || {
                id: session.project_id || 'unknown',
                name: 'Unknown Project',
                color: '#6B7280',
                icon: '❓',
            };
            return {
                id: session.id,
                projectId: session.project_id || '',
                project: project as Project,
                startedAt: session.started_at,
                endedAt: session.ended_at,
                duration: session.duration || 0,
                title: session.title || undefined,
                note: session.note || undefined,
            };
        });
    }, [dbSessions, projects]);

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
        isLoading: isLoadingSessions || isLoadingProjects,
        navigateDate,
        goToToday,
        editingSession,
        isEditDialogOpen,
        handleEditSession,
        handleCloseEditDialog,
        isToday: isToday(selectedDate),
    };
}
