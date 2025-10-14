"use client";

import { useEffect, useState } from "react";
import { PWA_OPT_IN_EVENT, PWA_OPT_IN_KEY, recordPwaOptIn } from "@/app/_lib/pwa";

/** Minimal JSON helper so DB types compile */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

/** Supabase Database types (conflict-free, merged) */
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
        Row: {
          created_at: string;
          id: string;
          momo_ref: string | null;
          status: Database["public"]["Enums"]["order_status"];
          total: number;
          user_id: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          momo_ref?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total: number;
          user_id?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          momo_ref?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          total?: number;
          user_id?: string | null;
        };
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
        Row: {
          free_ticket_issued: boolean;
          id: string;
          number: string;
          quote_id: string | null;
          valid_from: string;
          valid_to: string;
        };
        Insert: {
          free_ticket_issued?: boolean;
          id?: string;
          number: string;
          quote_id?: string | null;
          valid_from: string;
          valid_to: string;
        };
        Update: {
          free_ticket_issued?: boolean;
          id?: string;
          number?: string;
          quote_id?: string | null;
          valid_from?: string;
          valid_to?: string;
        };
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
      transactions: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          ref: string | null;
          status: Database["public"]["Enums"]["transaction_status"];
          type: Database["public"]["Enums"]["transaction_type"];
          user_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          ref?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"];
          type: Database["public"]["Enums"]["transaction_type"];
          user_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          ref?: string | null;
          status?: Database["public"]["Enums"]["transaction_status"];
          type?: Database["public"]["Enums"]["transaction_type"];
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      roles_permissions: {
        Row: { permission_id: string; role_id: string };
        Insert: { permission_id: string; role_id: string };
        Update: { permission_id?: string; role_id?: string };
        Relationships: [
          {
            foreignKeyName: "roles_permissions_permission_id_fkey";
            columns: ["permission_id"];
            referencedRelation: "permissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "roles_permissions_role_id_fkey";
            columns: ["role_id"];
            referencedRelation: "admin_roles";
            referencedColumns: ["id"];
          }
        ];
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
      ticket_zone: "VIP" | "Regular" | "Blue";
      ticket_order_status: "pending" | "paid" | "cancelled" | "expired";
      transaction_status: "pending" | "confirmed" | "failed" | "manual_review";
      transaction_type: "deposit" | "purchase" | "refund" | "reward";
      user_tier: "guest" | "fan" | "gold";
      payment_kind: "ticket" | "shop" | "deposit" | "policy";
      payment_status: "pending" | "confirmed" | "failed";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

/** PWA Install + Offline UI */
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void> };

const hasWindow = () => typeof window !== "undefined";

export function InstallPrompt() {
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!hasWindow()) return;

    const ua = window.navigator.userAgent.toLowerCase();
    const isiOS = /iphone|ipad|ipod/.test(ua);
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    const inStandalone =
      "standalone" in navigatorWithStandalone && Boolean(navigatorWithStandalone.standalone);
    if (isiOS && !inStandalone) setShowIosPrompt(true);

    const onBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!hasWindow()) return;
    try {
      if (window.localStorage.getItem(PWA_OPT_IN_KEY) === "true") setShow(false);
    } catch (error) {
      console.warn("Unable to read stored PWA preference", error);
    }
  }, []);

  if (showIosPrompt) {
    return (
      <div className="card break-words whitespace-normal fixed inset-x-0 bottom-24 mx-auto flex w-fit items-center gap-2">
        <span>Install GIKUNDIRO App to your Home Screen</span>
        <p className="text-xs text-white/70">Tap the Share icon and select “Add to Home Screen”.</p>
        <button className="btn" onClick={() => setShowIosPrompt(false)}>
          Close
        </button>
      </div>
    );
  }

  if (!show) return null;

  const handleInstall = async () => {
    recordPwaOptIn({ reason: "install" });
    try {
      await deferredPrompt?.prompt();
    } catch (error) {
      console.warn("PWA installation prompt failed", error);
    } finally {
      setShow(false);
    }
  };

  return (
    <div className="card break-words whitespace-normal fixed inset-x-0 bottom-24 mx-auto flex w-fit items-center gap-2">
      <span>Install GIKUNDIRO App?</span>
      <button className="btn-primary" onClick={handleInstall}>
        Install
      </button>
      <button className="btn" onClick={() => setShow(false)}>
        Later
      </button>
    </div>
  );
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!hasWindow()) return () => {};
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);

    setOffline(!navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed inset-x-0 top-14 bg-yellow-500/20 p-2 text-center text-yellow-100">
      You’re offline. We’ll sync when you’re back.
    </div>
  );
}
