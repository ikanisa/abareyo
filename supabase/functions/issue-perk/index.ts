import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";

type Payload = {
  user_id?: string;
  match_id?: string;
  note?: string;
  kind?: "ticket";
};

type RetroIssueResponse = {
  status?: string;
  order_id?: string;
  pass_id?: string;
};

const supabase = getServiceRoleClient();

async function resolveMatchId(candidate?: string | null): Promise<string | null> {
  if (candidate) {
    const { data } = await supabase.from("matches").select("id").eq("id", candidate).maybeSingle();
    if (data?.id) {
      return data.id;
    }
  }

  const { data: publicUpcoming } = await supabase
    .from("matches")
    .select("id")
    .eq("is_public", true)
    .gte("kickoff", new Date().toISOString())
    .order("kickoff", { ascending: true })
    .maybeSingle();

  if (publicUpcoming?.id) {
    return publicUpcoming.id;
  }

  const { data: anyUpcoming } = await supabase
    .from("matches")
    .select("id")
    .gte("kickoff", new Date().toISOString())
    .order("kickoff", { ascending: true })
    .maybeSingle();

  if (anyUpcoming?.id) {
    return anyUpcoming.id;
  }

  const { data: fallback } = await supabase
    .from("matches")
    .select("id")
    .order("kickoff", { ascending: true })
    .maybeSingle();

  return fallback?.id ?? null;
}

async function hasExistingPerk(userId: string, matchId: string): Promise<boolean> {
  const { data: rewards } = await supabase
    .from("rewards_events")
    .select("id")
    .eq("user_id", userId)
    .eq("source", "ticket_perk")
    .eq("meta->>match_id", matchId)
    .limit(1);

  if (rewards && rewards.length > 0) {
    return true;
  }

  const { data: orders } = await supabase
    .from("ticket_orders")
    .select("id")
    .eq("user_id", userId)
    .eq("match_id", matchId)
    .or("sms_ref.eq.RETRO-PERK,sms_ref.ilike.perk:%")
    .limit(1);

  return !!(orders && orders.length > 0);
}

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  const parsed = await parseJsonBody<Payload>(req);
  if (parsed.error) {
    return parsed.error;
  }

  const payload = parsed.data ?? {};
  const userId = payload.user_id?.trim();
  const kind = payload.kind ?? "ticket";

  if (!userId) {
    return jsonError("missing_user_id", 400);
  }

  if (kind !== "ticket") {
    return jsonError("unsupported_kind", 400, { supported: ["ticket"] });
  }

  const matchId = await resolveMatchId(payload.match_id);
  if (!matchId) {
    return jsonError("match_not_found", 404);
  }

  const alreadyIssued = await hasExistingPerk(userId, matchId);
  if (alreadyIssued) {
    return json({ ok: false, reason: "perk_already_issued", match_id: matchId });
  }

  const note = (payload.note ?? "edge:issue-perk").slice(0, 120);

  const { data, error } = await supabase.rpc<RetroIssueResponse>("retro_issue_ticket_perk", {
    target_user: userId,
    match: matchId,
    note,
  });

  if (error) {
    console.error("[edge:issue-perk] retro_issue_ticket_perk failed", { error });
    return jsonError(error.message ?? "issue_failed", 500);
  }

  console.log("[edge:issue-perk] perk issued", { userId, matchId });
  return json({ ok: true, match_id: matchId, result: data ?? null });
});
