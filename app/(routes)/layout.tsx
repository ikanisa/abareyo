import { ReactNode } from "react";

import { BottomNav } from "@/components/layout/BottomNav";

const RoutesLayout = ({ children }: { children: ReactNode }) => (
  <div className="relative flex min-h-screen flex-col pb-24 pb-safe">
    <main className="flex-1 pb-6">{children}</main>
    <BottomNav />
  </div>
);

export default RoutesLayout;
