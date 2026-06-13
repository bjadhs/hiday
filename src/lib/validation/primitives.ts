import { z } from 'zod';

/**
 * Shared enums — mirror the literal unions in `database.types.ts` so there is a
 * single runtime source of truth for the allowed values.
 */
export const goalTypeSchema = z.enum(['daily', 'weekly', 'hour', 'count', 'none']);
export const sessionStatusSchema = z.enum(['planned', 'active', 'completed', 'cancelled']);
export const sessionSourceSchema = z.enum(['manual', 'widget', 'watch', 'suggestion']);
export const kanbanStatusSchema = z.enum(['inbox', 'next', 'doing', 'done', 'revise']);

/** Kanban columns that exist on the board (everything except the inbox). */
export const boardKanbanStatusSchema = z.enum(['next', 'doing', 'done', 'revise']);

/** Reusable field validators. */
export const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color, e.g. #6D28D9');

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

// Use `guid` (general UUID/GUID shape) rather than `uuid`, which additionally
// enforces the RFC version/variant nibbles. Seeded/legacy ids (e.g. the
// placeholder `11111111-1111-...` rows in mock.sql) are UUID-shaped but not
// RFC-compliant; real `uuid_generate_v4()` ids pass either way.
export const uuid = z.guid('Must be a valid id');

/** Timestamps are stored as Unix milliseconds (see CLAUDE.md). */
export const timestamp = z.number().int().nonnegative();

/** Durations on sessions are stored in seconds. */
export const seconds = z.number().int().nonnegative();
