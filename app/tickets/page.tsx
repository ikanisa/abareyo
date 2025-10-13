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
import { fanProfile } from "@/app/_data/fanProfile";
import { jsonFetch } from "@/app/_lib/api";

const randomId = () => `fixture-${Math.random().toString(36).slice(2, 10)}`;

type ApiMatchZone = {
  id?: string | null;
  zone?: string | null;
  name?: string | null;
  price?: number | null;
  seatsLeft?: number | null;
  remaining?: number | null;
  totalSeats?: number | null;
  capacity?: number | null;
};

type ApiMatch = {
  id?: string | null;
  title?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  comp?: string | null;
  date?: string | null;
  kickoff?: string | null;
  venue?: string | null;
  status?: "upcoming" | "live" | "ft" | null;
  zones?: ApiMatchZone[] | null;
};

type ReservationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; ticket: { id: string; paid: boolean; momo_ref: string | null; created_at: string } }
  | { status: "error"; message: string };

const fallbackFixtures = defaultFixtures;

const toTicketZoneName = (value: string | null | undefined): TicketZone["name"] => {
  if (!value) return "Fan";
  const normalised = value.toLowerCase();
  if (normalised.includes("vip")) return "VIP";
  if (normalised.includes("regular")) return "Regular";
  if (normalised.includes("blue")) return "Fan";
  return "Fan";
};

const buildFixtureFromMatch = (match: ApiMatch): Fixture => {
  const kickoffSource = match.date ?? match.kickoff ?? new Date().toISOString();
  const kickoff = new Date(kickoffSource);
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
  const zones: TicketZone[] = (Array.isArray(match.zones) ? match.zones : []).map((zone) => ({
    id: zone.id ?? `${match.id ?? randomId()}-${(zone.zone ?? "zone").toLowerCase()}`,
    name: toTicketZoneName(zone.name ?? zone.zone),
    price: typeof zone.price === "number" ? zone.price : 0,
    seatsLeft: Math.max(Number(zone.seatsLeft ?? zone.remaining ?? 0), 0),
    totalSeats: Math.max(Number(zone.totalSeats ?? zone.capacity ?? 0), 0),
  }));
  const status = match.status === "ft" ? "completed" : match.status === "live" ? "upcoming" : "upcoming";
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
};

const normaliseZoneName = (zone: TicketZone["name"]): "VIP" | "Regular" | "Blue" =>
  zone === "Fan" ? "Blue" : zone;

const TicketsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fixtures, setFixtures] = useState<Fixture[]>(defaultFixtures);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [selectedZone, setSelectedZone] = useState<TicketZone | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<ReservationState>({ status: "idle" });

  useEffect(() => {
    let isMounted = true;
    const loadMatches = async () => {
      try {
        // Fetch ticketing fixtures from the dedicated tickets endpoint.
        const response = await fetch("/api/matches/tickets");
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
    if (searchParams?.get("claimed") === "1") {
      alert("🎉 Free BLUE ticket added to your tickets!");
      const el = document.querySelector("[data-ticket-free='1']");
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      window.history.replaceState(null, "", "/tickets");
    }
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await jsonFetch<ApiMatch[]>("/api/matches");
        if (!mounted) return;
        if (!Array.isArray(data) || data.length === 0) {
          setFixtures(fallbackFixtures);
          setLoadError(null);
          return;
        }
        setFixtures(data.map(buildFixtureFromMatch));
        setLoadError(null);
      } catch (error) {
        console.error("Failed to load matches", error);
        if (!mounted) return;
        setLoadError(error instanceof Error ? error.message : "Unable to load fixtures");
        setFixtures(fallbackFixtures);
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

  useEffect(() => {
    setReservation({ status: "idle" });
  }, [selectedFixture?.id]);

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

  const scrollToCheckout = () => {
    const checkoutAnchor = document.getElementById("checkout-panel");
    if (checkoutAnchor) {
      checkoutAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const reserveTicket = async (fixture: Fixture, zone: TicketZone) => {
    setReservation({ status: "loading" });
    try {
      const response = await jsonFetch<{
        ok: boolean;
        ticket: { id: string; paid: boolean; momo_ref: string | null; created_at: string };
      }>("/api/tickets", {
        method: "POST",
        body: JSON.stringify({
          match_id: fixture.id,
          zone: normaliseZoneName(zone.name),
          price: zone.price,
          user: {
            name: fanProfile.name,
            phone: fanProfile.phone,
            momo_number: fanProfile.momo ?? fanProfile.phone,
          },
        }),
      });
      setReservation({ status: "success", ticket: response.ticket });
    } catch (error) {
      setReservation({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to reserve ticket",
      });
    }
  };

  const handleFixtureSelect = (fixture: Fixture) => {
    setSelectedFixture(fixture);
    setSelectedZone(null);
    setIsSheetOpen(true);
  };

  const handleZoneSelect = (zone: TicketZone) => {
    setSelectedZone(zone);
    setIsSheetOpen(false);
    scrollToCheckout();
    if (selectedFixture) {
      reserveTicket(selectedFixture, zone);
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
          {loadError ? (
            <p className="text-xs text-amber-200" role="status" aria-live="polite">
              {loadError}. Showing cached fixtures.
            </p>
          ) : null}
        </section>
        <section aria-live="polite" aria-atomic="true" role="region" aria-label="Checkout summary">
          {selectedFixture && selectedZone ? (
            <CheckoutCard
              fixture={selectedFixture}
              zone={selectedZone}
              reservation={reservation}
              onRetry={() => selectedFixture && selectedZone && reserveTicket(selectedFixture, selectedZone)}
            />
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
