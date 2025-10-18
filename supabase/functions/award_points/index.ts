import { serve } from "https://deno.land/std@0.202.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Payload = {
  transaction_id?: string;
};

const rawSupabaseUrl = Deno.env.get("SITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const rawServiceKey =
  Deno.env.get("SITE_SUPABASE_SECRET_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SECRET_KEY");

if (!rawSupabaseUrl || !rawServiceKey) {
  throw new Error("Supabase URL or secret key is missing");
}

const supabase = createClient(rawSupabaseUrl, rawServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  if (!payload.transaction_id) {
    return json({ error: "missing_transaction_id" }, 400);
  }

  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("id, user_id, amount")
    .eq("id", payload.transaction_id)
    .maybeSingle();
  if (error) {
    return json({ error: error.message }, 500);
  }
  if (!transaction || !transaction.user_id) {
    return json({ error: "transaction_not_found" }, 404);
  }

  await supabase.rpc("increment_user_points", {
    p_user_id: transaction.user_id,
    p_points_delta: transaction.amount ?? 0,
  });

  return json({ ok: true, user_id: transaction.user_id, points_awarded: transaction.amount ?? 0 });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
