import { z } from 'zod';
import {
  boardKanbanStatusSchema,
  kanbanStatusSchema,
  seconds,
  timestamp,
  uuid,
} from './primitives';

/**
 * Validates a new Kanban todo. Encodes the rule from the create dialog: inbox
 * items need a title, while items on a board column need a project.
 */
export const createKanbanTodoSchema = z
  .object({
    projectId: uuid.nullable().optional(),
    kprojectId: uuid.nullable(),
    kanbanStatus: kanbanStatusSchema,
    duration: seconds,
    title: z.string().trim().max(200, 'Title is too long').optional(),
    note: z.string().max(2000, 'Note is too long').optional(),
  })
  .refine(
    (t) => (t.kanbanStatus === 'inbox' ? !!t.title?.trim() : !!t.projectId),
    { error: 'Inbox todos need a title; board columns need a project' },
  );

/** Validates a quick inbox todo created from the kproject dropdown. */
export const createInboxTodoSchema = z.object({
  kprojectId: uuid.nullable(),
  projectId: uuid.optional(),
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long').optional(),
});

/** Validates the patch passed to `updateKanbanTodo`. */
export const updateKanbanTodoSchema = z.object({
  projectId: z.union([uuid, z.literal(''), z.null()]).optional(),
  kprojectId: uuid.nullable().optional(),
  kanbanStatus: kanbanStatusSchema.optional(),
  duration: seconds.optional(),
  plannedStartTime: timestamp.nullable().optional(),
  plannedEndTime: timestamp.nullable().optional(),
  title: z.string().trim().max(200, 'Title is too long').nullable().optional(),
  note: z.string().max(2000, 'Note is too long').nullable().optional(),
});

/** Validates the target column for a drag/drop status change (inbox excluded). */
export const updateKanbanStatusSchema = boardKanbanStatusSchema;

export type CreateKanbanTodoInput = z.infer<typeof createKanbanTodoSchema>;
export type CreateInboxTodoInput = z.infer<typeof createInboxTodoSchema>;
export type UpdateKanbanTodoInput = z.infer<typeof updateKanbanTodoSchema>;
