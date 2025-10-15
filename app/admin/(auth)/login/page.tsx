import type { Metadata } from "next";

import AdminLoginForm from "@/components/auth/admin-login-form";
import { redirectIfAuthenticated } from "@/lib/auth";

/* eslint-disable-next-line react-refresh/only-export-components */
export const metadata: Metadata = {
  title: "Admin Login",
};

export default async function AdminLoginPage() {
  await redirectIfAuthenticated("/admin");

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12 text-neutral-100">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800/60 bg-neutral-900/70 p-6 shadow-xl backdrop-blur">
        <AdminLoginForm />
      </div>
    </div>
  );
}
