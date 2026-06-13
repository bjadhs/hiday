'use client';

import { Plus, Sparkles, ListTodo, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Task } from '@/lib/types';
import { ActiveSessionState } from '@/lib/stores/active-sessions-store';
import { TaskButton } from './task-button';

interface TasksGridProps {
  tasks: Task[];
  activeSessions: ActiveSessionState[];
  onStartTask: (task: Task) => void;
  onStopSession: (sessionId: string) => void;
  isPending: boolean;
}

/**
 * TasksGrid
 * 
 * A grid of task buttons for quick starting/stopping of time tracking.
 * Shows all available tasks with their active status.
 * 
 * @example
 * ```tsx
 * <TasksGrid
 *   tasks={tasks}
 *   activeSessions={activeSessions}
 *   onStartTask={handleStartTask}
 *   onStopSession={handleStopSession}
 *   isPending={false}
 * />
 * ```
 */
export function TasksGrid({
  tasks,
  activeSessions,
  onStartTask,
  onStopSession,
  isPending,
}: TasksGridProps) {
  return (
    <div className="bg-surface border-2 border-border-strong rounded-xl shadow-brutal h-full min-h-0 flex flex-col overflow-hidden">
      <div className="p-2 lg:p-3 border-b-2 border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Tasks</h2>
          </div>
          <Link
            href="/tasks?edit=new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white font-semibold border-2 border-border-strong dark:border-white/20 shadow-brutal-sm btn-brutal"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </Link>
        </div>
      </div>

      <div className="p-4 lg:p-6 flex-1 overflow-y-auto min-h-0">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-5 shadow-brutal-sm">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-black mb-2">No tasks yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
              A task is anything you want to track time for. Create one to start logging focused sessions.
            </p>
            <Link
              href="/tasks?edit=new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold border-2 border-border-strong shadow-brutal-sm btn-brutal text-sm"
            >
              <ListTodo className="w-4 h-4" />
              Create your first task
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2 lg:gap-3">
            {tasks.map((task) => {
              const activeCount = activeSessions.filter(
                (s) => s.task.id === task.id
              ).length;
              const isActive = activeCount > 0;
              const activeSessionForTask = activeSessions.find(
                (s) => s.task.id === task.id
              );

              return (
                <TaskButton
                  key={task.id}
                  task={task}
                  isActive={isActive}
                  activeCount={activeCount}
                  onClick={() =>
                    isActive && activeSessionForTask
                      ? onStopSession(activeSessionForTask.id)
                      : onStartTask(task)
                  }
                  isPending={isPending}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
