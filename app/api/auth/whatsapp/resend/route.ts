import { NextResponse } from 'next/server';

import { generateNumericOtp, hashOtp } from '@/lib/otp';
import { sendWhatsAppOtp } from '@/lib/server/otp/whatsapp';
import {
  applyWhatsappAuthResend,
  getWhatsappAuthRequestCountdowns,
  loadWhatsappAuthRequest,
} from '@/lib/server/whatsapp-auth/store';
import { persistWhatsappDelivery } from '@/lib/server/whatsapp-auth/persistence';
import { getWhatsappJwtSecret, resolveOtpTtlSeconds, resolveResendDelaySeconds } from '@/lib/server/whatsapp-auth/config';

type ResendPayload = {
  requestId?: string;
};

const isCooldownActive = (resendAvailableAt: number) => resendAvailableAt > Date.now();

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ResendPayload | null;
  if (!body || typeof body.requestId !== 'string') {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const { record, expired } = loadWhatsappAuthRequest(body.requestId);
  if (!record) {
    if (expired) {
      return NextResponse.json({ error: 'otp_expired' }, { status: 410 });
    }
    return NextResponse.json({ error: 'otp_not_found' }, { status: 404 });
  }

  if (isCooldownActive(record.resendAvailableAt)) {
    const { resendAfterSeconds } = getWhatsappAuthRequestCountdowns(record);
    return NextResponse.json(
      {
        error: 'resend_not_ready',
        resendAfter: resendAfterSeconds,
      },
      { status: 429 },
    );
  }

  const secret = getWhatsappJwtSecret();
  if (!secret) {
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 });
  }

  const ttlSeconds = resolveOtpTtlSeconds();
  const resendDelaySeconds = resolveResendDelaySeconds();

  const otp = generateNumericOtp();
  const hash = hashOtp(otp, secret, record.phone);

  const delivery = await sendWhatsAppOtp({ phone: record.phone, code: otp });
  if (!delivery.ok) {
    await persistWhatsappDelivery({
      requestId: record.id,
      phone: record.phone,
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

  const updated = applyWhatsappAuthResend({
    requestId: record.id,
    hash,
    ttlSeconds,
    resendDelaySeconds,
  });

  if (!updated) {
    return NextResponse.json({ error: 'otp_not_found' }, { status: 404 });
  }

  await persistWhatsappDelivery({
    requestId: updated.id,
    phone: updated.phone,
    status: delivery.status,
    responseId: delivery.responseId ?? null,
  });

  const { resendAfterSeconds } = getWhatsappAuthRequestCountdowns(updated);

  return NextResponse.json({
    data: {
      resendAfter: resendAfterSeconds,
    },
  });
}
