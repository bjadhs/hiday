'use client';

import { memo } from 'react';
import { Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';

interface TaskButtonProps {
  task: Task;
  isActive: boolean;
  activeCount: number;
  onClick: () => void;
  isPending: boolean;
}

/**
 * TaskButton
 * 
 * A button component for starting/stopping tracking on a specific task.
 * Shows task icon, name, and active state indicators.
 * 
 * @example
 * ```tsx
 * <TaskButton
 *   task={task}
 *   isActive={true}
 *   activeCount={1}
 *   onClick={() => handleTaskClick(task)}
 *   isPending={false}
 * />
 * ```
 */
export const TaskButton = memo(function TaskButton({
  task,
  isActive,
  activeCount,
  onClick,
  isPending,
}: TaskButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isPending}
      className={cn(
        'relative group p-2.5 lg:p-3 rounded-lg border-2 transition-all duration-200 text-left',
        isActive
          ? 'border-primary bg-primary/5 dark:bg-primary/20 shadow-brutal-colored'
          : 'border-border-strong bg-surface-elevated shadow-brutal card-interactive'
      )}
    >
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary border-2 border-surface dark:border-surface-dark flex items-center justify-center shadow-brutal-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </div>
      )}

      {/* Multiple active sessions badge */}
      {activeCount > 1 && (
        <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-primary-dark border-2 border-surface dark:border-surface-dark flex items-center justify-center shadow-brutal-xs">
          <span className="text-[10px] font-bold text-white">{activeCount}</span>
        </div>
      )}

      <div
        className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center text-lg lg:text-xl mb-2 border-2 border-black/10 dark:border-white/25 shadow-brutal-xs"
        style={{ backgroundColor: task.color }}
      >
        {task.icon}
      </div>

      <h3 className="font-semibold text-sm truncate">{task.name}</h3>

      <div className="mt-2 flex items-center gap-1">
        {isActive ? (
          <span className="text-[10px] font-semibold text-primary text-foreground flex items-center gap-0.5">
            <Square className="w-2.5 h-2.5 fill-current" />
            Stop
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-foreground-muted group-hover:text-primary dark:group-hover:text-foreground-dark transition-colors flex items-center gap-0.5">
            <Play className="w-2.5 h-2.5 fill-current" />
            Start
          </span>
        )}
      </div>
    </button>
  );
});
