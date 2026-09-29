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
      article_entity_links: {
        Row: {
          article_id: string
          college_id: string | null
          event_id: string | null
          id: string
          place_id: string | null
          student_id: string | null
        }
        Insert: {
          article_id: string
          college_id?: string | null
          event_id?: string | null
          id?: string
          place_id?: string | null
          student_id?: string | null
        }
        Update: {
          article_id?: string
          college_id?: string | null
          event_id?: string | null
          id?: string
          place_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_entity_links_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_entity_links_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_entity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_entity_links_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_entity_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      article_media: {
        Row: {
          article_id: string
          asset_id: string
        }
        Insert: {
          article_id: string
          asset_id: string
        }
        Update: {
          article_id?: string
          asset_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_media_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_media_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tags: {
        Row: {
          article_id: string
          tag_id: string
        }
        Insert: {
          article_id: string
          tag_id: string
        }
        Update: {
          article_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          body: Json
          created_at: string
          creator_id: string
          id: string
          published_at: string | null
          schema_version: number
          status: string
          summary: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          body: Json
          created_at?: string
          creator_id: string
          id?: string
          published_at?: string | null
          schema_version?: number
          status?: string
          summary?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          body?: Json
          created_at?: string
          creator_id?: string
          id?: string
          published_at?: string | null
          schema_version?: number
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          body: string
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
          body?: string
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
          body?: string
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
      event_entity_links: {
        Row: {
          college_id: string | null
          event_id: string
          id: string
          place_id: string | null
          related_event_id: string | null
          student_id: string | null
        }
        Insert: {
          college_id?: string | null
          event_id: string
          id?: string
          place_id?: string | null
          related_event_id?: string | null
          student_id?: string | null
        }
        Update: {
          college_id?: string | null
          event_id?: string
          id?: string
          place_id?: string | null
          related_event_id?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_entity_links_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_entity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_entity_links_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_entity_links_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_entity_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      event_supplements: {
        Row: {
          body: Json
          created_at: string
          creator_id: string
          event_id: string
          id: string
          kind: string
          published_at: string | null
          schema_version: number
          status: string
          timeline_node_id: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          body: Json
          created_at?: string
          creator_id: string
          event_id: string
          id?: string
          kind: string
          published_at?: string | null
          schema_version?: number
          status?: string
          timeline_node_id?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          body?: Json
          created_at?: string
          creator_id?: string
          event_id?: string
          id?: string
          kind?: string
          published_at?: string | null
          schema_version?: number
          status?: string
          timeline_node_id?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_supplements_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_supplements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_supplements_event_id_timeline_node_id_fkey"
            columns: ["event_id", "timeline_node_id"]
            isOneToOne: false
            referencedRelation: "event_timeline_nodes"
            referencedColumns: ["event_id", "id"]
          },
        ]
      }
      event_timeline_nodes: {
        Row: {
          description: string
          event_id: string
          id: string
          label: string
          sort_order: number
          title: string
        }
        Insert: {
          description?: string
          event_id: string
          id?: string
          label: string
          sort_order: number
          title: string
        }
        Update: {
          description?: string
          event_id?: string
          id?: string
          label?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_timeline_nodes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          causes: string
          consequences: string
          created_at: string
          creator_id: string
          ends_on: string | null
          id: string
          published_at: string | null
          starts_on: string | null
          status: string
          summary: string
          time_range: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          causes?: string
          consequences?: string
          created_at?: string
          creator_id: string
          ends_on?: string | null
          id?: string
          published_at?: string | null
          starts_on?: string | null
          status?: string
          summary?: string
          time_range?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          causes?: string
          consequences?: string
          created_at?: string
          creator_id?: string
          ends_on?: string | null
          id?: string
          published_at?: string | null
          starts_on?: string | null
          status?: string
          summary?: string
          time_range?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_accounts: {
        Row: {
          account_type: string
          avatar_asset_id: string | null
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
          avatar_asset_id?: string | null
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
          avatar_asset_id?: string | null
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
            foreignKeyName: "forum_accounts_avatar_asset_id_fkey"
            columns: ["avatar_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
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
      forum_messages: {
        Row: {
          question_count: number
          like_count: number
          body: string
          created_at: string
          floor_no: number
          forum_account_id: string
          id: string
          in_world_time: string | null
          reply_to_message_id: string | null
          topic_id: string
          updated_at: string
        }
        Insert: {
          question_count?: number
          like_count?: number
          body: string
          created_at?: string
          floor_no: number
          forum_account_id: string
          id?: string
          in_world_time?: string | null
          reply_to_message_id?: string | null
          topic_id: string
          updated_at?: string
        }
        Update: {
          question_count?: number
          like_count?: number
          body?: string
          created_at?: string
          floor_no?: number
          forum_account_id?: string
          id?: string
          in_world_time?: string | null
          reply_to_message_id?: string | null
          topic_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_messages_forum_account_id_fkey"
            columns: ["forum_account_id"]
            isOneToOne: false
            referencedRelation: "forum_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "forum_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_messages_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topic_entity_links: {
        Row: {
          college_id: string | null
          event_id: string | null
          id: string
          place_id: string | null
          student_id: string | null
          topic_id: string
        }
        Insert: {
          college_id?: string | null
          event_id?: string | null
          id?: string
          place_id?: string | null
          student_id?: string | null
          topic_id: string
        }
        Update: {
          college_id?: string | null
          event_id?: string | null
          id?: string
          place_id?: string | null
          student_id?: string | null
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topic_entity_links_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_topic_entity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_topic_entity_links_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_topic_entity_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_topic_entity_links_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topic_hashtags: {
        Row: {
          hashtag_id: string
          topic_id: string
        }
        Insert: {
          hashtag_id: string
          topic_id: string
        }
        Update: {
          hashtag_id?: string
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topic_hashtags_hashtag_id_fkey"
            columns: ["hashtag_id"]
            isOneToOne: false
            referencedRelation: "hashtags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_topic_hashtags_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          board: string
          created_at: string
          creator_id: string
          id: string
          published_at: string | null
          status: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          board: string
          created_at?: string
          creator_id: string
          id?: string
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          board?: string
          created_at?: string
          creator_id?: string
          id?: string
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtags: {
        Row: {
          created_at: string
          id: string
          name: string
          normalized_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          normalized_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          normalized_name?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          byte_size: number
          created_at: string
          filename: string
          id: string
          mime_type: string
          object_key: string
          status: string
          uploader_id: string
        }
        Insert: {
          byte_size: number
          created_at?: string
          filename: string
          id?: string
          mime_type: string
          object_key: string
          status?: string
          uploader_id: string
        }
        Update: {
          byte_size?: number
          created_at?: string
          filename?: string
          id?: string
          mime_type?: string
          object_key?: string
          status?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_actions: {
        Row: {
          action: string
          created_at: string
          id: string
          moderator_id: string
          next_status: string
          previous_status: string
          reason: string
          report_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          moderator_id: string
          next_status: string
          previous_status: string
          reason: string
          report_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          moderator_id?: string
          next_status?: string
          previous_status?: string
          reason?: string
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      moderators: {
        Row: {
          creator_id: string
          granted_at: string
        }
        Insert: {
          creator_id: string
          granted_at?: string
        }
        Update: {
          creator_id?: string
          granted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderators_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          body: string
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
          body?: string
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
          body?: string
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
          avatar_asset_id: string | null
          avatar_key: string | null
          bio: string | null
          created_at: string
          display_name: string
          handle: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_asset_id?: string | null
          avatar_key?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          handle: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_asset_id?: string | null
          avatar_key?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          handle?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_avatar_asset_id_fkey"
            columns: ["avatar_asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          article_id: string | null
          created_at: string
          event_id: string | null
          forum_topic_id: string | null
          id: string
          reason: string
          reporter_id: string
          status: string
          supplement_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          event_id?: string | null
          forum_topic_id?: string | null
          id?: string
          reason: string
          reporter_id: string
          status?: string
          supplement_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string
          event_id?: string | null
          forum_topic_id?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          status?: string
          supplement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_forum_topic_id_fkey"
            columns: ["forum_topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "event_supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          body: string
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
          body?: string
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
          body?: string
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
      supplement_entity_links: {
        Row: {
          college_id: string | null
          event_id: string | null
          id: string
          place_id: string | null
          student_id: string | null
          supplement_id: string
        }
        Insert: {
          college_id?: string | null
          event_id?: string | null
          id?: string
          place_id?: string | null
          student_id?: string | null
          supplement_id: string
        }
        Update: {
          college_id?: string | null
          event_id?: string | null
          id?: string
          place_id?: string | null
          student_id?: string | null
          supplement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_entity_links_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_entity_links_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_entity_links_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_entity_links_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_entity_links_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "event_supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_media: {
        Row: {
          asset_id: string
          supplement_id: string
        }
        Insert: {
          asset_id: string
          supplement_id: string
        }
        Update: {
          asset_id?: string
          supplement_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_media_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplement_media_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "event_supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
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
      work_bookmarks: {
        Row: {
          article_id: string | null
          created_at: string
          creator_id: string
          event_id: string | null
          forum_topic_id: string | null
          id: string
          supplement_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          creator_id: string
          event_id?: string | null
          forum_topic_id?: string | null
          id?: string
          supplement_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string
          creator_id?: string
          event_id?: string | null
          forum_topic_id?: string | null
          id?: string
          supplement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_bookmarks_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_bookmarks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_bookmarks_forum_topic_id_fkey"
            columns: ["forum_topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_bookmarks_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "event_supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      work_comments: {
        Row: {
          article_id: string | null
          body: string
          created_at: string
          creator_id: string
          deleted: boolean
          event_id: string | null
          forum_topic_id: string | null
          id: string
          supplement_id: string | null
        }
        Insert: {
          article_id?: string | null
          body: string
          created_at?: string
          creator_id: string
          deleted?: boolean
          event_id?: string | null
          forum_topic_id?: string | null
          id?: string
          supplement_id?: string | null
        }
        Update: {
          article_id?: string | null
          body?: string
          created_at?: string
          creator_id?: string
          deleted?: boolean
          event_id?: string | null
          forum_topic_id?: string | null
          id?: string
          supplement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_comments_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_comments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_comments_forum_topic_id_fkey"
            columns: ["forum_topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_comments_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "event_supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      work_likes: {
        Row: {
          article_id: string | null
          created_at: string
          creator_id: string
          event_id: string | null
          forum_topic_id: string | null
          id: string
          supplement_id: string | null
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          creator_id: string
          event_id?: string | null
          forum_topic_id?: string | null
          id?: string
          supplement_id?: string | null
        }
        Update: {
          article_id?: string | null
          created_at?: string
          creator_id?: string
          event_id?: string | null
          forum_topic_id?: string | null
          id?: string
          supplement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_likes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_likes_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_likes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_likes_forum_topic_id_fkey"
            columns: ["forum_topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_likes_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "event_supplements"
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
      create_wiki_entity_with_body: {
        Args: {
          p_body?: string
          p_college_id?: string
          p_entity_type: string
          p_name: string
          p_signature?: string
          p_slug: string
          p_summary?: string
        }
        Returns: Json
      }
      get_report_preview: { Args: { p_report_id: string }; Returns: Json }
      interact_work: {
        Args: {
          p_action: string
          p_body?: string
          p_id: string
          p_kind: string
        }
        Returns: undefined
      }
      is_moderator: { Args: never; Returns: boolean }
      moderate_report: {
        Args: { p_action: string; p_reason: string; p_report_id: string }
        Returns: undefined
      }
      publish_forum_topic: {
        Args: { p_topic_id: string }
        Returns: {
          board: string
          created_at: string
          creator_id: string
          id: string
          published_at: string | null
          status: string
          title: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "forum_topics"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      remove_work_comment: { Args: { p_id: string }; Returns: undefined }
      replace_forum_draft_hashtags: {
        Args: { p_names: string[]; p_topic_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          normalized_name: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "hashtags"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      replace_forum_draft_messages: {
        Args: { p_messages: Json; p_topic_id: string }
        Returns: {
          body: string
          created_at: string
          floor_no: number
          forum_account_id: string
          id: string
          in_world_time: string | null
          reply_to_message_id: string | null
          topic_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "forum_messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      report_work: {
        Args: { p_id: string; p_kind: string; p_reason: string }
        Returns: string
      }
      reserve_media: {
        Args: { p_byte_size: number; p_filename: string; p_mime_type: string }
        Returns: string
      }
      rollback_wiki_revision: {
        Args: {
          p_expected_version: number
          p_revision_id: string
          p_summary?: string
        }
        Returns: Json
      }
      save_article: {
        Args: {
          p_body: Json
          p_expected_version: number | null
          p_id: string | null
          p_publish: boolean
          p_summary: string
          p_tags: string[]
          p_title: string
        }
        Returns: string
      }
      save_event: {
        Args: {
          p_causes: string
          p_consequences: string
          p_ends_on?: string | null
          p_expected_version: number | null
          p_id: string | null
          p_links?: Json
          p_nodes: Json
          p_publish: boolean
          p_starts_on?: string | null
          p_summary: string
          p_time_range: string
          p_title: string
        }
        Returns: string
      }
      save_event_supplement: {
        Args: {
          p_body: Json
          p_event_id: string
          p_expected_version: number | null
          p_id: string | null
          p_kind: string
          p_publish: boolean
          p_timeline_node_id: string | null
          p_title: string
        }
        Returns: string
      }
      save_forum_draft: {
        Args: {
          p_board: string
          p_expected_version: number
          p_links: Json
          p_messages: Json
          p_publish?: boolean
          p_tags: string[]
          p_title: string
          p_topic_id: string
        }
        Returns: number
      }
      sync_content_links: {
        Args: { p_id: string; p_kind: string; p_links: Json }
        Returns: undefined
      }
      validate_content_body: { Args: { p_body: Json }; Returns: undefined }
      validate_content_image: {
        Args: { p_asset_id: string }
        Returns: undefined
      }
      work_is_public: {
        Args: { p_id: string; p_kind: string }
        Returns: boolean
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


// Application aliases; the Database shape above is generated from local Supabase.
export type Creator = Database["public"]["Tables"]["profiles"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type College = Database["public"]["Tables"]["colleges"]["Row"];
export type Place = Database["public"]["Tables"]["places"]["Row"];
export type ForumAccount = Database["public"]["Tables"]["forum_accounts"]["Row"];
export type WikiRevision = Database["public"]["Tables"]["wiki_revisions"]["Row"];
