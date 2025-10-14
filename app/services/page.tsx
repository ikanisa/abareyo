"use client";

import PageShell from "@/app/_components/shell/PageShell";
import HistoryList from "@/app/_components/services/HistoryList";
import PerkBanner from "@/app/_components/services/PerkBanner";
import ServiceCard from "@/app/_components/services/ServiceCard";
import ServiceHero from "@/app/_components/services/ServiceHero";
import { PARTNERS, perks } from "@/app/_data/services";

const anchorMap: Record<string, string | undefined> = {
  ins: "insurance",
  sacco: "sacco",
  bank: "bank",
};

const ServicesPage = () => (
  <PageShell>
    <ServiceHero title="Partner Services" subtitle="Insure, deposit & earn perks." />
    <PerkBanner text={perks.highlight} />
    <div className="grid gap-3" role="list" aria-label="Partner service cards">
      {PARTNERS.map((partner) => (
        <ServiceCard key={partner.id} partner={partner} anchorId={anchorMap[partner.id]} />
      ))}
    </div>
    <HistoryList />
  </PageShell>
);

export default ServicesPage;
