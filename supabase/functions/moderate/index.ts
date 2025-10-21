import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { getOpenAiApiKey, requireEnv } from "../_shared/env.ts";
import { json, jsonError, parseJsonBody, requireMethod } from "../_shared/http.ts";

const OPENAI_API_KEY = requireEnv(getOpenAiApiKey(), "OPENAI_API_KEY");

type Payload = { text?: string };

serve(async (req) => {
  const methodError = requireMethod(req, "POST");
  if (methodError) {
    return methodError;
  }

  const parsed = await parseJsonBody<Payload>(req);
  if (parsed.error) {
    return parsed.error;
  }

  const text = parsed.data?.text;
  if (!text) {
    return jsonError("missing_text", 400);
  }

  const res = await fetch("https://api.openai.com/v1/moderations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
  });

  if (!res.ok) {
    return jsonError(await res.text(), 502);
  }

  const output = await res.json();
  return json(output);
});
