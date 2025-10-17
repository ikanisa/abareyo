'use client';

import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
};

const MotionMain = motion.main;

export default function PageShell({ children, className, mainClassName }: PageShellProps) {
  const reduceMotion = useReducedMotion();
  const paddingStyle = { paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" };

  return (
    <div className={clsx("min-h-screen bg-rs-gradient text-white", className)} style={paddingStyle}>
      <MotionMain
        initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        transition={reduceMotion ? undefined : { duration: 0.28, ease: "easeOut" }}
        className={clsx(
          "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-12 pt-4 sm:px-6 lg:px-8",
          mainClassName,
        )}
      >
        {children}
      </MotionMain>
    </div>
  );
}
