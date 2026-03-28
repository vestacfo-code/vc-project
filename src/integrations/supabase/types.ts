export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_summaries: {
        Row: {
          body: string
          date: string
          generated_at: string
          headline: string
          hotel_id: string
          id: string
          metrics_snapshot: Json | null
          model: string | null
          period_type: string
          status: string
          tokens_used: number | null
        }
        Insert: {
          body: string
          date: string
          generated_at?: string
          headline: string
          hotel_id: string
          id?: string
          metrics_snapshot?: Json | null
          model?: string | null
          period_type: string
          status?: string
          tokens_used?: number | null
        }
        Update: {
          body?: string
          date?: string
          generated_at?: string
          headline?: string
          hotel_id?: string
          id?: string
          metrics_snapshot?: Json | null
          model?: string | null
          period_type?: string
          status?: string
          tokens_used?: number | null
        }
        Relationships: [{ foreignKeyName: "ai_summaries_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      anomalies: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          current_value: number | null
          date: string
          description: string
          detected_at: string
          expected_max: number | null
          expected_min: number | null
          hotel_id: string
          id: string
          metric: string
          resolved: boolean | null
          resolved_at: string | null
          severity: string
          title: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          current_value?: number | null
          date: string
          description: string
          detected_at?: string
          expected_max?: number | null
          expected_min?: number | null
          hotel_id: string
          id?: string
          metric: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          title: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          current_value?: number | null
          date?: string
          description?: string
          detected_at?: string
          expected_max?: number | null
          expected_min?: number | null
          hotel_id?: string
          id?: string
          metric?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          title?: string
        }
        Relationships: [{ foreignKeyName: "anomalies_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      budget_targets: {
        Row: {
          created_at: string
          hotel_id: string
          id: string
          month: number
          target_adr: number | null
          target_gop: number | null
          target_labor_ratio: number | null
          target_occupancy: number | null
          target_revenue: number | null
          target_revpar: number | null
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          hotel_id: string
          id?: string
          month: number
          target_adr?: number | null
          target_gop?: number | null
          target_labor_ratio?: number | null
          target_occupancy?: number | null
          target_revenue?: number | null
          target_revpar?: number | null
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          hotel_id?: string
          id?: string
          month?: number
          target_adr?: number | null
          target_gop?: number | null
          target_labor_ratio?: number | null
          target_occupancy?: number | null
          target_revenue?: number | null
          target_revpar?: number | null
          updated_at?: string
          year?: number
        }
        Relationships: [{ foreignKeyName: "budget_targets_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      daily_metrics: {
        Row: {
          adr: number | null
          created_at: string
          data_source: string | null
          date: string
          fnb_revenue: number | null
          gop: number | null
          gop_margin: number | null
          goppar: number | null
          hotel_id: string
          id: string
          labor_cost: number | null
          labor_cost_ratio: number | null
          occupancy_rate: number | null
          other_revenue: number | null
          revpar: number | null
          room_revenue: number | null
          rooms_available: number
          rooms_out_of_order: number
          rooms_sold: number
          spa_revenue: number | null
          total_expenses: number | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          adr?: number | null
          created_at?: string
          data_source?: string | null
          date: string
          fnb_revenue?: number | null
          gop?: number | null
          gop_margin?: number | null
          goppar?: number | null
          hotel_id: string
          id?: string
          labor_cost?: number | null
          labor_cost_ratio?: number | null
          occupancy_rate?: number | null
          other_revenue?: number | null
          revpar?: number | null
          room_revenue?: number | null
          rooms_available: number
          rooms_out_of_order?: number
          rooms_sold?: number
          spa_revenue?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          adr?: number | null
          created_at?: string
          data_source?: string | null
          date?: string
          fnb_revenue?: number | null
          gop?: number | null
          gop_margin?: number | null
          goppar?: number | null
          hotel_id?: string
          id?: string
          labor_cost?: number | null
          labor_cost_ratio?: number | null
          occupancy_rate?: number | null
          other_revenue?: number | null
          revpar?: number | null
          room_revenue?: number | null
          rooms_available?: number
          rooms_out_of_order?: number
          rooms_sold?: number
          spa_revenue?: number | null
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: [{ foreignKeyName: "daily_metrics_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          date: string
          description: string | null
          external_id: string | null
          hotel_id: string
          id: string
          is_recurring: boolean | null
          source: string | null
          subcategory: string | null
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          date: string
          description?: string | null
          external_id?: string | null
          hotel_id: string
          id?: string
          is_recurring?: boolean | null
          source?: string | null
          subcategory?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          date?: string
          description?: string | null
          external_id?: string | null
          hotel_id?: string
          id?: string
          is_recurring?: boolean | null
          source?: string | null
          subcategory?: string | null
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [{ foreignKeyName: "expenses_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      hotel_chat_messages: {
        Row: { content: string; created_at: string; id: string; metadata: Json | null; role: string; session_id: string }
        Insert: { content: string; created_at?: string; id?: string; metadata?: Json | null; role: string; session_id: string }
        Update: { content?: string; created_at?: string; id?: string; metadata?: Json | null; role?: string; session_id?: string }
        Relationships: [{ foreignKeyName: "hotel_chat_messages_session_id_fkey"; columns: ["session_id"]; isOneToOne: false; referencedRelation: "hotel_chat_sessions"; referencedColumns: ["id"] }]
      }
      hotel_chat_sessions: {
        Row: { created_at: string; hotel_id: string; id: string; title: string | null; updated_at: string; user_id: string }
        Insert: { created_at?: string; hotel_id: string; id?: string; title?: string | null; updated_at?: string; user_id: string }
        Update: { created_at?: string; hotel_id?: string; id?: string; title?: string | null; updated_at?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "hotel_chat_sessions_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      hotel_members: {
        Row: { created_at: string; hotel_id: string; id: string; invited_by: string | null; role: string; user_id: string }
        Insert: { created_at?: string; hotel_id: string; id?: string; invited_by?: string | null; role?: string; user_id: string }
        Update: { created_at?: string; hotel_id?: string; id?: string; invited_by?: string | null; role?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "hotel_members_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      hotel_notifications: {
        Row: { body: string; created_at: string; hotel_id: string; id: string; link: string | null; read_at: string | null; source_id: string | null; title: string; type: string; user_id: string }
        Insert: { body: string; created_at?: string; hotel_id: string; id?: string; link?: string | null; read_at?: string | null; source_id?: string | null; title: string; type: string; user_id: string }
        Update: { body?: string; created_at?: string; hotel_id?: string; id?: string; link?: string | null; read_at?: string | null; source_id?: string | null; title?: string; type?: string; user_id?: string }
        Relationships: [{ foreignKeyName: "hotel_notifications_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      hotels: {
        Row: {
          address: string | null
          city: string | null
          country: string
          created_at: string
          currency: string
          id: string
          logo_url: string | null
          name: string
          organization_id: string
          property_type: string
          room_count: number
          star_rating: number | null
          state: string | null
          timezone: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name: string
          organization_id: string
          property_type?: string
          room_count: number
          star_rating?: number | null
          state?: string | null
          timezone?: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          name?: string
          organization_id?: string
          property_type?: string
          room_count?: number
          star_rating?: number | null
          state?: string | null
          timezone?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: [{ foreignKeyName: "hotels_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }]
      }
      integrations: {
        Row: { created_at: string; credentials: Json | null; error_message: string | null; hotel_id: string; id: string; last_sync_at: string | null; provider: string; settings: Json | null; status: string; type: string; updated_at: string }
        Insert: { created_at?: string; credentials?: Json | null; error_message?: string | null; hotel_id: string; id?: string; last_sync_at?: string | null; provider: string; settings?: Json | null; status?: string; type: string; updated_at?: string }
        Update: { created_at?: string; credentials?: Json | null; error_message?: string | null; hotel_id?: string; id?: string; last_sync_at?: string | null; provider?: string; settings?: Json | null; status?: string; type?: string; updated_at?: string }
        Relationships: [{ foreignKeyName: "integrations_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      notification_preferences: {
        Row: { anomaly_email: boolean | null; anomaly_whatsapp: boolean | null; daily_briefing_email: boolean | null; daily_briefing_whatsapp: boolean | null; hotel_id: string; id: string; quiet_hours_end: string | null; quiet_hours_start: string | null; sync_error_email: boolean | null; updated_at: string; user_id: string; weekly_report_email: boolean | null }
        Insert: { anomaly_email?: boolean | null; anomaly_whatsapp?: boolean | null; daily_briefing_email?: boolean | null; daily_briefing_whatsapp?: boolean | null; hotel_id: string; id?: string; quiet_hours_end?: string | null; quiet_hours_start?: string | null; sync_error_email?: boolean | null; updated_at?: string; user_id: string; weekly_report_email?: boolean | null }
        Update: { anomaly_email?: boolean | null; anomaly_whatsapp?: boolean | null; daily_briefing_email?: boolean | null; daily_briefing_whatsapp?: boolean | null; hotel_id?: string; id?: string; quiet_hours_end?: string | null; quiet_hours_start?: string | null; sync_error_email?: boolean | null; updated_at?: string; user_id?: string; weekly_report_email?: boolean | null }
        Relationships: [{ foreignKeyName: "notification_preferences_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      organizations: {
        Row: { created_at: string; id: string; name: string; owner_user_id: string; plan: string; stripe_customer_id: string | null; updated_at: string }
        Insert: { created_at?: string; id?: string; name: string; owner_user_id: string; plan?: string; stripe_customer_id?: string | null; updated_at?: string }
        Update: { created_at?: string; id?: string; name?: string; owner_user_id?: string; plan?: string; stripe_customer_id?: string | null; updated_at?: string }
        Relationships: []
      }
      partner_leads: {
        Row: { clicked_at: string; converted: boolean | null; converted_at: string | null; hotel_id: string; id: string; partner_id: string; source: string | null; user_id: string }
        Insert: { clicked_at?: string; converted?: boolean | null; converted_at?: string | null; hotel_id: string; id?: string; partner_id: string; source?: string | null; user_id: string }
        Update: { clicked_at?: string; converted?: boolean | null; converted_at?: string | null; hotel_id?: string; id?: string; partner_id?: string; source?: string | null; user_id?: string }
        Relationships: [{ foreignKeyName: "partner_leads_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }, { foreignKeyName: "partner_leads_partner_id_fkey"; columns: ["partner_id"]; isOneToOne: false; referencedRelation: "partners"; referencedColumns: ["id"] }]
      }
      partners: {
        Row: { avg_savings_label: string | null; avg_savings_pct: number | null; category: string; commission_type: string | null; commission_value: number | null; created_at: string; description: string | null; id: string; is_active: boolean | null; is_featured: boolean | null; logo_url: string | null; name: string; slug: string; tagline: string | null; updated_at: string; website_url: string | null }
        Insert: { avg_savings_label?: string | null; avg_savings_pct?: number | null; category: string; commission_type?: string | null; commission_value?: number | null; created_at?: string; description?: string | null; id?: string; is_active?: boolean | null; is_featured?: boolean | null; logo_url?: string | null; name: string; slug: string; tagline?: string | null; updated_at?: string; website_url?: string | null }
        Update: { avg_savings_label?: string | null; avg_savings_pct?: number | null; category?: string; commission_type?: string | null; commission_value?: number | null; created_at?: string; description?: string | null; id?: string; is_active?: boolean | null; is_featured?: boolean | null; logo_url?: string | null; name?: string; slug?: string; tagline?: string | null; updated_at?: string; website_url?: string | null }
        Relationships: []
      }
      recommendations: {
        Row: { category: string; created_at: string; description: string; dismissed_at: string | null; effort: string | null; estimated_savings_monthly: number | null; hotel_id: string; id: string; implemented_at: string | null; partner_slug: string | null; status: string | null; title: string }
        Insert: { category: string; created_at?: string; description: string; dismissed_at?: string | null; effort?: string | null; estimated_savings_monthly?: number | null; hotel_id: string; id?: string; implemented_at?: string | null; partner_slug?: string | null; status?: string | null; title: string }
        Update: { category?: string; created_at?: string; description?: string; dismissed_at?: string | null; effort?: string | null; estimated_savings_monthly?: number | null; hotel_id?: string; id?: string; implemented_at?: string | null; partner_slug?: string | null; status?: string | null; title?: string }
        Relationships: [{ foreignKeyName: "recommendations_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      revenue_by_channel: {
        Row: { bookings_count: number | null; channel: string; commission_amount: number | null; commission_rate: number | null; created_at: string; date: string; hotel_id: string; id: string; net_revenue: number | null; revenue: number | null; room_nights: number | null }
        Insert: { bookings_count?: number | null; channel: string; commission_amount?: number | null; commission_rate?: number | null; created_at?: string; date: string; hotel_id: string; id?: string; net_revenue?: number | null; revenue?: number | null; room_nights?: number | null }
        Update: { bookings_count?: number | null; channel?: string; commission_amount?: number | null; commission_rate?: number | null; created_at?: string; date?: string; hotel_id?: string; id?: string; net_revenue?: number | null; revenue?: number | null; room_nights?: number | null }
        Relationships: [{ foreignKeyName: "revenue_by_channel_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }]
      }
      sync_logs: {
        Row: { completed_at: string | null; error_message: string | null; hotel_id: string; id: string; integration_id: string; metadata: Json | null; records_failed: number | null; records_synced: number | null; started_at: string; status: string }
        Insert: { completed_at?: string | null; error_message?: string | null; hotel_id: string; id?: string; integration_id: string; metadata?: Json | null; records_failed?: number | null; records_synced?: number | null; started_at?: string; status: string }
        Update: { completed_at?: string | null; error_message?: string | null; hotel_id?: string; id?: string; integration_id?: string; metadata?: Json | null; records_failed?: number | null; records_synced?: number | null; started_at?: string; status?: string }
        Relationships: [{ foreignKeyName: "sync_logs_hotel_id_fkey"; columns: ["hotel_id"]; isOneToOne: false; referencedRelation: "hotels"; referencedColumns: ["id"] }, { foreignKeyName: "sync_logs_integration_id_fkey"; columns: ["integration_id"]; isOneToOne: false; referencedRelation: "integrations"; referencedColumns: ["id"] }]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends { Row: infer R } ? R : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends { Row: infer R } ? R : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Insert: infer I } ? I : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Insert: infer I } ? I : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends { Update: infer U } ? U : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends { Update: infer U } ? U : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
