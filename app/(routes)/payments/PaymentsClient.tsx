"use client";

import { Suspense, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { PullToRefreshHint } from "@/app/_components/shell/PullToRefreshHint";
import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { SmsPermissionCard } from "@/components/sms-permission-card";
import {
  MobileMoneyPaymentHistory,
  MobileMoneyPaymentHistorySkeleton,
} from "@/components/mobile-money-payment-history";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { refreshPayments } from "@/lib/api/payments";

export default function PaymentsPage() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const queryClient = useQueryClient();
  const handleRefresh = useCallback(() => refreshPayments(queryClient), [queryClient]);

  return (
    <PageShell
      header={
        <div className="space-y-3">
          <PullToRefreshHint onRefresh={handleRefresh} />
          <SubpageHeader
            title="Mobile Money"
            eyebrow="Payments & reconciliation"
            description="Review detected SMS transactions, allocate them to orders, and keep your balances synced."
          />
        </div>
      }
      mainClassName="space-y-6"
    >
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="settings">SMS Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Suspense fallback={<MobileMoneyPaymentHistorySkeleton />}>
            <MobileMoneyPaymentHistory onRefresh={() => handleRefresh()} />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SmsPermissionCard
            onPermissionGranted={() => setPermissionGranted(true)}
            onPermissionDenied={() => setPermissionGranted(false)}
          />

          {permissionGranted && (
            <div className="rounded-lg border border-white/15 bg-white/10 p-4 text-white">
              <h3 className="font-semibold">SMS Detection Active</h3>
              <p className="mt-1 text-sm text-white/80">
                The app will automatically detect mobile money payment SMS messages and allocate them to your pending orders.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
