"use client";

import { Suspense, useCallback, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";

import { PullToRefreshHint } from "@/app/_components/shell/PullToRefreshHint";
import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import HybridPayModal from "@/app/_components/shop/HybridPayModal";
import OrderTracker from "@/app/_components/shop/OrderTracker";
import {
  ORDERS_QUERY_KEY,
  advanceOrderStatus,
  applyOptimisticOrderStatus,
  fetchOrders,
  refreshOrders,
  type OrdersResponse,
} from "@/lib/api/orders";
import { formatCurrency } from "@/app/_data/shop_v2";
import { Skeleton } from "@/components/ui/skeleton";

const OrdersSkeleton = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    {[1, 2].map((item) => (
      <div key={item} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[60%]" />
      </div>
    ))}
  </div>
);

const OrdersContent = () => {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery<OrdersResponse>({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: fetchOrders,
    staleTime: 60_000,
  });
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const advanceMutation = useMutation({
    mutationFn: advanceOrderStatus,
    onMutate: async ({ orderId }) => {
      setPendingOrderId(orderId);
      await queryClient.cancelQueries({ queryKey: ORDERS_QUERY_KEY });
      const previous = queryClient.getQueryData<OrdersResponse>(ORDERS_QUERY_KEY);
      const optimistic = applyOptimisticOrderStatus(previous, orderId);
      queryClient.setQueryData(ORDERS_QUERY_KEY, optimistic);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(ORDERS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      setPendingOrderId(null);
      void refreshOrders(queryClient);
    },
  });

  const handleAdvanceStatus = useCallback((orderId: string) => advanceMutation.mutate({ orderId }), [advanceMutation]);

  const handleRefresh = useCallback(() => refreshOrders(queryClient), [queryClient]);

  const primaryOrder = data.orders[0];

  return (
    <PageShell
      header={
        <div className="space-y-3">
          <PullToRefreshHint onRefresh={handleRefresh} refreshing={advanceMutation.isPending && !!pendingOrderId} />
          <SubpageHeader
            title="Orders"
            eyebrow="Pickup timeline"
            description={`Wallet ${formatCurrency(data.viewer.walletBalance)} · Fan points ${data.viewer.points}`}
          />
        </div>
      }
      mainClassName="space-y-10"
    >
      <OrderTracker orders={data.orders} onAdvanceStatus={handleAdvanceStatus} pendingOrderId={pendingOrderId} />

      <section className="card break-words whitespace-normal break-words whitespace-normal space-y-4">
        <div>
          <h2 className="section-title">Need to complete a payment?</h2>
          <p className="text-sm text-white/70">
            Launch Hybrid Pay and finish outstanding balances with a fresh USSD push.
          </p>
        </div>
        <HybridPayModal
          total={primaryOrder?.total ?? data.viewer.walletBalance / 2}
          walletBalance={data.viewer.walletBalance}
          points={data.viewer.points}
        />
      </section>
    </PageShell>
  );
};

const OrdersClient = () => (
  <Suspense fallback={<OrdersSkeleton />}>
    <OrdersContent />
  </Suspense>
);

export default OrdersClient;
