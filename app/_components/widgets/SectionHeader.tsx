"use client";

import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  action?: ReactNode;
};

export const SectionHeader = ({ title, action }: SectionHeaderProps) => (
  <div className="flex items-center justify-between gap-3">
    <h2 className="section-title">{title}</h2>
    {action}
  </div>
);
