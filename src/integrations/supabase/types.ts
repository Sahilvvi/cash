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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          clicked_at: string
          id: string
          ip_address: string | null
          session_id: string | null
          store_id: string
          user_id: string
        }
        Insert: {
          clicked_at?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          store_id: string
          user_id: string
        }
        Update: {
          clicked_at?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      banners: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link: string | null
          mobile_image_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link?: string | null
          mobile_image_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link?: string | null
          mobile_image_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cashback_transactions: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          description: string | null
          id: string
          order_amount: number | null
          order_id: string | null
          status: string
          store_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_amount?: number | null
          order_id?: string | null
          status?: string
          store_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_amount?: number | null
          order_id?: string | null
          status?: string
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashback_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          display_order: number | null
          icon: string
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          display_order?: number | null
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          cashback_percent: number | null
          category_id: string | null
          coupon_code: string | null
          created_at: string
          description: string | null
          discount_text: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_exclusive: boolean | null
          is_verified: boolean | null
          store_id: string
          subcategory_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cashback_percent?: number | null
          category_id?: string | null
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          discount_text?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_exclusive?: boolean | null
          is_verified?: boolean | null
          store_id: string
          subcategory_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cashback_percent?: number | null
          category_id?: string | null
          coupon_code?: string | null
          created_at?: string
          description?: string | null
          discount_text?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_exclusive?: boolean | null
          is_verified?: boolean | null
          store_id?: string
          subcategory_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          brand: string
          category: string | null
          created_at: string
          denominations: Json | null
          description: string | null
          discount_percent: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          subcategory_id: string | null
        }
        Insert: {
          brand: string
          category?: string | null
          created_at?: string
          denominations?: Json | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          subcategory_id?: string | null
        }
        Update: {
          brand?: string
          category?: string | null
          created_at?: string
          denominations?: Json | null
          description?: string | null
          discount_percent?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          subcategory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referred_id: string
          referred_reward: number | null
          referrer_id: string
          referrer_reward: number | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_id: string
          referred_reward?: number | null
          referrer_id: string
          referrer_reward?: number | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_id?: string
          referred_reward?: number | null
          referrer_id?: string
          referrer_reward?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      spin_rewards: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          probability: number | null
          reward_type: string
          reward_value: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          probability?: number | null
          reward_type: string
          reward_value?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          probability?: number | null
          reward_type?: string
          reward_value?: number | null
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          logo_url: string
          name: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url: string
          name: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          logo_url?: string
          name?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      stores: {
        Row: {
          affiliate_url: string | null
          cashback_percent: number | null
          cashback_type: string | null
          category: string | null
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_new: boolean | null
          is_trending: boolean | null
          logo_url: string | null
          name: string
          offers_count: number | null
          slug: string
          subcategory_id: string | null
          updated_at: string
        }
        Insert: {
          affiliate_url?: string | null
          cashback_percent?: number | null
          cashback_type?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_new?: boolean | null
          is_trending?: boolean | null
          logo_url?: string | null
          name: string
          offers_count?: number | null
          slug: string
          subcategory_id?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_url?: string | null
          cashback_percent?: number | null
          cashback_type?: string | null
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_new?: boolean | null
          is_trending?: boolean | null
          logo_url?: string | null
          name?: string
          offers_count?: number | null
          slug?: string
          subcategory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          category_id: string
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          category_id?: string
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gift_cards: {
        Row: {
          amount: number
          code: string
          expires_at: string | null
          gift_card_id: string
          id: string
          pin: string | null
          purchased_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          code: string
          expires_at?: string | null
          gift_card_id: string
          id?: string
          pin?: string | null
          purchased_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          code?: string
          expires_at?: string | null
          gift_card_id?: string
          id?: string
          pin?: string | null
          purchased_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gift_cards_gift_card_id_fkey"
            columns: ["gift_card_id"]
            isOneToOne: false
            referencedRelation: "gift_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      user_spins: {
        Row: {
          id: string
          reward_id: string | null
          reward_value: number | null
          spun_at: string
          user_id: string
        }
        Insert: {
          id?: string
          reward_id?: string | null
          reward_value?: number | null
          spun_at?: string
          user_id: string
        }
        Update: {
          id?: string
          reward_id?: string | null
          reward_value?: number | null
          spun_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_spins_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "spin_rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          id: string
          payment_details: Json | null
          payment_method: string
          processed_at: string | null
          requested_at: string
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          id?: string
          payment_details?: Json | null
          payment_method?: string
          processed_at?: string | null
          requested_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
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
