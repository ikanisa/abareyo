export const NFC_TAP_EVENT = "nfc:tap" as const;
export const NFC_TRANSACTION_EVENT = "nfc:transaction" as const;

const isBrowser = typeof window !== "undefined";

export type NfcTapDetail = {
  token: string;
  method?: "nfc" | "camera" | "manual";
  stewardId?: string | null;
  dryRun?: boolean;
};

export type NfcTransactionDetail = {
  transactionId: string;
  amount?: number;
  userId?: string | null;
  kind?: "ticket" | "shop" | "deposit" | "policy";
  metadata?: Record<string, unknown> | null;
  orderId?: string | null;
  membershipId?: string | null;
  donationId?: string | null;
  source?: "nfc" | "tap" | "camera" | "manual" | string;
};

const dispatchEvent = <T>(eventName: string, detail: T): boolean => {
  if (!isBrowser) {
    return false;
  }
  try {
    window.dispatchEvent(new CustomEvent<T>(eventName, { detail }));
    return true;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[nfc] failed to dispatch ${eventName}`, error);
    }
    return false;
  }
};

export const emitNfcTap = (detail: NfcTapDetail): boolean => dispatchEvent(NFC_TAP_EVENT, detail);

export const emitNfcTransactionPending = (detail: NfcTransactionDetail): boolean =>
  dispatchEvent(NFC_TRANSACTION_EVENT, detail);
