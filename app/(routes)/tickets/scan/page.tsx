import type { PostgrestError } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { buildRouteMetadata } from "@/app/_lib/navigation";
import { tryGetSupabaseServerAnonClient } from "@/lib/db";

import { TicketScannerGate } from "./_components/TicketScannerGate";

const TICKET_SCANNER_FLAG = "features.ticketScanner";
const TICKET_SCANNER_ROLLOUT = "rollouts.ticketScanner";

export const dynamic = "force-dynamic";

export const metadata = buildRouteMetadata("/tickets/scan", {
  title: "Ticket scanner",
  description: "Validate supporter QR codes for Rayon Sports match entry when the rollout is active.",
});

type TicketScannerMeta = {
  enabled: boolean;
  rolloutStage: string | null;
};

async function resolveTicketScannerMeta(): Promise<TicketScannerMeta> {
  const client = tryGetSupabaseServerAnonClient();

  if (!client) {
    return { enabled: false, rolloutStage: null };
  }

  try {
    const isNotFoundError = (error: PostgrestError | null) =>
      Boolean(error?.code && ["PGRST116", "PGRST209", "PGRST204"].includes(error.code));

    const { data: flagRow, error: flagError } = await client
      .from("feature_flags")
      .select("enabled")
      .eq("key", TICKET_SCANNER_FLAG)
      .maybeSingle();

    if (flagError && !isNotFoundError(flagError)) {
      console.warn("[ticket-scanner] flag fetch failed", flagError);
    }

    const enabled = Boolean(flagRow?.enabled);

    const { data: rolloutRow, error: rolloutError } = await client
      .from("remote_config")
      .select("value")
      .eq("key", TICKET_SCANNER_ROLLOUT)
      .maybeSingle();

    if (rolloutError && !isNotFoundError(rolloutError)) {
      console.warn("[ticket-scanner] remote config fetch failed", rolloutError);
    }

    const rolloutStage = typeof rolloutRow?.value === "string" ? rolloutRow.value : null;

    return { enabled, rolloutStage };
  } catch (error) {
    console.error("[ticket-scanner] remote config error", error);
    return { enabled: false, rolloutStage: null };
  }
}

export default async function TicketScannerPage() {
  const meta = await resolveTicketScannerMeta();

  if (!meta.enabled) {
    notFound();
  }

  return (
    <PageShell>
      <SubpageHeader
        title="Ticket QR Scanner"
        eyebrow="Tickets"
        description="Scan supporter QR codes for entry validation once the rollout stage is active."
        backHref="/tickets"
      />
      <div className="mt-6">
        <TicketScannerGate rolloutStage={meta.rolloutStage} />
      </div>
    </PageShell>
  );
}
