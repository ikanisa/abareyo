'use client';

import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
  header?: ReactNode;
};

const MotionMain = motion.main;

export default function PageShell({ children, className, mainClassName, header }: PageShellProps) {
  const reduceMotion = useReducedMotion();
  const paddingStyle = { paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" };

  return (
    <div className={clsx("min-h-screen bg-rs-gradient text-white", className)} style={paddingStyle}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {header ? (
          <div className="sticky top-0 z-30 -mx-1 pb-2 pt-4 sm:-mx-2 lg:-mx-3">
            {header}
          </div>
        ) : null}
        <MotionMain
          initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { duration: 0.28, ease: "easeOut" }}
          className={clsx("flex w-full flex-col gap-6 pb-12 pt-4", mainClassName)}
        >
          {children}
        </MotionMain>
      </div>
    </div>
  );
}
