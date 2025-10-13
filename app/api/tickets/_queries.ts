import { createClient } from "@supabase/supabase-js";

const createServiceClient = () => {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase credentials are not configured");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
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
    throw error;
  }
  return (data ?? []) as TicketRecordWithRelations[];
}
