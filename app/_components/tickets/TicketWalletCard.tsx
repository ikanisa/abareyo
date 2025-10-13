"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";

import type { TicketZone } from "@/app/_data/fixtures";

export type TicketRecord = {
  id: string;
  zone: TicketZone["name"] | string;
  price: number;
  paid: boolean;
  momo_ref: string | null;
  created_at: string;
  match?: {
    id: string;
    title: string;
    comp: string | null;
    date: string;
    venue: string | null;
  } | null;
};

type TicketWalletCardProps = {
  ticket: TicketRecord;
  animationDelay?: number;
};

const statusMap = {
  paid: {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-100",
    qr: "/tickets/qr-active.svg",
  },
  pending: {
    label: "SMS confirmation pending",
    className: "bg-amber-500/15 text-amber-100",
    qr: "/tickets/qr-pending.svg",
  },
} as const;

const formatSchedule = (dateValue?: string | null) => {
  if (!dateValue) return { date: "TBC", time: "" };
  try {
    const date = new Date(dateValue);
    return {
      date: date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch {
    return { date: dateValue, time: "" };
  }
};

const TicketWalletCard = ({ ticket, animationDelay }: TicketWalletCardProps) => {
  const [shareError, setShareError] = useState<string | null>(null);
  const status = ticket.paid ? statusMap.paid : statusMap.pending;
  const schedule = useMemo(() => formatSchedule(ticket.match?.date), [ticket.match?.date]);

  const handleShare = useCallback(async () => {
    setShareError(null);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rayon Sports ticket - ${ticket.match?.title ?? "Match"}`,
          text: `Zone ${ticket.zone} · ${schedule.date} ${schedule.time}`,
          url: window.location.href,
        });
      } catch (error) {
        setShareError((error as Error)?.message ?? "Share cancelled");
      }
    } else {
      setShareError("Sharing not supported on this device");
    }
  }, [schedule.date, schedule.time, ticket.match?.title, ticket.zone]);

  const isFreeTicket = ticket.price === 0;

  return (
    <article
      className="card break-words whitespace-normal space-y-5 bg-white/5 text-white animate-ticket-wallet"
      role="listitem"
      style={animationDelay ? { animationDelay: `${animationDelay}s` } : undefined}
      data-ticket-free={isFreeTicket ? "1" : undefined}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">
            {ticket.match?.comp ?? "Rayon Sports"}
          </p>
          <h2 className="text-xl font-semibold leading-snug">
            {ticket.match?.title ?? "Match ticket"}
          </h2>
          <p className="text-sm text-white/70">
            {schedule.date} · {schedule.time} · {ticket.match?.venue ?? "TBC"}
          </p>
          <p className="text-sm font-semibold text-white">Zone {ticket.zone} · 1 seat</p>
        </div>

        <span className={`chip ${status.className}`}>
          {status.label}
          {isFreeTicket ? (
            <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs">Perk</span>
          ) : null}
        </span>
      </header>

      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex h-40 w-full max-w-[180px] items-center justify-center overflow-hidden rounded-3xl bg-black/40">
          <Image alt="Ticket QR code" src={status.qr} width={160} height={160} className="rounded-2xl" />
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="grid gap-2 text-sm text-white/75">
            <div className="flex items-center justify-between">
              <span>Ticket ID</span>
              <span className="font-semibold text-white">{ticket.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="font-semibold text-white">{status.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{isFreeTicket ? "Perk value" : "Total paid"}</span>
              <span className="font-semibold text-white">{ticket.price.toLocaleString()} RWF</span>
            </div>

            {ticket.momo_ref ? (
              <div className="flex items-center justify-between">
                <span>MoMo ref</span>
                <span className="font-semibold text-white">{ticket.momo_ref}</span>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleShare} className="btn inline-flex h-12 items-center justify-center">
              Share ticket
            </button>
            <button type="button" className="btn-primary inline-flex h-12 items-center justify-center">
              Add to Wallet
            </button>
          </div>

          {shareError ? (
            <p className="text-xs text-amber-200" role="status" aria-live="polite">
              {shareError}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default TicketWalletCard;
