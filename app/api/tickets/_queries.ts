import { createServiceSupabaseClient } from "@/integrations/supabase/server";

const createServiceClient = () => {
  return createServiceSupabaseClient();
};

export type TicketRecordWithRelations = {
  id: string;
  match_id: string;
  user_id: string | null;
  zone: "VIP" | "Regular" | "Blue";
  price: number;
  momo_ref: string | null;
  paid: boolean;
  created_at: string;
  match: Record<string, unknown> | null;
  user: { id: string; name: string | null; phone: string | null } | null;
};

type ListTicketsParams = {
  userId?: string | null;
  phone?: string | null;
};

export async function listTicketsForUser({ userId, phone }: ListTicketsParams) {
  const db = createServiceClient();

  if (!db) {
    console.warn("Supabase credentials missing; returning empty ticket history.");
    return [] as TicketRecordWithRelations[];
  }

  let resolvedUserId = userId?.trim() || null;
  if (!resolvedUserId && phone) {
    const sanitizedPhone = phone.replace(/\s+/g, "");
    if (!sanitizedPhone) {
      return [] as TicketRecordWithRelations[];
    }
    const { data: existingUser, error: userError } = await db
      .from("users")
      .select("id")
      .eq("phone", sanitizedPhone)
      .maybeSingle();
    if (userError) {
      throw userError;
    }
    resolvedUserId = existingUser?.id ?? null;
  }

  if (!resolvedUserId) {
    return [] as TicketRecordWithRelations[];
  }

  const { data, error } = await db
    .from("tickets")
    .select("*, match:matches(*), user:users(id, name, phone)")
    .eq("user_id", resolvedUserId)
    .order("created_at", { ascending: false });
  if (error) {
    console.warn("listTicketsForUser lookup failed", error);
    return [] as TicketRecordWithRelations[];
  }
  return (data ?? []) as TicketRecordWithRelations[];
}
