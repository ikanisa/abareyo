import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => (
  <div className="card break-words whitespace-normal border border-dashed border-white/20 bg-white/5 text-left text-white/80" role="status" aria-live="polite">
    <div className="flex items-start gap-3">
      {icon ? <span aria-hidden="true" className="text-xl">{icon}</span> : null}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-sm text-white/70">{description}</p>
        {action ? (
          action.href ? (
            <Link className="text-sm font-semibold text-white/80 underline" href={action.href} aria-label={action.label}>
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button
              type="button"
              className="text-sm font-semibold text-white/80 underline"
              onClick={action.onClick}
              aria-label={action.label}
            >
              {action.label}
            </button>
          ) : null
        ) : null}
      </div>
    </div>
  </div>
);

export default EmptyState;
