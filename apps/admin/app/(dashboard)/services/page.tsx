import { Suspense } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rayon/ui";

import { ensureSegmentAccess } from "@/auth/guard";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { fetchServices } from "@/data/client";
import { ServicesTable } from "@/features/services/table";

const ServicesView = async () => {
  await ensureSegmentAccess("services");
  const { data, error, source } = await fetchServices();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member services</CardTitle>
        <CardDescription>Coordinate membership perks, hospitality upgrades, and fan services.</CardDescription>
      </CardHeader>
      <CardContent>
        <ServicesTable data={data} error={error} source={source} />
      </CardContent>
    </Card>
  );
};

const ServicesPage = async () => (
  <Suspense fallback={<DataTableSkeleton columns={5} rows={8} />}>
    {/* @ts-expect-error Async Server Component */}
    <ServicesView />
  </Suspense>
);

export default ServicesPage;
