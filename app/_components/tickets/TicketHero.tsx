"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

type TicketHeroTab = {
  id: string;
  label: string;
  icon?: ReactNode;
  panelId?: string;
};

type TicketHeroProps = {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabs: TicketHeroTab[];
};

const TicketHero = ({ activeTab, onTabChange, tabs }: TicketHeroProps) => (
  <section
    aria-label="Match ticketing hero"
    className="relative overflow-hidden rounded-3xl bg-rs-gradient px-6 py-8 text-white shadow-2xl"
  >
    <div
      className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_65%)]"
      aria-hidden
    />
    <div className="relative z-10 space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-white/80">Matchday Access</p>
        <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Buy Match Tickets</h1>
        <p className="max-w-xl text-sm text-white/80 md:text-base">
          Explore fixtures, pick your zone, and secure seats with mobile money in three fluid steps.
        </p>
      </header>
      <nav aria-label="Ticket sections" role="tablist" className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={tab.panelId}
            id={`${tab.id}-tab`}
            onClick={() => onTabChange(tab.id)}
            className={clsx(
              "min-w-[128px] rounded-2xl px-5 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              "min-h-[44px] flex items-center justify-center",
              activeTab === tab.id ? "bg-white/25 text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
            )}
          >
            <span className="flex items-center justify-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  </section>
);

export type { TicketHeroTab };
export default TicketHero;
