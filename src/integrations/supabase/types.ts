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
      ad_campaigns: {
        Row: {
          accent: string
          active: boolean
          advertiser_id: string | null
          bg: string
          brand: string
          category: string
          cpc_cents: number
          cpm_cents: number
          created_at: string
          cta: string
          headline: string
          id: string
          network: string
          priority: number
          subline: string
          url: string
        }
        Insert: {
          accent?: string
          active?: boolean
          advertiser_id?: string | null
          bg?: string
          brand: string
          category?: string
          cpc_cents?: number
          cpm_cents?: number
          created_at?: string
          cta?: string
          headline: string
          id?: string
          network?: string
          priority?: number
          subline?: string
          url: string
        }
        Update: {
          accent?: string
          active?: boolean
          advertiser_id?: string | null
          bg?: string
          brand?: string
          category?: string
          cpc_cents?: number
          cpm_cents?: number
          created_at?: string
          cta?: string
          headline?: string
          id?: string
          network?: string
          priority?: number
          subline?: string
          url?: string
        }
        Relationships: []
      }
      ad_events: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          kind: string
          placement: string
          revenue_cents: number
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          kind: string
          placement?: string
          revenue_cents?: number
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          kind?: string
          placement?: string
          revenue_cents?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      campaign_events: {
        Row: {
          campaign_id: string
          created_at: string
          dedupe_key: string
          id: string
          kind: string
          placement: string
          session_key: string
          user_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          dedupe_key: string
          id?: string
          kind: string
          placement?: string
          session_key: string
          user_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          dedupe_key?: string
          id?: string
          kind?: string
          placement?: string
          session_key?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "store_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      color_analyses: {
        Row: {
          analysis: Json
          chroma: string
          contrast: string
          created_at: string
          depth: string
          id: string
          season: string
          season_family: string
          thumbnail: string | null
          undertone: string
          user_id: string
        }
        Insert: {
          analysis: Json
          chroma?: string
          contrast?: string
          created_at?: string
          depth?: string
          id?: string
          season: string
          season_family?: string
          thumbnail?: string | null
          undertone?: string
          user_id: string
        }
        Update: {
          analysis?: Json
          chroma?: string
          contrast?: string
          created_at?: string
          depth?: string
          id?: string
          season?: string
          season_family?: string
          thumbnail?: string | null
          undertone?: string
          user_id?: string
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          details: string
          id: string
          post_id: string
          reason: string
          reporter_id: string
          resolution_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          details?: string
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          details?: string
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          resolution_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "look_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_usage: {
        Row: {
          kind: string
          updated_at: string
          usage_date: string
          used: number
          user_id: string
        }
        Insert: {
          kind: string
          updated_at?: string
          usage_date?: string
          used?: number
          user_id: string
        }
        Update: {
          kind?: string
          updated_at?: string
          usage_date?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      look_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "look_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "look_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      look_posts: {
        Row: {
          author_avatar: string | null
          author_name: string
          caption: string
          category: string
          created_at: string
          garments: Json
          id: string
          image_path: string
          is_editorial: boolean
          likes_count: number
          suspended_at: string | null
          suspension_reason: string | null
          title: string
          user_id: string
        }
        Insert: {
          author_avatar?: string | null
          author_name?: string
          caption?: string
          category?: string
          created_at?: string
          garments?: Json
          id?: string
          image_path: string
          is_editorial?: boolean
          likes_count?: number
          suspended_at?: string | null
          suspension_reason?: string | null
          title: string
          user_id: string
        }
        Update: {
          author_avatar?: string | null
          author_name?: string
          caption?: string
          category?: string
          created_at?: string
          garments?: Json
          id?: string
          image_path?: string
          is_editorial?: boolean
          likes_count?: number
          suspended_at?: string | null
          suspension_reason?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string
          city: string | null
          id: string
          joined_at: string
          language: string
          link: string
          name: string
          notifications: boolean
          plan: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string
          city?: string | null
          id: string
          joined_at?: string
          language?: string
          link?: string
          name?: string
          notifications?: boolean
          plan?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string
          city?: string | null
          id?: string
          joined_at?: string
          language?: string
          link?: string
          name?: string
          notifications?: boolean
          plan?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string
          id: string
          link: string
          name: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string
          id: string
          link?: string
          name?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string
          id?: string
          link?: string
          name?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_inspirations: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_inspirations_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "look_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      store_campaigns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          cta: string
          destination_url: string
          ends_at: string | null
          headline: string
          id: string
          image_path: string | null
          name: string
          product_id: string | null
          rejection_reason: string | null
          revision: number
          starts_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          store_id: string
          submitted_at: string | null
          targeting: Json
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          cta: string
          destination_url: string
          ends_at?: string | null
          headline: string
          id?: string
          image_path?: string | null
          name: string
          product_id?: string | null
          rejection_reason?: string | null
          revision?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          store_id: string
          submitted_at?: string | null
          targeting?: Json
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          cta?: string
          destination_url?: string
          ends_at?: string | null
          headline?: string
          id?: string
          image_path?: string | null
          name?: string
          product_id?: string | null
          rejection_reason?: string | null
          revision?: number
          starts_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          store_id?: string
          submitted_at?: string | null
          targeting?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_campaigns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_events: {
        Row: {
          created_at: string
          dedupe_key: string
          id: string
          kind: string
          product_id: string | null
          session_key: string
          store_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          id?: string
          kind: string
          product_id?: string | null
          session_key: string
          store_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          id?: string
          kind?: string
          product_id?: string | null
          session_key?: string
          store_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          created_at: string
          id: string
          member_role: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_role?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_role?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          category: string
          created_at: string
          description: string
          destination_url: string | null
          id: string
          image_path: string | null
          name: string
          price_cents: number | null
          published: boolean
          service_area: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          destination_url?: string | null
          id?: string
          image_path?: string | null
          name: string
          price_cents?: number | null
          published?: boolean
          service_area?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          destination_url?: string | null
          id?: string
          image_path?: string | null
          name?: string
          price_cents?: number | null
          published?: boolean
          service_area?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          banner_path: string | null
          created_at: string
          description: string
          id: string
          instagram_url: string | null
          logo_path: string | null
          name: string
          partner_subscription_id: string | null
          partner_tier: string | null
          partner_until: string | null
          rejection_reason: string | null
          service_area: Json
          slug: string
          status: Database["public"]["Enums"]["store_status"]
          updated_at: string
          verified_at: string | null
          website_url: string | null
        }
        Insert: {
          banner_path?: string | null
          created_at?: string
          description?: string
          id?: string
          instagram_url?: string | null
          logo_path?: string | null
          name: string
          partner_subscription_id?: string | null
          partner_tier?: string | null
          partner_until?: string | null
          rejection_reason?: string | null
          service_area?: Json
          slug: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
          verified_at?: string | null
          website_url?: string | null
        }
        Update: {
          banner_path?: string | null
          created_at?: string
          description?: string
          id?: string
          instagram_url?: string | null
          logo_path?: string | null
          name?: string
          partner_subscription_id?: string | null
          partner_tier?: string | null
          partner_until?: string | null
          rejection_reason?: string | null
          service_area?: Json
          slug?: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
          verified_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      subscription_events: {
        Row: {
          event_type: string
          payload_hash: string
          processed_at: string
          provider_event_id: string
          user_id: string | null
        }
        Insert: {
          event_type: string
          payload_hash: string
          processed_at?: string
          provider_event_id: string
          user_id?: string | null
        }
        Update: {
          event_type?: string
          payload_hash?: string
          processed_at?: string
          provider_event_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_entries: {
        Row: {
          city: string | null
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      campaign_fits_partner_plan: {
        Args: { _store_id: string; _targeting: Json }
        Returns: boolean
      }
      consume_daily_usage:
        | {
            Args: { _kind: string }
            Returns: {
              allowed: boolean
              remaining: number
              used: number
            }[]
          }
        | {
            Args: { _free_limit: number; _kind: string }
            Returns: {
              allowed: boolean
              remaining: number
              used: number
            }[]
          }
      create_store_with_owner: {
        Args: {
          _description: string
          _instagram_url: string
          _name: string
          _service_area: Json
          _slug: string
          _website_url: string
        }
        Returns: string
      }
      get_follow_counts: {
        Args: { _user_id: string }
        Returns: {
          followers: number
          following: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_store_member: {
        Args: { _store_id: string; _user_id?: string }
        Returns: boolean
      }
      refund_daily_usage: {
        Args: { _kind: string; _user_id: string }
        Returns: undefined
      }
      submit_store_campaign: {
        Args: { _campaign_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      campaign_status:
        | "draft"
        | "submitted"
        | "under_review"
        | "approved"
        | "scheduled"
        | "active"
        | "paused"
        | "rejected"
        | "ended"
      report_status: "open" | "under_review" | "resolved" | "dismissed"
      store_status: "pending" | "verified" | "rejected" | "suspended"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      campaign_status: [
        "draft",
        "submitted",
        "under_review",
        "approved",
        "scheduled",
        "active",
        "paused",
        "rejected",
        "ended",
      ],
      report_status: ["open", "under_review", "resolved", "dismissed"],
      store_status: ["pending", "verified", "rejected", "suspended"],
    },
  },
} as const
