"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Command as CommandIcon,
  MailSearch,
  Menu,
  Sparkles,
  Workflow,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { hasAnyPermission } from "@/config/admin-rbac";
import {
  ADMIN_NAVIGATION_ITEMS,
  ADMIN_QUICK_ACTIONS,
  findAdminNavigationItem,
  type AdminNavigationGroupKey,
  type AdminNavigationItem,
} from "@/config/admin-navigation";
import { AdminToastViewport } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAdminFeatureFlags } from "@/providers/admin-feature-flags-provider";
import { useAdminSession } from "@/providers/admin-session-provider";

const NAV_LABELS: Record<AdminNavigationGroupKey, string> = {
  operations: "Operations",
  growth: "Growth",
  communications: "Communications",
  governance: "Governance",
};

type AdminLayoutProps = {
  environment?: string;
  children: ReactNode;
};

type CommandEntry = {
  id: string;
  label: string;
  description?: string;
  href: string;
  badge?: string;
};

const NAV_ITEM_STYLES =
  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-slate-800/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500";

const AdminCommandPalette = ({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  onNavigate: (href: string) => void;
}) => {
  const { permissions } = useAdminSession();
  const { isEnabled } = useAdminFeatureFlags();

  const smsCommands: CommandEntry[] = [
    {
      id: "sms-review",
      label: "Open SMS review queue",
      description: "Inspect inbound messages and parser results.",
      href: "/admin/sms",
    },
    {
      id: "sms-prompts",
      label: "Adjust parser prompts",
      description: "Tweak the active prompt and run quick tests.",
      href: "/admin/sms#parser-prompts",
    },
  ];

  const realtimeCommands: CommandEntry[] = [
    {
      id: "realtime-stream",
      label: "Realtime control room",
      description: "View live signals and channel health.",
      href: "/admin/realtime",
    },
    {
      id: "realtime-incidents",
      label: "Filter realtime incidents",
      description: "Jump to incident view with filters applied.",
      href: "/admin/realtime?focus=incidents",
    },
  ];

  const quickActions = useMemo(
    () =>
      ADMIN_QUICK_ACTIONS.filter(
        (action) =>
          action.modules.every((module) => isEnabled(module)) &&
          (!action.permissions || hasAnyPermission(permissions, action.permissions)),
      ).map<CommandEntry>((action) => ({
        id: action.id,
        label: action.label,
        description: action.description,
        href: action.href,
        badge: action.badge?.label,
      })),
    [permissions, isEnabled],
  );

  const handleSelect = (href: string) => {
    onNavigate(href);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to SMS, realtime filters, or quick actions…" />
      <CommandList>
        <CommandEmpty>No matches found</CommandEmpty>
        <CommandGroup heading="SMS review">
          {smsCommands.map((command) => (
            <CommandItem key={command.id} value={command.label} onSelect={() => handleSelect(command.href)}>
              <MailSearch className="mr-2 h-4 w-4" />
              <div className="flex flex-col text-sm">
                <span className="font-medium">{command.label}</span>
                <span className="text-xs text-slate-400">{command.description}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Realtime filters">
          {realtimeCommands.map((command) => (
            <CommandItem key={command.id} value={command.label} onSelect={() => handleSelect(command.href)}>
              <Workflow className="mr-2 h-4 w-4" />
              <div className="flex flex-col text-sm">
                <span className="font-medium">{command.label}</span>
                <span className="text-xs text-slate-400">{command.description}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick actions">
          {quickActions.map((command) => (
            <CommandItem key={command.id} value={command.label} onSelect={() => handleSelect(command.href)}>
              <Sparkles className="mr-2 h-4 w-4" />
              <div className="flex flex-col text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{command.label}</span>
                  {command.badge ? (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-200">
                      {command.badge}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-slate-400">{command.description}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

const AdminNav = ({ activeItem, onNavigate }: { activeItem?: AdminNavigationItem; onNavigate?: () => void }) => {
  const { permissions } = useAdminSession();
  const { isEnabled } = useAdminFeatureFlags();

  const itemsByGroup = useMemo(() => {
    const availableItems = ADMIN_NAVIGATION_ITEMS.filter(
      (item) =>
        item.modules.every((module) => isEnabled(module)) &&
        (!item.permissions || hasAnyPermission(permissions, item.permissions)),
    );

    return availableItems.reduce<Record<AdminNavigationGroupKey, AdminNavigationItem[]>>(
      (acc, item) => {
        const current = acc[item.group] ?? [];
        current.push(item);
        acc[item.group] = current;
        return acc;
      },
      {
        operations: [],
        growth: [],
        communications: [],
        governance: [],
      },
    );
  }, [permissions, isEnabled]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">Admin console</p>
        <p className="text-xs text-slate-400">Operations, comms, and supporter tooling.</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-6 pr-2">
          {(Object.keys(NAV_LABELS) as AdminNavigationGroupKey[]).map((groupKey) => {
            const items = itemsByGroup[groupKey];
            if (!items?.length) return null;

            return (
              <div key={groupKey} className="space-y-2">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {NAV_LABELS[groupKey]}
                </p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive = activeItem?.key === item.key;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          NAV_ITEM_STYLES,
                          isActive ? "bg-slate-800/80 text-white" : "text-slate-200 hover:text-white",
                        )}
                      >
                        <span className="text-sm font-medium">{item.fallback}</span>
                        {item.badge ? (
                          <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-200">
                            {item.badge.label}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export const AdminLayout = ({ children, environment = "dev" }: AdminLayoutProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAdminSession();
  const activeItem = findAdminNavigationItem(pathname ?? "");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const handleNavigate = (href: string) => {
    router.push(href);
    setIsNavOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="hidden w-[280px] flex-shrink-0 border-r border-slate-800/80 bg-slate-950/80 px-5 py-8 backdrop-blur lg:block">
          <AdminNav activeItem={activeItem} />
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 text-sm backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Button size="icon" variant="ghost" className="lg:hidden" onClick={() => setIsNavOpen(true)}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <BadgeCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-medium uppercase tracking-wide text-slate-100">{environment}</span>
                <Separator orientation="vertical" className="h-4 bg-slate-700" />
                <span className="hidden text-xs text-slate-400 sm:inline">{activeItem?.fallback ?? "Dashboard"}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                onClick={() => setIsCommandOpen(true)}
              >
                <CommandIcon className="mr-2 h-4 w-4" />
                Command palette
              </Button>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-semibold text-white">{user?.displayName ?? user?.email ?? "Admin"}</span>
                <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-200">Online</span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl space-y-6 text-slate-50">{children}</div>
          </main>
        </div>
      </div>

      <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
        <SheetContent side="left" className="w-[280px] bg-slate-950 p-0 text-slate-100 sm:w-[320px]">
          <SheetHeader className="px-6 py-4 text-left">
            <SheetTitle className="text-base font-semibold text-white">Navigation</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-6">
            <AdminNav activeItem={activeItem} onNavigate={() => setIsNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <AdminCommandPalette open={isCommandOpen} onOpenChange={setIsCommandOpen} onNavigate={handleNavigate} />
      <AdminToastViewport />
    </div>
  );
};

export default AdminLayout;
