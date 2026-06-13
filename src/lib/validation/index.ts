import type { z } from 'zod';

export * from './primitives';
export * from './task';
export * from './session';
export * from './planned-session';
export * from './kanban';
export * from './project';

/**
 * Flatten a ZodError into a `{ field: message }` map keyed by the first path
 * segment, for driving per-field form error messages. Issues without a path
 * (e.g. cross-field `.refine` checks) are collected under the `_form` key.
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : '_form';
    if (!result[key]) result[key] = issue.message;
  }
  return result;
}
