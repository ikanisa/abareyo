"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import TicketHero from "@/app/_components/tickets/TicketHero";
import TicketWalletCard from "@/app/_components/tickets/TicketWalletCard";
import EmptyState from "@/app/_components/ui/EmptyState";
import type { Fixture, Order, TicketZone } from "@/app/_data/fixtures";
import { fixtures as defaultFixtures, orders as defaultOrders } from "@/app/_data/fixtures";

const DEFAULT_USER_ID = "11111111-1111-1111-1111-111111111111";

const MyTicketsPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [walletTickets, setWalletTickets] = useState(
    () =>
      defaultOrders.map((order) => {
        const fixture = defaultFixtures.find((item) => item.id === order.fixtureId);
        const zone = fixture?.zones.find((item) => item.id === order.zoneId);
        return { order, fixture: fixture ?? defaultFixtures[0], zone };
      }),
  );

  useEffect(() => {
    let isMounted = true;
    const loadOrders = async () => {
      try {
        const response = await fetch(`/api/tickets/orders?userId=${DEFAULT_USER_ID}`);
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const body = (await response.json()) as {
          data?: {
            id: string;
            status: string;
            total: number;
            createdAt: string;
            match: {
              id: string;
              opponent: string;
              venue: string | null;
              kickoff: string | null;
              competition?: string | null;
            } | null;
            items: { id: string; zone: string; quantity: number; price: number }[];
          }[];
        };
        if (!Array.isArray(body.data)) {
          throw new Error("Invalid orders payload");
        }
        if (!isMounted) return;
        const mapZoneName = (zone: string): TicketZone["name"] => {
          switch (zone) {
            case "VIP":
              return "VIP";
            case "Regular":
              return "Regular";
            default:
              return "Fan";
          }
        };

        const mapped = body.data.map((order) => {
          const kickoff = order.match?.kickoff ? new Date(order.match.kickoff) : null;
          const fixture: Fixture = {
            id: order.match?.id ?? order.id,
            title: order.match?.opponent ?? "Upcoming match",
            comp: order.match?.competition ?? "",
            date: kickoff
              ? kickoff.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })
              : "TBD",
            time: kickoff
              ? kickoff.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
              : "",
            venue: order.match?.venue ?? "TBD",
            zones: order.items.map((item) => ({
              id: `${order.id}-${item.id}`,
              name: mapZoneName(item.zone),
              price: item.price,
              seatsLeft: 0,
              totalSeats: item.quantity,
            })),
            status: order.status === 'paid' ? 'upcoming' : order.status === 'cancelled' ? 'completed' : 'upcoming',
            heroImage: "/tickets/default-match.svg",
          };
          const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);
          const zone = fixture.zones[0];
          const statusMap: Record<string, "pending" | "paid" | "used" | "cancelled"> = {
            pending: "pending",
            paid: "paid",
            cancelled: "cancelled",
            expired: "cancelled",
          };
          const orderSummary: Order = {
            id: order.id,
            fixtureId: fixture.id,
            zoneId: zone?.id ?? `${order.id}-zone`,
            qty: totalQty,
            total: order.total,
            status: statusMap[order.status] ?? 'pending',
            qrCode:
              statusMap[order.status] === 'paid'
                ? '/tickets/qr-active.svg'
                : statusMap[order.status] === 'cancelled'
                ? '/tickets/qr-cancelled.svg'
                : '/tickets/qr-pending.svg',
          };
          return { order: orderSummary, fixture, zone };
        });
        setWalletTickets(mapped);
      } catch (error) {
        console.warn('Failed to load ticket orders', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);
  const tabs = [
    { id: "upcoming", label: "Upcoming" },
    { id: "my-tickets", label: "My Tickets", panelId: "wallet-panel" },
    { id: "past", label: "Past Games" },
  ];

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
          {isLoading ? (
            <EmptyState
              title="Loading tickets"
              description="Pulling your passes from the Supabase backend."
              icon="⏳"
            />
          ) : walletTickets.length === 0 ? (
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
