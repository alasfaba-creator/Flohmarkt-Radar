// Automatisch generiert aus dem Supabase-Projekt (Supabase MCP / `supabase gen types`). Nicht von Hand ändern.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      market_suggestions: {
        Row: {
          created_at: string
          id: string
          location_info: string | null
          notes: string | null
          suggested_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          location_info?: string | null
          notes?: string | null
          suggested_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          location_info?: string | null
          notes?: string | null
          suggested_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      markets: {
        Row: {
          available_sizes_text: string | null
          booked_stalls: number | null
          created_at: string
          description: string | null
          features: string[] | null
          id: string
          images: string[] | null
          is_covered: string | null
          is_market_open: boolean | null
          latitude: number
          location: unknown
          longitude: number
          name: string
          organizer_id: string | null
          parking_info_text: string | null
          show_available_sizes_to_sellers: boolean | null
          show_free_stalls_to_sellers: boolean | null
          show_occupancy_to_sellers: boolean | null
          total_stalls: number | null
        }
        Insert: {
          available_sizes_text?: string | null
          booked_stalls?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_covered?: string | null
          is_market_open?: boolean | null
          latitude: number
          location?: unknown
          longitude: number
          name: string
          organizer_id?: string | null
          parking_info_text?: string | null
          show_available_sizes_to_sellers?: boolean | null
          show_free_stalls_to_sellers?: boolean | null
          show_occupancy_to_sellers?: boolean | null
          total_stalls?: number | null
        }
        Update: {
          available_sizes_text?: string | null
          booked_stalls?: number | null
          created_at?: string
          description?: string | null
          features?: string[] | null
          id?: string
          images?: string[] | null
          is_covered?: string | null
          is_market_open?: boolean | null
          latitude?: number
          location?: unknown
          longitude?: number
          name?: string
          organizer_id?: string | null
          parking_info_text?: string | null
          show_available_sizes_to_sellers?: boolean | null
          show_free_stalls_to_sellers?: boolean | null
          show_occupancy_to_sellers?: boolean | null
          total_stalls?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "markets_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_super_admin: boolean
          organizer_status: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_super_admin?: boolean
          organizer_status?: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_super_admin?: boolean
          organizer_status?: string
          role?: string
        }
        Relationships: []
      }
      stalls: {
        Row: {
          approval_status: string
          categories: string[] | null
          created_at: string
          custom_items: string | null
          event_date: string | null
          has_coffee_and_cake: boolean | null
          id: string
          image_url: string | null
          is_open_by_seller: boolean | null
          latitude: number
          location: unknown
          longitude: number
          market_id: string | null
          planned_end: string | null
          planned_start: string | null
          proof_image_url: string | null
          stall_type: string
          stand_number: string | null
          user_id: string | null
        }
        Insert: {
          approval_status?: string
          categories?: string[] | null
          created_at?: string
          custom_items?: string | null
          event_date?: string | null
          has_coffee_and_cake?: boolean | null
          id?: string
          image_url?: string | null
          is_open_by_seller?: boolean | null
          latitude: number
          location?: unknown
          longitude: number
          market_id?: string | null
          planned_end?: string | null
          planned_start?: string | null
          proof_image_url?: string | null
          stall_type: string
          stand_number?: string | null
          user_id?: string | null
        }
        Update: {
          approval_status?: string
          categories?: string[] | null
          created_at?: string
          custom_items?: string | null
          event_date?: string | null
          has_coffee_and_cake?: boolean | null
          id?: string
          image_url?: string | null
          is_open_by_seller?: boolean | null
          latitude?: number
          location?: unknown
          longitude?: number
          market_id?: string | null
          planned_end?: string | null
          planned_start?: string | null
          proof_image_url?: string | null
          stall_type?: string
          stand_number?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stalls_market_id_fkey"
            columns: ["market_id"]
            isOneToOne: false
            referencedRelation: "markets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stalls_user_id_fkey"
            columns: ["user_id"]
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
      markets_nearby: {
        Args: { lat: number; lng: number; radius_m: number }
        Returns: {
          distance_m: number
          market: Database["public"]["Tables"]["markets"]["Row"]
        }[]
      }
      stalls_nearby: {
        Args: { lat: number; lng: number; radius_m: number }
        Returns: {
          distance_m: number
          stall: Database["public"]["Tables"]["stalls"]["Row"]
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
