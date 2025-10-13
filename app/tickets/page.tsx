"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CheckoutCard from "@/app/_components/tickets/CheckoutCard";
import FixtureCard from "@/app/_components/tickets/FixtureCard";
import TicketHero from "@/app/_components/tickets/TicketHero";
import ZoneSheet from "@/app/_components/tickets/ZoneSheet";
import EmptyState from "@/app/_components/ui/EmptyState";
import type { Fixture, TicketZone } from "@/app/_data/fixtures";
import { fixtures as defaultFixtures } from "@/app/_data/fixtures";

const randomId = () => `fixture-${Math.random().toString(36).slice(2, 10)}`;

const TicketsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fixtures, setFixtures] = useState<Fixture[]>(defaultFixtures);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [selectedZone, setSelectedZone] = useState<TicketZone | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadMatches = async () => {
      try {
        const response = await fetch("/api/matches");
        if (!response.ok) {
          throw new Error(await response.text());
        }
        const body = (await response.json()) as { data?: any[] };
        if (!Array.isArray(body.data)) {
          throw new Error("Invalid matches payload");
        }
        if (!isMounted) return;
        const mapped: Fixture[] = body.data.map((match) => {
          const kickoff = new Date(match.date ?? match.kickoff ?? Date.now());
          const readableDate = kickoff.toLocaleDateString(undefined, {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const readableTime = kickoff.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
          const zones: TicketZone[] = (Array.isArray(match.zones) ? match.zones : []).map((zone: any) => ({
            id: zone.id ?? `${match.id}-${zone.zone}`,
            name: zone.zone === "Blue" ? "Fan" : zone.name ?? zone.zone ?? "Zone",
            price: typeof zone.price === "number" ? zone.price : 0,
            seatsLeft: Math.max(Number(zone.seatsLeft ?? zone.remaining ?? 0), 0),
            totalSeats: Math.max(Number(zone.totalSeats ?? zone.capacity ?? 0), 0),
          }));
          const status = match.status === "ft" ? "completed" : match.status === "live" ? "upcoming" : match.status ?? "upcoming";
          return {
            id: match.id ?? randomId(),
            title:
              match.title ??
              [match.home_team ?? "Rayon Sports", match.away_team ?? "Opposition"].filter(Boolean).join(" vs "),
            comp: match.comp ?? "", 
            date: readableDate,
            time: readableTime,
            venue: match.venue ?? "TBD",
            zones,
            status: zones.every((zone) => zone.seatsLeft === 0) ? "soldout" : status,
            heroImage: "/tickets/default-match.svg",
          } satisfies Fixture;
        });
        setFixtures(mapped.length > 0 ? mapped : defaultFixtures);
      } catch (error) {
        console.warn("Failed to load matches", error);
        if (isMounted) {
          setFixtures(defaultFixtures);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadMatches();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const requestedTab = searchParams?.get("tab");
    if (requestedTab === "past") {
      setActiveTab("past");
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("claimed") === "1") {
      alert("🎉 Free BLUE ticket added to your tickets!");
      const el = document.querySelector("[data-ticket-free='1']");
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      window.history.replaceState(null, "", "/tickets");
    }
  }, [searchParams]);

  const filteredFixtures = useMemo(() => {
    if (activeTab === "upcoming") {
      return fixtures.filter((fixture) => fixture.status === "upcoming");
    }
    if (activeTab === "past") {
      return fixtures.filter((fixture) => fixture.status === "completed");
    }
    return fixtures;
  }, [activeTab, fixtures]);

  const handleTabChange = (tabId: string) => {
    if (tabId === "my-tickets") {
      router.push("/mytickets");
      return;
    }
    setActiveTab(tabId);
  };

  const handleFixtureSelect = (fixture: Fixture) => {
    setSelectedFixture(fixture);
    setSelectedZone(null);
    setIsSheetOpen(true);
  };

  const handleZoneSelect = (zone: TicketZone) => {
    setSelectedZone(zone);
    setIsSheetOpen(false);
    const checkoutAnchor = document.getElementById("checkout-panel");
    if (checkoutAnchor) {
      checkoutAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const tabs = [
    { id: "upcoming", label: "Upcoming", panelId: "fixtures-panel" },
    { id: "my-tickets", label: "My Tickets" },
    { id: "past", label: "Past Games", panelId: "fixtures-panel" },
  ];

  return (
    <main className="min-h-screen bg-rs-gradient pb-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8">
        <TicketHero activeTab={activeTab} onTabChange={handleTabChange} tabs={tabs} />
        <section
          id="fixtures-panel"
          className="space-y-4"
          role="tabpanel"
          tabIndex={0}
          aria-describedby="fixtures-instructions"
          aria-labelledby={`${activeTab}-tab fixtures-heading`}
        >
          <div className="flex items-center justify-between">
            <h2 id="fixtures-heading" className="section-title">
              {activeTab === "past" ? "Past fixtures" : "Upcoming fixtures"}
            </h2>
            <p id="fixtures-instructions" className="text-xs text-white/70">
              Tap a match card to choose your zone.
            </p>
          </div>
          {loading ? (
            <EmptyState
              title="Loading fixtures"
              description="Fetching the latest fixtures from Supabase."
              icon="⏳"
            />
          ) : filteredFixtures.length === 0 ? (
            <EmptyState
              title="No fixtures to show"
              description="We will update this space as soon as new fixtures are confirmed."
              icon="🎟️"
            />
          ) : (
            <div className="h-scroll flex gap-4" role="list">
              {filteredFixtures.map((fixture) => (
                <FixtureCard key={fixture.id} fixture={fixture} onSelect={handleFixtureSelect} />
              ))}
            </div>
          )}
        </section>
        <section aria-live="polite" aria-atomic="true" role="region" aria-label="Checkout summary">
          {selectedFixture && selectedZone ? (
            <CheckoutCard fixture={selectedFixture} zone={selectedZone} />
          ) : (
            <div className="card space-y-3 bg-white/5 text-white/80">
              <h3 className="text-base font-semibold text-white">Your selection</h3>
              <p className="text-sm text-white/70">
                Choose a match and seating zone to load the USSD checkout.
              </p>
            </div>
          )}
        </section>
      </div>
      <ZoneSheet
        fixture={selectedFixture}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onZoneSelect={handleZoneSelect}
      />
    </main>
  );
};

export default TicketsPage;
