import { NextResponse } from 'next/server';

import { serverEnv } from '@/config/env';
import { normalizeWhatsappNumber } from '@/lib/phone';
import { generateNumericOtp, hashOtp } from '@/lib/otp';
import { rateLimiter } from '@/lib/redis';
import { sendWhatsAppOtp } from '@/lib/server/otp/whatsapp';
import {
  createWhatsappAuthRequest,
  deleteWhatsappAuthRequest,
  getWhatsappAuthRequestCountdowns,
} from '@/lib/server/whatsapp-auth/store';
import { persistWhatsappDelivery } from '@/lib/server/whatsapp-auth/persistence';
import {
  getWhatsappJwtSecret,
  resolveOtpTtlSeconds,
  resolveResendDelaySeconds,
} from '@/lib/server/whatsapp-auth/config';

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

  const ttlSeconds = resolveOtpTtlSeconds();
  const resendDelaySeconds = resolveResendDelaySeconds();

  const secret = getWhatsappJwtSecret();
  if (!secret) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  const otp = generateNumericOtp();
  const hash = hashOtp(otp, secret, phone);

  const requestRecord = createWhatsappAuthRequest({
    phone,
    hash,
    ttlSeconds,
    resendDelaySeconds,
  });

  try {
    const delivery = await sendWhatsAppOtp({ phone, code: otp });
    if (!delivery.ok) {
      deleteWhatsappAuthRequest(requestRecord.id);
      await persistWhatsappDelivery({
        requestId: requestRecord.id,
        phone,
        status: 'failed',
        errorCode: delivery.error,
      });
      return NextResponse.json(
        {
          error: 'whatsapp_delivery_failed',
          detail: delivery.error,
        },
        { status: 502 },
      );
    }

    await persistWhatsappDelivery({
      requestId: requestRecord.id,
      phone,
      status: delivery.status,
      responseId: delivery.responseId ?? null,
    });
  } catch (error) {
    deleteWhatsappAuthRequest(requestRecord.id);
    await persistWhatsappDelivery({
      requestId: requestRecord.id,
      phone,
      status: 'failed',
      errorCode: error instanceof Error ? error.message : 'unexpected_error',
    });
    throw error;
  }

  const { expiresInSeconds, resendAfterSeconds } = getWhatsappAuthRequestCountdowns(requestRecord);

  return NextResponse.json({
    data: {
      requestId: requestRecord.id,
      expiresIn: expiresInSeconds,
      resendAfter: resendAfterSeconds,
    },
  });
}
