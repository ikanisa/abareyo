"use client";

import { useMemo } from "react";

const FALLBACK_ROLLOUT = "unassigned";

type TicketScannerGateProps = {
  rolloutStage: string | null;
};

export function TicketScannerGate({ rolloutStage }: TicketScannerGateProps) {
  const label = useMemo(() => rolloutStage ?? FALLBACK_ROLLOUT, [rolloutStage]);

  return (
    <section className="space-y-6 rounded-2xl border border-emerald-900/30 bg-emerald-900/10 p-6 text-emerald-50">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-emerald-300">Beta cohort</p>
        <h2 className="text-2xl font-semibold">Venue ticket scanning</h2>
      </header>
      <p className="text-sm text-emerald-100/80">
        Camera access and QR decoding will be enabled once the <code>features.ticketScanner</code> flag is active for your
        Supabase project. We surface the assigned rollout cohort through <code>rollouts.ticketScanner</code> so on-site
        supervisors can confirm activation.
      </p>
      <dl className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/40 p-4">
          <dt className="font-medium text-emerald-200">Remote rollout stage</dt>
          <dd className="mt-1 font-mono text-lg">{label}</dd>
        </div>
        <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/40 p-4">
          <dt className="font-medium text-emerald-200">Next steps</dt>
          <dd className="mt-1 space-y-2">
            <p>Confirm device camera permissions in the hybrid shell.</p>
            <p>Invite a limited staff group before rolling out to all stewards.</p>
          </dd>
        </div>
      </dl>
      <footer className="text-xs text-emerald-300/80">
        Toggle ownership: Operations. Update the Supabase <code>feature_flags</code> and <code>remote_config</code> tables
        during phased rollouts.
      </footer>
    </section>
  );
}
