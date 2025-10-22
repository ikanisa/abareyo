"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import TicketHero from "@/app/_components/tickets/TicketHero";
import TicketWalletCard, { type TicketRecord } from "@/app/_components/tickets/TicketWalletCard";
import EmptyState from "@/app/_components/ui/EmptyState";

const tabs = [
  { id: "upcoming", label: "Upcoming" },
  { id: "my-tickets", label: "My Tickets", panelId: "wallet-panel" },
  { id: "past", label: "Past Games" },
];

type MyTicketsClientPageProps = {
  tickets: TicketRecord[];
  error?: string | null;
};

const MyTicketsClientPage = ({ tickets, error }: MyTicketsClientPageProps) => {
  const router = useRouter();

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
          aria-labelledby="my-tickets-tab wallet-heading"
        >
          <header className="space-y-1">
            <h2 id="wallet-heading" className="section-title">
              My match passes
            </h2>
            <p className="text-xs text-white/70">Show these passes at the gate. Status updates automatically.</p>
          </header>
          {orderedTickets.length === 0 ? (
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

export default MyTicketsClientPage;
