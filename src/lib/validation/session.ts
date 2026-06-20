import { z } from 'zod';
import {
  kanbanStatusSchema,
  seconds,
  sessionStatusSchema,
  timestamp,
  uuid,
} from './primitives';

/** Validates the arguments to `startSession`. */
export const startSessionSchema = z.object({
  projectId: uuid,
  title: z.string().trim().max(200, 'Title is too long').optional(),
  startTime: timestamp.optional(),
});

/**
 * Validates `updateSession` patches. A strict object listing every session
 * column a caller may legitimately patch, so the parsed result is statically
 * assignable to the Supabase `sessions` Update type (no cast needed) and any
 * stray key is dropped rather than forwarded to the database. The end-after-start
 * invariant is enforced across the two timestamp fields.
 */
export const sessionUpdateSchema = z
  .object({
    title: z.string().trim().max(200, 'Title is too long').nullable().optional(),
    note: z.string().max(2000, 'Note is too long').nullable().optional(),
    project_id: uuid.nullable().optional(),
    kproject_id: uuid.nullable().optional(),
    kanban_status: kanbanStatusSchema.optional(),
    started_at: timestamp.nullable().optional(),
    ended_at: timestamp.nullable().optional(),
    duration: seconds.nullable().optional(),
    status: sessionStatusSchema.optional(),
    sync_status: z.string().optional(),
    client_timestamp: timestamp.optional(),
    parent_session_id: uuid.nullable().optional(),
  })
  .refine(
    (s) => s.started_at == null || s.ended_at == null || s.ended_at > s.started_at,
    { path: ['ended_at'], error: 'End time must be after start time' },
  );

export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type SessionUpdateInput = z.infer<typeof sessionUpdateSchema>;
