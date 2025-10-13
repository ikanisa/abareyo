"use client";

import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  desc?: string;
  action?: ReactNode;
};

export const EmptyState = ({ title, desc, action }: EmptyStateProps) => (
  <div className="card break-words whitespace-normal text-center">
    <div className="text-white/90 font-semibold">{title}</div>
    {desc ? <p className="muted mt-1 text-sm">{desc}</p> : null}
    {action ? <div className="mt-3">{action}</div> : null}
  </div>
);
