import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const auth = req.headers.authorization?.replace("Bearer ", "");
  if (!auth || auth !== process.env.ONBOARDING_API_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { sessionId, text } = req.body || {};
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const AGENT_ID = process.env.AGENT_ID || 'abareyo-onboarding';
  const ALLOW_MOCK = (process.env.NEXT_PUBLIC_ONBOARDING_ALLOW_MOCK === '1' || process.env.ONBOARDING_ALLOW_MOCK === '1' || !(OPENAI_API_KEY || '').startsWith('sk-'));

  if (!OPENAI_API_KEY || !AGENT_ID) {
    if (ALLOW_MOCK) {
      res.setHeader('x-onboarding-mock', '1');
      return res.status(200).json({ ok: true, reply: "(mock) Hello! Let’s get your fan profile set up." });
    }
    return res.status(503).json({ error: "service_unavailable", message: "Agent not configured" });
  }
  if (!sessionId || !text) {
    return res.status(400).json({ error: "bad_request", message: "sessionId and text are required" });
  }

  try {
    // Example call to OpenAI Responses API (replace with your specific flow/Agents API)
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: `Agent:${AGENT_ID}\nUser:${text}\nReturn a short onboarding reply.`,
        metadata: { app: "abareyo", sessionId }
      })
    });
    if (!resp.ok) {
      const detail = await resp.text();
      return res.status(502).json({ error: "upstream_error", detail });
    }
    const data = await resp.json();
    const reply = data?.output?.[0]?.content?.[0]?.text ?? "Muraho! Let's get started.";

    return res.status(200).json({ ok: true, reply });
  } catch (e: any) {
    return res.status(500).json({ error: "internal_error", message: e?.message ?? "Unknown error" });
  }
}
