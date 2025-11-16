"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export type AdminShellProps = {
  user: {
    displayName: string;
    email: string;
    roles: string[];
  };
  environment?: string;
  children: ReactNode;
  featureFlags?: unknown;
  secondaryPanel?: ReactNode;
};

const NavLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-900 hover:text-slate-50"
  >
    {label}
  </Link>
);

export const AdminShell = ({ user, environment, children, secondaryPanel }: AdminShellProps) => (
  <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 bg-slate-950/80 px-4 py-4 md:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Admin</p>
          <p className="text-lg font-bold">Operations workspace</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <Badge variant="secondary" className="bg-slate-800 text-slate-100">
              {environment ?? "Unknown env"}
            </Badge>
            <span>{user.displayName}</span>
            <span className="text-slate-600">•</span>
            <span>{user.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" className="bg-slate-800 text-slate-100 hover:bg-slate-700">
            Invite
          </Button>
          <Button size="sm">New report</Button>
        </div>
      </div>
      <div className="mx-auto mt-4 flex w-full max-w-6xl flex-wrap gap-2">
        <NavLink href="/" label="Dashboard" />
        <NavLink href="/users" label="Users" />
        <NavLink href="/audit" label="Audit" />
        <NavLink href="/settings" label="Settings" />
      </div>
    </header>

    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardContent className="space-y-6 pt-6">{children}</CardContent>
        </Card>
        {secondaryPanel ? (
          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm font-semibold text-slate-50">Secondary</p>
              <Separator className="bg-slate-800" />
              {secondaryPanel}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  </div>
);

export default AdminShell;
