import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: { text?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const text = payload.text;
  if (!text) {
    return new Response(JSON.stringify({ error: "missing_text" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
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
    return new Response(JSON.stringify({ error: await res.text() }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  const output = await res.json();
  return new Response(JSON.stringify(output), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
