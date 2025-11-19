import type { QueryClient } from "@tanstack/react-query";

export type MobileMoneyPaymentStatus = "pending" | "allocated" | "failed" | "manual";

export type MobileMoneyPayment = {
  id: string;
  amount: number;
  currency: string;
  ref: string | null;
  status: MobileMoneyPaymentStatus;
  allocated_to: string | null;
  allocated_id: string | null;
  allocated_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentHistoryData = {
  payments: MobileMoneyPayment[];
  counts: {
    total: number;
    pending: number;
    allocated: number;
    failed: number;
    manual: number;
  };
};

export type AllocatePaymentInput = {
  paymentId: string;
  allocatedTo?: string;
};

export const MOBILE_MONEY_PAYMENTS_QUERY_KEY = ["payments", "mobile-money"] as const;

const withSimulatedDelay = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });

export const fetchMobileMoneyPayments = async (): Promise<PaymentHistoryData> => {
  const response = await fetch("/api/payments/mobile-money", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to fetch mobile money payments");
  }

  return response.json();
};

export const markPaymentAllocated = async ({ paymentId, allocatedTo }: AllocatePaymentInput) => {
  await withSimulatedDelay(400);

  try {
    await fetch(`/api/payments/mobile-money/${paymentId}/allocate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ allocatedTo }),
    });
  } catch {
    // Non-blocking: we still rely on query invalidation to reconcile against the API.
  }

  return { paymentId, allocatedTo: allocatedTo ?? "shop_order" };
};

export const refreshPayments = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: MOBILE_MONEY_PAYMENTS_QUERY_KEY });

export const applyOptimisticPaymentAllocation = (
  data: PaymentHistoryData | undefined,
  paymentId: string,
  allocatedTo: string,
): PaymentHistoryData | undefined => {
  if (!data) {
    return data;
  }

  const payments = data.payments.map((payment) =>
    payment.id === paymentId
      ? {
          ...payment,
          status: "allocated" as const,
          allocated_to: allocatedTo,
          allocated_at: new Date().toISOString(),
        }
      : payment,
  );

  const counts = {
    ...data.counts,
    allocated: payments.filter((payment) => payment.status === "allocated").length,
    pending: payments.filter((payment) => payment.status === "pending").length,
  };

  return { payments, counts };
};
