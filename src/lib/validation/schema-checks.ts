/* eslint-disable @typescript-eslint/no-unused-vars -- the aliases below are
   intentionally unused; they exist only so their `extends` constraints run. */
/**
 * Compile-time guards that keep the Zod input schemas in lockstep with the
 * generated Supabase table types. Each `AssertAssignable<Target, Source>` below
 * fails to type-check the moment a schema's inferred output stops being a valid
 * payload for the `Insert`/`Update` shape it is parsed into — turning what would
 * otherwise be a runtime Postgres error into a build error.
 *
 * This file is types-only: it emits no runtime code. It is referenced by the
 * type-checker (via `tsc`) simply by existing in the project.
 *
 * Only schemas whose output keys are real DB columns are guarded here. The
 * camelCase action DTOs (`startSessionSchema`, `createKanbanTodoSchema`,
 * `createInboxTodoSchema`, `updateKanbanTodoSchema`, and the planned-session
 * schemas) are deliberately not column-shaped — their actions translate
 * `taskId`/`projectId`/`plannedStartTime`/… into the snake_case columns by hand
 * while building a typed `SessionInsert`/`SessionUpdate`, which is where those
 * get their compile-time check.
 */
import type { Database } from '@/lib/supabase/database.types';
import type {
  TaskInput,
  TaskUpdateInput,
  ProjectInput,
  ProjectUpdateInput,
  SessionUpdateInput,
} from './index';

type Tables = Database['public']['Tables'];

/** Columns the server fills in itself; never part of a validated client payload. */
type ServerManaged = 'user_id' | 'created_at' | 'updated_at';

/**
 * Resolves to `Source` only when it is assignable to `Target`. Used purely for
 * its constraint: if `Source` drifts from `Target`, the alias errors.
 */
type AssertAssignable<Target, Source extends Target> = Source;

// tasks
type _TaskInput = AssertAssignable<Omit<Tables['tasks']['Insert'], ServerManaged>, TaskInput>;
type _TaskUpdate = AssertAssignable<Tables['tasks']['Update'], TaskUpdateInput>;

// projects
type _ProjectInput = AssertAssignable<Omit<Tables['projects']['Insert'], ServerManaged>, ProjectInput>;
type _ProjectUpdate = AssertAssignable<Tables['projects']['Update'], ProjectUpdateInput>;

// sessions (update path; the insert paths build typed SessionInsert objects directly)
type _SessionUpdate = AssertAssignable<Tables['sessions']['Update'], SessionUpdateInput>;
