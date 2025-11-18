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
  <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-5 text-left text-slate-100" role="status" aria-live="polite">
    <div className="flex items-start gap-3">
      {icon ? <span aria-hidden="true" className="text-xl text-slate-300">{icon}</span> : null}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-50">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
        {action ? (
          action.href ? (
            <Link className="text-sm font-semibold text-slate-100 underline" href={action.href} aria-label={action.label}>
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button
              type="button"
              className="text-sm font-semibold text-slate-100 underline"
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
