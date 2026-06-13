'use client';

import { Search, Kanban, Plus } from 'lucide-react';

interface KanbanHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewTodo: () => void;
}

export function KanbanHeader({
  searchQuery,
  onSearchChange,
  onNewTodo,
}: KanbanHeaderProps) {
  return (
    <header className="px-4 lg:px-8 py-4 lg:py-6 border-b-2 border-border-strong bg-surface">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white border-2 border-border-strong shadow-brutal-sm">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight">
              Kanban
            </h1>
            <p className="text-sm text-foreground-muted">
              Plan your work
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search todos..."
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 rounded-xl border-2 border-border-strong bg-surface-elevated text-sm font-medium focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={onNewTodo}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-brutal-sm btn-brutal whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Todo</span>
          </button>
        </div>
      </div>
    </header>
  );
}
