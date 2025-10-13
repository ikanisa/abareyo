"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CheckoutCard from "@/app/_components/tickets/CheckoutCard";
import FixtureCard from "@/app/_components/tickets/FixtureCard";
import TicketHero from "@/app/_components/tickets/TicketHero";
import ZoneSheet from "@/app/_components/tickets/ZoneSheet";
import EmptyState from "@/app/_components/ui/EmptyState";
import type { Fixture, TicketZone } from "@/app/_data/fixtures";
import { fixtures as fallbackFixtures } from "@/app/_data/fixtures";
import { fanProfile } from "@/app/_data/fanProfile";
import { jsonFetch } from "@/app/_lib/api";

type ApiMatch = {
  id: string;
  title: string;
  comp: string | null;
  date: string;
  venue: string | null;
  status: string;
  home_team: string | null;
  away_team: string | null;
  vip_price: number | null;
  regular_price: number | null;
  seats_vip: number | null;
  seats_regular: number | null;
};

type TicketReservationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; ticket: { id: string; paid: boolean; momo_ref: string | null; created_at: string } };

const formatMatchDate = (value: string) => {
  try {
    const date = new Date(value);
    return {
      date: date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch {
    return { date: value, time: "" };
  }
};

const heroImageForMatch = (home?: string | null, away?: string | null) => {
  const combined = `${home ?? ""} ${away ?? ""}`.toLowerCase();
  if (combined.includes("apr")) return "/tickets/rayon-apr.svg";
  if (combined.includes("police")) return "/tickets/rayon-simba.svg";
  return "/tickets/rayon-legends.svg";
};

const normaliseZoneName = (zone: TicketZone["name"]): "VIP" | "Regular" | "Blue" => {
  if (zone === "Fan" || zone === "Blue") return "Blue";
  return zone;
};

const buildFixtureFromMatch = (match: ApiMatch): Fixture => {
  const { date, time } = formatMatchDate(match.date);
  const baseTitle = match.title?.trim()
    ? match.title
    : `${match.home_team ?? "Rayon"} vs ${match.away_team ?? "Opponent"}`;
  const vipSeats = match.seats_vip ?? 420;
  const regularSeats = match.seats_regular ?? 3510;
  const blueSeats = Math.max(120, Math.round(regularSeats * 0.25));
  const regularPrice = match.regular_price ?? 5000;
  const bluePrice = Math.max(3000, Math.round(regularPrice * 0.65));

  const zones: TicketZone[] = [
    {
      id: `${match.id}-vip`,
      name: "VIP",
      price: Math.max(0, match.vip_price ?? 15000),
      seatsLeft: vipSeats,
      totalSeats: Math.max(vipSeats, 420),
    },
    {
      id: `${match.id}-regular`,
      name: "Regular",
      price: Math.max(0, regularPrice),
      seatsLeft: regularSeats,
      totalSeats: Math.max(regularSeats, 3510),
    },
    {
      id: `${match.id}-blue`,
      name: "Blue",
      price: bluePrice,
      seatsLeft: blueSeats,
      totalSeats: Math.max(blueSeats, 1200),
    },
  ];

  const status: Fixture["status"] = match.status === "ft" ? "completed" : "upcoming";

  return {
    id: match.id,
    title: baseTitle,
    comp: match.comp ?? "Rayon Sports",
    date,
    time,
    venue: match.venue ?? "TBC",
    zones,
    status,
    heroImage: heroImageForMatch(match.home_team, match.away_team),
  };
};

const TicketsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingFixtures, setLoadingFixtures] = useState(true);
  const [fixtures, setFixtures] = useState<Fixture[]>(fallbackFixtures);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [selectedZone, setSelectedZone] = useState<TicketZone | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [reservation, setReservation] = useState<TicketReservationState>({ status: "idle" });

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (requestedTab === "past") {
      setActiveTab("past");
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
          setLoadingFixtures(false);
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
          {loadingFixtures ? (
            <div className="grid gap-4" role="status" aria-live="polite">
              <div className="h-56 w-64 animate-pulse rounded-3xl bg-white/10" />
              <div className="h-56 w-64 animate-pulse rounded-3xl bg-white/10" />
            </div>
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
