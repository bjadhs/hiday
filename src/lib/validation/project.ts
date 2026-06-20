import { z } from 'zod';
import { goalTypeSchema, hexColor } from './primitives';

/**
 * The editable shape of a project (everything except server-managed columns like
 * `user_id`, `created_at`, `updated_at`). Mirrors `EditableProject` in
 * `src/components/projects/types.ts` but as a runtime schema.
 *
 * Kept un-refined so it can be `.partial()`-ed for updates.
 */
const projectObject = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  color: hexColor,
  icon: z.string().min(1).nullable().optional(),
  goal_type: goalTypeSchema.default('none'),
  goal_duration: z.number().int().positive().nullable().optional(), // minutes
  goal_value: z.number().int().positive().nullable().optional(),
  default_note: z.string().max(1000, 'Note is too long').nullable().optional(),
  note_prompt: z.boolean().default(false),
  project_tags: z.array(z.string().trim().min(1)).nullable().optional(),
  archived: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

/** Validates input when creating a project. Enforces goal-type ↔ goal-field rules. */
export const projectInputSchema = projectObject
  .refine(
    (t) => !['daily', 'weekly'].includes(t.goal_type) || t.goal_duration != null,
    { path: ['goal_duration'], error: 'A duration goal needs a target duration' },
  )
  .refine(
    (t) => !['hour', 'count'].includes(t.goal_type) || t.goal_value != null,
    { path: ['goal_value'], error: 'This goal type needs a target value' },
  );

/** Validates input when updating a project. All fields optional; no goal refinement. */
export const projectUpdateSchema = projectObject.partial();

export type ProjectInput = z.infer<typeof projectInputSchema>;
export type ProjectUpdateInput = z.infer<typeof projectUpdateSchema>;
