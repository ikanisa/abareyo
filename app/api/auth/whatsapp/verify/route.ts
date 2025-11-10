import { NextResponse } from 'next/server';

import { signWhatsappJwt, verifyOtpHash } from '@/lib/otp';
import {
  deleteWhatsappAuthRequest,
  incrementWhatsappAuthAttempts,
  loadWhatsappAuthRequest,
} from '@/lib/server/whatsapp-auth/store';
import { hashPhoneForTelemetry } from '@/lib/server/otp/whatsapp';
import { getWhatsappJwtSecret, resolveOtpTtlSeconds } from '@/lib/server/whatsapp-auth/config';

const MAX_ATTEMPTS = 5;

type VerifyPayload = {
  requestId?: string;
  code?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as VerifyPayload | null;
  if (!body || typeof body.requestId !== 'string' || typeof body.code !== 'string') {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const otp = body.code.trim();
  if (!otp) {
    return NextResponse.json({ error: 'otp_required' }, { status: 400 });
  }

  const { record, expired } = loadWhatsappAuthRequest(body.requestId);

  if (!record) {
    if (expired) {
      return NextResponse.json({ error: 'otp_expired' }, { status: 410 });
    }
    return NextResponse.json({ error: 'otp_not_found' }, { status: 404 });
  }

  const secret = getWhatsappJwtSecret();
  if (!secret) {
    deleteWhatsappAuthRequest(record.id);
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  const valid = verifyOtpHash(otp, secret, record.phone, record.hash);
  if (!valid) {
    const attempts = incrementWhatsappAuthAttempts(record.id);
    if (attempts !== null && attempts >= MAX_ATTEMPTS) {
      deleteWhatsappAuthRequest(record.id);
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

  deleteWhatsappAuthRequest(record.id);

  const ttlSeconds = resolveOtpTtlSeconds();
  const token = signWhatsappJwt(record.phone, secret, ttlSeconds);

  return NextResponse.json({
    data: {
      accessToken: token,
      refreshToken: token,
      userId: hashPhoneForTelemetry(record.phone),
    },
  });
}
