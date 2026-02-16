// Core data types for the ATracker application
// TASK-SESSION RELATIONSHIP: Each Task can have multiple Sessions
// A Session represents a time period spent working on a specific Task

export type Task = {
  id: string;
  name: string;           // Task name (e.g., "Coding", "Gym")
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
// Displays: Session title (editable) + Task name (badge)
export type ActiveSession = {
  id: string;
  taskId: string;
  task: Task;             // Belongs to this task
  startedAt: number;
  title?: string;         // Session title (defaults to task name, editable by user)
  note?: string;          // Note about what was done in this session
};

// A completed session with recorded time
// Displays: Session title + Task name (badge) + duration
export type Session = {
  id: string;
  taskId: string;
  task: Task;             // Belongs to this task
  startedAt: number;
  endedAt: number;
  duration: number;       // in seconds
  title?: string;         // Session title (defaults to task name, editable by user)
  note?: string;          // Note about what was done in this session
};

// For history view - may have null endedAt for ongoing sessions
export type HistorySession = {
  id: string;
  taskId: string;
  task: Task;
  startedAt: number;
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
