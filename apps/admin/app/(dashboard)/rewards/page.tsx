import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rayon/ui";

import { ensureSegmentAccess } from "@/auth/guard";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { fetchRewards } from "@/data/client";
import { RewardsTable } from "@/features/rewards/table";

const RewardsView = async () => {
  await ensureSegmentAccess("rewards");
  const { data, error, source } = await fetchRewards();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rewards and loyalty</CardTitle>
        <CardDescription>Audit member redemptions and manage fulfilment workflows.</CardDescription>
      </CardHeader>
      <CardContent>
        <RewardsTable data={data} error={error} source={source} />
      </CardContent>
    </Card>
  );
};

const RewardsPage = async () => (
  <Suspense fallback={<DataTableSkeleton columns={5} rows={8} />}>
    {/* @ts-expect-error Async Server Component */}
    <RewardsView />
  </Suspense>
);

export default RewardsPage;
