"use client";

import { useMemo, useState, useTransition } from "react";

import { clientEnv } from "@/config/env";
import { useToast } from "@/components/ui/use-toast";

const API_BASE = (clientEnv.NEXT_PUBLIC_BACKEND_URL || "/api").replace(/\/$/, "");

type RsvpButtonProps = {
  eventId: string;
  eventTitle: string;
};

export default function RsvpButton({ eventId, eventTitle }: RsvpButtonProps) {
  const { toast } = useToast();
  const [hasRsvped, setHasRsvped] = useState(false);
  const [isPending, startTransition] = useTransition();

  const targetUrl = useMemo(() => `${API_BASE}/events/${encodeURIComponent(eventId)}/rsvp`, [eventId]);

  const handleRsvp = () => {
    if (hasRsvped || isPending) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(targetUrl, {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId: "demo-user" }),
        });

        if (!response.ok) {
          throw new Error(`RSVP failed (${response.status})`);
        }

        setHasRsvped(true);
        toast({
          title: "RSVP confirmed",
          description: `We'll save a spot for ${eventTitle}.`,
        });
      } catch (error) {
        console.error("Failed to RSVP", error);
        toast({
          title: "Unable to RSVP",
          description: "Please try again in a few moments.",
          variant: "destructive",
        });
      }
    });
  };

  const label = hasRsvped ? "You're attending" : isPending ? "Submitting…" : "RSVP for event";

  return (
    <button
      type="button"
      onClick={handleRsvp}
      disabled={hasRsvped || isPending}
      className="btn-primary w-full min-h-[44px] justify-center"
      aria-live="polite"
    >
      {label}
    </button>
  );
}
