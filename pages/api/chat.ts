import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const body = req.body
    const r = await fetch(`${process.env.NEXT_PUBLIC_OPENAI_BASE_URL || 'https://api.openai.com/v1'}/responses`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: body?.input ?? 'hello',
        metadata: { app: 'gikundiro', stage: process.env.NODE_ENV }
      })
    })
    const data = await r.json()
    res.status(200).json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to reach OpenAI', detail: String(err) })
  }
}

