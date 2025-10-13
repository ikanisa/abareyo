"use client";

import { motion } from "framer-motion";

const ServiceHero = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.21, 0.84, 0.38, 0.99] }}
      className="card relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent" aria-hidden />
      <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          {subtitle ? <p className="muted max-w-xl text-sm md:text-base">{subtitle}</p> : null}
        </div>
        <span className="chip">Official Partners</span>
      </div>
    </motion.section>
  );
};

export default ServiceHero;
