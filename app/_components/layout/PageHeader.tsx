import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";

export const PageHeader = ({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) => (
  <header className="space-y-3">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Control Center</p>
        <div>
          <h1 className="text-2xl font-bold text-slate-50">{title}</h1>
          {description ? <p className="text-sm text-slate-400">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex flex-shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
    <Separator className="bg-slate-800" />
  </header>
);

export default PageHeader;
