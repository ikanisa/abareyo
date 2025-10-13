import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE);

serve(async (_req) => {
  // Issue simple policies for paid quotes, set perk
  const { data: q } = await db.from("insurance_quotes").select("*").eq("status", "paid").limit(10);
  for (const quote of q ?? []) {
    await db.from("policies").insert({
      quote_id: quote.id,
      number: "POL-" + crypto.randomUUID().slice(0, 8).toUpperCase(),
      valid_from: new Date().toISOString(),
      valid_to: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    });
    await db
      .from("insurance_quotes")
      .update({ status: "issued", ticket_perk: quote.premium >= 25000 })
      .eq("id", quote.id);
  }
  return new Response(JSON.stringify({ ok: true, issued: (q ?? []).length }), { status: 200 });
});
