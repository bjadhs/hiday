// Client-side exports only
// Server-side exports should be imported directly from their respective files

export { createClient as createBrowserClient } from './client'
export { updateSession } from './middleware'

// Provider and hooks exports
export { 
  SupabaseProvider, 
  useSupabase, 
  useUser,
  type Database,
  type Tables,
  type TablesInsert,
  type TablesUpdate 
} from './provider'

// Type re-exports
export type { Database as SupabaseDatabase } from './database.types'
