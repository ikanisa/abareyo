"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle, Clock, RefreshCw, XCircle } from "lucide-react";

import { PullToRefreshHint } from "@/app/_components/shell/PullToRefreshHint";
import {
  MOBILE_MONEY_PAYMENTS_QUERY_KEY,
  applyOptimisticPaymentAllocation,
  fetchMobileMoneyPayments,
  markPaymentAllocated,
  refreshPayments,
  type MobileMoneyPayment,
  type PaymentHistoryData,
} from "@/lib/api/payments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type MobileMoneyPaymentHistoryProps = {
  onRefresh?: () => void;
};

export function MobileMoneyPaymentHistory({ onRefresh }: MobileMoneyPaymentHistoryProps = {}) {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const { data } = useSuspenseQuery<PaymentHistoryData>({
    queryKey: MOBILE_MONEY_PAYMENTS_QUERY_KEY,
    queryFn: fetchMobileMoneyPayments,
    staleTime: 45_000,
  });

  const allocationMutation = useMutation({
    mutationFn: markPaymentAllocated,
    onMutate: async ({ paymentId, allocatedTo = "shop_order" }) => {
      await queryClient.cancelQueries({ queryKey: MOBILE_MONEY_PAYMENTS_QUERY_KEY });
      const previous = queryClient.getQueryData<PaymentHistoryData>(MOBILE_MONEY_PAYMENTS_QUERY_KEY);
      const optimistic = applyOptimisticPaymentAllocation(previous, paymentId, allocatedTo);
      queryClient.setQueryData(MOBILE_MONEY_PAYMENTS_QUERY_KEY, optimistic);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(MOBILE_MONEY_PAYMENTS_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      void refreshPayments(queryClient);
    },
  });

  const handleRefresh = () => {
    setRefreshing(true);
    void refreshPayments(queryClient).finally(() => {
      setRefreshing(false);
      onRefresh?.();
    });
  };

  const getStatusIcon = (status: MobileMoneyPayment["status"]) => {
    switch (status) {
      case "allocated":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "manual":
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: MobileMoneyPayment["status"]) => {
    const variants: Record<MobileMoneyPayment["status"], "default" | "secondary" | "destructive" | "outline"> = {
      allocated: "default",
      pending: "secondary",
      failed: "destructive",
      manual: "outline",
    };

    return <Badge variant={variants[status] || "outline"}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  const getAllocatedToLabel = (allocatedTo: string | null) => {
    if (!allocatedTo) return "Unallocated";

    const labels: Record<string, string> = {
      ticket_order: "Ticket Order",
      shop_order: "Shop Order",
      insurance_quote: "Insurance Policy",
      sacco_deposit: "SACCO Deposit",
    };

    return labels[allocatedTo] || allocatedTo;
  };

  const allocationCounts = useMemo(
    () => `${data.counts.total} total payments • ${data.counts.pending} pending`,
    [data.counts.pending, data.counts.total],
  );

  if (!data || data.payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mobile Money Payments</CardTitle>
          <CardDescription>No payments found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your mobile money payment history will appear here once payments are detected.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <PullToRefreshHint onRefresh={handleRefresh} refreshing={refreshing} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Mobile Money Payments</CardTitle>
            <CardDescription>{allocationCounts}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {data.payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">{getStatusIcon(payment.status)}</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {payment.amount.toLocaleString()} {payment.currency}
                  </span>
                  {getStatusBadge(payment.status)}
                </div>

                {payment.ref && (
                  <p className="text-sm text-muted-foreground">
                    Ref: {payment.ref}
                  </p>
                )}

                {payment.allocated_to && (
                  <p className="text-sm text-muted-foreground">
                    → {getAllocatedToLabel(payment.allocated_to)}
                  </p>
                )}

                {payment.error_message && (
                  <p className="text-sm text-red-600">
                    Error: {payment.error_message}
                  </p>
                )}

                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(payment.created_at), {
                    addSuffix: true,
                  })}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="bg-blue-600 text-white hover:bg-blue-500"
                    disabled={allocationMutation.isPending}
                    onClick={() => allocationMutation.mutate({ paymentId: payment.id, allocatedTo: "shop_order" })}
                  >
                    Mark allocated
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white/80 hover:bg-white/10"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    Re-sync
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function MobileMoneyPaymentHistorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mobile Money Payments</CardTitle>
        <CardDescription>Loading payment history...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
