'use client';

import { Suspense } from 'react';
import { useProjectsPage } from '@/lib/hooks/use-projects-page';
import { ProjectAnalyticsModal } from '@/components/projects/project-analytics-modal';
import { ProjectFormModal } from '@/components/projects/project-form-modal';
import { ProjectsHeader } from '@/components/projects/projects-header';
import { ProjectsList } from '@/components/projects/projects-list';

function ProjectsPageContent() {
  const {
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
    isSaving,
    isDeleting,
    handleDragEnd,
    handleSaveProject,
    handleDeleteProject,
    router,
  } = useProjectsPage();

  if (isLoadingProjects) {
    return (
      <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
        <div className='flex-1 p-4 lg:p-8 max-w-3xl mx-auto w-full'>
          <div className='animate-pulse space-y-4'>
            <div className='h-8 w-32 bg-muted rounded' />
            <div className='h-20 bg-muted rounded-xl' />
            <div className='h-20 bg-muted rounded-xl' />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
      {analyzingProject && (
        <ProjectAnalyticsModal
          project={analyzingProject}
          onClose={() => router.push('/projects')}
        />
      )}

      {(editId || isCreating) && (
        <ProjectFormModal
          project={editId === 'new' ? newInitialProject : (editingProject || newInitialProject)}
          isNew={editId === 'new' || isCreating}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
          onCancel={() => { setIsCreating(false); router.push('/projects'); }}
          isSaving={isSaving}
          isDeleting={isDeleting}
        />
      )}

      <div className='flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full space-y-8'>
        <ProjectsHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onCreate={() => { setIsCreating(true); router.push('/projects?edit=new'); }}
        />

        <ProjectsList
          sortedProjects={sortedProjects}
          orderedProjects={orderedProjects}
          viewMode={viewMode}
          sortBy={sortBy}
          onDragEnd={handleDragEnd}
          onEdit={(id) => router.push(`/projects?edit=${id}`)}
          onAnalytics={(id) => router.push(`/projects?analytics=${id}`)}
          onCreate={() => { setIsCreating(true); router.push('/projects?edit=new'); }}
        />
      </div>
    </main>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={
      <main className='flex-1 flex flex-col pb-20 lg:pb-0'>
        <div className='flex-1 p-4 lg:p-8 max-w-3xl mx-auto w-full'>
          <div className='animate-pulse space-y-4'>
            <div className='h-8 w-32 bg-muted rounded' />
            <div className='h-20 bg-muted rounded-xl' />
            <div className='h-20 bg-muted rounded-xl' />
          </div>
        </div>
      </main>
    }>
      <ProjectsPageContent />
    </Suspense>
  );
}
