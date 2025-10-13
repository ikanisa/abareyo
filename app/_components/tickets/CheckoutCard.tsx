"use client";

import { useMemo, useState } from "react";

import type { Fixture, TicketZone } from "@/app/_data/fixtures";
import { fanProfile } from "@/app/_data/fanProfile";

type CheckoutCardProps = {
  fixture: Fixture;
  zone: TicketZone;
  reservation:
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "success"; ticket: { id: string; paid: boolean; momo_ref: string | null; created_at: string } };
  onRetry?: () => void;
};

const paymentMethods = [
  { id: "mtn", label: "MTN MoMo", deeplink: "tel:*182*8*1%23" },
  { id: "airtel", label: "Airtel Money", deeplink: "tel:*182*8*2%23" },
];

const CheckoutCard = ({ fixture, zone, reservation, onRetry }: CheckoutCardProps) => {
  const [waiting, setWaiting] = useState(false);
  const [reference, setReference] = useState("");

  const summary = useMemo(
    () => ({
      title: fixture.title,
      subtitle: `${fixture.date} · ${fixture.time}`,
      venue: fixture.venue,
      zone: zone.name,
      total: zone.price,
    }),
    [fixture, zone]
  );

  const reservationBanner = (() => {
    switch (reservation.status) {
      case "loading":
        return (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 text-sm text-blue-100" role="status">
            <span className="flex h-3 w-3 animate-ping rounded-full bg-blue-300" aria-hidden />
            <span>Reserving your seat… hold tight while we secure this ticket.</span>
          </div>
        );
      case "error":
        return (
          <div className="flex flex-col gap-3 rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
            <span>{reservation.message}</span>
            {onRetry ? (
              <button
                type="button"
                className="self-start rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                onClick={onRetry}
              >
                Try again
              </button>
            ) : null}
          </div>
        );
      case "success":
        return (
          <div className="flex flex-col gap-1 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100" role="status">
            <span className="text-sm font-semibold">Reservation confirmed</span>
            <span>Ticket ID: {reservation.ticket.id.slice(0, 8).toUpperCase()} · Status: {reservation.ticket.paid ? "Paid" : "Awaiting payment"}</span>
            {reservation.ticket.momo_ref ? (
              <span className="text-xs text-emerald-100/80">Mobile money ref: {reservation.ticket.momo_ref}</span>
            ) : null}
          </div>
        );
      default:
        return null;
    }
  })();

  return (
    <section
      aria-live="polite"
      aria-busy={waiting}
      id="checkout-panel"
      className="card break-words whitespace-normal break-words whitespace-normal space-y-6 bg-white/5 text-white"
      role="status"
    >
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Checkout</p>
        <h2 className="text-2xl font-semibold">Confirm and Pay</h2>
      </header>
      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
        <div className="flex items-center justify-between">
          <span className="text-white/70">Match</span>
          <span className="text-right font-semibold text-white">{summary.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/70">Schedule</span>
          <span className="text-right text-white">{summary.subtitle}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/70">Venue</span>
          <span className="text-right text-white">{summary.venue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/70">Zone</span>
          <span className="text-right font-semibold text-white">{summary.zone}</span>
        </div>
        <div className="flex items-center justify-between text-base font-semibold text-white">
          <span>Total</span>
          <span>{summary.total.toLocaleString()} RWF</span>
        </div>
      </div>
      <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
        <div className="flex items-center justify-between">
          <span className="text-white/70">Fan</span>
          <span className="text-right font-semibold text-white">{fanProfile.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/70">Rayon ID</span>
          <span className="text-right text-white">{fanProfile.id}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/70">Contact</span>
          <span className="text-right text-white">{fanProfile.phone}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/70">Membership</span>
          <span className="text-right text-white">{fanProfile.membership}</span>
        </div>
      </div>
      {reservationBanner}

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Pay with Mobile Money</p>
        <div className="grid gap-3 md:grid-cols-2">
          {paymentMethods.map((method) => (
            <a
              key={method.id}
              href={method.deeplink}
              onClick={() => setWaiting(true)}
              className="flex min-h-[52px] items-center justify-between rounded-2xl bg-white/15 px-5 text-sm font-semibold transition hover:bg-white/25"
            >
              <span>{method.label}</span>
              <span aria-hidden>→</span>
            </a>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-white" htmlFor="payment-reference">
          Enter payment reference (optional)
        </label>
        <input
          id="payment-reference"
          name="payment-reference"
          value={reference}
          onChange={(event) => setReference(event.target.value)}
          placeholder="e.g. MOMO-123456"
          className="w-full rounded-2xl border border-white/20 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/60"
        />
      </div>
      {waiting ? (
        <div className="flex items-center gap-4 rounded-2xl border border-blue-400/40 bg-gradient-to-r from-blue-500/20 via-blue-400/25 to-blue-500/20 px-4 py-3 text-sm text-blue-100" role="status">
          <div
            className="h-10 w-10 rounded-full bg-[linear-gradient(135deg,rgba(0,51,255,0.8),rgba(0,161,222,0.6),rgba(32,96,61,0.5))] bg-[length:200%_200%] animate-ticket-waiting"
            aria-hidden
          />
          <div>
            <p className="font-semibold">SMS confirmation pending</p>
            <p className="text-xs text-white/70">Complete the USSD flow and enter your reference when the SMS arrives so we can activate your ticket instantly.</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-white/60">
          After dialing the USSD code, return here to enter the confirmation reference once your SMS confirmation arrives.
        </p>
      )}
    </section>
  );
};

export default CheckoutCard;
