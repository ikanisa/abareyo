'use client';

import { useState } from 'react';
import { SmsPermissionCard } from '@/components/sms-permission-card';
import { MobileMoneyPaymentHistory } from '@/components/mobile-money-payment-history';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PaymentsPage() {
  const [permissionGranted, setPermissionGranted] = useState(false);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mobile Money Payments</h1>
        <p className="text-muted-foreground mt-2">
          Manage your mobile money payments and SMS detection
        </p>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Payment History</TabsTrigger>
          <TabsTrigger value="settings">SMS Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <MobileMoneyPaymentHistory />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SmsPermissionCard
            onPermissionGranted={() => setPermissionGranted(true)}
            onPermissionDenied={() => setPermissionGranted(false)}
          />

          {permissionGranted && (
            <div className="rounded-lg border p-4 bg-green-50 dark:bg-green-950">
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                SMS Detection Active
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                The app will now automatically detect mobile money payment SMS messages
                and allocate them to your pending orders.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
