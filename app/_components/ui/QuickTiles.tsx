"use client";
import { useRouter } from "next/navigation";
const items = [
  { label: "🎟️ Tickets", href: "/tickets" },
  { label: "⭐ Membership", href: "/membership" },
  { label: "🛍️ Shop", href: "/shop" },
  { label: "💙 Donate", href: "/fundraising" },
];
export default function QuickTiles(){
  const router = useRouter();
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map(it => (
        <button key={it.label} className="tile text-center" onClick={()=>router.push(it.href)}>{it.label}</button>
      ))}
    </div>
  );
}

