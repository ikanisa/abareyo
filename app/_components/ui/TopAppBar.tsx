"use client";
import { motion } from "framer-motion";
export default function TopAppBar(){
  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 glass flex items-center justify-between px-4 py-3 backdrop-saturate-150">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-white/90" />
        <span className="text-white font-semibold">Rayon Sports</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="btn">🔔</button>
        <button className="btn">🔍</button>
        <button className="btn">RW/EN</button>
      </div>
    </motion.header>
  );
}

