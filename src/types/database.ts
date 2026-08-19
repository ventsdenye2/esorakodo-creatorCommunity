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
      students: {
        Row: {
          id: string;
          name: string;
          slug: string;
          college_id: string | null;
          signature: string | null;
          summary: string | null;
          created_by: string;
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Creator = Database["public"]["Tables"]["profiles"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type ForumAccount = Database["public"]["Tables"]["forum_accounts"]["Row"];
