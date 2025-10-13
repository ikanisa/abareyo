"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { Fixture, Order, TicketZone } from "@/app/_data/fixtures";

type TicketWalletCardProps = {
  fixture: Fixture;
  order: Order;
  zone: TicketZone | undefined;
  animationDelay?: number;
};

const statusStyles: Record<Order["status"], string> = {
  pending: "bg-amber-500/15 text-amber-100",
  paid: "bg-emerald-500/15 text-emerald-100",
  used: "bg-blue-500/15 text-blue-100",
  cancelled: "bg-red-500/15 text-red-100",
};

const statusLabels: Record<Order["status"], string> = {
  pending: "SMS confirmation pending",
  paid: "Active",
  used: "Used",
  cancelled: "Cancelled",
};

const TicketWalletCard = ({ fixture, order, zone, animationDelay }: TicketWalletCardProps) => {
  const [shareError, setShareError] = useState<string | null>(null);

  const handleShare = useCallback(async () => {
    setShareError(null);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Rayon Sports ticket - ${fixture.title}`,
          text: `Zone ${zone?.name ?? ""} · ${order.qty} seat(s) on ${fixture.date}`,
          url: window.location.href,
        });
      } catch (error) {
        setShareError("Share cancelled");
      }
    } else {
      setShareError("Sharing not supported on this device");
    }
  }, [fixture.date, fixture.title, order.qty, zone?.name]);

  const isFreeTicket = order.total === 0;

  return (
    <article
      className="card space-y-5 bg-white/5 text-white animate-ticket-wallet"
      role="listitem"
      style={animationDelay ? { animationDelay: `${animationDelay}s` } : undefined}
      data-ticket-free={isFreeTicket ? "1" : undefined}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-white/60">{fixture.comp}</p>
          <h2 className="text-xl font-semibold leading-snug">{fixture.title}</h2>
          <p className="text-sm text-white/70">
            {fixture.date} · {fixture.time} · {fixture.venue}
          </p>
          {zone ? (
            <p className="text-sm font-semibold text-white">Zone {zone.name} · {order.qty} seat(s)</p>
          ) : null}
        </div>
        <span className={`chip ${statusStyles[order.status]}`}>
          {statusLabels[order.status]}
          {isFreeTicket ? <span className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs">Perk</span> : null}
        </span>
      </header>
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="flex h-40 w-full max-w-[180px] items-center justify-center overflow-hidden rounded-3xl bg-black/40">
          <Image
            alt="Ticket QR code"
            src={order.qrCode}
            width={160}
            height={160}
            className="rounded-2xl"
          />
        </div>
        <div className="flex flex-1 flex-col justify-between gap-4">
          <div className="grid gap-2 text-sm text-white/75">
            <div className="flex items-center justify-between">
              <span>Order ID</span>
              <span className="font-semibold text-white">{order.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="font-semibold text-white">{statusLabels[order.status]}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{isFreeTicket ? "Perk value" : "Total paid"}</span>
              <span className="font-semibold text-white">{order.total.toLocaleString()} RWF</span>
            </div>
            {order.momoRef ? (
              <div className="flex items-center justify-between">
                <span>Reference</span>
                <span className="font-semibold text-white">{order.momoRef}</span>
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="btn inline-flex h-12 items-center justify-center"
            >
              Share ticket
            </button>
            <Link href="/wallet" className="btn-primary inline-flex h-12 items-center justify-center">
              Add to Wallet
            </Link>
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
