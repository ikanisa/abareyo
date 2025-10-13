"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const tiles = [
  { icon: "🛡️", label: "Insurance", href: "/services#insurance", description: "Get matchday perks" },
  { icon: "🏦", label: "SACCO Deposit", href: "/services#sacco", description: "Earn double fan points" },
  { icon: "💳", label: "Bank Offers", href: "/services#bank", description: "Unlock partner promos" },
] as const;

const PartnerTiles = () => {
  const router = useRouter();

  return (
    <div className="grid grid-cols-3 gap-3" role="list">
      {tiles.map((tile) => (
        <motion.button
          key={tile.href}
          type="button"
          role="listitem"
          whileTap={{ scale: 0.96 }}
          whileHover={{ translateY: -2 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="tile flex-col gap-1 text-center text-sm font-semibold leading-tight"
          onClick={() => router.push(tile.href)}
          aria-label={`${tile.label} — ${tile.description}`}
        >
          <span className="text-lg" aria-hidden>
            {tile.icon}
          </span>
          <span className="block text-xs text-white/80">{tile.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default PartnerTiles;
