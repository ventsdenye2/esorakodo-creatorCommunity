// Generated from the local Supabase public schema on 2026-09-23 with
// `npx supabase gen types typescript --local --schema public`.
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
      colleges: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string
          summary: string | null
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug: string
          summary?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string
          summary?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "colleges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_accounts: {
        Row: {
          account_type: string
          avatar_key: string | null
          created_at: string
          created_by: string
          display_name: string
          handle: string
          id: string
          signature: string | null
          student_id: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          avatar_key?: string | null
          created_at?: string
          created_by: string
          display_name: string
          handle: string
          id?: string
          signature?: string | null
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          avatar_key?: string | null
          created_at?: string
          created_by?: string
          display_name?: string
          handle?: string
          id?: string
          signature?: string | null
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_accounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          college_id: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          slug: string
          summary: string | null
          updated_at: string
          version: number
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          slug: string
          summary?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          college_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          slug?: string
          summary?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "places_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_key: string | null
          bio: string | null
          created_at: string
          display_name: string
          handle: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_key?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          handle: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_key?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          handle?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          college_id: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          signature: string | null
          slug: string
          summary: string | null
          updated_at: string
          version: number
        }
        Insert: {
          college_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          signature?: string | null
          slug: string
          summary?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          college_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          signature?: string | null
          slug?: string
          summary?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "students_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wiki_revisions: {
        Row: {
          created_at: string
          editor_id: string
          entity_id: string
          entity_type: string
          id: string
          snapshot: Json
          source_work_id: string | null
          summary: string
        }
        Insert: {
          created_at?: string
          editor_id: string
          entity_id: string
          entity_type: string
          id?: string
          snapshot: Json
          source_work_id?: string | null
          summary?: string
        }
        Update: {
          created_at?: string
          editor_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
          snapshot?: Json
          source_work_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "wiki_revisions_editor_id_fkey"
            columns: ["editor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_wiki_revision: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_expected_version: number
          p_patch: Json
          p_source_work_id?: string
          p_summary?: string
        }
        Returns: Json
      }
      create_wiki_entity: {
        Args: {
          p_college_id?: string
          p_entity_type: string
          p_name: string
          p_signature?: string
          p_slug: string
          p_summary?: string
        }
        Returns: Json
      }
      rollback_wiki_revision: {
        Args: {
          p_expected_version: number
          p_revision_id: string
          p_summary?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const


// Domain aliases used by the application; the Database shape above is generated.
export type Creator = Database["public"]["Tables"]["profiles"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type College = Database["public"]["Tables"]["colleges"]["Row"];
export type Place = Database["public"]["Tables"]["places"]["Row"];
export type ForumAccount = Database["public"]["Tables"]["forum_accounts"]["Row"];
export type WikiRevision = Database["public"]["Tables"]["wiki_revisions"]["Row"];
