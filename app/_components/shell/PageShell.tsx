"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

const transition = { duration: 0.35, ease: [0.21, 0.84, 0.38, 0.99] } as const;

const PageShell = ({ children }: { children: ReactNode }) => {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-24 pt-6 md:px-6"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 rounded-b-[48px] bg-rs-gradient opacity-70 blur-3xl"
      />
      {children}
    </motion.main>
  );
};

export default PageShell;
