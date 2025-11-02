import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rayon/ui";

import { ensureSegmentAccess } from "@/auth/guard";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { fetchOrders } from "@/data/client";
import { ShopOrdersTable } from "@/features/shop/table";

const ShopView = async () => {
  await ensureSegmentAccess("shop");
  const { data, error, source } = await fetchOrders();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop orders</CardTitle>
        <CardDescription>Monitor e-commerce performance and fulfilment queues.</CardDescription>
      </CardHeader>
      <CardContent>
        <ShopOrdersTable data={data} error={error} source={source} />
      </CardContent>
    </Card>
  );
};

const ShopPage = async () => (
  <Suspense fallback={<DataTableSkeleton columns={5} rows={8} />}>
    {/* @ts-expect-error Async Server Component */}
    <ShopView />
  </Suspense>
);

export default ShopPage;
