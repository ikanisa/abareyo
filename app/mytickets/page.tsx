"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import TicketHero from "@/app/_components/tickets/TicketHero";
import TicketWalletCard from "@/app/_components/tickets/TicketWalletCard";
import EmptyState from "@/app/_components/ui/EmptyState";
import { fixtures, orders } from "@/app/_data/fixtures";

const MyTicketsPage = () => {
  const router = useRouter();
  const tabs = [
    { id: "upcoming", label: "Upcoming" },
    { id: "my-tickets", label: "My Tickets", panelId: "wallet-panel" },
    { id: "past", label: "Past Games" },
  ];

  const walletTickets = useMemo(
    () =>
      orders.map((order) => {
        const fixture = fixtures.find((item) => item.id === order.fixtureId);
        const zone = fixture?.zones.find((item) => item.id === order.zoneId);
        return { order, fixture, zone };
      }),
    []
  );

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
          {walletTickets.length === 0 ? (
            <EmptyState
              title="No tickets yet"
              description="Buy a ticket to your next Rayon Sports match and it will appear here, ready for offline access."
              icon="🎫"
              action={{ label: "Browse matches", href: "/tickets" }}
            />
          ) : (
            <div className="space-y-4" role="list">
              {walletTickets.map(({ order, fixture, zone }, index) =>
                fixture ? (
                  <TicketWalletCard
                    key={order.id}
                    fixture={fixture}
                    order={order}
                    zone={zone}
                    animationDelay={index * 0.08}
                  />
                ) : null
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default MyTicketsPage;
