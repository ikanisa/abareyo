import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    href: string;
  };
}

const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => (
  <div className="card border border-dashed border-white/20 bg-white/5 text-left text-white/80">
    <div className="flex items-start gap-3">
      {icon ? <span aria-hidden="true" className="text-xl">{icon}</span> : null}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/70">{description}</p>
        {action ? (
          <Link className="text-sm font-semibold text-white/80 underline" href={action.href}>
            {action.label}
          </Link>
        ) : null}
      </div>
    </div>
  </div>
);

export default EmptyState;
