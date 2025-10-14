"use client";

import Link from "next/link";

type WalletPass = {
  id: string;
  order_id?: string | null;
  zone?: string | null;
  gate?: string | null;
  state?: string | null; // "active" | "used" | "transferred"
  qr_token_hash?: string | null;
  match?: {
    id?: string;
    opponent?: string;
    kickoff?: string;
  } | null;
};

type WalletPassesProps = {
  items: WalletPass[];
};

const stateLabelMap: Record<string, string> = {
  active: "Active",
  used: "Used",
  transferred: "Transferred",
};

function titleCaseState(state?: string | null) {
  if (!state) return "Active";
  const normalized = state.toLowerCase();
  return stateLabelMap[normalized] ?? state.charAt(0).toUpperCase() + state.slice(1);
}

function formatKickoffDate(kickoff?: string | null) {
  if (!kickoff) return null;
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function WalletPasses({ items }: WalletPassesProps) {
  if (!items.length) {
    return (
      <div className="card text-center">
        <div className="text-white/90 font-semibold">No passes yet</div>
        <a className="btn mt-2" href="/tickets">
          Buy Tickets
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((pass) => {
        const isFree = !pass.order_id;
        const matchLabel = pass.match?.opponent || pass.match?.id || "Match";
        const zone = pass.zone || "Zone";
        const gate = pass.gate || "—";
        const kickoff = formatKickoffDate(pass.match?.kickoff ?? null);
        const hasQr = Boolean(pass.qr_token_hash);
        const stateLabel = titleCaseState(pass.state);
        const orderLabel = isFree ? "Free perk" : pass.order_id ? `Order ${pass.order_id}` : "Issued";

        return (
          <div
            className="card space-y-3"
            key={pass.id}
            data-ticket-free={isFree ? 1 : 0}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-white/90 font-semibold">
                  {matchLabel} — {zone}
                </div>
                <p className="muted text-xs">
                  {kickoff ?? "Kickoff TBC"} · Gate {gate}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span
                  className={`rounded-lg border border-white/20 px-2 py-1 text-[11px] uppercase tracking-wide ${
                    pass.state === "transferred" ? "text-amber-200" : "text-white/80"
                  }`}
                >
                  {stateLabel}
                </span>
                {hasQr ? (
                  <Link
                    className="btn px-3 py-1 text-xs"
                    href={`/mytickets?pass=${encodeURIComponent(pass.id)}`}
                    prefetch={false}
                  >
                    Show QR
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide">
              <span
                className={`rounded-lg bg-white/10 px-2 py-1 ${
                  isFree ? "text-emerald-300" : "text-white/70"
                }`}
              >
                {orderLabel}
              </span>
              <span className="rounded-lg bg-white/10 px-2 py-1 text-white/70">
                {hasQr ? "QR ready" : "Collect at gate"}
              </span>
              {pass.state === "transferred" ? (
                <span className="rounded-lg bg-white/10 px-2 py-1 text-amber-200">
                  Transfer sent
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
