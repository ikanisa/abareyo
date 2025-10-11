import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  // Simple bearer
  const auth = req.headers.authorization?.replace("Bearer ", "");
  if (!auth || auth !== process.env.ONBOARDING_API_TOKEN) {
    return res.status(401).json({ error: "unauthorized", message: "Missing or invalid token." });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const AGENT_ID = process.env.AGENT_ID;

  if (!OPENAI_API_KEY || !AGENT_ID) {
    // 502-ish behavior: backend not ready; we return 503 with reason
    return res.status(503).json({
      error: "service_unavailable",
      message: "Onboarding service is not ready. Missing OPENAI_API_KEY or AGENT_ID in production."
    });
  }

  try {
    // A minimal "session" doc we can return. Replace later with real agent session if needed.
    const session = {
      sessionId: crypto.randomUUID(),
      agentId: AGENT_ID,
      createdAt: new Date().toISOString()
    };
    return res.status(200).json({ ok: true, session });
  } catch (e: any) {
    return res.status(500).json({ error: "internal_error", message: e?.message ?? "Unknown error" });
  }
}

