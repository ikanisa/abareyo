import { serve } from "https://deno.land/std@0.202.0/http/server.ts";

import { getServiceRoleClient } from "../_shared/client.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";

type Payload = {
  event_id?: string;
  token?: string;
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

  const { event_id, token } = parsed.data ?? {};

  if (!event_id) {
    return jsonError("missing_event_id", 400);
  }

  if (!token) {
    return jsonError("missing_token", 400);
  }

  if (token !== event_id) {
    return jsonError("invalid_token", 401);
  }

  const { data: checkin, error } = await supabase
    .from("event_checkins")
    .insert({
      event_id,
      token,
    })
    .select("id")
    .single();

  if (error) {
    return jsonError(error.message, 500);
  }

  return json({ ok: true, checkin_id: checkin?.id ?? null });
});
