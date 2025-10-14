export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_roles: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      admin_sessions: {
        Row: {
          admin_user_id: string;
          created_at: string;
          expires_at: string | null;
          id: string;
          last_seen_at: string | null;
          revoked: boolean;
          token_hash: string;
        };
        Insert: {
          admin_user_id: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          last_seen_at?: string | null;
          revoked?: boolean;
          token_hash: string;
        };
        Update: {
          admin_user_id?: string;
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          last_seen_at?: string | null;
          revoked?: boolean;
          token_hash?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          display_name: string | null;
          email: string;
          id: string;
          last_login: string | null;
          password_hash: string;
          status: string;
        };
        Insert: {
          display_name?: string | null;
          email: string;
          id?: string;
          last_login?: string | null;
          password_hash: string;
          status?: string;
        };
        Update: {
          display_name?: string | null;
          email?: string;
          id?: string;
          last_login?: string | null;
          password_hash?: string;
          status?: string;
        };
        Relationships: [];
      };
      admin_users_roles: {
        Row: {
          admin_user_id: string;
          role_id: string;
        };
        Insert: {
          admin_user_id: string;
          role_id: string;
        };
        Update: {
          admin_user_id?: string;
          role_id?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          action: string;
          admin_user_id: string | null;
          after: Json | null;
          at: string;
          before: Json | null;
          context: Json | null;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          ip: string | null;
          ua: string | null;
        };
        Insert: {
          action: string;
          admin_user_id?: string | null;
          after?: Json | null;
          at?: string;
          before?: Json | null;
          context?: Json | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip?: string | null;
          ua?: string | null;
        };
        Update: {
          action?: string;
          admin_user_id?: string | null;
          after?: Json | null;
          at?: string;
          before?: Json | null;
          context?: Json | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip?: string | null;
          ua?: string | null;
        };
        Relationships: [];
      };
      feature_flags: {
        Row: {
          key: string;
          updated_at: string;
          updated_by: string | null;
          value: Json | null;
        };
        Insert: {
          key: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json | null;
        };
        Update: {
          key?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: Json | null;
        };
        Relationships: [];
      };
      match_gates: {
        Row: {
          created_at: string;
          id: string;
          location: string | null;
          match_id: string;
          max_throughput: number | null;
          name: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          location?: string | null;
          match_id: string;
          max_throughput?: number | null;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          location?: string | null;
          match_id?: string;
          max_throughput?: number | null;
          name?: string;
        };
        Relationships: [];
      };
      match_zones: {
        Row: {
          capacity: number;
          created_at: string;
          default_gate: string | null;
          id: string;
          match_id: string;
          name: string;
          price: number;
        };
        Insert: {
          capacity?: number;
          created_at?: string;
          default_gate?: string | null;
          id?: string;
          match_id: string;
          name: string;
          price?: number;
        };
        Update: {
          capacity?: number;
          created_at?: string;
          default_gate?: string | null;
          id?: string;
          match_id?: string;
          name?: string;
          price?: number;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          kickoff: string | null;
          opponent: string | null;
          regular_price: number | null;
          seats_blue: number | null;
          seats_regular: number | null;
          seats_vip: number | null;
          status: Database['public']['Enums']['match_status'];
          venue: string | null;
          vip_price: number | null;
        };
        Insert: {
          id?: string;
          kickoff?: string | null;
          opponent?: string | null;
          regular_price?: number | null;
          seats_blue?: number | null;
          seats_regular?: number | null;
          seats_vip?: number | null;
          status?: Database['public']['Enums']['match_status'];
          venue?: string | null;
          vip_price?: number | null;
        };
        Update: {
          id?: string;
          kickoff?: string | null;
          opponent?: string | null;
          regular_price?: number | null;
          seats_blue?: number | null;
          seats_regular?: number | null;
          seats_vip?: number | null;
          status?: Database['public']['Enums']['match_status'];
          venue?: string | null;
          vip_price?: number | null;
        };
        Relationships: [];
      };
      shop_products: {
        Row: {
          badge: string | null;
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          image_url: string | null;
          images: Json | null;
          name: string;
          price: number;
          stock: number | null;
        };
        Insert: {
          badge?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          images?: Json | null;
          name: string;
          price: number;
          stock?: number | null;
        };
        Update: {
          badge?: string | null;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          images?: Json | null;
          name?: string;
          price?: number;
          stock?: number | null;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          price: number;
          product_id: string;
          qty: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          price: number;
          product_id: string;
          qty: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          price?: number;
          product_id?: string;
          qty?: number;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          created_at: string;
          id: string;
          momo_ref: string | null;
          status: Database['public']['Enums']['order_status'];
          total: number;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          momo_ref?: string | null;
          status?: Database['public']['Enums']['order_status'];
          total: number;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          momo_ref?: string | null;
          status?: Database['public']['Enums']['order_status'];
          total?: number;
          user_id?: string | null;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          kind: Database['public']['Enums']['payment_kind'];
          metadata: Json | null;
          order_id: string | null;
          sms_parsed_id: string | null;
          status: Database['public']['Enums']['payment_status'];
          ticket_order_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          kind?: Database['public']['Enums']['payment_kind'];
          metadata?: Json | null;
          order_id?: string | null;
          sms_parsed_id?: string | null;
          status?: Database['public']['Enums']['payment_status'];
          ticket_order_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          kind?: Database['public']['Enums']['payment_kind'];
          metadata?: Json | null;
          order_id?: string | null;
          sms_parsed_id?: string | null;
          status?: Database['public']['Enums']['payment_status'];
          ticket_order_id?: string | null;
        };
        Relationships: [];
      };
      insurance_quotes: {
        Row: {
          created_at: string;
          id: string;
          moto_type: string | null;
          period_months: number | null;
          plate: string | null;
          premium: number | null;
          ref: string | null;
          status: Database['public']['Enums']['insurance_status'];
          ticket_perk: boolean | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          moto_type?: string | null;
          period_months?: number | null;
          plate?: string | null;
          premium?: number | null;
          ref?: string | null;
          status?: Database['public']['Enums']['insurance_status'];
          ticket_perk?: boolean | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          moto_type?: string | null;
          period_months?: number | null;
          plate?: string | null;
          premium?: number | null;
          ref?: string | null;
          status?: Database['public']['Enums']['insurance_status'];
          ticket_perk?: boolean | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          description: string | null;
          id: string;
          key: string;
        };
        Insert: {
          description?: string | null;
          id?: string;
          key: string;
        };
        Update: {
          description?: string | null;
          id?: string;
          key?: string;
        };
        Relationships: [];
      };
      rewards_events: {
        Row: {
          created_at: string;
          id: string;
          meta: Json | null;
          points: number;
          ref_id: string | null;
          source: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          meta?: Json | null;
          points: number;
          ref_id?: string | null;
          source: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          meta?: Json | null;
          points?: number;
          ref_id?: string | null;
          source?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      sacco_deposits: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          ref: string | null;
          sacco_name: string | null;
          status: Database['public']['Enums']['sacco_status'];
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          ref?: string | null;
          sacco_name?: string | null;
          status?: Database['public']['Enums']['sacco_status'];
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          ref?: string | null;
          sacco_name?: string | null;
          status?: Database['public']['Enums']['sacco_status'];
          user_id?: string | null;
        };
        Relationships: [];
      };
      roles_permissions: {
        Row: {
          permission_id: string;
          role_id: string;
        };
        Insert: {
          permission_id: string;
          role_id: string;
        };
        Update: {
          permission_id?: string;
          role_id?: string;
        };
        Relationships: [];
      };
      sms_parsed: {
        Row: {
          amount: number;
          confidence: number | null;
          created_at: string;
          currency: string | null;
          id: string;
          matched_entity: string | null;
          payer_mask: string | null;
          ref: string | null;
          sms_id: string | null;
        };
        Insert: {
          amount: number;
          confidence?: number | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          matched_entity?: string | null;
          payer_mask?: string | null;
          ref?: string | null;
          sms_id?: string | null;
        };
        Update: {
          amount?: number;
          confidence?: number | null;
          created_at?: string;
          currency?: string | null;
          id?: string;
          matched_entity?: string | null;
          payer_mask?: string | null;
          ref?: string | null;
          sms_id?: string | null;
        };
        Relationships: [];
      };
      sms_raw: {
        Row: {
          from_msisdn: string | null;
          id: string;
          received_at: string;
          source: string | null;
          text: string;
        };
        Insert: {
          from_msisdn?: string | null;
          id?: string;
          received_at?: string;
          source?: string | null;
          text: string;
        };
        Update: {
          from_msisdn?: string | null;
          id?: string;
          received_at?: string;
          source?: string | null;
          text?: string;
        };
        Relationships: [];
      };
      ticket_order_items: {
        Row: {
          id: string;
          order_id: string;
          price: number;
          quantity: number;
          zone: Database['public']['Enums']['ticket_zone'];
        };
        Insert: {
          id?: string;
          order_id: string;
          price: number;
          quantity: number;
          zone: Database['public']['Enums']['ticket_zone'];
        };
        Update: {
          id?: string;
          order_id?: string;
          price?: number;
          quantity?: number;
          zone?: Database['public']['Enums']['ticket_zone'];
        };
        Relationships: [];
      };
      ticket_orders: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          match_id: string | null;
          momo_ref: string | null;
          sms_ref: string | null;
          status: Database['public']['Enums']['ticket_order_status'];
          total: number;
          user_id: string | null;
          ussd_code: string | null;
        };
        Insert: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          match_id?: string | null;
          momo_ref?: string | null;
          sms_ref?: string | null;
          status?: Database['public']['Enums']['ticket_order_status'];
          total: number;
          user_id?: string | null;
          ussd_code?: string | null;
        };
        Update: {
          created_at?: string;
          expires_at?: string | null;
          id?: string;
          match_id?: string | null;
          momo_ref?: string | null;
          sms_ref?: string | null;
          status?: Database['public']['Enums']['ticket_order_status'];
          total?: number;
          user_id?: string | null;
          ussd_code?: string | null;
        };
        Relationships: [];
      };
      ticket_passes: {
        Row: {
          created_at: string;
          gate: string | null;
          id: string;
          order_id: string | null;
          qr_token_hash: string | null;
          state: Database['public']['Enums']['ticket_pass_state'];
          zone: Database['public']['Enums']['ticket_zone'];
        };
        Insert: {
          created_at?: string;
          gate?: string | null;
          id?: string;
          order_id?: string | null;
          qr_token_hash?: string | null;
          state?: Database['public']['Enums']['ticket_pass_state'];
          zone: Database['public']['Enums']['ticket_zone'];
        };
        Update: {
          created_at?: string;
          gate?: string | null;
          id?: string;
          order_id?: string | null;
          qr_token_hash?: string | null;
          state?: Database['public']['Enums']['ticket_pass_state'];
          zone?: Database['public']['Enums']['ticket_zone'];
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          ref: string | null;
          status: Database['public']['Enums']['transaction_status'];
          type: Database['public']['Enums']['transaction_type'];
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          ref?: string | null;
          status?: Database['public']['Enums']['transaction_status'];
          type: Database['public']['Enums']['transaction_type'];
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          ref?: string | null;
          status?: Database['public']['Enums']['transaction_status'];
          type?: Database['public']['Enums']['transaction_type'];
          user_id?: string | null;
        };
        Relationships: [];
      };
      translations: {
        Row: {
          key: string;
          lang: string;
          updated_at: string;
          updated_by: string | null;
          value: string;
        };
        Insert: {
          key: string;
          lang: string;
          updated_at?: string;
          updated_by?: string | null;
          value: string;
        };
        Update: {
          key?: string;
          lang?: string;
          updated_at?: string;
          updated_by?: string | null;
          value?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          id: string;
          momo_number: string | null;
          name: string | null;
          phone: string | null;
          points: number | null;
          tier: Database['public']['Enums']['user_tier'];
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          id?: string;
          momo_number?: string | null;
          name?: string | null;
          phone?: string | null;
          points?: number | null;
          tier?: Database['public']['Enums']['user_tier'];
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          id?: string;
          momo_number?: string | null;
          name?: string | null;
          phone?: string | null;
          points?: number | null;
          tier?: Database['public']['Enums']['user_tier'];
        };
        Relationships: [];
      };
      wallet: {
        Row: {
          balance: number;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          balance?: number;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          balance?: number;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_user_points: {
        Args: {
          p_points_delta?: number | null;
          p_user_id: string;
        };
        Returns: null;
      };
    };
    Enums: {
      insurance_status: 'quoted' | 'paid' | 'issued';
      match_status: 'upcoming' | 'live' | 'ft';
      order_status: 'pending' | 'paid' | 'ready' | 'pickedup';
      payment_kind: 'ticket' | 'shop' | 'deposit' | 'policy';
      payment_status: 'pending' | 'confirmed' | 'failed';
      sacco_status: 'pending' | 'confirmed';
      ticket_order_status: 'pending' | 'paid' | 'cancelled' | 'expired';
      ticket_pass_state: 'active' | 'used' | 'refunded';
      ticket_zone: 'VIP' | 'Regular' | 'Blue';
      transaction_status: 'pending' | 'confirmed' | 'failed' | 'manual_review';
      transaction_type: 'deposit' | 'purchase' | 'refund' | 'reward';
      user_tier: 'guest' | 'fan' | 'gold';
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<
  TName extends keyof Database['public']['Tables']
> = Database['public']['Tables'][TName]['Row'];

export type TablesInsert<
  TName extends keyof Database['public']['Tables']
> = Database['public']['Tables'][TName]['Insert'];

export type TablesUpdate<
  TName extends keyof Database['public']['Tables']
> = Database['public']['Tables'][TName]['Update'];

export type Enums<TName extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][TName];
