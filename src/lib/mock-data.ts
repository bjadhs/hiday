import { Project, Session, HistorySession } from './types';

// Base timestamp for consistent mock data
export const INITIAL_NOW = Date.now();

// Common projects used across the app
export const mockProjects: Project[] = [
  { id: 'inbox', name: 'Inbox', color: '#6B7280', icon: '📥' },
  { id: '1', name: 'Coding', color: '#8B5CF6', icon: '💻', goal_duration: 240 },
  { id: '2', name: 'Gym', color: '#22C55E', icon: '💪', goal_duration: 60 },
  { id: '3', name: 'Reading', color: '#3B82F6', icon: '📚', goal_duration: 30 },
  { id: '4', name: 'Meeting', color: '#F59E0B', icon: '🗣️' },
  { id: '5', name: 'Break', color: '#EF4444', icon: '☕' },
  { id: '6', name: 'Design', color: '#EC4899', icon: '🎨', goal_duration: 120 },
  { id: '7', name: 'Writing', color: '#14B8A6', icon: '✍️', goal_duration: 60 },
  { id: '8', name: 'Research', color: '#6366F1', icon: '🔍' },
];

// Default project for quick start
export const defaultProject = mockProjects[0];

// Today's completed sessions for Track page
// Each session belongs to a project and has its own title
export const mockTodaySessions: Session[] = [
  {
    id: '1',
    projectId: '2',
    project: mockProjects[1],
    startedAt: INITIAL_NOW - 1000 * 60 * 60 * 2 - 1000 * 60 * 30,
    endedAt: INITIAL_NOW - 1000 * 60 * 60,
    duration: 90 * 60,
  },
  {
    id: '2',
    projectId: '1',
    project: mockProjects[0],
    startedAt: INITIAL_NOW - 1000 * 60 * 45,
    endedAt: INITIAL_NOW - 1000 * 60 * 5,
    duration: 40 * 60,
  },
];

// History sessions for specific projects (used when tracking to show recent sessions)
// Shows session title as main, project name as badge
export const projectHistorySessions: Session[] = [
  {
    id: 'h1',
    projectId: 'inbox',
    project: mockProjects[0],
    startedAt: INITIAL_NOW - 1000 * 60 * 60 * 24,
    endedAt: INITIAL_NOW - 1000 * 60 * 60 * 24 + 45 * 1000,
    duration: 45,
    title: 'Inbox',
    note: 'Quick catch-up',
  },
  {
    id: 'h2',
    projectId: 'inbox',
    project: mockProjects[0],
    startedAt: INITIAL_NOW - 1000 * 60 * 60 * 48,
    endedAt: INITIAL_NOW - 1000 * 60 * 60 * 48 + 120 * 1000,
    duration: 120,
    title: 'Morning Inbox Review',
    note: 'Morning review',
  },
  {
    id: 'h3',
    projectId: 'inbox',
    project: mockProjects[0],
    startedAt: INITIAL_NOW - 1000 * 60 * 60 * 72,
    endedAt: INITIAL_NOW - 1000 * 60 * 60 * 72 + 60 * 1000,
    duration: 60,
    title: 'Inbox',
    note: 'Email cleanup',
  },
  {
    id: 'h4',
    projectId: 'inbox',
    project: mockProjects[0],
    startedAt: INITIAL_NOW - 1000 * 60 * 60 * 96,
    endedAt: INITIAL_NOW - 1000 * 60 * 60 * 96 + 30 * 1000,
    duration: 30,
    title: 'Quick Notes',
    note: 'Jotting down ideas',
  },
  {
    id: 'h5',
    projectId: 'inbox',
    project: mockProjects[0],
    startedAt: INITIAL_NOW - 1000 * 60 * 60 * 120,
    endedAt: INITIAL_NOW - 1000 * 60 * 60 * 120 + 90 * 1000,
    duration: 90,
    title: 'Weekly Planning',
    note: 'Planning session',
  },
];

// History page subset of projects
export const mockHistoryProjects: Project[] = mockProjects.slice(0, 5);

// Generate mock sessions for a specific date (History page)
export function generateMockSessions(date: Date): HistorySession[] {
  const baseTime = new Date(date).setHours(0, 0, 0, 0);
  const sessions: HistorySession[] = [
    {
      id: '1',
      projectId: '2',
      project: mockHistoryProjects[1],
      startedAt: baseTime + 7 * 60 * 60 * 1000,
      endedAt: baseTime + 8 * 60 * 60 * 1000 + 30 * 60 * 1000,
      duration: 90 * 60,
      title: 'Morning Workout',
      note: 'Leg day - squats and deadlifts',
    },
    {
      id: '2',
      projectId: '1',
      project: mockHistoryProjects[0],
      startedAt: baseTime + 9 * 60 * 60 * 1000,
      endedAt: baseTime + 12 * 60 * 60 * 1000,
      duration: 3 * 60 * 60,
      title: 'Feature Implementation',
      note: 'Built the auth module with JWT tokens',
    },
    {
      id: '3',
      projectId: '4',
      project: mockHistoryProjects[3],
      startedAt: baseTime + 13 * 60 * 60 * 1000,
      endedAt: baseTime + 14 * 60 * 60 * 1000,
      duration: 60 * 60,
      title: 'Team Standup',
      note: 'Sprint planning and blockers discussion',
    },
    {
      id: '4',
      projectId: '1',
      project: mockHistoryProjects[0],
      startedAt: baseTime + 14 * 60 * 60 * 1000 + 30 * 60 * 1000,
      endedAt: baseTime + 17 * 60 * 60 * 1000,
      duration: 2.5 * 60 * 60,
      title: 'Code Review & Bug Fixes',
      note: 'Reviewed PR #234 and fixed login bug',
    },
    {
      id: '5',
      projectId: '5',
      project: mockHistoryProjects[4],
      startedAt: baseTime + 17 * 60 * 60 * 1000 + 15 * 60 * 1000,
      endedAt: baseTime + 17 * 60 * 60 * 1000 + 45 * 60 * 1000,
      duration: 30 * 60,
      title: 'Coffee Break',
      note: 'Quick rest and snack',
    },
    {
      id: '6',
      projectId: '3',
      project: mockHistoryProjects[2],
      startedAt: baseTime + 20 * 60 * 60 * 1000,
      endedAt: baseTime + 21 * 60 * 60 * 1000 + 30 * 60 * 1000,
      duration: 90 * 60,
      title: 'Technical Reading',
      note: 'Read chapter 5 of Clean Architecture',
    },
  ];
  return sessions;
}
