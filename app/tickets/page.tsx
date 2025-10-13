"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import CheckoutCard from "@/app/_components/tickets/CheckoutCard";
import FixtureCard from "@/app/_components/tickets/FixtureCard";
import TicketHero from "@/app/_components/tickets/TicketHero";
import ZoneSheet from "@/app/_components/tickets/ZoneSheet";
import EmptyState from "@/app/_components/ui/EmptyState";
import type { Fixture, TicketZone } from "@/app/_data/fixtures";
import { fixtures } from "@/app/_data/fixtures";

const TicketsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [selectedFixture, setSelectedFixture] = useState<Fixture | null>(null);
  const [selectedZone, setSelectedZone] = useState<TicketZone | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    const requestedTab = searchParams.get("tab");
    if (requestedTab === "past") {
      setActiveTab("past");
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
  }, [activeTab]);

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
          {filteredFixtures.length === 0 ? (
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
