import { serve } from "https://deno.land/std@0.202.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";

type Payload = {
  transaction_id?: string;
};

const supabase = getServiceRoleClient();

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
  if (!payload.transaction_id) {
    return jsonError("missing_transaction_id", 400);
  }

  const { data: transaction, error } = await supabase
    .from("transactions")
    .select("id, user_id, amount")
    .eq("id", payload.transaction_id)
    .maybeSingle();

  if (error) {
    return jsonError(error.message, 500);
  }

  if (!transaction || !transaction.user_id) {
    return jsonError("transaction_not_found", 404);
  }

  await supabase.rpc("increment_user_points", {
    p_user_id: transaction.user_id,
    p_points_delta: transaction.amount ?? 0,
  });

  return json({ ok: true, user_id: transaction.user_id, points_awarded: transaction.amount ?? 0 });
});
