import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format seconds to MM:SS or H:MM:SS
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Distinct, visually-spaced palette for kproject indicators.
const KPROJECT_PALETTE = [
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#EF4444', // red
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
];

// Deterministic, distinct color for a kproject based on its id, so kprojects are
// visually distinguishable even when they share the same stored color default.
export function getKProjectColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return KPROJECT_PALETTE[hash % KPROJECT_PALETTE.length];
}

// Format timestamp to time string (e.g., "2:30 PM")
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

// Format date to readable string (e.g., "Feb 7, 2025")
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
