import { serverEnv } from '@/config/env';

const DEFAULT_BASE_URL = 'https://graph.facebook.com/v21.0';

type SendWhatsappOtpInput = {
  phone: string;
  otp: string;
};

type WhatsappErrorOptions = {
  status?: number;
  detail?: unknown;
  cause?: unknown;
};

export class WhatsappRecoverableError extends Error {
  status?: number;
  detail?: unknown;

  constructor(message: string, { status, detail, cause }: WhatsappErrorOptions = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = 'WhatsappRecoverableError';
    this.status = status;
    this.detail = detail;
  }
}

const resolveBaseUrl = (): string => {
  const base = serverEnv.META_WABA_BASE_URL?.trim() || DEFAULT_BASE_URL;
  return base.replace(/\/$/, '');
};

export const sendWhatsappOTP = async ({ phone, otp }: SendWhatsappOtpInput): Promise<void> => {
  const phoneNumberId = serverEnv.META_WABA_PHONE_NUMBER_ID?.trim();
  const accessToken = serverEnv.META_WABA_ACCESS_TOKEN?.trim();
  const templateName = serverEnv.OTP_TEMPLATE_NAME?.trim();
  const languageCode = serverEnv.OTP_TEMPLATE_LANGUAGE?.trim();

  if (!phoneNumberId || !accessToken || !templateName || !languageCode) {
    throw new Error('whatsapp_configuration_missing');
  }

  const url = `${resolveBaseUrl()}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: otp,
            },
          ],
        },
      ],
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw new WhatsappRecoverableError('whatsapp_network_error', { cause: error });
  }

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      try {
        detail = await response.text();
      } catch {
        detail = null;
      }
    }
    throw new WhatsappRecoverableError('whatsapp_send_failed', {
      status: response.status,
      detail,
    });
  }
};
