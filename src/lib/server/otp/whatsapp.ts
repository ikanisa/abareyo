import { createHash } from "node:crypto";

const API_BASE = "https://graph.facebook.com/v19.0";

export type WhatsAppSendOutcome =
  | { ok: true; status: "sent" | "mocked"; responseId?: string | null }
  | { ok: false; error: string };

type SendWhatsAppParams = {
  phone: string;
  code: string;
  locale?: string | null;
};

const buildBody = ({ phone, code, locale }: SendWhatsAppParams) => {
  const language = locale && locale.trim().length > 0 ? locale.trim() : "en";
  return {
    messaging_product: "whatsapp",
    to: phone,
    type: "template",
    template: {
      name: process.env.WHATSAPP_OTP_TEMPLATE ?? "otp_verification",
      language: { code: language },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: code },
          ],
        },
      ],
    },
  } satisfies Record<string, unknown>;
};

export const sendWhatsAppOtp = async (params: SendWhatsAppParams): Promise<WhatsAppSendOutcome> => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (!token || !phoneNumberId) {
    return { ok: true, status: "mocked" };
  }

  try {
    const response = await fetch(`${API_BASE}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildBody(params)),
    });

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, error: detail || `HTTP ${response.status}` };
    }

    const payload = (await response.json().catch(() => null)) as
      | { messages?: Array<{ id?: string }> }
      | null;
    const responseId = payload?.messages?.[0]?.id ?? null;
    return { ok: true, status: "sent", responseId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};

export const hashPhoneForTelemetry = (phone: string) =>
  createHash("sha256").update(phone).digest("hex").slice(0, 16);
