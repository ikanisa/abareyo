import Link from "next/link";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";

const PredictPage = () => (
  <PageShell>
    <SubpageHeader
      title="Predict & Win"
      eyebrow="Match challenge"
      description="Submit your scoreline for a chance to win signed merchandise and loyalty bonuses."
      backHref="/community"
    />
    <section className="glass space-y-4 rounded-3xl border border-white/10 px-6 py-5 text-white">
      <p className="text-sm text-white/75">
        Predictions lock 30 minutes before kickoff. Winners are announced inside the Community tab alongside the player of the
        match poll. Submit your scoreline below and track how many fans agree with you.
      </p>
      <Link
        href="/community/polls/motm"
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
      >
        View latest poll →
      </Link>
    </section>
  </PageShell>
);

export default PredictPage;
