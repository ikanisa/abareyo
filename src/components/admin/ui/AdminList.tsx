import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type AdminListItem = {
  title: string;
  description?: string;
  meta?: ReactNode;
};

type AdminListProps = {
  items: AdminListItem[];
};

export const AdminList = ({ items }: AdminListProps) => (
  <Card className="border-slate-800 bg-slate-900 text-slate-100">
    <CardContent className="divide-y divide-slate-800 p-0">
      {items.map((item, index) => (
        <div key={index} className="space-y-1 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-50">{item.title}</p>
            {item.meta ? <span className="text-xs text-slate-400">{item.meta}</span> : null}
          </div>
          {item.description ? <p className="text-xs text-slate-400">{item.description}</p> : null}
          {index < items.length - 1 ? <Separator className="bg-slate-800" /> : null}
        </div>
      ))}
    </CardContent>
  </Card>
);

export default AdminList;
