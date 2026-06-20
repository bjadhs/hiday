'use client';

import { memo } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type ProjectDropdownProps = {
  /** Currently selected project */
  selectedProject: Project;
  /** List of available projects to choose from */
  projects: Project[];
  /** Callback when a project is selected */
  onProjectChange: (project: Project) => void;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether the dropdown is disabled */
  disabled?: boolean;
};

/**
 * ProjectDropdown
 *
 * A dropdown component for selecting projects. Displays the current project as a
 * clickable badge with color and icon. Clicking opens a dropdown menu with
 * all available projects.
 *
 * @example
 * ```tsx
 * <ProjectDropdown
 *   selectedProject={currentProject}
 *   projects={allProjects}
 *   onProjectChange={(project) => console.log('Selected:', project.name)}
 * />
 * ```
 */
export const ProjectDropdown = memo(function ProjectDropdown({
  selectedProject,
  projects,
  onProjectChange,
  className,
  size = 'sm',
  disabled = false,
}: ProjectDropdownProps) {
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
            'inline-flex items-center gap-1 rounded shrink-0 hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed',
            sizeClasses[size],
            className
          )}
          style={{
            backgroundColor: `${selectedProject.color}20`,
            color: selectedProject.color,
          }}
          disabled={disabled}
        >
          <span>{selectedProject.icon}</span>
          <span className="font-medium">{selectedProject.name}</span>
          <ChevronDown className={cn('ml-0.5', iconSizes[size])} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="border-2 border-border-strong shadow-brutal w-44 bg-surface/95 bg-surface/95 backdrop-blur-sm"
      >
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => onProjectChange(project)}
            className={cn(
              'cursor-pointer flex items-center gap-2 py-1.5',
              selectedProject.id === project.id && 'bg-primary/10 font-medium'
            )}
          >
            <span
              className={cn(
                'rounded flex items-center justify-center shrink-0',
                itemIconSizes[size]
              )}
              style={{ backgroundColor: project.color }}
            >
              {project.icon}
            </span>
            <span className="truncate text-sm">{project.name}</span>
            {selectedProject.id === project.id && (
              <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
