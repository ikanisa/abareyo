"use client";

import { useMemo, useState, useTransition } from "react";

import { clientEnv } from "@/config/env";
import { useToast } from "@/components/ui/use-toast";

const API_BASE = (clientEnv.NEXT_PUBLIC_BACKEND_URL || "/api").replace(/\/$/, "");

type JoinClubButtonProps = {
  clubId: string;
  clubName: string;
};

export default function JoinClubButton({ clubId, clubName }: JoinClubButtonProps) {
  const { toast } = useToast();
  const [hasJoined, setHasJoined] = useState(false);
  const [isPending, startTransition] = useTransition();

  const targetUrl = useMemo(() => `${API_BASE}/clubs/${encodeURIComponent(clubId)}/join`, [clubId]);

  const handleJoin = () => {
    if (hasJoined || isPending) {
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
          throw new Error(`Join request failed (${response.status})`);
        }

        setHasJoined(true);
        toast({
          title: "Request sent",
          description: `We'll introduce you to the ${clubName} captains shortly.`,
        });
      } catch (error) {
        console.error("Failed to join club", error);
        toast({
          title: "Unable to join right now",
          description: "Please try again in a few moments.",
          variant: "destructive",
        });
      }
    });
  };

  const label = hasJoined ? "You're on the list" : isPending ? "Submitting…" : `Join ${clubName}`;

  return (
    <button
      type="button"
      onClick={handleJoin}
      disabled={hasJoined || isPending}
      className="btn-primary w-full min-h-[44px] justify-center"
      aria-live="polite"
    >
      {label}
    </button>
  );
}
