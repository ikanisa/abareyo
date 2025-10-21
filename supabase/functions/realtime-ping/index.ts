import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { json, requireMethod } from "../_shared/http.ts";

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  return json({ ok: true });
});
