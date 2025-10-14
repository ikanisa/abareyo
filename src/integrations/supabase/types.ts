export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Supabase Database types — conflict-free (merged) */
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      admin_roles: {
        Row: { id: string; name: string };
        Insert: { id?: string; name: string };
        Update: { id?: string; name?: string };
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
        Relationships: [
          {
            foreignKeyName: "admin_sessions_admin_user_id_fkey";
            columns: ["admin_user_id"];
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          }
        ];
      };

      admin_users: {
        Row: {
          display_name: string | null;
          email: string;
          id: string;
          last_login: string | null;
          password_hash: string;
          status: string | null;
        };
        Insert: {
          display_name?: string | null;
          email: string;
          id?: string;
          last_login?: string | null;
          password_hash: string;
          status?: string | null;
        };
        Update: {
          display_name?: string | null;
          email?: string;
          id?: string;
          last_login?: string | null;
          password_hash?: string;
          status?: string | null;
        };
        Relationships: [];
      };

      admin_users_roles: {
        Row: { admin_user_id: string; role_id: string };
        Insert: { admin_user_id: string; role_id: string };
        Update: { admin_user_id?: string; role_id?: string };
        Relationships: [
          {
            foreignKeyName: "admin_users_roles_admin_user_id_fkey";
            columns: ["admin_user_id"];
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_users_roles_role_id_fkey";
            columns: ["role_id"];
            referencedRelation: "admin_roles";
            referencedColumns: ["id"];
          }
        ];
      };

      audit_logs: {
        Row: {
          action: string | null;
          admin_user_id: string | null;
          after: Json | null;
          at: string | null;
          before: Json | null;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          ip: string | null;
          ua: string | null;
        };
        Insert: {
          action?: string | null;
          admin_user_id?: string | null;
          after?: Json | null;
          at?: string | null;
          before?: Json | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip?: string | null;
          ua?: string | null;
        };
        Update: {
          action?: string | null;
          admin_user_id?: string | null;
          after?: Json | null;
          at?: string | null;
          before?: Json | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          ip?: string | null;
          ua?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey";
            columns: ["admin_user_id"];
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          }
        ];
      };

      feature_flags: {
        Row: { key: string; updated_at: string; updated_by: string | null; value: Json | null };
        Insert: { key: string; updated_at?: string; updated_by?: string | null; value?: Json | null };
        Update: { key?: string; updated_at?: string; updated_by?: string | null; value?: Json | null };
        Relationships: [
          {
            foreignKeyName: "feature_flags_updated_by_fkey";
            columns: ["updated_by"];
            referencedRelation: "admin_users";
            referencedColumns: ["id"];
          }
        ];
      };

      fan_clubs: {
        Row: { city: string | null; id: string; members: number; name: string };
        Insert: { city?: string | null; id?: string; members?: number; name: string };
        Update: { city?: string | null; id?: string; members?: number; name?: string };
        Relationships: [];
      };

      fan_posts: {
        Row: {
          comments: number;
          created_at: string;
          id: string;
          likes: number;
          media_url: string | null;
          text: string | null;
          user_id: string | null;
        };
        Insert: {
          comments?: number;
          created_at?: string;
          id?: string;
          likes?: number;
          media_url?: string | null;
          text?: string | null;
          user_id?: string | null;
        };
        Update: {
          comments?: number;
          created_at?: string;
          id?: string;
          likes?: number;
          media_url?: string | null;
          text?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fan_posts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      insurance_quotes: {
        Row: {
          created_at: string;
          id: string;
          moto_type: string | null;
          plate: string | null;
          premium: number;
          ref: string | null;
          status: Database["public"]["Enums"]["insurance_status"];
          ticket_perk: boolean;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          moto_type?: string | null;
          plate?: string | null;
          premium: number;
          ref?: string | null;
          status?: Database["public"]["Enums"]["insurance_status"];
          ticket_perk?: boolean;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          moto_type?: string | null;
          plate?: string | null;
          premium?: number;
          ref?: string | null;
          status?: Database["public"]["Enums"]["insurance_status"];
          ticket_perk?: boolean;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "insurance_quotes_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      matches: {
        Row: {
          away_team: string | null;
          blue_price: number | null;
          comp: string | null;
          date: string;
          home_team: string | null;
          id: string;
          regular_price: number | null;
          seats_blue: number | null;
          seats_regular: number | null;
          seats_vip: number | null;
          status: Database["public"]["Enums"]["match_status"];
          title: string;
          venue: string | null;
          vip_price: number | null;
        };
        Insert: {
          away_team?: string | null;
          blue_price?: number | null;
          comp?: string | null;
          date: string;
          home_team?: string | null;
          id?: string;
          regular_price?: number | null;
          seats_blue?: number | null;
          seats_regular?: number | null;
          seats_vip?: number | null;
          status?: Database["public"]["Enums"]["match_status"];
          title: string;
          venue?: string | null;
          vip_price?: number | null;
        };
        Update: {
          away_team?: string | null;
          blue_price?: number | null;
          comp?: string | null;
          date?: string;
          home_team?: string | null;
          id?: string;
          regular_price?: number | null;
          seats_blue?: number | null;
          seats_regular?: number | null;
          seats_vip?: number | null;
          status?: Database["public"]["Enums"]["match_status"];
          title?: string;
          venue?: string | null;
          vip_price?: number | null;
        };
        Relationships: [];
      };

      match_gates: {
        Row: { created_at: string; id: string; location: string | null; match_id: string; max_throughput: number | null; name: string };
        Insert: { created_at?: string; id?: string; location?: string | null; match_id: string; max_throughput?: number | null; name: string };
        Update: { created_at?: string; id?: string; location?: string | null; match_id?: string; max_throughput?: number | null; name?: string };
        Relationships: [
          {
            foreignKeyName: "match_gates_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          }
        ];
      };

      match_zones: {
        Row: { capacity: number; created_at: string; default_gate: string | null; id: string; match_id: string; name: string; price: number };
        Insert: { capacity?: number; created_at?: string; default_gate?: string | null; id?: string; match_id: string; name: string; price?: number };
        Update: { capacity?: number; created_at?: string; default_gate?: string | null; id?: string; match_id?: string; name?: string; price?: number };
        Relationships: [
          {
            foreignKeyName: "match_zones_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          }
        ];
      };

      order_items: {
        Row: { id: string; order_id: string | null; price: number; product_id: string | null; qty: number };
        Insert: { id?: string; order_id?: string | null; price: number; product_id?: string | null; qty: number };
        Update: { id?: string; order_id?: string | null; price?: number; product_id?: string | null; qty?: number };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            referencedRelation: "shop_products";
            referencedColumns: ["id"];
          }
        ];
      };

      orders: {
        Row: { created_at: string; id: string; momo_ref: string | null; status: Database["public"]["Enums"]["order_status"]; total: number; user_id: string | null };
        Insert: { created_at?: string; id?: string; momo_ref?: string | null; status?: Database["public"]["Enums"]["order_status"]; total: number; user_id?: string | null };
        Update: { created_at?: string; id?: string; momo_ref?: string | null; status?: Database["public"]["Enums"]["order_status"]; total?: number; user_id?: string | null };
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      policies: {
        Row: { free_ticket_issued: boolean; id: string; number: string; quote_id: string | null; valid_from: string; valid_to: string };
        Insert: { free_ticket_issued?: boolean; id?: string; number: string; quote_id?: string | null; valid_from: string; valid_to: string };
        Update: { free_ticket_issued?: boolean; id?: string; number?: string; quote_id?: string | null; valid_from?: string; valid_to?: string };
        Relationships: [
          {
            foreignKeyName: "policies_quote_id_fkey";
            columns: ["quote_id"];
            referencedRelation: "insurance_quotes";
            referencedColumns: ["id"];
          }
        ];
      };

      polls: {
        Row: { active: boolean; id: string; options: Json; question: string; results: Json };
        Insert: { active?: boolean; id?: string; options: Json; question: string; results?: Json };
        Update: { active?: boolean; id?: string; options?: Json; question?: string; results?: Json };
        Relationships: [];
      };

      sacco_deposits: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          ref: string | null;
          sacco_name: string;
          status: Database["public"]["Enums"]["sacco_status"];
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          ref?: string | null;
          sacco_name: string;
          status?: Database["public"]["Enums"]["sacco_status"];
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          ref?: string | null;
          sacco_name?: string;
          status?: Database["public"]["Enums"]["sacco_status"];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sacco_deposits_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      permissions: {
        Row: { description: string | null; id: string; key: string };
        Insert: { description?: string | null; id?: string; key: string };
        Update: { description?: string | null; id?: string; key?: string };
        Relationships: [];
      };

      shop_products: {
        Row: {
          badge: string | null;
          category: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          name: string;
          price: number;
          stock: number;
        };
        Insert: {
          badge?: string | null;
          category?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name: string;
          price: number;
          stock?: number;
        };
        Update: {
          badge?: string | null;
          category?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          name?: string;
          price?: number;
          stock?: number;
        };
        Relationships: [];
      };

      ticket_order_items: {
        Row: { id: string; order_id: string | null; price: number; quantity: number; zone: Database["public"]["Enums"]["ticket_zone"] };
        Insert: { id?: string; order_id?: string | null; price: number; quantity: number; zone: Database["public"]["Enums"]["ticket_zone"] };
        Update: { id?: string; order_id?: string | null; price?: number; quantity?: number; zone?: Database["public"]["Enums"]["ticket_zone"] };
        Relationships: [
          {
            foreignKeyName: "ticket_order_items_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "ticket_orders";
            referencedColumns: ["id"];
          }
        ];
      };

      ticket_orders: {
        Row: {
          created_at: string;
          expires_at: string | null;
          id: string;
          match_id: string | null;
          momo_ref: string | null;
          sms_ref: string | null;
          status: Database["public"]["Enums"]["ticket_order_status"];
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
          status?: Database["public"]["Enums"]["ticket_order_status"];
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
          status?: Database["public"]["Enums"]["ticket_order_status"];
          total?: number;
          user_id?: string | null;
          ussd_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_orders_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ticket_orders_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      /** Legacy tickets table (kept if still present in DB) */
      tickets: {
        Row: {
          created_at: string;
          gate: string | null;
          id: string;
          match_id: string | null;
          momo_ref: string | null;
          order_id: string | null;
          paid: boolean;
          price: number;
          qr_token: string | null;
          state: string;
          updated_at: string;
          user_id: string | null;
          zone: Database["public"]["Enums"]["ticket_zone"];
        };
        Insert: {
          created_at?: string;
          gate?: string | null;
          id?: string;
          match_id?: string | null;
          momo_ref?: string | null;
          order_id?: string | null;
          paid?: boolean;
          price: number;
          qr_token?: string | null;
          state?: string;
          updated_at?: string;
          user_id?: string | null;
          zone: Database["public"]["Enums"]["ticket_zone"];
        };
        Update: {
          created_at?: string;
          gate?: string | null;
          id?: string;
          match_id?: string | null;
          momo_ref?: string | null;
          order_id?: string | null;
          paid?: boolean;
          price?: number;
          qr_token?: string | null;
          state?: string;
          updated_at?: string;
          user_id?: string | null;
          zone?: Database["public"]["Enums"]["ticket_zone"];
        };
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "ticket_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tickets_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      /** New passes table (used by newer flows) */
      ticket_passes: {
        Row: {
          created_at: string;
          gate: string | null;
          id: string;
          order_id: string | null;
          qr_token_hash: string | null;
          state: Database["public"]["Enums"]["ticket_pass_state"];
          zone: Database["public"]["Enums"]["ticket_zone"];
        };
        Insert: {
          created_at?: string;
          gate?: string | null;
          id?: string;
          order_id?: string | null;
          qr_token_hash?: string | null;
          state?: Database["public"]["Enums"]["ticket_pass_state"];
          zone: Database["public"]["Enums"]["ticket_zone"];
        };
        Update: {
          created_at?: string;
          gate?: string | null;
          id?: string;
          order_id?: string | null;
          qr_token_hash?: string | null;
          state?: Database["public"]["Enums"]["ticket_pass_state"];
          zone?: Database["public"]["Enums"]["ticket_zone"];
        };
        Relationships: [
          {
            foreignKeyName: "ticket_passes_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "ticket_orders";
            referencedColumns: ["id"];
          }
        ];
      };

      payments: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          kind: Database["public"]["Enums"]["payment_kind"];
          metadata: Json | null;
          order_id: string | null;
          sms_parsed_id: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          ticket_order_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          kind: Database["public"]["Enums"]["payment_kind"];
          metadata?: Json | null;
          order_id?: string | null;
          sms_parsed_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          ticket_order_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          kind?: Database["public"]["Enums"]["payment_kind"];
          metadata?: Json | null;
          order_id?: string | null;
          sms_parsed_id?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          ticket_order_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_sms_parsed_id_fkey";
            columns: ["sms_parsed_id"];
            referencedRelation: "sms_parsed";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_ticket_order_id_fkey";
            columns: ["ticket_order_id"];
            referencedRelation: "ticket_orders";
            referencedColumns: ["id"];
          }
        ];
      };

      rewards_events: {
        Row: { created_at: string; id: string; meta: Json | null; points: number; ref_id: string | null; source: string; user_id: string | null };
        Insert: { created_at?: string; id?: string; meta?: Json | null; points: number; ref_id?: string | null; source: string; user_id?: string | null };
        Update: { created_at?: string; id?: string; meta?: Json | null; points?: number; ref_id?: string | null; source?: string; user_id?: string | null };
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
          sms_id: string;
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
          sms_id: string;
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
          sms_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sms_parsed_sms_id_fkey";
            columns: ["sms_id"];
            referencedRelation: "sms_raw";
            referencedColumns: ["id"];
          }
        ];
      };

      sms_raw: {
        Row: { from_msisdn: string | null; id: string; received_at: string; source: string | null; text: string };
        Insert: { from_msisdn?: string | null; id?: string; received_at?: string; source?: string | null; text: string };
        Update: { from_msisdn?: string | null; id?: string; received_at?: string; source?: string | null; text?: string };
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
          points: number;
          tier: Database["public"]["Enums"]["user_tier"];
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          id?: string;
          momo_number?: string | null;
          name?: string | null;
          phone?: string | null;
          points?: number;
          tier?: Database["public"]["Enums"]["user_tier"];
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          id?: string;
          momo_number?: string | null;
          name?: string | null;
          phone?: string | null;
          points?: number;
          tier?: Database["public"]["Enums"]["user_tier"];
        };
        Relationships: [];
      };

      wallet: {
        Row: { balance: number; id: string; updated_at: string; user_id: string | null };
        Insert: { balance?: number; id?: string; updated_at?: string; user_id?: string | null };
        Update: { balance?: number; id?: string; updated_at?: string; user_id?: string | null };
        Relationships: [
          {
            foreignKeyName: "wallet_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };

    Views: { [_ in never]: never };

    Functions: {
      increment_user_points: {
        Args: { p_user_id: string; p_points_delta: number };
        Returns: void;
      };
    };

    Enums: {
      insurance_status: "quoted" | "paid" | "issued";
      match_status: "upcoming" | "live" | "ft";
      order_status: "pending" | "paid" | "ready" | "pickedup";
      sacco_status: "pending" | "confirmed";
      payment_kind: "ticket" | "shop" | "deposit" | "policy";
      payment_status: "pending" | "confirmed" | "failed";
      ticket_order_status: "pending" | "paid" | "cancelled" | "expired";
      ticket_pass_state: "active" | "used" | "refunded";
      ticket_zone: "VIP" | "Regular" | "Blue";
      transaction_status: "pending" | "confirmed" | "failed" | "manual_review";
      transaction_type: "deposit" | "purchase" | "refund" | "reward";
      user_tier: "guest" | "fan" | "gold";
    };

    CompositeTypes: { [_ in never]: never };
  };
};

/** Helper type aliases */
export type Tables<TName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TName]["Row"];

export type TablesInsert<TName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TName]["Insert"];

export type TablesUpdate<TName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TName]["Update"];

export type Enums<TName extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][TName];
