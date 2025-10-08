import { Home, Calendar, Ticket, ShoppingBag, Users, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Calendar, label: "Matches", path: "/matches" },
  { icon: Ticket, label: "Tickets", path: "/tickets" },
  { icon: ShoppingBag, label: "Shop", path: "/shop" },
  { icon: Users, label: "Community", path: "/community" },
  { icon: MoreHorizontal, label: "More", path: "/more" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe">
      <div className="glass-card rounded-t-3xl border-t-2 border-primary/20">
        <div className="grid grid-cols-6 gap-1 px-2 py-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all duration-300",
                  isActive
                    ? "text-primary scale-110"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive && "drop-shadow-glow")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
