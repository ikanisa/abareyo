"use client";

import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

type SubpageHeaderProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  backHref?: string;
  className?: string;
  actions?: ReactNode;
};

export default function SubpageHeader({
  title,
  eyebrow,
  description,
  backHref,
  className,
  actions,
}: SubpageHeaderProps) {
  const router = useRouter();

  const BackButton = ({ label }: { label: string }) => {
    if (backHref) {
      return (
        <Link
          href={backHref}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-xl transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label={label}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
      );
    }

    return (
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-xl transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        aria-label={label}
      >
        <ArrowLeft className="h-5 w-5" aria-hidden />
      </button>
    );
  };

  return (
    <header
      className={clsx(
        "glass flex flex-wrap items-center justify-between gap-4 rounded-3xl px-5 py-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <BackButton label="Go back" />
        <div className="space-y-1 text-white">
          {eyebrow ? (
            <span className="block text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="text-2xl font-semibold leading-tight md:text-3xl">{title}</h1>
          {description ? <p className="text-sm text-white/75 md:text-base">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
