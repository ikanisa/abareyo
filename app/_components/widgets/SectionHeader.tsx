"use client";

import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  action?: ReactNode;
  id?: string;
};

export const SectionHeader = ({ title, action, id }: SectionHeaderProps) => (
  <div className="flex items-center justify-between gap-3">
    <h2 id={id} className="section-title">
      {title}
    </h2>
    {action}
  </div>
);
