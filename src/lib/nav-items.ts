import {
  Zap,
  Clock,
  CalendarCheck,
  Kanban,
  History,
  BarChart3,
  ListTodo,
  Settings,
  NotebookPen,
} from 'lucide-react';

export type NavItem = {
  /** stable identifier used in URLs (e.g. ?feature=track) */
  key: string;
  label: string;
  href: string;
  icon: React.ElementType;
};

/**
 * All sidebar navigation entries (Settings included for navigation).
 * Single source of truth shared by the Sidebar, the /dashboard grid and the
 * auth pages.
 */
export const navItems: NavItem[] = [
  { key: 'track', label: 'Track', href: '/track', icon: Zap },
  { key: 'timeline', label: 'Timeline', href: '/timeline', icon: Clock },
  { key: 'todos', label: 'Todos', href: '/todos', icon: CalendarCheck },
  { key: 'plan', label: 'Plan', href: '/plan', icon: NotebookPen },
  { key: 'kanban', label: 'Kanban', href: '/kanban', icon: Kanban },
  { key: 'history', label: 'History', href: '/history', icon: History },
  { key: 'analyze', label: 'Analyze', href: '/analyze', icon: BarChart3 },
  { key: 'projects', label: 'Projects', href: '/projects', icon: ListTodo },
  { key: 'settings', label: 'Settings', href: '/settings', icon: Settings },
];

/** Tailwind color-token classes for the icon badge, keyed loosely by feel. */
type Accent = {
  /** badge background + border + icon text classes */
  badge: string;
  icon: string;
};

export type FeatureCard = NavItem & {
  description: string;
  image: string;
  accent: Accent;
};

/**
 * The feature pages showcased on /dashboard (Settings excluded — it is not a
 * showcase feature). Descriptions mirror the landing-page bento copy.
 */
export const featureCards: FeatureCard[] = [
  {
    key: 'track',
    label: 'Track',
    href: '/track',
    icon: Zap,
    description:
      'One-tap start and stop timers — run several in parallel and jot a note as you go.',
    image: '/dashboard/track.svg',
    accent: { badge: 'bg-primary/10 border-primary/25', icon: 'text-primary' },
  },
  {
    key: 'timeline',
    label: 'Timeline',
    href: '/timeline',
    icon: Clock,
    description:
      'See your day laid out hour by hour. Every session, neatly placed on a timeline you can trust.',
    image: '/dashboard/timeline.svg',
    accent: { badge: 'bg-info-bg border-info-border', icon: 'text-info' },
  },
  {
    key: 'todos',
    label: 'Todos',
    href: '/todos',
    icon: CalendarCheck,
    description:
      'Plan ahead with scheduled sessions, then turn intentions into tracked time.',
    image: '/dashboard/todos.svg',
    accent: { badge: 'bg-success-bg border-success-border', icon: 'text-success' },
  },
  {
    key: 'kanban',
    label: 'Kanban',
    href: '/kanban',
    icon: Kanban,
    description:
      'Move work across Inbox, Next, Doing and Done — a board that mirrors how you actually work.',
    image: '/dashboard/kanban.svg',
    accent: { badge: 'bg-accent/15 border-warning-border', icon: 'text-accent' },
  },
  {
    key: 'history',
    label: 'History',
    href: '/history',
    icon: History,
    description:
      'Browse, edit and export every past session. Your full record, always at hand.',
    image: '/dashboard/history.svg',
    accent: { badge: 'bg-danger-bg border-danger-border', icon: 'text-danger' },
  },
  {
    key: 'analyze',
    label: 'Analyze',
    href: '/analyze',
    icon: BarChart3,
    description:
      'Interactive charts, weekly trends and per-project breakdowns. See where the hours really went.',
    image: '/dashboard/analyze.svg',
    accent: { badge: 'bg-primary/10 border-primary/25', icon: 'text-primary' },
  },
  {
    key: 'projects',
    label: 'Projects',
    href: '/projects',
    icon: ListTodo,
    description:
      'Organise everything you track into projects with goals, colors and tags.',
    image: '/dashboard/projects.svg',
    accent: { badge: 'bg-info-bg border-info-border', icon: 'text-info' },
  },
];

export const getFeatureByKey = (key?: string | null): FeatureCard | undefined =>
  key ? featureCards.find((f) => f.key === key) : undefined;

export const getNavItemByKey = (key: string): NavItem | undefined =>
  navItems.find((n) => n.key === key);

/* -------------------------------------------------------------------------- */
/*  Feature flow — how the pages connect into one workflow                     */
/* -------------------------------------------------------------------------- */

/** A single feature node inside a flow stage. */
export type FlowNode = {
  /** matches a FeatureCard / NavItem key */
  key: string;
  /** tiny pill shown on the node, e.g. "now" / "later" */
  role: string;
  /** short, flow-aware blurb (overrides the longer showcase description) */
  blurb: string;
};

/** A horizontal band in the flow, connected to the next by a labelled spine. */
export type FlowStage = {
  id: string;
  /** stage step number, shown in a brutalist badge */
  step: number;
  title: string;
  caption: string;
  nodes: FlowNode[];
  /** label on the connector leading to the NEXT stage (omit on the last) */
  edgeLabel?: string;
};

/**
 * The Hiday workflow as a connected map. Read top to bottom:
 * organise → capture → manage → review. Each node deep-links to its page.
 */
export const flowStages: FlowStage[] = [
  {
    id: 'organize',
    step: 1,
    title: 'Organize',
    caption: 'Set up the projects everything else hangs off.',
    edgeLabel: 'every project holds its sessions',
    nodes: [
      {
        key: 'projects',
        role: 'start here',
        blurb: 'Group your work into projects with goals, colors & tags.',
      },
    ],
  },
  {
    id: 'capture',
    step: 2,
    title: 'Capture',
    caption: 'Track time as it happens, or plan it for later.',
    edgeLabel: 'each one becomes a session',
    nodes: [
      {
        key: 'track',
        role: 'now',
        blurb: 'One tap to start a live timer — run several at once.',
      },
      {
        key: 'todos',
        role: 'later',
        blurb: 'Plan sessions ahead, then start them when you’re ready.',
      },
    ],
  },
  {
    id: 'manage',
    step: 3,
    title: 'Manage',
    caption: 'Push every session through your workflow.',
    edgeLabel: 'then look back on it all',
    nodes: [
      {
        key: 'kanban',
        role: 'organize',
        blurb: 'Move work across Inbox → Next → Doing → Done.',
      },
    ],
  },
  {
    id: 'review',
    step: 4,
    title: 'Review',
    caption: 'See where the time actually went.',
    nodes: [
      {
        key: 'timeline',
        role: 'today',
        blurb: 'Your day laid out hour by hour.',
      },
      {
        key: 'history',
        role: 'past',
        blurb: 'Browse, edit & export every session.',
      },
      {
        key: 'analyze',
        role: 'insights',
        blurb: 'Charts & trends across all your time.',
      },
    ],
  },
];
