"use client";

import { useEffect } from "react";

type ExternalLauncherProps = {
  href: string;
  title: string;
  description?: string;
  actionLabel?: string;
  delayMs?: number;
};

const DEFAULT_DELAY = 150;

export default function ExternalLauncher({
  href,
  title,
  description,
  actionLabel = "Launch",
  delayMs = DEFAULT_DELAY,
}: ExternalLauncherProps) {
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.href = href;
    }, Math.max(0, delayMs));

    return () => window.clearTimeout(timer);
  }, [delayMs, href]);

  const isHttpLink = /^https?:/i.test(href);

  return (
    <section className="card space-y-3 text-center">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold text-white/90">{title}</h1>
        {description ? (
          <p className="muted text-sm">
            {description}
          </p>
        ) : null}
      </div>
      <a
        className="tile inline-block"
        href={href}
        target={isHttpLink ? "_blank" : undefined}
        rel={isHttpLink ? "noopener noreferrer" : undefined}
      >
        {actionLabel}
      </a>
      <p className="muted text-xs">
        Having trouble? Tap the button above to continue.
      </p>
    </section>
  );
}
