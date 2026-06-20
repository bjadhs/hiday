// Core data types for the ATracker application
// PROJECT-SESSION RELATIONSHIP: Each Project can have multiple Sessions
// A Session represents a time period spent working on a specific Project

export type Project = {
  id: string;
  name: string;           // Project name (e.g., "Coding", "Gym")
  color: string;
  icon: string | null;
  goal_duration?: number | null; // in minutes
  goal_value?: number | null;     // for count-based goals
  goal_type?: 'daily' | 'weekly' | 'hour' | 'count' | 'none' | null;
  default_note?: string | null;
  note_prompt?: boolean | null;
  tags?: string[] | null;
  sort_order?: number;
};

// An active (ongoing) session being tracked
// Displays: Session title (editable) + Project name (badge)
export type ActiveSession = {
  id: string;
  projectId: string;
  project: Project;             // Belongs to this project
  startedAt: number;
  title?: string;         // Session title (defaults to project name, editable by user)
  note?: string;          // Note about what was done in this session
};

// A completed session with recorded time
// Displays: Session title + Project name (badge) + duration
export type Session = {
  id: string;
  projectId: string;
  project: Project;             // Belongs to this project
  startedAt: number;
  endedAt: number;
  duration: number;       // in seconds
  title?: string;         // Session title (defaults to project name, editable by user)
  note?: string;          // Note about what was done in this session
};

// For history view - may have null endedAt for ongoing sessions
export type HistorySession = {
  id: string;
  projectId: string;
  project: Project;
  startedAt: number | null;
  endedAt: number | null;
  duration: number;
  title?: string;
  note?: string;
};

// Deprecated: Use Session instead
/** @deprecated Use Session instead */
export type TimeEntry = Session;
/** @deprecated Use HistorySession instead */
export type HistoryTimeEntry = HistorySession;

export type ViewMode = 'list' | 'timeline';

// Planned session for future time planning
// Uses the sessions table with status='planned'
export type PlannedSession = {
  id: string;
  projectId: string;
  project: Project;
  title: string | null;
  plannedStartTime: number | null;  // Unix timestamp when it's planned to start (stored in started_at). Null = unscheduled
  plannedEndTime: number | null;    // Unix timestamp when it's planned to end (stored in ended_at). Null = unscheduled
  plannedDuration: number;   // Duration in seconds
  plannedDate: string;       // YYYY-MM-DD format
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  note: string | null;
  isUnscheduled?: boolean;   // True if no start/end time set yet
};

// For display on the timeline
export type TimelinePlannedSession = PlannedSession & {
  top: number;      // Pixel position from top
  height: number;   // Pixel height based on duration
  left: number;     // Percentage for column positioning
  width: number;    // Percentage width
};

// Kanban status values
export type KanbanStatus = 'inbox' | 'next' | 'doing' | 'done' | 'revise';

// KProject for grouping Kanban todos
export type KProject = {
  id: string;
  userId: string;
  name: string;
  color: string;
  sortOrder: number;
};

// Planned session with Kanban workflow and kproject info
export type KanbanSession = PlannedSession & {
  kanbanStatus: KanbanStatus;
  kprojectId: string | null;
  kproject: KProject | null;
};

// Stats card props
export type StatCardProps = {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
};

// Settings components props
export type SettingsSectionProps = {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
};

export type SettingsItemProps = {
  label: string;
  value: string;
  description?: string;
  action?: boolean;
};
