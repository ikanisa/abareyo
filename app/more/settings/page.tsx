import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import { GlassButton } from "@/app/_components/ui/GlassButton";
import { GlassCard } from "@/app/_components/ui/GlassCard";
import { GlassTile } from "@/app/_components/ui/GlassTile";
import { MotionToggle } from "@/app/_components/ui/MotionToggle";

export default function Settings() {
  return (
    <PageShell>
      <div className="mx-auto grid max-w-4xl gap-6">
        <GlassCard className="space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold text-white">Settings</h1>
            <p className="text-sm text-white/70">Tune your Rayon Sports experience across devices.</p>
          </header>
          <div className="grid gap-3 sm:grid-cols-2">
            <GlassTile title="Language" description="Switch between Kinyarwanda, English, and French." />
            <GlassTile title="Theme" description="Toggle between light, dark, and club palettes." />
            <GlassTile title="Notifications" description="Control match alerts and ticket reminders." />
            <GlassTile title="Privacy" description="Manage data sharing and personalization." />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-white/70">
            <Link className="underline-offset-4 hover:underline" href="/legal/terms">
              Terms of service
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/legal/privacy">
              Privacy policy
            </Link>
            <Link className="underline-offset-4 hover:underline" href="/legal/cookies">
              Cookie policy
            </Link>
          </div>
          <MotionToggle />
          <Link href="/support" className="block">
            <GlassButton tone="ghost" className="w-full">
              Help &amp; Legal
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    </PageShell>
  );
}

