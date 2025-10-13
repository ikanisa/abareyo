"use client";

import type { Badge } from "@/app/_data/community";

const BadgeCard = ({ icon, label, description }: Badge) => (
  <article className="glass flex flex-col gap-2 rounded-2xl border border-white/25 bg-white/10 p-4 text-white">
    <span className="text-3xl" aria-hidden>
      {icon}
    </span>
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wide">{label}</h4>
      <p className="text-xs text-white/70">{description}</p>
    </div>
  </article>
);

export default BadgeCard;
