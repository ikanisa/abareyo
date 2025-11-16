export type NavigationSurface = "sidebar" | "top";

export type NavigationItem = {
  id: "dashboard" | "users" | "audit" | "settings";
  href: string;
  title: string;
  description?: string;
  icon: "dashboard" | "users" | "activity" | "settings";
  surfaces: NavigationSurface[];
  meta: {
    title: string;
    description?: string;
  };
};

export type AppNavigation = {
  primary: NavigationItem[];
};

export const appNavigation: AppNavigation = {
  primary: [
    {
      id: "dashboard",
      href: "/",
      title: "Dashboard",
      description: "System health, KPIs, and quick actions.",
      icon: "dashboard",
      surfaces: ["sidebar", "top"],
      meta: {
        title: "Control Center",
        description: "Operational overview for the platform.",
      },
    },
    {
      id: "users",
      href: "/users",
      title: "Users",
      description: "Accounts, roles, and access management.",
      icon: "users",
      surfaces: ["sidebar", "top"],
      meta: {
        title: "User Management",
        description: "Manage administrators and customer accounts.",
      },
    },
    {
      id: "audit",
      href: "/audit",
      title: "Audit & Logs",
      description: "Recent changes, alerts, and event history.",
      icon: "activity",
      surfaces: ["sidebar", "top"],
      meta: {
        title: "Audit Log",
        description: "Trace configuration changes and platform events.",
      },
    },
    {
      id: "settings",
      href: "/settings",
      title: "Settings",
      description: "Environment, notifications, and preferences.",
      icon: "settings",
      surfaces: ["sidebar"],
      meta: {
        title: "Settings",
        description: "Tune the control center for your team.",
      },
    },
  ],
};

export const navigationByHref = new Map(appNavigation.primary.map((item) => [item.href, item] as const));

export default appNavigation;
