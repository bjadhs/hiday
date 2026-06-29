'use client';

import { FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlanMarkdownPaneProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  /** Shown next to the title — e.g. "Syncing…" / "Synced" */
  syncStatus?: string;
}

export function PlanMarkdownPane({ value, onChange, isLoading, syncStatus }: PlanMarkdownPaneProps) {
  return (
    <div className="flex flex-col h-full border-l-2 border-border-strong bg-surface">
      <div className="flex items-center justify-between gap-2 p-4 border-b-2 border-border-strong">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-lg">Markdown</h2>
        </div>
        {syncStatus && (
          <span className="text-xs font-medium text-muted-foreground tabular-nums">{syncStatus}</span>
        )}
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        placeholder={isLoading ? 'Loading…' : 'Type a plan line like:\n### 9:00 AM – 10:00 AM · Title'}
        spellCheck={false}
        className={cn(
          'flex-1 w-full resize-none p-4 bg-background-elevated text-foreground',
          'font-mono text-sm leading-relaxed',
          'border-0 outline-none focus-visible:outline-none focus-visible:ring-0',
          'placeholder:text-muted-foreground disabled:opacity-60'
        )}
      />
    </div>
  );
}
