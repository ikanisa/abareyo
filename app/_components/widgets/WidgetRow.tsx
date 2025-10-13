"use client";

import type { ReactNode } from "react";

type WidgetRowProps = {
  children: ReactNode;
};

export const WidgetRow = ({ children }: WidgetRowProps) => (
  <div className="h-scroll flex items-stretch gap-3 pb-1">{children}</div>
);
