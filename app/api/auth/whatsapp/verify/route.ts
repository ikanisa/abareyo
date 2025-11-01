import { NextResponse } from 'next/server';

import { serverEnv } from '@/config/env';
import { normalizeWhatsappNumber } from '@/lib/phone';
import { signWhatsappJwt, verifyOtpHash } from '@/lib/otp';
import { otpRepository } from '@/lib/redis';

const MAX_ATTEMPTS = 5;

type VerifyPayload = {
  phone?: string;
  otp?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as VerifyPayload | null;
  if (!body || typeof body.phone !== 'string' || typeof body.otp !== 'string') {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const phone = normalizeWhatsappNumber(body.phone);
  if (!phone) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 });
  }

  const otp = body.otp.trim();
  if (!otp) {
    return NextResponse.json({ error: 'otp_required' }, { status: 400 });
  }

  const record = await otpRepository.load(phone);
  if (!record) {
    return NextResponse.json({ error: 'otp_not_found' }, { status: 404 });
  }

  if (record.exp <= Date.now()) {
    await otpRepository.remove(phone);
    return NextResponse.json({ error: 'otp_expired' }, { status: 410 });
  }

  const valid = verifyOtpHash(otp, serverEnv.JWT_SECRET, phone, record.hash);
  if (!valid) {
    const attempts = await otpRepository.incrementAttempts(phone);
    if (attempts !== null && attempts >= MAX_ATTEMPTS) {
      await otpRepository.remove(phone);
      return NextResponse.json({ error: 'otp_attempts_exceeded' }, { status: 429 });
    }

    return NextResponse.json(
      {
        error: 'otp_invalid',
        remainingAttempts: attempts !== null ? Math.max(0, MAX_ATTEMPTS - attempts) : 0,
      },
      { status: 401 },
    );
  }

  await otpRepository.remove(phone);

  const ttlSeconds = Math.max(30, Number(serverEnv.OTP_TTL_SEC || 300));
  const token = signWhatsappJwt(phone, serverEnv.JWT_SECRET, ttlSeconds);

  return NextResponse.json({ ok: true, token });
}
