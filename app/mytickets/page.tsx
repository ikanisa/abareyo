"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import TicketHero from "@/app/_components/tickets/TicketHero";
import TicketWalletCard, { type TicketRecord } from "@/app/_components/tickets/TicketWalletCard";
import EmptyState from "@/app/_components/ui/EmptyState";
import { jsonFetch } from "@/app/_lib/api";

const tabs = [
  { id: "upcoming", label: "Upcoming" },
  { id: "my-tickets", label: "My Tickets", panelId: "wallet-panel" },
  { id: "past", label: "Past Games" },
];

type ApiTicket = TicketRecord & {
  match: TicketRecord["match"];
};

const MyTicketsPage = () => {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await jsonFetch<ApiTicket[]>("/api/tickets");
        if (!mounted) return;
        if (!Array.isArray(data)) {
          setTickets([]);
        } else {
          setTickets(
            data.map((ticket) => ({
              id: ticket.id,
              zone: ticket.zone,
              price: ticket.price,
              paid: ticket.paid,
              momo_ref: ticket.momo_ref,
              created_at: ticket.created_at,
              match: ticket.match,
            })),
          );
        }
        setError(null);
      } catch (error) {
        console.error("Failed to load tickets", error);
        if (!mounted) return;
        setError(error instanceof Error ? error.message : "Unable to fetch tickets");
        setTickets([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleTabChange = (tabId: string) => {
    if (tabId === "my-tickets") {
      return;
    }
    if (tabId === "upcoming") {
      router.push("/tickets");
      return;
    }
    if (tabId === "past") {
      router.push("/tickets?tab=past");
    }
  };

  const orderedTickets = useMemo(() => tickets, [tickets]);

  return (
    <main className="min-h-screen bg-rs-gradient pb-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
        <TicketHero activeTab="my-tickets" onTabChange={handleTabChange} tabs={tabs} />
        <section
          id="wallet-panel"
          className="space-y-4"
          role="tabpanel"
          tabIndex={0}
          aria-labelledby="my-tickets-tab wallet-heading"
        >
          <header className="space-y-1">
            <h2 id="wallet-heading" className="section-title">
              My match passes
            </h2>
            <p className="text-xs text-white/70">Show these passes at the gate. Status updates automatically.</p>
          </header>
          {loading ? (
            <div className="space-y-4" role="status" aria-live="polite">
              <div className="h-40 animate-pulse rounded-3xl bg-white/10" />
              <div className="h-40 animate-pulse rounded-3xl bg-white/10" />
            </div>
          ) : orderedTickets.length === 0 ? (
            <EmptyState
              title="No tickets yet"
              description="Buy a ticket to your next Rayon Sports match and it will appear here, ready for offline access."
              icon="🎫"
              action={{ label: "Browse matches", href: "/tickets" }}
            />
          ) : (
            <div className="space-y-4" role="list">
              {orderedTickets.map((ticket, index) => (
                <TicketWalletCard key={ticket.id} ticket={ticket} animationDelay={index * 0.08} />
              ))}
            </div>
          )}
          {error ? (
            <p className="text-xs text-amber-200" role="status" aria-live="polite">
              {error}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
};

export default MyTicketsPage;
