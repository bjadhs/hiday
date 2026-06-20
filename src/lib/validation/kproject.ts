import { z } from 'zod';
import { hexColor } from './primitives';

/** Validates input when creating a kproject. */
export const kprojectInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  color: hexColor.default('#6D28D9'),
});

/** Validates input when updating a kproject (all fields optional). */
export const kprojectUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long').optional(),
  color: hexColor.optional(),
  sort_order: z.number().int().optional(),
});

export type KProjectInput = z.infer<typeof kprojectInputSchema>;
export type KProjectUpdateInput = z.infer<typeof kprojectUpdateSchema>;
