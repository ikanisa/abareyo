"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Wallet2 } from "lucide-react";

import type { Wallet } from "@/app/_data/more";

const currencyFormatter = new Intl.NumberFormat("en-RW", {
  style: "currency",
  currency: "RWF",
  maximumFractionDigits: 0,
});

export type WalletWidgetProps = {
  wallet: Wallet;
  onAddMoney?: () => void;
};

export function WalletWidget({ wallet, onAddMoney }: WalletWidgetProps) {
  const prefersReducedMotion = useReducedMotion();
  const router = useRouter();
  const handleAddMoney = () => {
    if (onAddMoney) {
      onAddMoney();
      return;
    }
    router.push("/wallet/top-up");
  };

  return (
    <motion.section
      className="card break-words whitespace-normal flex h-full flex-col justify-between gap-4 bg-white/10 text-white"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      aria-labelledby="wallet-balance-heading"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="rounded-2xl bg-white/20 p-3">
          <Wallet2 className="h-6 w-6" aria-hidden />
        </div>
        <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
          Updated {new Date(wallet.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </header>
      <div>
        <p className="text-sm text-white/70">Wallet balance</p>
        <p id="wallet-balance-heading" className="text-3xl font-semibold">
          {currencyFormatter.format(wallet.balance)}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleAddMoney}
          className="btn-primary flex-1 rounded-2xl px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          Add money
        </button>
        <Link
          href="/wallet/history"
          className="btn inline-flex items-center gap-1 rounded-2xl px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label="View wallet history"
        >
          History <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </motion.section>
  );
}
