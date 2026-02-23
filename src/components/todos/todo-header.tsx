'use client';

import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TodoHeaderProps {
  selectedDate: Date;
  isToday: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreateTodo: () => void;
}

export function TodoHeader({
  selectedDate,
  isToday,
  onPrev,
  onNext,
  onToday,
  onCreateTodo,
}: TodoHeaderProps) {
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const dayName = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
  });

  return (
    <div className="flex items-center justify-between gap-4 p-4 border-b-2 border-border-strong dark:border-border-strong-dark">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Todos</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrev}
            className="p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col items-center min-w-[180px]">
            <span className="font-semibold text-lg">{formattedDate}</span>
            <span className="text-sm text-muted-foreground">{dayName}</span>
          </div>
          <button
            onClick={onNext}
            className="p-2 rounded-lg border-2 border-border-strong dark:border-border-strong-dark hover:bg-surface-elevated dark:hover:bg-surface-elevated-dark transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {!isToday && (
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="border-2 border-border-strong"
          >
            Today
          </Button>
        )}
      </div>

      <Button
        onClick={onCreateTodo}
        className="btn-brutal gap-2"
      >
        <Plus className="w-4 h-4" />
        Create Todo
      </Button>
    </div>
  );
}
