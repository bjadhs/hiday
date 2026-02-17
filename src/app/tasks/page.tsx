'use client';

import { Suspense } from 'react';
import { useTasksPage } from '@/lib/hooks/use-tasks-page';
import { TaskAnalyticsModal } from '@/app/components/tasks/task-analytics-modal';
import { TaskFormModal } from '@/app/components/tasks/task-form-modal';
import { TasksHeader } from '@/app/components/tasks/tasks-header';
import { TasksList } from '@/app/components/tasks/tasks-list';

function TasksPageContent() {
  const {
    isLoadingTasks,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
    orderedTasks,
    sortedTasks,
    editingTask,
    analyzingTask,
    isCreating,
    setIsCreating,
    editId,
    newInitialTask,
    isSaving,
    isDeleting,
    handleDragEnd,
    handleSaveTask,
    handleDeleteTask,
    router,
  } = useTasksPage();

  if (isLoadingTasks) {
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
      {analyzingTask && (
        <TaskAnalyticsModal
          task={analyzingTask}
          onClose={() => router.push('/tasks')}
        />
      )}

      {(editId || isCreating) && (
        <TaskFormModal
          task={editId === 'new' ? newInitialTask : (editingTask || newInitialTask)}
          isNew={editId === 'new' || isCreating}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onCancel={() => { setIsCreating(false); router.push('/tasks'); }}
          isSaving={isSaving}
          isDeleting={isDeleting}
        />
      )}

      <div className='flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full space-y-8'>
        <TasksHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onCreate={() => { setIsCreating(true); router.push('/tasks?edit=new'); }}
        />

        <TasksList
          sortedTasks={sortedTasks}
          orderedTasks={orderedTasks}
          viewMode={viewMode}
          sortBy={sortBy}
          onDragEnd={handleDragEnd}
          onEdit={(id) => router.push(`/tasks?edit=${id}`)}
          onAnalytics={(id) => router.push(`/tasks?analytics=${id}`)}
          onCreate={() => { setIsCreating(true); router.push('/tasks?edit=new'); }}
        />
      </div>
    </main>
  );
}

export default function TasksPage() {
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
      <TasksPageContent />
    </Suspense>
  );
}
