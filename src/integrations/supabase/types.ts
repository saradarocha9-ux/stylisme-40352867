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
          likes_count: number
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
          likes_count?: number
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
          likes_count?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_public_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          banner_url: string
          bio: string
          id: string
          link: string
          name: string
          username: string
        }[]
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
    Enums: {},
  },
} as const
