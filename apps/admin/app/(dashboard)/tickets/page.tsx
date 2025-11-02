import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rayon/ui";

import { ensureSegmentAccess } from "@/auth/guard";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { fetchTickets } from "@/data/client";
import { TicketsTable } from "@/features/tickets/table";

const TicketsView = async () => {
  const { session } = await ensureSegmentAccess("tickets");
  const { data, error, source } = await fetchTickets();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Support tickets</CardTitle>
          <CardDescription>
            Track and triage help desk conversations across web, mobile, USSD, and WhatsApp. Signed in as {session.user.email}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketsTable data={data} error={error} source={source} />
        </CardContent>
      </Card>
    </div>
  );
};

const TicketsPage = async () => (
  <Suspense fallback={<DataTableSkeleton columns={6} rows={8} />}>
    {/* @ts-expect-error Async Server Component */}
    <TicketsView />
  </Suspense>
);

export default TicketsPage;
