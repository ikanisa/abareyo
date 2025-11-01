"use client";

import clsx from "clsx";
import type { AnchorHTMLAttributes } from "react";

export type SkipNavLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  targetId?: string;
};

const DEFAULT_TARGET_ID = "main-content";

export const SkipNavLink = ({
  children = "Skip to main content",
  targetId = DEFAULT_TARGET_ID,
  className,
  ...props
}: SkipNavLinkProps) => (
  <a href={`#${targetId}`} className={clsx("skip-link", className)} {...props}>
    {children}
  </a>
);

export default SkipNavLink;
