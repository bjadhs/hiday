import { z } from 'zod';
import { dateString, sessionStatusSchema, timestamp, uuid } from './primitives';

/** Validates the arguments to `createPlannedSession`. */
export const createPlannedSessionSchema = z.object({
  projectId: uuid,
  plannedDate: dateString,
  plannedStartTime: timestamp.nullable(), // null = unscheduled
  plannedDuration: z.number().int().positive('Duration must be greater than zero'),
  title: z.string().trim().max(200, 'Title is too long').optional(),
  note: z.string().max(2000, 'Note is too long').optional(),
});

/** Validates the `updates` patch passed to `updatePlannedSession`. */
export const updatePlannedSessionSchema = z.object({
  projectId: uuid.optional(),
  plannedStartTime: timestamp.nullable().optional(),
  plannedDuration: z.number().int().positive('Duration must be greater than zero').optional(),
  title: z.string().trim().max(200, 'Title is too long').optional(),
  note: z.string().max(2000, 'Note is too long').optional(),
  status: sessionStatusSchema.optional(),
});

/** Validates the optional actual start/end times when completing a planned session. */
export const completePlannedSessionSchema = z.object({
  actualStartTime: timestamp.optional(),
  actualEndTime: timestamp.optional(),
});

export type CreatePlannedSessionInput = z.infer<typeof createPlannedSessionSchema>;
export type UpdatePlannedSessionInput = z.infer<typeof updatePlannedSessionSchema>;
