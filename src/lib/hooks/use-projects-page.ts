import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, useReorderProjects } from '@/lib/hooks/use-projects';
import { DBProject, EditableProject } from '@/components/projects/types';
import { PROJECT_COLORS, PROJECT_ICONS } from '@/lib/constant';
import { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

interface ReorderProjectInput {
  id: string;
  name: string;
}

export function useProjectsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');
    const analyticsId = searchParams.get('analytics');

    const { data: projectsData = [], isLoading: isLoadingProjects } = useProjects();
    const createProjectMutation = useCreateProject();
    const updateProjectMutation = useUpdateProject();
    const deleteProjectMutation = useDeleteProject();
    const reorderProjectsMutation = useReorderProjects();

    const [isCreating, setIsCreating] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [sortBy, setSortBy] = useState<'name' | 'order' | 'newest'>('order');
    const [orderedProjects, setOrderedProjects] = useState<DBProject[]>([]);

    // Initialize ordered projects from fetched data only once or when empty
    const initializedRef = useRef(false);
    useEffect(() => {
        if (initializedRef.current || projectsData.length === 0) return;
        initializedRef.current = true;
        setOrderedProjects([...projectsData]);
    }, [projectsData]);

    const editingProject = useMemo(() =>
        editId && editId !== 'new' ? orderedProjects.find((t) => t.id === editId) : null
        , [editId, orderedProjects]);

    const analyzingProject = useMemo(() =>
        analyticsId ? orderedProjects.find((t) => t.id === analyticsId) : null
        , [analyticsId, orderedProjects]);

    const handleDragEnd = useCallback(
        async (event: DragEndEvent) => {
            const { active, over } = event;
            if (over && active.id !== over.id) {
                const oldIndex = orderedProjects.findIndex((t) => t.id === active.id);
                const newIndex = orderedProjects.findIndex((t) => t.id === over.id);
                const newOrder = arrayMove(orderedProjects, oldIndex, newIndex);
                setOrderedProjects(newOrder);
                try {
                    await reorderProjectsMutation.mutateAsync(newOrder.map((t) => ({ id: t.id, name: t.name } as ReorderProjectInput)));
                } catch (error) {
                    console.error('Failed to reorder projects:', error);
                    setOrderedProjects(projectsData);
                }
            }
        },
        [orderedProjects, reorderProjectsMutation, projectsData]
    );

    const handleSaveProject = useCallback(
        async (updatedProject: EditableProject) => {
            try {
                if (!updatedProject.id || updatedProject.id.startsWith('new-')) {
                    const { id: _id, ...cleanProject } = updatedProject;
                    void _id;
                    await createProjectMutation.mutateAsync({
                        ...cleanProject,
                        archived: false,
                        sort_order: -1, // Ensure new projects come first
                    } as Omit<EditableProject, 'id'>);
                } else {
                    const { id, ...updates } = updatedProject;
                    await updateProjectMutation.mutateAsync({ id: id!, updates: updates as Partial<EditableProject> });
                }
                router.push('/projects');
                setIsCreating(false);
            } catch (error) {
                console.error('Failed to save project:', error);
            }
        },
        [router, createProjectMutation, updateProjectMutation]
    );

    const handleDeleteProject = useCallback(
        async (projectId: string) => {
            try {
                await deleteProjectMutation.mutateAsync(projectId);
                router.push('/projects');
            } catch (error) {
                console.error('Failed to delete project:', error);
            }
        },
        [router, deleteProjectMutation]
    );

    const sortedProjects = useMemo(() => {
        if (sortBy === 'order') return orderedProjects;
        return [...orderedProjects].sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'newest') return (b.created_at || 0) - (a.created_at || 0);
            return (a.sort_order || 0) - (b.sort_order || 0);
        });
    }, [orderedProjects, sortBy]);

    const newInitialProject: EditableProject = {
        name: '',
        color: PROJECT_COLORS[0],
        icon: PROJECT_ICONS[0],
        goal_duration: 30,
        goal_type: 'none',
        project_tags: [],
        note_prompt: false,
        default_note: '',
    };

    return {
        isLoadingProjects,
        viewMode,
        setViewMode,
        sortBy,
        setSortBy,
        orderedProjects,
        sortedProjects,
        editingProject,
        analyzingProject,
        isCreating,
        setIsCreating,
        editId,
        newInitialProject,
        isSaving: createProjectMutation.isPending || updateProjectMutation.isPending,
        isDeleting: deleteProjectMutation.isPending,
        handleDragEnd,
        handleSaveProject,
        handleDeleteProject,
        router,
    };
}
