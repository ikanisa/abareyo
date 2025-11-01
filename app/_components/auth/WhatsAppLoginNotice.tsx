"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { dispatchTelemetryEvent } from "@/lib/observability";
import { cn } from "@/lib/utils";

type WhatsAppLoginNoticeProps = {
  source: string;
  className?: string;
};

const WhatsAppLoginNotice = ({ source, className }: WhatsAppLoginNoticeProps) => {
  const handleClick = () => {
    void dispatchTelemetryEvent({ type: "whatsapp_auth_cta", source });
  };

  return (
    <GlassCard className={cn("flex flex-col gap-4 p-5", className)}>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-primary/10 p-2 text-primary">
          <MessageSquare className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">Verify with WhatsApp</h2>
          <p className="text-sm text-muted-foreground">
            Secure your supporter account with a one-time WhatsApp code to unlock wallet, tickets, and member-only features.
          </p>
        </div>
      </div>
      <Button asChild className="self-start" onClick={handleClick}>
        <Link href="/auth/whatsapp">Verify WhatsApp login</Link>
      </Button>
    </GlassCard>
  );
};

export default WhatsAppLoginNotice;
