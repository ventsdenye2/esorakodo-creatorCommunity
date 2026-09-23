export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          avatar_key: string | null;
          bio: string | null;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          handle: string;
          display_name: string;
          avatar_key?: string | null;
          bio?: string | null;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      colleges: {
        Row: {
          id: string;
          slug: string;
          name: string;
          summary: string | null;
          created_by: string;
          version: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          summary?: string | null;
          created_by: string;
          version?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["colleges"]["Insert"]>;
        Relationships: [];
      };
      places: {
        Row: {
          id: string;
          slug: string;
          name: string;
          college_id: string | null;
          summary: string | null;
          created_by: string;
          version: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          college_id?: string | null;
          summary?: string | null;
          created_by: string;
          version?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["places"]["Insert"]>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          name: string;
          slug: string;
          college_id: string | null;
          signature: string | null;
          summary: string | null;
          created_by: string;
          version: number;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          college_id?: string | null;
          signature?: string | null;
          summary?: string | null;
          created_by: string;
          version?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
        Relationships: [];
      };
      forum_accounts: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          avatar_key: string | null;
          signature: string | null;
          student_id: string | null;
          account_type: string;
          created_by: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          handle: string;
          display_name: string;
          avatar_key?: string | null;
          signature?: string | null;
          student_id?: string | null;
          account_type?: string;
          created_by: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["forum_accounts"]["Insert"]>;
        Relationships: [];
      };
      wiki_revisions: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          editor_id: string;
          summary: string;
          source_work_id: string | null;
          snapshot: Json;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          editor_id: string;
          summary?: string;
          source_work_id?: string | null;
          snapshot: Json;
          created_at?: Timestamp;
        };
        Update: Partial<Database["public"]["Tables"]["wiki_revisions"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_wiki_entity: {
        Args: {
          p_entity_type: string;
          p_slug: string;
          p_name: string;
          p_summary?: string | null;
          p_college_id?: string | null;
          p_signature?: string | null;
        };
        Returns: Json;
      };
      apply_wiki_revision: {
        Args: {
          p_entity_type: string;
          p_entity_id: string;
          p_expected_version: number;
          p_patch: Json;
          p_summary?: string;
          p_source_work_id?: string | null;
        };
        Returns: Json;
      };
      rollback_wiki_revision: {
        Args: {
          p_revision_id: string;
          p_expected_version: number;
          p_summary?: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Creator = Database["public"]["Tables"]["profiles"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type College = Database["public"]["Tables"]["colleges"]["Row"];
export type Place = Database["public"]["Tables"]["places"]["Row"];
export type ForumAccount = Database["public"]["Tables"]["forum_accounts"]["Row"];
export type WikiRevision = Database["public"]["Tables"]["wiki_revisions"]["Row"];
