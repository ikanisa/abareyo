import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rayon/ui";

import { ensureSegmentAccess } from "@/auth/guard";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { fetchCommunityPosts } from "@/data/client";
import { CommunityTable } from "@/features/community/table";

const CommunityView = async () => {
  await ensureSegmentAccess("community");
  const { data, error, source } = await fetchCommunityPosts();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community insights</CardTitle>
        <CardDescription>Moderate fan sentiment and escalate risky conversations.</CardDescription>
      </CardHeader>
      <CardContent>
        <CommunityTable data={data} error={error} source={source} />
      </CardContent>
    </Card>
  );
};

const CommunityPage = async () => (
  <Suspense fallback={<DataTableSkeleton columns={5} rows={8} />}>
    {/* @ts-expect-error Async Server Component */}
    <CommunityView />
  </Suspense>
);

export default CommunityPage;
