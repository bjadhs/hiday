export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string
          name: string
          icon: string | null
          color: string
          goal_duration: number | null
          goal_type: 'daily' | 'weekly' | 'hour' | 'count' | 'none' | null
          goal_value: number | null
          default_note: string | null
          note_prompt: boolean
          task_tags: string[] | null
          category_id: string | null
          archived: boolean
          sort_order: number
          created_at: number
          updated_at: number
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          icon?: string | null
          color: string
          goal_duration?: number | null
          goal_type?: 'daily' | 'weekly' | 'hour' | 'count' | 'none' | null
          goal_value?: number | null
          default_note?: string | null
          note_prompt?: boolean
          task_tags?: string[] | null
          category_id?: string | null
          archived?: boolean
          sort_order?: number
          created_at?: number
          updated_at?: number
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          icon?: string | null
          color?: string
          goal_duration?: number | null
          goal_type?: 'daily' | 'weekly' | 'hour' | 'count' | 'none' | null
          goal_value?: number | null
          default_note?: string | null
          note_prompt?: boolean
          task_tags?: string[] | null
          category_id?: string | null
          archived?: boolean
          sort_order?: number
          created_at?: number
          updated_at?: number
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          task_id: string
          title: string | null
          started_at: number
          ended_at: number | null
          duration: number | null
          note: string | null
          tags: string[] | null
          source: 'manual' | 'widget' | 'watch' | 'suggestion'
          sync_status: string
          client_timestamp: number
          session_date: string
          server_timestamp: number | null
          created_at: number
        }
        Insert: {
          id?: string
          user_id: string
          task_id: string
          title?: string | null
          started_at: number
          ended_at?: number | null
          duration?: number | null
          note?: string | null
          tags?: string[] | null
          source?: 'manual' | 'widget' | 'watch' | 'suggestion'
          sync_status?: string
          client_timestamp: number
          session_date: string
          server_timestamp?: number | null
          created_at?: number
        }
        Update: {
          id?: string
          user_id?: string
          task_id?: string
          title?: string | null
          started_at?: number
          ended_at?: number | null
          duration?: number | null
          note?: string | null
          tags?: string[] | null
          source?: 'manual' | 'widget' | 'watch' | 'suggestion'
          sync_status?: string
          client_timestamp?: number
          session_date?: string
          server_timestamp?: number | null
          created_at?: number
        }
        Relationships: [
          {
            foreignKeyName: 'sessions_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
        ]
      }
      categories: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          icon: string | null
          sort_order: number
          created_at: number
          updated_at: number
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          icon?: string | null
          sort_order?: number
          created_at?: number
          updated_at?: number
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          icon?: string | null
          sort_order?: number
          created_at?: number
          updated_at?: number
        }
        Relationships: []
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          type: 'daily' | 'goal' | 'category'
          reference_id: string | null
          current_count: number
          longest_count: number
          last_extended_at: number | null
          frozen_until: number | null
          created_at: number
          updated_at: number
        }
        Insert: {
          id?: string
          user_id: string
          type: 'daily' | 'goal' | 'category'
          reference_id?: string | null
          current_count?: number
          longest_count?: number
          last_extended_at?: number | null
          frozen_until?: number | null
          created_at?: number
          updated_at?: number
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'daily' | 'goal' | 'category'
          reference_id?: string | null
          current_count?: number
          longest_count?: number
          last_extended_at?: number | null
          frozen_until?: number | null
          created_at?: number
          updated_at?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_type: 'duration' | 'occurrence'
          target_value: number
          period: 'daily' | 'weekly'
          task_id: string | null
          category_id: string | null
          active: boolean
          created_at: number
          updated_at: number
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_type: 'duration' | 'occurrence'
          target_value: number
          period: 'daily' | 'weekly'
          task_id?: string | null
          category_id?: string | null
          active?: boolean
          created_at?: number
          updated_at?: number
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_type?: 'duration' | 'occurrence'
          target_value?: number
          period?: 'daily' | 'weekly'
          task_id?: string | null
          category_id?: string | null
          active?: boolean
          created_at?: number
          updated_at?: number
        }
        Relationships: [
          {
            foreignKeyName: 'goals_task_id_fkey'
            columns: ['task_id']
            isOneToOne: false
            referencedRelation: 'tasks'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goals_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
          color: string
          type: 'basic' | 'numeric' | 'dropdown'
          config: Json | null
          sort_order: number
          created_at: number
          updated_at: number
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          color: string
          type?: 'basic' | 'numeric' | 'dropdown'
          config?: Json | null
          sort_order?: number
          created_at?: number
          updated_at?: number
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          color?: string
          type?: 'basic' | 'numeric' | 'dropdown'
          config?: Json | null
          sort_order?: number
          created_at?: number
          updated_at?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
    Database[PublicTableNameOrOptions['schema']]['Views'])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
    Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
    PublicSchema['Views'])
  ? (PublicSchema['Tables'] &
    PublicSchema['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema['Tables']
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema['Tables']
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
  ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema['Enums']
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
  ? PublicSchema['Enums'][PublicEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof PublicSchema['CompositeTypes']
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
  ? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never
