'use client';

import { memo } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type TaskDropdownProps = {
  /** Currently selected task */
  selectedTask: Task;
  /** List of available tasks to choose from */
  tasks: Task[];
  /** Callback when a task is selected */
  onTaskChange: (task: Task) => void;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
};

/**
 * TaskDropdown
 *
 * A dropdown component for selecting tasks. Displays the current task as a
 * clickable badge with color and icon. Clicking opens a dropdown menu with
 * all available tasks.
 *
 * @example
 * ```tsx
 * <TaskDropdown
 *   selectedTask={currentTask}
 *   tasks={allTasks}
 *   onTaskChange={(task) => console.log('Selected:', task.name)}
 * />
 * ```
 */
export const TaskDropdown = memo(function TaskDropdown({
  selectedTask,
  tasks,
  onTaskChange,
  className,
  size = 'sm',
}: TaskDropdownProps) {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  const itemIconSizes = {
    sm: 'w-5 h-5 text-xs',
    md: 'w-6 h-6 text-sm',
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-1 rounded shrink-0 hover:opacity-80 transition-opacity cursor-pointer',
            sizeClasses[size],
            className
          )}
          style={{
            backgroundColor: `${selectedTask.color}20`,
            color: selectedTask.color,
          }}
        >
          <span>{selectedTask.icon}</span>
          <span className="font-medium">{selectedTask.name}</span>
          <ChevronDown className={cn('ml-0.5', iconSizes[size])} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="border-2 border-border-strong shadow-brutal w-44 bg-surface/95 bg-surface/95 backdrop-blur-sm"
      >
        {tasks.map((task) => (
          <DropdownMenuItem
            key={task.id}
            onClick={() => onTaskChange(task)}
            className={cn(
              'cursor-pointer flex items-center gap-2 py-1.5',
              selectedTask.id === task.id && 'bg-primary/10 font-medium'
            )}
          >
            <span
              className={cn(
                'rounded flex items-center justify-center shrink-0',
                itemIconSizes[size]
              )}
              style={{ backgroundColor: task.color }}
            >
              {task.icon}
            </span>
            <span className="truncate text-sm">{task.name}</span>
            {selectedTask.id === task.id && (
              <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
