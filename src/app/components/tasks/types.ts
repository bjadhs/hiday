import type { Database } from '@/lib/supabase/database.types';

export type DBTask = Database['public']['Tables']['tasks']['Row'];
export type EditableTask = Omit<Database['public']['Tables']['tasks']['Insert'], 'user_id' | 'created_at' | 'updated_at'> & { id?: string };
