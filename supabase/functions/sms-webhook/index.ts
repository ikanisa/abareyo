// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const TOKEN = Deno.env.get("SMS_WEBHOOK_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(SUPABASE_URL, SERVICE);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const auth = req.headers.get("authorization")?.split("Bearer ")[1];
  if (!auth || auth !== TOKEN) return new Response("Unauthorized", { status: 401 });

  const payload = await req.json(); // { from, text } e.g. "Paid RWF 25000 Ref XYZ123 ..."
  const txt = String(payload?.text ?? "");
  const refMatch = txt.match(/Ref\s+([A-Z0-9\-]+)/i);
  const amtMatch = txt.match(/RWF\s*([\d,]+)/i);
  const REF = refMatch?.[1] ?? crypto.randomUUID();
  const AMT = amtMatch ? Number(amtMatch[1].replace(/,/g, "")) : 0;

  // Try to match pending ticket/order/quote/deposit by amount or placeholder ref
  // For MVP we only flip earliest pending with same total.
  async function matchAndConfirm() {
    // tickets
    let { data: t } = await db.from("tickets").select("*").eq("paid", false).order("created_at").limit(50);
    const ticket = (t ?? []).find((x: any) => x.price === AMT);
    if (ticket) {
      await db.from("tickets").update({ paid: true, momo_ref: REF }).eq("id", ticket.id);
      await db.from("transactions").insert({ user_id: ticket.user_id, kind: "purchase", amount: AMT, ref: REF });
      return { kind: "ticket", id: ticket.id };
    }
    // orders
    let { data: o } = await db.from("orders").select("*").eq("status", "pending").order("created_at").limit(50);
    const order = (o ?? []).find((x: any) => x.total === AMT);
    if (order) {
      await db.from("orders").update({ status: "paid", momo_ref: REF }).eq("id", order.id);
      await db.from("transactions").insert({ user_id: order.user_id, kind: "purchase", amount: AMT, ref: REF });
      return { kind: "order", id: order.id };
    }
    // insurance
    let { data: q } = await db.from("insurance_quotes").select("*").eq("status", "quoted").order("created_at").limit(50);
    const quote = (q ?? []).find((x: any) => x.premium === AMT);
    if (quote) {
      await db.from("insurance_quotes").update({ status: "paid", ref: REF }).eq("id", quote.id);
      return { kind: "quote", id: quote.id };
    }
    // sacco
    let { data: d } = await db.from("sacco_deposits").select("*").eq("status", "pending").order("created_at").limit(50);
    const dep = (d ?? []).find((x: any) => x.amount === AMT);
    if (dep) {
      await db.from("sacco_deposits").update({ status: "confirmed", ref: REF }).eq("id", dep.id);
      await db.from("transactions").insert({ user_id: dep.user_id, kind: "deposit", amount: AMT, ref: REF });
      return { kind: "deposit", id: dep.id };
    }
    return { kind: "unmatched" };
  }

  const result = await matchAndConfirm();
  return new Response(JSON.stringify({ ok: true, parsed: { REF, AMT }, result }), { status: 200 });
});
