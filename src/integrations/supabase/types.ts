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
      bom_items: {
        Row: {
          batch_size: number
          id: string
          product_id: string
          quantity: number
          raw_material_id: string
        }
        Insert: {
          batch_size?: number
          id?: string
          product_id: string
          quantity: number
          raw_material_id: string
        }
        Update: {
          batch_size?: number
          id?: string
          product_id?: string
          quantity?: number
          raw_material_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "raw_materials"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_entries: {
        Row: {
          created_at: string
          data: Json
          department: string
          entry_date: string
          factory_id: string
          id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          department: string
          entry_date: string
          factory_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          department?: string
          entry_date?: string
          factory_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_entries_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_items: {
        Row: {
          created_at: string
          description: string
          factory_id: string | null
          id: string
          priority: string
          resolution_note: string | null
          resolved_at: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          factory_id?: string | null
          id?: string
          priority: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          factory_id?: string | null
          id?: string
          priority?: string
          resolution_note?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_items_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      factories: {
        Row: {
          created_at: string
          id: string
          market_type: string
          name: string
          planning_stage: string
        }
        Insert: {
          created_at?: string
          id?: string
          market_type: string
          name: string
          planning_stage?: string
        }
        Update: {
          created_at?: string
          id?: string
          market_type?: string
          name?: string
          planning_stage?: string
        }
        Relationships: []
      }
      forecasts: {
        Row: {
          horizon: string
          id: string
          likely: number
          optimistic: number
          period: string
          pessimistic: number
          product_id: string
        }
        Insert: {
          horizon: string
          id?: string
          likely: number
          optimistic: number
          period: string
          pessimistic: number
          product_id: string
        }
        Update: {
          horizon?: string
          id?: string
          likely?: number
          optimistic?: number
          period?: string
          pessimistic?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecasts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      gm_report_snapshots: {
        Row: {
          admin_note: string | null
          data: Json
          generated_at: string
          id: string
        }
        Insert: {
          admin_note?: string | null
          data: Json
          generated_at?: string
          id?: string
        }
        Update: {
          admin_note?: string | null
          data?: Json
          generated_at?: string
          id?: string
        }
        Relationships: []
      }
      lines: {
        Row: {
          capacity_per_hour: number
          created_at: string
          current_product_id: string | null
          factory_id: string
          hours_per_day: number
          id: string
          name: string
          suitable_product_ids: Json
          type: string
        }
        Insert: {
          capacity_per_hour: number
          created_at?: string
          current_product_id?: string | null
          factory_id: string
          hours_per_day?: number
          id?: string
          name: string
          suitable_product_ids?: Json
          type: string
        }
        Update: {
          capacity_per_hour?: number
          created_at?: string
          current_product_id?: string | null
          factory_id?: string
          hours_per_day?: number
          id?: string
          name?: string
          suitable_product_ids?: Json
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lines_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          ctp_details: Json | null
          ctp_status: string | null
          customer_name: string
          id: string
          product_id: string
          promised_date: string | null
          quantity: number
          requested_date: string
          status: string
        }
        Insert: {
          created_at?: string
          ctp_details?: Json | null
          ctp_status?: string | null
          customer_name: string
          id?: string
          product_id: string
          promised_date?: string | null
          quantity: number
          requested_date: string
          status?: string
        }
        Update: {
          created_at?: string
          ctp_details?: Json | null
          ctp_status?: string | null
          customer_name?: string
          id?: string
          product_id?: string
          promised_date?: string | null
          quantity?: number
          requested_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          code: string
          contribution_margin: number | null
          created_at: string
          factory_id: string
          id: string
          moq: number
          name: string
          price_customer: number | null
          price_supermarket: number | null
          price_wholesale: number | null
          seasonality: string | null
          setup_time_minutes: number
          unit: string
        }
        Insert: {
          code: string
          contribution_margin?: number | null
          created_at?: string
          factory_id: string
          id?: string
          moq?: number
          name: string
          price_customer?: number | null
          price_supermarket?: number | null
          price_wholesale?: number | null
          seasonality?: string | null
          setup_time_minutes?: number
          unit: string
        }
        Update: {
          code?: string
          contribution_margin?: number | null
          created_at?: string
          factory_id?: string
          id?: string
          moq?: number
          name?: string
          price_customer?: number | null
          price_supermarket?: number | null
          price_wholesale?: number | null
          seasonality?: string | null
          setup_time_minutes?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          backup_supplier: string | null
          created_at: string
          current_stock: number
          id: string
          lead_time_days: number
          name: string
          risk_note: string | null
          safety_stock_days: number
          supplier: string | null
          unit: string
          unit_cost: number
        }
        Insert: {
          backup_supplier?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          lead_time_days?: number
          name: string
          risk_note?: string | null
          safety_stock_days?: number
          supplier?: string | null
          unit: string
          unit_cost?: number
        }
        Update: {
          backup_supplier?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          lead_time_days?: number
          name?: string
          risk_note?: string | null
          safety_stock_days?: number
          supplier?: string | null
          unit?: string
          unit_cost?: number
        }
        Relationships: []
      }
      risks: {
        Row: {
          category: string
          classification: string
          created_at: string
          description: string
          factory_id: string | null
          id: string
          impact: string
          mitigation_plan: string | null
          probability: string
          status: string
        }
        Insert: {
          category: string
          classification: string
          created_at?: string
          description: string
          factory_id?: string | null
          id?: string
          impact: string
          mitigation_plan?: string | null
          probability: string
          status?: string
        }
        Update: {
          category?: string
          classification?: string
          created_at?: string
          description?: string
          factory_id?: string | null
          id?: string
          impact?: string
          mitigation_plan?: string | null
          probability?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "risks_factory_id_fkey"
            columns: ["factory_id"]
            isOneToOne: false
            referencedRelation: "factories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
