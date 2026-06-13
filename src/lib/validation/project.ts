import { z } from 'zod';
import { hexColor } from './primitives';

/** Validates input when creating a project. */
export const projectInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  color: hexColor.default('#6D28D9'),
});

/** Validates input when updating a project (all fields optional). */
export const projectUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long').optional(),
  color: hexColor.optional(),
  sort_order: z.number().int().optional(),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
