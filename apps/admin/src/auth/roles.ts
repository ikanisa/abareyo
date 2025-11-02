import type { Session } from "@supabase/supabase-js";

export type Role =
  | "admin"
  | "support"
  | "commerce"
  | "community"
  | "rewards"
  | "analyst";

export type RoleGuard = {
  segment: string;
  label: string;
  href: string;
  description?: string;
  icon: string;
  roles: Role[];
};

const NAV_ITEMS: RoleGuard[] = [
  {
    segment: "",
    label: "Overview",
    href: "/",
    icon: "layout-dashboard",
    roles: ["admin", "support", "commerce", "community", "rewards", "analyst"],
  },
  {
    segment: "tickets",
    label: "Tickets",
    href: "/tickets",
    icon: "ticket",
    roles: ["admin", "support", "analyst"],
  },
  {
    segment: "shop",
    label: "Shop",
    href: "/shop",
    icon: "shopping-bag",
    roles: ["admin", "commerce", "analyst"],
  },
  {
    segment: "services",
    label: "Services",
    href: "/services",
    icon: "workflow",
    roles: ["admin", "support", "analyst"],
  },
  {
    segment: "community",
    label: "Community",
    href: "/community",
    icon: "users",
    roles: ["admin", "community", "analyst"],
  },
  {
    segment: "rewards",
    label: "Rewards",
    href: "/rewards",
    icon: "gift",
    roles: ["admin", "rewards", "analyst"],
  },
];

export const getUserRoles = (session: Session | null): Role[] => {
  if (!session) {
    return [];
  }

  const rawRoles =
    (session.user.app_metadata?.roles as string[] | undefined) ??
    (session.user.app_metadata?.role ? [session.user.app_metadata.role as string] : undefined) ??
    (session.user.user_metadata?.roles as string[] | undefined);

  return (rawRoles ?? []).map((role) => role.toLowerCase() as Role).filter(Boolean);
};

export const getNavigation = (roles: Role[]) =>
  NAV_ITEMS.filter((item) => item.roles.some((role) => roles.includes(role)));

export const canAccessSegment = (roles: Role[], segment: string) => {
  const normalized = segment.replace(/^\//, "");
  const match = NAV_ITEMS.find((item) => item.segment === normalized);
  if (!match) {
    return roles.includes("admin");
  }
  return match.roles.some((role) => roles.includes(role));
};
