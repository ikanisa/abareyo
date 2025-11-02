import type { ReactNode } from "react";

const AuthLayout = ({ children }: { children: ReactNode }) => (
  <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16">
    <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/40 bg-card/80 p-8 shadow-xl shadow-black/20">
      {children}
    </div>
  </div>
);

export default AuthLayout;
