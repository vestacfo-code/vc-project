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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_interaction_log: {
        Row: {
          created_at: string
          id: string
          interaction_type: string
          metadata: Json | null
          model_used: string | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          model_used?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
          model_used?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          severity: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          severity?: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          severity?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_health_scores: {
        Row: {
          ai_explanation: string | null
          created_at: string
          factors: Json | null
          id: string
          score: number
          user_id: string
        }
        Insert: {
          ai_explanation?: string | null
          created_at?: string
          factors?: Json | null
          id?: string
          score: number
          user_id: string
        }
        Update: {
          ai_explanation?: string | null
          created_at?: string
          factors?: Json | null
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      business_profiles: {
        Row: {
          country: string | null
          created_at: string
          currency: string | null
          employees_fulltime: number | null
          id: string
          industry_naics: string | null
          legal_name: string | null
          model: string | null
          owners_count: number | null
          start_date: string | null
          trade_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          currency?: string | null
          employees_fulltime?: number | null
          id?: string
          industry_naics?: string | null
          legal_name?: string | null
          model?: string | null
          owners_count?: number | null
          start_date?: string | null
          trade_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          currency?: string | null
          employees_fulltime?: number | null
          id?: string
          industry_naics?: string | null
          legal_name?: string | null
          model?: string | null
          owners_count?: number | null
          start_date?: string | null
          trade_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consumer_features: {
        Row: {
          config: Json | null
          created_at: string
          enabled: boolean
          enabled_at: string | null
          enabled_by: string | null
          feature_key: string
          id: string
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          enabled?: boolean
          enabled_at?: string | null
          enabled_by?: string | null
          feature_key: string
          id?: string
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          enabled?: boolean
          enabled_at?: string | null
          enabled_by?: string | null
          feature_key?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      consumer_invite_links: {
        Row: {
          created_at: string
          created_by: string | null
          custom_logo_url: string | null
          custom_pricing_id: string | null
          email: string
          expires_at: string
          features: Json | null
          first_name: string | null
          fixed_amount: number | null
          id: string
          is_free: boolean | null
          last_name: string | null
          monthly_amount: number | null
          monthly_credits: number | null
          pricing_description: string | null
          skip_integration_onboarding: boolean | null
          slug: string
          status: string
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custom_logo_url?: string | null
          custom_pricing_id?: string | null
          email: string
          expires_at?: string
          features?: Json | null
          first_name?: string | null
          fixed_amount?: number | null
          id?: string
          is_free?: boolean | null
          last_name?: string | null
          monthly_amount?: number | null
          monthly_credits?: number | null
          pricing_description?: string | null
          skip_integration_onboarding?: boolean | null
          slug: string
          status?: string
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custom_logo_url?: string | null
          custom_pricing_id?: string | null
          email?: string
          expires_at?: string
          features?: Json | null
          first_name?: string | null
          fixed_amount?: number | null
          id?: string
          is_free?: boolean | null
          last_name?: string | null
          monthly_amount?: number | null
          monthly_credits?: number | null
          pricing_description?: string | null
          skip_integration_onboarding?: boolean | null
          slug?: string
          status?: string
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consumer_invite_links_custom_pricing_id_fkey"
            columns: ["custom_pricing_id"]
            isOneToOne: false
            referencedRelation: "custom_pricing"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_documents: {
        Row: {
          attached_at: string | null
          conversation_id: string
          document_id: string
          id: string
        }
        Insert: {
          attached_at?: string | null
          conversation_id: string
          document_id: string
          id?: string
        }
        Update: {
          attached_at?: string | null
          conversation_id?: string
          document_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_documents_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_addons: {
        Row: {
          created_at: string
          credits_per_month: number
          id: string
          monthly_cost: number
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_per_month?: number
          id?: string
          monthly_cost?: number
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_per_month?: number
          id?: string
          monthly_cost?: number
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_usage_log: {
        Row: {
          action_type: string
          credits_used: number
          description: string | null
          id: string
          session_id: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          action_type: string
          credits_used: number
          description?: string | null
          id?: string
          session_id?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          action_type?: string
          credits_used?: number
          description?: string | null
          id?: string
          session_id?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          completed_at: string | null
          contact_id: string
          created_at: string | null
          created_by: string
          deal_id: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          outcome: string | null
          scheduled_at: string | null
          status: Database["public"]["Enums"]["crm_activity_status"] | null
          subject: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          completed_at?: string | null
          contact_id: string
          created_at?: string | null
          created_by?: string
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          outcome?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["crm_activity_status"] | null
          subject?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["crm_activity_type"]
          completed_at?: string | null
          contact_id?: string
          created_at?: string | null
          created_by?: string
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          outcome?: string | null
          scheduled_at?: string | null
          status?: Database["public"]["Enums"]["crm_activity_status"] | null
          subject?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_audit_log: {
        Row: {
          action_type: string
          changes: Json | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Insert: {
          action_type: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_email: string
          user_id: string
          user_name: string
        }
        Update: {
          action_type?: string
          changes?: Json | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_email?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      crm_call_logs: {
        Row: {
          call_date: string | null
          caller_email: string
          caller_id: string
          caller_name: string
          contact_id: string
          created_at: string | null
          disposition:
            | Database["public"]["Enums"]["crm_call_disposition"]
            | null
          duration_seconds: number | null
          follow_up_date: string | null
          id: string
          notes: string | null
          outcome: Database["public"]["Enums"]["crm_call_outcome"] | null
          script_used: string | null
        }
        Insert: {
          call_date?: string | null
          caller_email: string
          caller_id?: string
          caller_name: string
          contact_id: string
          created_at?: string | null
          disposition?:
            | Database["public"]["Enums"]["crm_call_disposition"]
            | null
          duration_seconds?: number | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["crm_call_outcome"] | null
          script_used?: string | null
        }
        Update: {
          call_date?: string | null
          caller_email?: string
          caller_id?: string
          caller_name?: string
          contact_id?: string
          created_at?: string | null
          disposition?:
            | Database["public"]["Enums"]["crm_call_disposition"]
            | null
          duration_seconds?: number | null
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          outcome?: Database["public"]["Enums"]["crm_call_outcome"] | null
          script_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_call_logs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_call_scripts: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          script_content: string
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          script_content: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          script_content?: string
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          address: Json | null
          assigned_to: string | null
          company: string | null
          created_at: string | null
          created_by: string
          custom_fields: Json | null
          email: string | null
          first_name: string | null
          id: string
          last_contacted_at: string | null
          last_contacted_by: string | null
          last_name: string | null
          linkedin_url: string | null
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          source: Database["public"]["Enums"]["crm_contact_source"] | null
          status: Database["public"]["Enums"]["crm_contact_status"] | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: Json | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_contacted_at?: string | null
          last_contacted_by?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          status?: Database["public"]["Enums"]["crm_contact_status"] | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: Json | null
          assigned_to?: string | null
          company?: string | null
          created_at?: string | null
          created_by?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_contacted_at?: string | null
          last_contacted_by?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          source?: Database["public"]["Enums"]["crm_contact_source"] | null
          status?: Database["public"]["Enums"]["crm_contact_status"] | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      crm_deals: {
        Row: {
          actual_close_date: string | null
          contact_id: string
          created_at: string | null
          created_by: string
          currency: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          probability: number | null
          stage: Database["public"]["Enums"]["crm_deal_stage"] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          value: number | null
        }
        Insert: {
          actual_close_date?: string | null
          contact_id: string
          created_at?: string | null
          created_by?: string
          currency?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["crm_deal_stage"] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          value?: number | null
        }
        Update: {
          actual_close_date?: string | null
          contact_id?: string
          created_at?: string | null
          created_by?: string
          currency?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["crm_deal_stage"] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_import_history: {
        Row: {
          error_log: Json | null
          failed_records: number | null
          file_name: string
          id: string
          import_date: string | null
          import_type: string | null
          status: Database["public"]["Enums"]["crm_import_status"] | null
          successful_records: number | null
          total_records: number | null
          user_id: string
        }
        Insert: {
          error_log?: Json | null
          failed_records?: number | null
          file_name: string
          id?: string
          import_date?: string | null
          import_type?: string | null
          status?: Database["public"]["Enums"]["crm_import_status"] | null
          successful_records?: number | null
          total_records?: number | null
          user_id?: string
        }
        Update: {
          error_log?: Json | null
          failed_records?: number | null
          file_name?: string
          id?: string
          import_date?: string | null
          import_type?: string | null
          status?: Database["public"]["Enums"]["crm_import_status"] | null
          successful_records?: number | null
          total_records?: number | null
          user_id?: string
        }
        Relationships: []
      }
      crm_user_stats: {
        Row: {
          activities_logged: number | null
          calls_connected: number | null
          calls_made: number | null
          contacts_created: number | null
          created_at: string | null
          deals_closed: number | null
          deals_created: number | null
          id: string
          stat_date: string
          total_deal_value: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activities_logged?: number | null
          calls_connected?: number | null
          calls_made?: number | null
          contacts_created?: number | null
          created_at?: string | null
          deals_closed?: number | null
          deals_created?: number | null
          id?: string
          stat_date?: string
          total_deal_value?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activities_logged?: number | null
          calls_connected?: number | null
          calls_made?: number | null
          contacts_created?: number | null
          created_at?: string | null
          deals_closed?: number | null
          deals_created?: number | null
          id?: string
          stat_date?: string
          total_deal_value?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      custom_pricing: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          fixed_amount: number | null
          id: string
          is_active: boolean
          monthly_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          monthly_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          fixed_amount?: number | null
          id?: string
          is_active?: boolean
          monthly_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          benefits: Json | null
          code: string
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          benefits?: Json | null
          code: string
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          benefits?: Json | null
          code?: string
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          markdown_content: string | null
          metadata: Json | null
          processing_status: string
          records_extracted: number | null
          storage_path: string | null
          updated_at: string
          upload_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          markdown_content?: string | null
          metadata?: Json | null
          processing_status?: string
          records_extracted?: number | null
          storage_path?: string | null
          updated_at?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          markdown_content?: string | null
          metadata?: Json | null
          processing_status?: string
          records_extracted?: number | null
          storage_path?: string | null
          updated_at?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      email_settings: {
        Row: {
          alerts_enabled: boolean | null
          created_at: string
          day_of_week: string | null
          email: string
          id: string
          last_sent: string | null
          notification_preferences: Json | null
          quiet_hours: Json | null
          time_of_day: string | null
          updated_at: string
          user_id: string
          weekly_reports_enabled: boolean | null
        }
        Insert: {
          alerts_enabled?: boolean | null
          created_at?: string
          day_of_week?: string | null
          email: string
          id?: string
          last_sent?: string | null
          notification_preferences?: Json | null
          quiet_hours?: Json | null
          time_of_day?: string | null
          updated_at?: string
          user_id: string
          weekly_reports_enabled?: boolean | null
        }
        Update: {
          alerts_enabled?: boolean | null
          created_at?: string
          day_of_week?: string | null
          email?: string
          id?: string
          last_sent?: string | null
          notification_preferences?: Json | null
          quiet_hours?: Json | null
          time_of_day?: string | null
          updated_at?: string
          user_id?: string
          weekly_reports_enabled?: boolean | null
        }
        Relationships: []
      }
      financial_data: {
        Row: {
          cash_flow: number | null
          created_at: string
          document_id: string | null
          expenses: number | null
          id: string
          period_end: string
          period_start: string
          profit: number | null
          revenue: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cash_flow?: number | null
          created_at?: string
          document_id?: string | null
          expenses?: number | null
          id?: string
          period_end: string
          period_start: string
          profit?: number | null
          revenue?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cash_flow?: number | null
          created_at?: string
          document_id?: string | null
          expenses?: number | null
          id?: string
          period_end?: string
          period_start?: string
          profit?: number | null
          revenue?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_snapshots: {
        Row: {
          arpu: number | null
          arr: number | null
          business_id: string
          cac: number | null
          cash_balance: number | null
          churn_logo_pct: number | null
          churn_revenue_pct: number | null
          cogs: number | null
          created_at: string
          debt_balance: number | null
          ebitda: number | null
          gross_margin_pct: number | null
          growth_12m_pct: number | null
          growth_3m_pct: number | null
          id: string
          inventory_value: number | null
          last_12m_taxable_income: number | null
          ltv: number | null
          mrr: number | null
          net_dollar_retention_pct: number | null
          operating_expenses: number | null
          period_end: string
          period_start: string
          revenue: number | null
          sde: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          arpu?: number | null
          arr?: number | null
          business_id: string
          cac?: number | null
          cash_balance?: number | null
          churn_logo_pct?: number | null
          churn_revenue_pct?: number | null
          cogs?: number | null
          created_at?: string
          debt_balance?: number | null
          ebitda?: number | null
          gross_margin_pct?: number | null
          growth_12m_pct?: number | null
          growth_3m_pct?: number | null
          id?: string
          inventory_value?: number | null
          last_12m_taxable_income?: number | null
          ltv?: number | null
          mrr?: number | null
          net_dollar_retention_pct?: number | null
          operating_expenses?: number | null
          period_end: string
          period_start: string
          revenue?: number | null
          sde?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          arpu?: number | null
          arr?: number | null
          business_id?: string
          cac?: number | null
          cash_balance?: number | null
          churn_logo_pct?: number | null
          churn_revenue_pct?: number | null
          cogs?: number | null
          created_at?: string
          debt_balance?: number | null
          ebitda?: number | null
          gross_margin_pct?: number | null
          growth_12m_pct?: number | null
          growth_3m_pct?: number | null
          id?: string
          inventory_value?: number | null
          last_12m_taxable_income?: number | null
          ltv?: number | null
          mrr?: number | null
          net_dollar_retention_pct?: number | null
          operating_expenses?: number | null
          period_end?: string
          period_start?: string
          revenue?: number | null
          sde?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_snapshots_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_application_rate_limits: {
        Row: {
          blocked_until: string | null
          created_at: string
          email: string
          id: string
          ip_address: unknown
          last_submission: string
          submission_count: number
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          email: string
          id?: string
          ip_address: unknown
          last_submission?: string
          submission_count?: number
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          last_submission?: string
          submission_count?: number
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          additional_info: string | null
          background_check_consent: boolean | null
          city: string | null
          country: string | null
          cover_letter: string | null
          created_at: string
          custom_answers: Json | null
          earliest_start_date: string | null
          email: string
          first_name: string
          full_name: string | null
          id: string
          instagram_handle: string | null
          ip_address: unknown
          job_role_id: string
          last_name: string
          linkedin_url: string | null
          phone: string | null
          portfolio_url: string | null
          privacy_policy_consent: boolean | null
          reference_info: string | null
          resume_url: string | null
          state: string | null
          status: string
          submission_source: string | null
          updated_at: string
          user_agent: string | null
          verified_email: boolean | null
          why_work_here: string | null
          work_authorization: string | null
        }
        Insert: {
          additional_info?: string | null
          background_check_consent?: boolean | null
          city?: string | null
          country?: string | null
          cover_letter?: string | null
          created_at?: string
          custom_answers?: Json | null
          earliest_start_date?: string | null
          email: string
          first_name: string
          full_name?: string | null
          id?: string
          instagram_handle?: string | null
          ip_address?: unknown
          job_role_id: string
          last_name: string
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          privacy_policy_consent?: boolean | null
          reference_info?: string | null
          resume_url?: string | null
          state?: string | null
          status?: string
          submission_source?: string | null
          updated_at?: string
          user_agent?: string | null
          verified_email?: boolean | null
          why_work_here?: string | null
          work_authorization?: string | null
        }
        Update: {
          additional_info?: string | null
          background_check_consent?: boolean | null
          city?: string | null
          country?: string | null
          cover_letter?: string | null
          created_at?: string
          custom_answers?: Json | null
          earliest_start_date?: string | null
          email?: string
          first_name?: string
          full_name?: string | null
          id?: string
          instagram_handle?: string | null
          ip_address?: unknown
          job_role_id?: string
          last_name?: string
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          privacy_policy_consent?: boolean | null
          reference_info?: string | null
          resume_url?: string | null
          state?: string | null
          status?: string
          submission_source?: string | null
          updated_at?: string
          user_agent?: string | null
          verified_email?: boolean | null
          why_work_here?: string | null
          work_authorization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_role_id_fkey"
            columns: ["job_role_id"]
            isOneToOne: false
            referencedRelation: "job_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_roles: {
        Row: {
          created_at: string
          custom_questions: Json | null
          department: string
          description: string
          id: string
          is_active: boolean
          location: string
          requirements: string
          salary_range: string | null
          slug: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_questions?: Json | null
          department: string
          description: string
          id?: string
          is_active?: boolean
          location: string
          requirements: string
          salary_range?: string | null
          slug: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_questions?: Json | null
          department?: string
          description?: string
          id?: string
          is_active?: boolean
          location?: string
          requirements?: string
          salary_range?: string | null
          slug?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          email_sent: boolean | null
          id: string
          is_read: boolean | null
          message: string
          scheduled_for: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          email_sent?: boolean | null
          id?: string
          is_read?: boolean | null
          message: string
          scheduled_for?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          email_sent?: boolean | null
          id?: string
          is_read?: boolean | null
          message?: string
          scheduled_for?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      preboarding_steps: {
        Row: {
          completed_at: string | null
          created_at: string
          data: Json | null
          id: string
          status: string
          step_type: string
          updated_at: string
          welcome_link_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          status?: string
          step_type: string
          updated_at?: string
          welcome_link_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          status?: string
          step_type?: string
          updated_at?: string
          welcome_link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preboarding_steps_welcome_link_id_fkey"
            columns: ["welcome_link_id"]
            isOneToOne: false
            referencedRelation: "welcome_links"
            referencedColumns: ["id"]
          },
        ]
      }
      press_releases: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          press_contact: string | null
          published_at: string | null
          release_date: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          press_contact?: string | null
          published_at?: string | null
          release_date?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          press_contact?: string | null
          published_at?: string | null
          release_date?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pricing_ai_recommendations: {
        Row: {
          created_at: string
          id: string
          optimal_price: number
          product_id: string
          reasoning: string | null
          strategy_used: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          optimal_price: number
          product_id: string
          reasoning?: string | null
          strategy_used?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          optimal_price?: number
          product_id?: string
          reasoning?: string | null
          strategy_used?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_ai_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_product_aliases: {
        Row: {
          alias_upc: string
          created_at: string
          id: string
          notes: string | null
          product_id: string
          supplier_id: string | null
        }
        Insert: {
          alias_upc: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          supplier_id?: string | null
        }
        Update: {
          alias_upc?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_product_aliases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_product_aliases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "pricing_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_products: {
        Row: {
          base_cost: number | null
          brand: string | null
          cogs: number | null
          created_at: string | null
          description: string | null
          gender: string | null
          id: string
          product_type: string | null
          size: string | null
          target_margin: number | null
          upc: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_cost?: number | null
          brand?: string | null
          cogs?: number | null
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          product_type?: string | null
          size?: string | null
          target_margin?: number | null
          upc: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_cost?: number | null
          brand?: string | null
          cogs?: number | null
          created_at?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          product_type?: string | null
          size?: string | null
          target_margin?: number | null
          upc?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pricing_supplier_prices: {
        Row: {
          availability: number | null
          country: string | null
          created_at: string | null
          currency: string | null
          effective_date: string | null
          id: string
          min_order_qty: number | null
          price: number
          price_type: string | null
          product_id: string
          supplier_id: string
        }
        Insert: {
          availability?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          effective_date?: string | null
          id?: string
          min_order_qty?: number | null
          price: number
          price_type?: string | null
          product_id: string
          supplier_id: string
        }
        Update: {
          availability?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          effective_date?: string | null
          id?: string
          min_order_qty?: number | null
          price?: number
          price_type?: string | null
          product_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_supplier_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pricing_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_supplier_prices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "pricing_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_suppliers: {
        Row: {
          column_mapping: Json | null
          country: string | null
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          name: string
          user_id: string
        }
        Insert: {
          column_mapping?: Json | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name: string
          user_id: string
        }
        Update: {
          column_mapping?: Json | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_type: string | null
          company_name: string | null
          company_size: string | null
          created_at: string
          credit_renewal_day: number | null
          custom_logo_url: string | null
          description: string | null
          email: string | null
          full_name: string | null
          id: string
          industry: string | null
          is_custom_solution: boolean | null
          payment_status: string | null
          skip_integration_onboarding: boolean | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          business_type?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          credit_renewal_day?: number | null
          custom_logo_url?: string | null
          description?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          industry?: string | null
          is_custom_solution?: boolean | null
          payment_status?: string | null
          skip_integration_onboarding?: boolean | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          business_type?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          credit_renewal_day?: number | null
          custom_logo_url?: string | null
          description?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          is_custom_solution?: boolean | null
          payment_status?: string | null
          skip_integration_onboarding?: boolean | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_data: {
        Row: {
          created_at: string
          data_json: Json
          data_type: string
          id: string
          integration_id: string
          last_synced: string
          quickbooks_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_json: Json
          data_type: string
          id?: string
          integration_id: string
          last_synced?: string
          quickbooks_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_json?: Json
          data_type?: string
          id?: string
          integration_id?: string
          last_synced?: string
          quickbooks_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_data_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      quickbooks_integrations: {
        Row: {
          access_token: string
          base_url: string
          company_id: string
          company_name: string
          created_at: string
          id: string
          is_active: boolean
          realm_id: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          base_url: string
          company_id: string
          company_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          realm_id: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          base_url?: string
          company_id?: string
          company_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          realm_id?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quickbooks_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          document_metadata: Json | null
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          document_metadata?: Json | null
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          document_metadata?: Json | null
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "quickbooks_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          created_by_user_id: string | null
          expires_at: string
          id: string
          is_active: boolean
          updated_at: string
          used_at: string | null
          used_by_user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by_user_id?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by_user_id?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          used_at?: string | null
          used_by_user_id?: string | null
        }
        Relationships: []
      }
      shared_conversations: {
        Row: {
          conversation_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          share_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          share_token?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          share_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_conversations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "quickbooks_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_posts: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          engagement_metrics: Json | null
          hashtags: string[] | null
          id: string
          media_urls: string[] | null
          notes: string | null
          platforms: string[]
          published_at: string | null
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          author_name: string
          content: string
          created_at?: string
          engagement_metrics?: Json | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          notes?: string | null
          platforms?: string[]
          published_at?: string | null
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          engagement_metrics?: Json | null
          hashtags?: string[] | null
          id?: string
          media_urls?: string[] | null
          notes?: string | null
          platforms?: string[]
          published_at?: string | null
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_records: {
        Row: {
          applicant_name: string
          application_id: string
          created_at: string
          deleted_at: string | null
          id: string
          preboarding_data: Json | null
          start_date: string | null
          status: string
          supervisors: Json | null
          updated_at: string
          welcome_link_data: Json | null
        }
        Insert: {
          applicant_name: string
          application_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          preboarding_data?: Json | null
          start_date?: string | null
          status?: string
          supervisors?: Json | null
          updated_at?: string
          welcome_link_data?: Json | null
        }
        Update: {
          applicant_name?: string
          application_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          preboarding_data?: Json | null
          start_date?: string | null
          status?: string
          supervisors?: Json | null
          updated_at?: string
          welcome_link_data?: Json | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_changes: {
        Row: {
          change_reason: string | null
          created_at: string
          effective_date: string
          id: string
          new_tier: Database["public"]["Enums"]["subscription_tier_type"]
          old_tier: Database["public"]["Enums"]["subscription_tier_type"] | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          effective_date?: string
          id?: string
          new_tier: Database["public"]["Enums"]["subscription_tier_type"]
          old_tier?:
            | Database["public"]["Enums"]["subscription_tier_type"]
            | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          effective_date?: string
          id?: string
          new_tier?: Database["public"]["Enums"]["subscription_tier_type"]
          old_tier?:
            | Database["public"]["Enums"]["subscription_tier_type"]
            | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          id: string
          notes: string | null
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          ticket_number: string
          updated_at: string | null
          user_email: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          ticket_number?: string
          updated_at?: string | null
          user_email: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          auth_invitation_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["team_role"]
          signup_redirect_url: string | null
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          auth_invitation_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["team_role"]
          signup_redirect_url?: string | null
          team_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          auth_invitation_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["team_role"]
          signup_redirect_url?: string | null
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          shareable_enabled: boolean | null
          shareable_token: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          shareable_enabled?: boolean | null
          shareable_token?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          shareable_enabled?: boolean | null
          shareable_token?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      terms_acceptance_log: {
        Row: {
          accepted_at: string
          id: string
          ip_address: unknown
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          id?: string
          ip_address?: unknown
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          id?: string
          ip_address?: unknown
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      training_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string
          assigned_to: string
          completed_at: string | null
          completed_sections: number[] | null
          current_section_index: number | null
          due_date: string | null
          id: string
          notes: string | null
          progress_percentage: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["training_status"] | null
          training_material_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by: string
          assigned_to: string
          completed_at?: string | null
          completed_sections?: number[] | null
          current_section_index?: number | null
          due_date?: string | null
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["training_status"] | null
          training_material_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string
          assigned_to?: string
          completed_at?: string | null
          completed_sections?: number[] | null
          current_section_index?: number | null
          due_date?: string | null
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["training_status"] | null
          training_material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_assignments_training_material_id_fkey"
            columns: ["training_material_id"]
            isOneToOne: false
            referencedRelation: "training_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      training_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          training_material_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          training_material_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          training_material_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attachments_training_material_id_fkey"
            columns: ["training_material_id"]
            isOneToOne: false
            referencedRelation: "training_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      training_materials: {
        Row: {
          category: string
          content: string
          cover_image_url: string | null
          created_at: string | null
          created_by: string
          description: string | null
          difficulty_level: string | null
          estimated_duration: number | null
          id: string
          is_active: boolean | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          cover_image_url?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          is_active?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          additional_credits_purchased: number
          created_at: string
          credits_used_this_month: number
          credits_used_today: number
          current_credits: number
          daily_limit: number
          id: string
          is_trial_active: boolean
          last_daily_reset: string
          last_reset_date: string
          max_collaborators: number
          max_monthly_downloads: number
          monthly_limit: number
          referral_code_used: string | null
          report_downloads_this_month: number
          tier: Database["public"]["Enums"]["subscription_tier_type"]
          tier_start_date: string
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_credits_purchased?: number
          created_at?: string
          credits_used_this_month?: number
          credits_used_today?: number
          current_credits?: number
          daily_limit?: number
          id?: string
          is_trial_active?: boolean
          last_daily_reset?: string
          last_reset_date?: string
          max_collaborators?: number
          max_monthly_downloads?: number
          monthly_limit?: number
          referral_code_used?: string | null
          report_downloads_this_month?: number
          tier?: Database["public"]["Enums"]["subscription_tier_type"]
          tier_start_date?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_credits_purchased?: number
          created_at?: string
          credits_used_this_month?: number
          credits_used_today?: number
          current_credits?: number
          daily_limit?: number
          id?: string
          is_trial_active?: boolean
          last_daily_reset?: string
          last_reset_date?: string
          max_collaborators?: number
          max_monthly_downloads?: number
          monthly_limit?: number
          referral_code_used?: string | null
          report_downloads_this_month?: number
          tier?: Database["public"]["Enums"]["subscription_tier_type"]
          tier_start_date?: string
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: Database["public"]["Enums"]["admin_permission"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: Database["public"]["Enums"]["admin_permission"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: Database["public"]["Enums"]["admin_permission"]
          user_id?: string
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
      user_settings: {
        Row: {
          accent_color: string
          chat_dark_mode: boolean
          created_at: string
          data_retention_days: number
          email_notifications: boolean
          export_format: string
          id: string
          language: string
          monthly_summaries: boolean
          push_notifications: boolean
          session_timeout: string
          show_additional_models: boolean
          spoken_language: string
          theme: string
          two_factor_auth: boolean
          updated_at: string
          user_id: string
          voice: string
          weekly_reports: boolean
        }
        Insert: {
          accent_color?: string
          chat_dark_mode?: boolean
          created_at?: string
          data_retention_days?: number
          email_notifications?: boolean
          export_format?: string
          id?: string
          language?: string
          monthly_summaries?: boolean
          push_notifications?: boolean
          session_timeout?: string
          show_additional_models?: boolean
          spoken_language?: string
          theme?: string
          two_factor_auth?: boolean
          updated_at?: string
          user_id: string
          voice?: string
          weekly_reports?: boolean
        }
        Update: {
          accent_color?: string
          chat_dark_mode?: boolean
          created_at?: string
          data_retention_days?: number
          email_notifications?: boolean
          export_format?: string
          id?: string
          language?: string
          monthly_summaries?: boolean
          push_notifications?: boolean
          session_timeout?: string
          show_additional_models?: boolean
          spoken_language?: string
          theme?: string
          two_factor_auth?: boolean
          updated_at?: string
          user_id?: string
          voice?: string
          weekly_reports?: boolean
        }
        Relationships: []
      }
      valuation_runs: {
        Row: {
          business_id: string | null
          created_at: string
          currency: string | null
          documents_used: Json | null
          id: string
          inputs_json: Json | null
          method_used: string | null
          notes: string | null
          pdf_url: string | null
          share_slug: string | null
          updated_at: string
          user_id: string
          valuation_base: number | null
          valuation_high: number | null
          valuation_low: number | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          currency?: string | null
          documents_used?: Json | null
          id?: string
          inputs_json?: Json | null
          method_used?: string | null
          notes?: string | null
          pdf_url?: string | null
          share_slug?: string | null
          updated_at?: string
          user_id: string
          valuation_base?: number | null
          valuation_high?: number | null
          valuation_low?: number | null
        }
        Update: {
          business_id?: string | null
          created_at?: string
          currency?: string | null
          documents_used?: Json | null
          id?: string
          inputs_json?: Json | null
          method_used?: string | null
          notes?: string | null
          pdf_url?: string | null
          share_slug?: string | null
          updated_at?: string
          user_id?: string
          valuation_base?: number | null
          valuation_high?: number | null
          valuation_low?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "valuation_runs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wave_data: {
        Row: {
          created_at: string
          data_json: Json
          data_type: string
          id: string
          integration_id: string
          last_synced: string
          user_id: string
          wave_id: string
        }
        Insert: {
          created_at?: string
          data_json: Json
          data_type: string
          id?: string
          integration_id: string
          last_synced?: string
          user_id: string
          wave_id: string
        }
        Update: {
          created_at?: string
          data_json?: Json
          data_type?: string
          id?: string
          integration_id?: string
          last_synced?: string
          user_id?: string
          wave_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wave_data_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "wave_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      wave_integrations: {
        Row: {
          access_token: string
          business_id: string
          business_name: string
          created_at: string
          currency: string | null
          id: string
          is_active: boolean
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          business_id: string
          business_name: string
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean
          refresh_token: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          business_id?: string
          business_name?: string
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      welcome_links: {
        Row: {
          applicant_name: string
          application_id: string
          created_at: string
          deleted_at: string | null
          id: string
          notes: string | null
          slug: string
          start_date: string | null
          status: string
          supervisors: Json | null
          updated_at: string
        }
        Insert: {
          applicant_name: string
          application_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          slug: string
          start_date?: string | null
          status?: string
          supervisors?: Json | null
          updated_at?: string
        }
        Update: {
          applicant_name?: string
          application_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          notes?: string | null
          slug?: string
          start_date?: string | null
          status?: string
          supervisors?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "welcome_links_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      zoho_data: {
        Row: {
          created_at: string
          data_json: Json
          data_type: string
          id: string
          integration_id: string
          last_synced: string
          user_id: string
          zoho_id: string
        }
        Insert: {
          created_at?: string
          data_json: Json
          data_type: string
          id?: string
          integration_id: string
          last_synced?: string
          user_id: string
          zoho_id: string
        }
        Update: {
          created_at?: string
          data_json?: Json
          data_type?: string
          id?: string
          integration_id?: string
          last_synced?: string
          user_id?: string
          zoho_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zoho_data_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "zoho_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      zoho_integrations: {
        Row: {
          access_token: string
          api_domain: string
          created_at: string
          currency_code: string | null
          data_center: string
          id: string
          is_active: boolean
          organization_id: string
          organization_name: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          api_domain: string
          created_at?: string
          currency_code?: string | null
          data_center: string
          id?: string
          is_active?: boolean
          organization_id: string
          organization_name: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          api_domain?: string
          created_at?: string
          currency_code?: string | null
          data_center?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          organization_name?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invitation: {
        Args: { p_invitation_id: string; p_user_id: string }
        Returns: Json
      }
      activate_referral_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: {
          message: string
          new_codes: string[]
          success: boolean
        }[]
      }
      audit_and_fix_user_credits: {
        Args: never
        Returns: {
          action_taken: string
          new_credits: number
          old_credits: number
          tier: Database["public"]["Enums"]["subscription_tier_type"]
          user_id: string
        }[]
      }
      can_access_shared_conversation: {
        Args: { p_token: string }
        Returns: boolean
      }
      can_access_team_data: {
        Args: { _data_owner_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_welcome_link_application: {
        Args: { p_application_id: string; p_slug: string }
        Returns: boolean
      }
      ensure_user_credits_exist: { Args: never; Returns: undefined }
      generate_job_slug: { Args: { title: string }; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_slug: { Args: { title: string }; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      generate_welcome_slug: { Args: never; Returns: string }
      get_effective_user_id: { Args: { _user_id: string }; Returns: string }
      get_next_monthly_reset_date: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_public_stats: {
        Args: never
        Returns: {
          total_revenue: number
          total_users: number
        }[]
      }
      get_team_owner_id: { Args: { _user_id: string }; Returns: string }
      get_team_role: { Args: { _user_id: string }; Returns: string }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          permission: string
        }[]
      }
      get_user_team_role: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: Database["public"]["Enums"]["team_role"]
      }
      get_user_training_stats: {
        Args: { p_user_id: string }
        Returns: {
          completed: number
          in_progress: number
          overdue: number
          total_assigned: number
        }[]
      }
      grant_unlimited_credits: { Args: { p_email: string }; Returns: undefined }
      has_any_permission: {
        Args: {
          _permissions: Database["public"]["Enums"]["admin_permission"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["admin_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_admin_or_owner: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_admin_or_super_admin: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_team_super_admin: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      is_unlimited_user: { Args: { p_user_id: string }; Returns: boolean }
      is_user_team_member: {
        Args: { p_team_id: string; p_user_id: string }
        Returns: boolean
      }
      reset_daily_credits: { Args: never; Returns: undefined }
      reset_monthly_credits: { Args: never; Returns: undefined }
      trigger_daily_strategic_alerts: { Args: never; Returns: undefined }
      trigger_weekly_reports: { Args: never; Returns: undefined }
      update_user_tier: {
        Args: {
          p_new_tier: Database["public"]["Enums"]["subscription_tier_type"]
          p_stripe_subscription_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      admin_permission:
        | "blog_management"
        | "press_management"
        | "careers_management"
        | "crm_contacts"
        | "crm_deals"
        | "crm_activities"
        | "crm_call_center"
        | "crm_analytics"
        | "staff_directory"
        | "training_management"
        | "user_management"
        | "audit_logs"
        | "content_calendar_management"
        | "training"
        | "content_calendar_view"
        | "content_calendar_create"
        | "content_calendar_edit"
        | "content_calendar_delete"
        | "consumer_management"
      app_role: "admin" | "hr_staff" | "user" | "super_admin" | "staff"
      crm_activity_status: "scheduled" | "completed" | "cancelled"
      crm_activity_type: "call" | "email" | "meeting" | "note" | "task"
      crm_call_disposition: "hot" | "warm" | "cold" | "not_qualified"
      crm_call_outcome:
        | "connected"
        | "voicemail"
        | "no_answer"
        | "busy"
        | "wrong_number"
        | "not_interested"
        | "callback_requested"
      crm_contact_source:
        | "cold_call"
        | "referral"
        | "website"
        | "import"
        | "other"
      crm_contact_status:
        | "lead"
        | "prospect"
        | "customer"
        | "inactive"
        | "demo_scheduled"
      crm_deal_stage:
        | "prospecting"
        | "qualification"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      crm_import_status: "processing" | "completed" | "failed"
      subscription_tier_type: "founder" | "scale" | "ceo"
      team_role:
        | "owner"
        | "admin"
        | "member"
        | "viewer"
        | "super_admin"
        | "collaborator"
      training_status: "assigned" | "in_progress" | "completed"
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
      admin_permission: [
        "blog_management",
        "press_management",
        "careers_management",
        "crm_contacts",
        "crm_deals",
        "crm_activities",
        "crm_call_center",
        "crm_analytics",
        "staff_directory",
        "training_management",
        "user_management",
        "audit_logs",
        "content_calendar_management",
        "training",
        "content_calendar_view",
        "content_calendar_create",
        "content_calendar_edit",
        "content_calendar_delete",
        "consumer_management",
      ],
      app_role: ["admin", "hr_staff", "user", "super_admin", "staff"],
      crm_activity_status: ["scheduled", "completed", "cancelled"],
      crm_activity_type: ["call", "email", "meeting", "note", "task"],
      crm_call_disposition: ["hot", "warm", "cold", "not_qualified"],
      crm_call_outcome: [
        "connected",
        "voicemail",
        "no_answer",
        "busy",
        "wrong_number",
        "not_interested",
        "callback_requested",
      ],
      crm_contact_source: [
        "cold_call",
        "referral",
        "website",
        "import",
        "other",
      ],
      crm_contact_status: [
        "lead",
        "prospect",
        "customer",
        "inactive",
        "demo_scheduled",
      ],
      crm_deal_stage: [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      crm_import_status: ["processing", "completed", "failed"],
      subscription_tier_type: ["founder", "scale", "ceo"],
      team_role: [
        "owner",
        "admin",
        "member",
        "viewer",
        "super_admin",
        "collaborator",
      ],
      training_status: ["assigned", "in_progress", "completed"],
    },
  },
} as const
