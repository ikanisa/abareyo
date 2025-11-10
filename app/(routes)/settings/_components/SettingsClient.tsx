"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Globe, Shield, HelpCircle, MousePointer2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const languageOptions = [
  { value: "rw", label: "Kinyarwanda" },
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
];

export function SettingsClient() {
  const [language, setLanguage] = useState("rw");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [shopAlerts, setShopAlerts] = useState(true);
  const [privacyDigest, setPrivacyDigest] = useState(true);
  const [supportMessage, setSupportMessage] = useState("");

  const languageLabel = useMemo(() => languageOptions.find((entry) => entry.value === language)?.label ?? "Kinyarwanda", [language]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6 text-white">
          <header className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Globe className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Language & regions</h2>
              <p className="text-xs uppercase tracking-[0.26em] text-white/60">Choose the interface language</p>
            </div>
          </header>
          <div className="space-y-3 text-sm text-white/80">
            <p>Switching languages updates copy instantly across the web and mobile app.</p>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full rounded-2xl border-white/20 bg-black/30 text-white">
                <SelectValue placeholder="Choose language" />
              </SelectTrigger>
              <SelectContent className="bg-black/80 text-white">
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
              Preferred language: <span className="font-semibold text-white">{languageLabel}</span>
            </p>
          </div>
        </article>
        <article className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6 text-white">
          <header className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <p className="text-xs uppercase tracking-[0.26em] text-white/60">Stay on top of matches and drops</p>
            </div>
          </header>
          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <div>
                <p className="font-semibold text-white">Match alerts</p>
                <p className="text-xs text-white/60">Kickoff, lineups, and final whistle summaries.</p>
              </div>
              <Switch checked={matchAlerts} onCheckedChange={setMatchAlerts} />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <div>
                <p className="font-semibold text-white">Shop drops</p>
                <p className="text-xs text-white/60">Notify me when new kits or merch arrive.</p>
              </div>
              <Switch checked={shopAlerts} onCheckedChange={setShopAlerts} />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <div>
                <p className="font-semibold text-white">Monthly digest</p>
                <p className="text-xs text-white/60">Email summary of missions, news, and benefits.</p>
              </div>
              <Switch checked={privacyDigest} onCheckedChange={setPrivacyDigest} />
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6 text-white">
          <header className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Shield className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Privacy controls</h2>
              <p className="text-xs uppercase tracking-[0.26em] text-white/60">Manage how partners see your data</p>
            </div>
          </header>
          <div className="space-y-3 text-sm text-white/80">
            <p>Privacy toggles sync with the members directory to keep your data transparent.</p>
            <ul className="space-y-2 rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/70">
              <li>• Share wallet balance with partner services: <strong className="text-white/90">Off</strong></li>
              <li>• Allow partner perks emails: <strong className="text-white/90">On</strong></li>
              <li>• Data export: request from Settings → Help</li>
            </ul>
            <Button variant="secondary" type="button" className="w-full bg-white/10 text-white/80">
              Manage privacy center
            </Button>
          </div>
        </article>
        <article className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6 text-white">
          <header className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <MousePointer2 className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-white">Accessibility</h2>
              <p className="text-xs uppercase tracking-[0.26em] text-white/60">Reduce motion and haptics</p>
            </div>
          </header>
          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-center justify-between rounded-2xl bg-white/10 p-4">
              <div>
                <p className="font-semibold text-white">Reduced motion</p>
                <p className="text-xs text-white/60">Simplify hero animations and confetti bursts.</p>
              </div>
              <Switch checked={reducedMotion} onCheckedChange={setReducedMotion} />
            </div>
            <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
              Motion preference is stored device-side. We avoid auto-playing celebrations when this is enabled.
            </p>
          </div>
        </article>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/15 bg-white/5 p-6 text-white">
        <header className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <HelpCircle className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-white">Help & legal</h2>
            <p className="text-xs uppercase tracking-[0.26em] text-white/60">Reach the support squad</p>
          </div>
        </header>
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
          <Textarea
            value={supportMessage}
            onChange={(event) => setSupportMessage(event.target.value)}
            placeholder="Describe your issue, feedback, or request a data export…"
            className="min-h-[120px] rounded-2xl border-white/20 bg-black/30 text-sm text-white placeholder:text-white/40"
          />
          <div className="space-y-3 text-sm text-white/80">
            <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
              Contact us at <a href="mailto:support@gikundiro.rw" className="font-semibold text-white underline">support@gikundiro.rw</a> or visit
              the community desk inside Kigali Arena on matchdays.
            </p>
            <Button type="button" className="w-full" disabled={!supportMessage.trim()}>
              Send to support
            </Button>
            <div className="grid gap-1">
              <Button asChild variant="link" className="justify-start px-0 text-white">
                <Link href="/legal/privacy">Privacy policy</Link>
              </Button>
              <Button asChild variant="link" className="justify-start px-0 text-white">
                <Link href="/legal/terms">Terms of service</Link>
              </Button>
              <Button asChild variant="link" className="justify-start px-0 text-white">
                <Link href="/legal/cookies">Cookie policy</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
