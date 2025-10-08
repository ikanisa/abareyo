import { ReactNode } from "react";
import { BottomNav } from "@/components/layout/BottomNav";

const RoutesLayout = ({ children }: { children: ReactNode }) => (
  <div className="relative min-h-screen pb-24">
    {children}
    <BottomNav />
  </div>
);

export default RoutesLayout;
