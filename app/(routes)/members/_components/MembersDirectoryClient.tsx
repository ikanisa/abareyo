"use client";

import { useMemo, useState } from "react";
import { Users, ShieldCheck, MapPin, Award, ToggleLeft } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type Member = {
  id: string;
  name: string;
  role: string;
  location: string;
  joinedAt: string;
  visibility: "public" | "members" | "private";
  badges: string[];
  availability?: string;
};

const members: Member[] = [
  {
    id: "m001",
    name: "Aline Uwera",
    role: "Matchday Steward",
    location: "Kigali",
    joinedAt: "2022-09-01",
    visibility: "public",
    badges: ["Volunteer leader", "Season ticket"],
    availability: "Available for community drives",
  },
  {
    id: "m002",
    name: "Didier Uwimana",
    role: "Academy Parent Liaison",
    location: "Huye",
    joinedAt: "2023-01-15",
    visibility: "members",
    badges: ["Academy mentor"],
  },
  {
    id: "m003",
    name: "Grace Mukamana",
    role: "Supporter Group Captain",
    location: "Rubavu",
    joinedAt: "2021-11-03",
    visibility: "public",
    badges: ["Away travel", "Community champion"],
    availability: "Organises buses for away trips",
  },
  {
    id: "m004",
    name: "Eric Nshimiyimana",
    role: "Digital Volunteer",
    location: "Nyagatare",
    joinedAt: "2024-04-21",
    visibility: "private",
    badges: ["New member"],
  },
];

const formatter = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric" });

export function MembersDirectoryClient() {
  const [query, setQuery] = useState("");
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [shareLocation, setShareLocation] = useState(true);
  const [shareAvailability, setShareAvailability] = useState(true);

  const filteredMembers = useMemo(() => {
    const term = query.trim().toLowerCase();
    return members.filter((member) => {
      if (showPublicOnly && member.visibility !== "public") {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = `${member.name} ${member.role} ${member.location}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [query, showPublicOnly]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,3fr),minmax(0,2fr)]">
        <article className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6 text-white">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-white/60">Visibility preferences</p>
              <h2 className="text-lg font-semibold text-white">Control how members find you</h2>
            </div>
            <Badge variant="outline" className="border-white/40 text-white/80">
              <ShieldCheck className="mr-1 h-4 w-4" />
              Privacy-first
            </Badge>
          </header>
          <div className="space-y-3 text-sm text-white/80">
            <p>
              Toggle which data appears in the directory. Changes sync instantly across the More tab and partner experiences.
            </p>
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <div>
                <p className="font-semibold text-white">Show profile publicly</p>
                <p className="text-xs text-white/60">Visible to all fans using the app and web hub.</p>
              </div>
              <Switch checked={!showPublicOnly} onCheckedChange={(value) => setShowPublicOnly(!value)} />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <div>
                <p className="font-semibold text-white">Share city/region</p>
                <p className="text-xs text-white/60">Helps local captains coordinate match travel.</p>
              </div>
              <Switch checked={shareLocation} onCheckedChange={setShareLocation} />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <div>
                <p className="font-semibold text-white">Highlight volunteer availability</p>
                <p className="text-xs text-white/60">Surface when you can support missions or events.</p>
              </div>
              <Switch checked={shareAvailability} onCheckedChange={setShareAvailability} />
            </div>
          </div>
        </article>
        <aside className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6 text-white">
          <h3 className="text-sm font-semibold uppercase tracking-[0.26em] text-white/70">Search directory</h3>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, role, or location"
            className="rounded-2xl border-white/20 bg-black/30 text-sm text-white placeholder:text-white/40"
          />
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
            <p className="font-semibold text-white">Directory visibility levels</p>
            <ul className="mt-2 space-y-1 text-xs text-white/60">
              <li>Public – anyone can see your card</li>
              <li>Members – only authenticated Rayon Nation supporters</li>
              <li>Private – hidden from the directory</li>
            </ul>
          </div>
          <Button variant="secondary" className="w-full bg-white/10 text-white/80" type="button">
            <Users className="mr-2 h-4 w-4" />
            Invite new member
          </Button>
        </aside>
      </section>

      <section className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/60">{filteredMembers.length} members</p>
            <h2 className="text-lg font-semibold text-white">Directory</h2>
          </div>
          <Badge variant="outline" className="border-white/40 text-white/80">
            <ToggleLeft className="mr-1 h-4 w-4" />
            {showPublicOnly ? "Public view" : "All access"}
          </Badge>
        </header>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => (
            <article
              key={member.id}
              className="space-y-3 rounded-3xl border border-white/15 bg-white/5 p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border border-white/20 bg-black/40">
                  <AvatarFallback className="text-sm text-white/80">
                    {member.name
                      .split(" ")
                      .map((word) => word[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-base font-semibold text-white">{member.name}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/60">{member.role}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
                {shareLocation && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {member.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  Since {formatter.format(new Date(member.joinedAt))}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-white/80">
                {member.badges.map((badge) => (
                  <Badge key={badge} variant="secondary" className="bg-white/10 text-white/70">
                    {badge}
                  </Badge>
                ))}
              </div>
              {shareAvailability && member.availability ? (
                <p className="rounded-2xl border border-white/10 bg-black/30 p-3 text-xs text-white/70">
                  {member.availability}
                </p>
              ) : null}
              <footer className="flex items-center justify-between text-xs text-white/60">
                <span className="rounded-full bg-black/30 px-3 py-1 uppercase tracking-[0.2em]">{member.visibility}</span>
                <Button variant="ghost" size="sm" className="text-white/80" type="button">
                  View profile
                </Button>
              </footer>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
