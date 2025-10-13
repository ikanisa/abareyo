"use client";

import { useMemo } from "react";
import { useSyncExternalStore } from "react";

import { SACCO_LIST, formatRWF, getServicesSnapshot, subscribeServices } from "@/app/_data/services";

const useServicesHistory = () =>
  useSyncExternalStore(subscribeServices, getServicesSnapshot, getServicesSnapshot);

const HistoryList = () => {
  const { policies, deposits, quotes } = useServicesHistory();
  const saccoLookup = useMemo(
    () =>
      SACCO_LIST.reduce<Record<string, string>>((accumulator, sacco) => {
        accumulator[sacco.id] = sacco.branch ? `${sacco.name} • ${sacco.branch}` : sacco.name;
        return accumulator;
      }, {}),
    [],
  );
  const latestPolicyNumber = useMemo(() => policies.at(-1)?.number, [policies]);
  const latestQuoteStatus = useMemo(() => quotes.at(-1)?.status, [quotes]);

  return (
    <section className="space-y-3" aria-label="My Services history">
      <h2 className="section-title">My Services</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="card space-y-2" aria-live="polite">
          <div className="text-white/90 font-medium">Policies</div>
          {policies.length === 0 ? (
            <p className="muted text-sm">No policies yet. Generate a quote to get started.</p>
          ) : (
            <ul className="space-y-2">
              {policies.map((policy) => {
                const perkState = policy.ticketPerkIssued;
                const perkLabel =
                  perkState === undefined ? "No ticket perk" : perkState ? "Ticket sent" : "Ticket pending";
                const perkClass =
                  perkState === undefined
                    ? "rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70"
                    : perkState
                      ? "rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white"
                      : "rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-100";

                return (
                  <li key={policy.id} className="flex items-start justify-between gap-3 text-sm text-white/80">
                    <div className="space-y-1">
                      <p className="font-semibold text-white">{policy.number}</p>
                      <p className="text-xs text-white/60">Valid {policy.validFrom} → {policy.validTo}</p>
                    </div>
                    <span className={perkClass}>{perkLabel}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card space-y-2" aria-live="polite">
          <div className="text-white/90 font-medium">Deposits</div>
          {deposits.length === 0 ? (
            <p className="muted text-sm">No deposits yet. Lock in double fan points today.</p>
          ) : (
            <ul className="space-y-2">
              {deposits.map((deposit) => (
                <li key={deposit.id} className="flex flex-col gap-1 rounded-2xl bg-white/5 p-3 text-sm text-white/80">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{new Date(deposit.at).toLocaleString()}</span>
                    <span className="uppercase tracking-wide">{deposit.status}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{formatRWF(deposit.amount)}</span>
                    <span className="text-xs text-emerald-200">+{deposit.pointsEarned} fan pts</span>
                  </div>
                  <span className="text-xs text-white/60">{saccoLookup[deposit.saccoId] ?? deposit.saccoId}</span>
                  {deposit.ref ? (
                    <span className="text-xs text-white/50">Ref {deposit.ref}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card space-y-2" aria-live="polite">
          <div className="text-white/90 font-medium">Quotes</div>
          {quotes.length === 0 ? (
            <p className="muted text-sm">No saved quotes yet. Generate one above to view ticket perks.</p>
          ) : (
            <ul className="space-y-2">
              {quotes.map((quote) => {
                const statusClass =
                  quote.status === "issued"
                    ? "bg-emerald-500/20 text-emerald-100"
                    : quote.status === "paid"
                      ? "bg-blue-500/20 text-blue-100"
                      : "bg-white/10 text-white/70";

                return (
                  <li key={quote.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-3 text-sm text-white/80">
                    <div className="space-y-1">
                      <p className="font-semibold text-white">{formatRWF(quote.premium)}</p>
                      <p className="text-xs text-white/60">
                        {quote.motoType.toUpperCase()} • {quote.periodMonths} months
                      </p>
                      <p className="text-xs text-white/60">Plate {quote.plate || "—"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}>
                      {quote.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="card text-sm text-white/70" role="note">
        {latestPolicyNumber ? (
          <p>
            Latest policy {latestPolicyNumber}. Ticket status: {
              (() => {
                const latestPolicy = policies.at(-1);
                if (!latestPolicy) {
                  return "n/a";
                }
                if (latestPolicy.ticketPerkIssued === undefined) {
                  return "not included";
                }
                return latestPolicy.ticketPerkIssued ? "issued" : "pending";
              })()
            }. Quote status: {latestQuoteStatus ?? "n/a"}.
          </p>
        ) : (
          <p>No partner activity recorded yet. Start with an insurance quote or SACCO deposit above.</p>
        )}
      </div>
    </section>
  );
};

export default HistoryList;
