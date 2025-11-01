type RecordTicketPendingPaymentInput = {
  ticketOrderId: string;
  paymentId?: string | null;
  amount: number;
  channel?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  ussdCode?: string | null;
  expiresAt?: string | null;
  userId?: string | null;
};

export const recordTicketPendingPayment = async (
  payload: RecordTicketPendingPaymentInput,
): Promise<boolean> => {
  try {
    const response = await fetch("/api/payments/pending", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      try {
        const errorBody = (await response.json()) as { error?: string };
        if (errorBody?.error) {
          console.warn("[payments] failed to sync pending payment", errorBody.error);
        } else {
          console.warn("[payments] failed to sync pending payment", response.statusText);
        }
      } catch {
        console.warn("[payments] failed to sync pending payment", response.statusText);
      }
      return false;
    }

    const data = (await response.json().catch(() => null)) as { ok?: boolean; skipped?: boolean } | null;
    if (data?.skipped) {
      return false;
    }

    return Boolean(data?.ok);
  } catch (error) {
    console.warn("[payments] error syncing pending payment", error);
    return false;
  }
};
