import { tryGetSupabaseServiceRoleClient } from "@/lib/db";

export type WhatsappDeliveryStatus = "sent" | "mocked" | "failed";

type PersistOptions = {
  requestId: string;
  phone: string;
  status: WhatsappDeliveryStatus;
  responseId?: string | null;
  errorCode?: string | null;
  detail?: unknown;
};

export const persistWhatsappDelivery = async ({
  requestId,
  phone,
  status,
  responseId = null,
  errorCode = null,
  detail = null,
}: PersistOptions): Promise<void> => {
  const supabase = tryGetSupabaseServiceRoleClient();
  if (!supabase) {
    return;
  }

  const payload = {
    request_id: requestId,
    phone,
    status,
    response_id: responseId,
    error_code: errorCode,
    detail,
    delivered_at: new Date().toISOString(),
  } satisfies Record<string, unknown>;

  const { error } = await supabase.from("whatsapp_otp_deliveries").insert(payload);
  if (error) {
    console.warn("[whatsapp-auth] Failed to persist delivery", { error: error.message, requestId, status });
  }
};
