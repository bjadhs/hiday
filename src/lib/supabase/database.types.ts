export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      goals: {
        Row: {
          active: boolean
          created_at: number
          id: string
          name: string
          period: string
          project_id: string | null
          target_type: string
          target_value: number
          updated_at: number
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: number
          id?: string
          name: string
          period: string
          project_id?: string | null
          target_type: string
          target_value: number
          updated_at?: number
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: number
          id?: string
          name?: string
          period?: string
          project_id?: string | null
          target_type?: string
          target_value?: number
          updated_at?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kprojects: {
        Row: {
          color: string
          created_at: number
          id: string
          name: string
          sort_order: number
          updated_at: number
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: number
          id?: string
          name: string
          sort_order?: number
          updated_at?: number
          user_id: string
        }
        Update: {
          color?: string
          created_at?: number
          id?: string
          name?: string
          sort_order?: number
          updated_at?: number
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          archived: boolean
          color: string
          created_at: number
          default_note: string | null
          goal_duration: number | null
          goal_type: 'daily' | 'weekly' | 'hour' | 'count' | 'none' | null
          goal_value: number | null
          icon: string | null
          id: string
          name: string
          note_prompt: boolean
          project_tags: string[] | null
          sort_order: number
          updated_at: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          color?: string
          created_at?: number
          default_note?: string | null
          goal_duration?: number | null
          goal_type?: 'daily' | 'weekly' | 'hour' | 'count' | 'none' | null
          goal_value?: number | null
          icon?: string | null
          id?: string
          name: string
          note_prompt?: boolean
          project_tags?: string[] | null
          sort_order?: number
          updated_at?: number
          user_id: string
        }
        Update: {
          archived?: boolean
          color?: string
          created_at?: number
          default_note?: string | null
          goal_duration?: number | null
          goal_type?: 'daily' | 'weekly' | 'hour' | 'count' | 'none' | null
          goal_value?: number | null
          icon?: string | null
          id?: string
          name?: string
          note_prompt?: boolean
          project_tags?: string[] | null
          sort_order?: number
          updated_at?: number
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          client_timestamp: number
          created_at: number
          duration: number | null
          ended_at: number | null
          id: string
          kanban_status: Database["public"]["Enums"]["kanban_status"]
          kproject_id: string | null
          note: string | null
          parent_session_id: string | null
          project_id: string | null
          server_timestamp: number | null
          session_date: string
          source: string
          started_at: number | null
          status: 'planned' | 'active' | 'completed' | 'cancelled'
          sync_status: string
          tags: string[] | null
          title: string | null
          user_id: string
        }
        Insert: {
          client_timestamp: number
          created_at?: number
          duration?: number | null
          ended_at?: number | null
          id?: string
          kanban_status?: Database["public"]["Enums"]["kanban_status"]
          kproject_id?: string | null
          note?: string | null
          parent_session_id?: string | null
          project_id?: string | null
          server_timestamp?: number | null
          session_date: string
          source?: string
          started_at?: number | null
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          sync_status?: string
          tags?: string[] | null
          title?: string | null
          user_id: string
        }
        Update: {
          client_timestamp?: number
          created_at?: number
          duration?: number | null
          ended_at?: number | null
          id?: string
          kanban_status?: Database["public"]["Enums"]["kanban_status"]
          kproject_id?: string | null
          note?: string | null
          parent_session_id?: string | null
          project_id?: string | null
          server_timestamp?: number | null
          session_date?: string
          source?: string
          started_at?: number | null
          status?: 'planned' | 'active' | 'completed' | 'cancelled'
          sync_status?: string
          tags?: string[] | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_kproject_id_fkey"
            columns: ["kproject_id"]
            isOneToOne: false
            referencedRelation: "kprojects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_parent_session_id_fkey"
            columns: ["parent_session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          config: Json | null
          created_at: number
          id: string
          name: string
          sort_order: number
          type: string
          updated_at: number
          user_id: string
        }
        Insert: {
          color?: string
          config?: Json | null
          created_at?: number
          id?: string
          name: string
          sort_order?: number
          type?: string
          updated_at?: number
          user_id: string
        }
        Update: {
          color?: string
          config?: Json | null
          created_at?: number
          id?: string
          name?: string
          sort_order?: number
          type?: string
          updated_at?: number
          user_id?: string
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
      kanban_status: "next" | "doing" | "done" | "revise" | "inbox"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      kanban_status: ["next", "doing", "done", "revise", "inbox"],
    },
  },
} as const
