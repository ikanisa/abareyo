import { NextResponse } from 'next/server';

import { serverEnv } from '@/config/env';
import { normalizeWhatsappNumber } from '@/lib/phone';
import { generateNumericOtp, hashOtp } from '@/lib/otp';
import { otpRepository, rateLimiter } from '@/lib/redis';
import { sendWhatsappOTP, WhatsappRecoverableError } from '@/lib/whatsapp';

type StartPayload = {
  phone?: string;
};

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as StartPayload | null;
  if (!body || typeof body.phone !== 'string') {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const phone = normalizeWhatsappNumber(body.phone);
  if (!phone) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 });
  }

  const limit = Math.max(1, Number(serverEnv.RATE_LIMIT_PER_PHONE_PER_HOUR || 5));
  const rateHit = await rateLimiter.hit(phone, limit, RATE_LIMIT_WINDOW_MS);

  if (!rateHit.allowed) {
    return NextResponse.json(
      {
        error: 'rate_limited',
        retryAt: new Date(rateHit.resetAt).toISOString(),
      },
      { status: 429 },
    );
  }

  const ttlSeconds = Math.max(30, Number(serverEnv.OTP_TTL_SEC || 300));
  const otp = generateNumericOtp();
  const hash = hashOtp(otp, serverEnv.JWT_SECRET, phone);

  const record = await otpRepository.create(phone, hash, ttlSeconds);

  try {
    await sendWhatsappOTP({ phone, otp });
  } catch (error) {
    await otpRepository.remove(phone);
    if (error instanceof WhatsappRecoverableError) {
      return NextResponse.json(
        {
          error: error.message,
          detail: error.detail ?? null,
        },
        { status: error.status ?? 502 },
      );
    }
    throw error;
  }

  return NextResponse.json({ ok: true, expiresAt: new Date(record.exp).toISOString() });
}
