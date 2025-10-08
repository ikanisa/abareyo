"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Share2, Key, CheckCircle2 } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { initiateTicketTransfer, claimTicketTransfer } from "@/lib/api/tickets";

export default function TicketTransfer() {
  const { toast } = useToast();
  const [initiatePassId, setInitiatePassId] = useState("");
  const [ownerUserId, setOwnerUserId] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetPhone, setTargetPhone] = useState("");
  const [transferCode, setTransferCode] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  const [claimPassId, setClaimPassId] = useState("");
  const [recipientUserId, setRecipientUserId] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [claimSuccess, setClaimSuccess] = useState(false);

  const initiateMutation = useMutation({
    mutationFn: async () => {
      if (!initiatePassId.trim() || !ownerUserId.trim()) {
        throw new Error("Pass ID and owner ID are required");
      }
      const response = await initiateTicketTransfer({
        passId: initiatePassId.trim(),
        ownerUserId: ownerUserId.trim(),
        targetUserId: targetUserId.trim() || undefined,
        targetPhone: targetPhone.trim() || undefined,
      });
      setTransferCode(response.transferCode);
      toast({ title: "Transfer code generated", description: "Share this code with the recipient." });
      return response;
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Transfer could not be initiated";
      toast({ title: "Transfer error", description: message, variant: "destructive" });
    },
  });

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!claimPassId.trim() || !recipientUserId.trim() || codeInput.trim().length !== 6) {
        throw new Error("Provide pass ID, recipient, and 6-character code");
      }
      await claimTicketTransfer({
        passId: claimPassId.trim(),
        recipientUserId: recipientUserId.trim(),
        transferCode: codeInput.trim().toUpperCase(),
      });
      setClaimSuccess(true);
      toast({ title: "Transfer claimed", description: "The pass is now linked to the new owner." });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unable to claim pass";
      toast({ title: "Claim failed", description: message, variant: "destructive" });
    },
  });

  useEffect(() => {
    setCanShare(Boolean(navigator.share));
  }, []);

  return (
    <div className="min-h-screen pb-28 px-4">
      <div className="pt-8 pb-6 space-y-2">
        <h1 className="text-3xl font-black gradient-text">Transfer Ticket</h1>
        <p className="text-muted-foreground">Generate a secure code to hand a ticket pass to another fan.</p>
      </div>

      <GlassCard className="p-6 space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <Share2 className="w-6 h-6 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Step 1 · Initiate transfer</p>
            <p className="text-xs text-muted-foreground">Owner generates a one-time code to share with the recipient.</p>
          </div>
        </div>

        <Input
          value={initiatePassId}
          onChange={(event) => setInitiatePassId(event.target.value)}
          placeholder="Pass ID"
          className="font-mono"
        />
        <Input
          value={ownerUserId}
          onChange={(event) => setOwnerUserId(event.target.value)}
          placeholder="Owner user ID (UUID)"
          className="font-mono"
        />
        <Input
          value={targetUserId}
          onChange={(event) => setTargetUserId(event.target.value)}
          placeholder="Recipient user ID (optional to lock transfer)"
          className="font-mono"
        />
        <Input
          value={targetPhone}
          onChange={(event) => setTargetPhone(event.target.value)}
          placeholder="Recipient phone (optional note)"
        />

        <Button variant="hero" onClick={() => initiateMutation.mutate()} disabled={initiateMutation.isPending}>
          {initiateMutation.isPending ? "Generating..." : "Generate Transfer Code"}
        </Button>

        {transferCode && (
          <div className="glass-card p-4 text-center space-y-2">
            <p className="text-xs text-muted-foreground">Share this code with the recipient</p>
            <p className="font-mono text-xl text-foreground tracking-widest">{transferCode}</p>
            <Button
              variant="glass"
              size="sm"
              onClick={async () => {
                try {
                  if (navigator.share && canShare) {
                    await navigator.share({
                      title: "Rayon Sports Ticket Transfer",
                      text: `Use code ${transferCode} to claim the ticket pass`,
                    });
                  } else {
                    await navigator.clipboard.writeText(transferCode);
                    toast({ title: "Code copied" });
                  }
                } catch (error) {
                  toast({ title: "Unable to share", description: String(error), variant: "destructive" });
                }
              }}
            >
              {canShare ? "Share code" : "Copy code"}
            </Button>
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Key className="w-6 h-6 text-accent" />
          <div>
            <p className="font-semibold text-foreground">Step 2 · Claim transfer</p>
            <p className="text-xs text-muted-foreground">Recipient enters the pass ID, their user ID, and the code.</p>
          </div>
        </div>

        <Input
          value={claimPassId}
          onChange={(event) => setClaimPassId(event.target.value)}
          placeholder="Pass ID"
          className="font-mono"
        />
        <Input
          value={recipientUserId}
          onChange={(event) => setRecipientUserId(event.target.value)}
          placeholder="Recipient user ID (UUID)"
          className="font-mono"
        />
        <Input
          value={codeInput}
          onChange={(event) => setCodeInput(event.target.value)}
          placeholder="Transfer code (6 characters)"
          className="font-mono uppercase"
          maxLength={6}
        />

        <Button variant="hero" onClick={() => claimMutation.mutate()} disabled={claimMutation.isPending}>
          {claimMutation.isPending ? "Claiming..." : "Claim Pass"}
        </Button>

        {claimSuccess && (
          <div className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="w-5 h-5" />
            <span>Transfer completed successfully.</span>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
