import type { Database } from '@/lib/supabase/database.types';

export type DBProject = Database['public']['Tables']['projects']['Row'];
export type EditableProject = Omit<Database['public']['Tables']['projects']['Insert'], 'user_id' | 'created_at' | 'updated_at'> & { id?: string };
