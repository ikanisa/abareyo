"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Crown, Clock, CheckCircle2, PhoneCall, Copy, Loader2, Award } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  fetchMembershipPlans,
  fetchMembershipStatus,
  upgradeMembership,
} from "@/lib/api/membership";
import { launchUssdDialer } from "@/lib/ussd";
import type { MembershipPlanContract } from "@rayon/contracts";
import { useRealtime } from "@/providers/realtime-provider";

const formatter = new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF" });

type Channel = "mtn" | "airtel";

const channelOptions: { id: Channel; label: string; helper: string }[] = [
  { id: "mtn", label: "MTN MoMo", helper: "Best for MTN Rwanda numbers" },
  { id: "airtel", label: "Airtel Money", helper: "Use for Airtel subscribers" },
];

const LAST_USER_STORAGE_KEY = "membership:last-user";

const extractPerks = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }
  if (value && typeof value === "object" && Array.isArray((value as { perks?: unknown[] }).perks)) {
    return (value as { perks: unknown[] }).perks.map((item) => String(item));
  }
  return [];
};

export default function Membership() {
  const { toast } = useToast();
  const { socket } = useRealtime();
  const [userIdInput, setUserIdInput] = useState("");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [channel, setChannel] = useState<Channel>("mtn");
  const [pendingUpgrade, setPendingUpgrade] = useState<{
    membershipId?: string;
    paymentId?: string;
    ussdCode?: string;
    amount?: number;
    expiresAt?: string;
  } | null>(null);

  const plansQuery = useQuery({
    queryKey: ["membership", "plans"],
    queryFn: fetchMembershipPlans,
  });

  const statusQuery = useQuery({
    queryKey: ["membership", "status", activeUserId],
    queryFn: () => fetchMembershipStatus(activeUserId as string),
    enabled: Boolean(activeUserId),
  });

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      if (!activeUserId) {
        throw new Error("Provide a user ID first");
      }
      if (!selectedPlan) {
        throw new Error("Select a membership tier");
      }

      const response = await upgradeMembership({
        userId: activeUserId,
        planId: selectedPlan,
        channel,
      });

      setPendingUpgrade(response);
      statusQuery.refetch();
      if (response.message) {
        toast({ title: response.message, description: response.status ? `Status: ${response.status}` : undefined });
      }
      return response;
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Membership request failed";
      toast({ title: "Could not start membership checkout", description: message, variant: "destructive" });
    },
  });

  const membershipPlans = plansQuery.data ?? [];
  const activeStatus = statusQuery.data;
  const activePlanId = useMemo(() => activeStatus?.plan.id ?? null, [activeStatus]);
  const isActive = activeStatus?.status === "active";
  const isPending = activeStatus?.status === "pending";
  const ussdDisplay = pendingUpgrade?.ussdCode?.replaceAll("%23", "#");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = window.localStorage.getItem(LAST_USER_STORAGE_KEY);
    if (cached) {
      setUserIdInput(cached);
      setActiveUserId(cached);
    }
  }, []);

  useEffect(() => {
    if (!socket || !activeUserId) {
      return;
    }

    const handleMembershipActivated = (payload: { membershipId?: string; userId?: string } | undefined) => {
      if (!payload) return;
      if (payload.userId && payload.userId !== activeUserId) return;
      toast({ title: "Membership activated", description: "Perks are now unlocked." });
      statusQuery.refetch();
      setPendingUpgrade(null);
    };

    socket.on("membership.activated", handleMembershipActivated);
    return () => {
      socket.off("membership.activated", handleMembershipActivated);
    };
  }, [socket, activeUserId, statusQuery, toast]);

  useEffect(() => {
    if (!plansQuery.error && !statusQuery.error) {
      return;
    }
    const message = plansQuery.error ?? statusQuery.error;
    toast({
      title: "Membership fetch failed",
      description: message instanceof Error ? message.message : "Unable to load membership data.",
      variant: "destructive",
    });
  }, [plansQuery.error, statusQuery.error, toast]);

  const handleCopy = async () => {
    if (!ussdDisplay) return;
    try {
      await navigator.clipboard.writeText(ussdDisplay);
      toast({ title: "USSD copied", description: "Dial on your phone to confirm membership." });
    } catch (error) {
      toast({ title: "Unable to copy", description: "Copy the code manually.", variant: "destructive" });
    }
  };

  const launchDialer = () => {
    if (!pendingUpgrade?.ussdCode) return;
    launchUssdDialer(pendingUpgrade.ussdCode, {
      onFallback: () => {
        if (ussdDisplay) {
          toast({
            title: "Dial not opened?",
            description: `Open your Phone app and dial ${ussdDisplay} manually.`,
          });
        }
      },
    });
  };

  return (
    <div className="min-h-screen pb-28 px-4">
      <div className="pt-8 pb-6 space-y-2">
        <h1 className="text-3xl font-black gradient-text">Gikundiro Membership</h1>
        <p className="text-muted-foreground">Unlock perks, priority access, and special matchday rewards.</p>
      </div>

      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Crown className="w-6 h-6 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Link User</p>
            <p className="text-xs text-muted-foreground">Use the UUID from external auth (or create a seed user).</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            value={userIdInput}
            onChange={(event) => setUserIdInput(event.target.value)}
            placeholder="User ID (UUID)"
            className="font-mono"
          />
         <div className="flex gap-2">
           <Button
              variant="hero"
              onClick={() => {
                const value = userIdInput.trim();
                if (!value) {
                  toast({
                    title: "Enter a user ID",
                    description: "Paste the fan UUID before continuing.",
                    variant: "destructive",
                  });
                  return;
                }
                setActiveUserId(value);
                setPendingUpgrade(null);
                statusQuery.refetch();
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(LAST_USER_STORAGE_KEY, value);
                }
              }}
              disabled={!userIdInput.trim()}
            >
              Load
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setUserIdInput("");
                setActiveUserId(null);
                setPendingUpgrade(null);
                if (typeof window !== "undefined") {
                  window.localStorage.removeItem(LAST_USER_STORAGE_KEY);
                }
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </GlassCard>

      {activeStatus && (
        <GlassCard className="mt-6 overflow-hidden">
          <div className="bg-gradient-hero p-6 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-primary-foreground/70">Membership Status</p>
                <h2 className="text-2xl font-black text-primary-foreground flex items-center gap-2">
                  {activeStatus.plan.name}
                  {isActive && <CheckCircle2 className="w-5 h-5 text-success" />}
                  {isPending && <Clock className="w-5 h-5 text-accent" />}
                </h2>
              </div>
              <Badge variant={isActive ? "success" : "accent"}>{activeStatus.status}</Badge>
            </div>
            <div className="glass-card bg-white/10 p-4 rounded-2xl space-y-2">
              <p className="text-sm text-primary-foreground/90">Member ID</p>
              <p className="font-mono text-primary-foreground">{activeStatus.id.slice(0, 8)}…</p>
              <div className="flex items-center justify-between text-xs text-primary-foreground/80">
                <span>Started</span>
                <span>{activeStatus.startedAt ? new Date(activeStatus.startedAt).toLocaleDateString() : '--'}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-primary-foreground/80">
                <span>Expires</span>
                <span>{activeStatus.expiresAt ? new Date(activeStatus.expiresAt).toLocaleDateString() : '--'}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-primary-foreground/90">
              <Award className="w-4 h-4" />
              <span>Perks</span>
              {extractPerks(activeStatus.plan.perks).map((perk, index) => (
                <Badge key={index} variant="outline" className="bg-white/10 text-primary-foreground">
                  {perk}
                </Badge>
              ))}
            </div>
          </div>
        </GlassCard>
      )}

      <GlassCard className="mt-6 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">Choose a tier</p>
          <Badge variant="secondary">{membershipPlans.length} plans</Badge>
        </div>

        <div className="space-y-3">
          {membershipPlans.map((plan: MembershipPlanContract) => {
            const isActivePlan = activePlanId === plan.id && activeStatus?.status === "active";
            const isSelected = selectedPlan === plan.id;
            return (
              <GlassCard
                key={plan.id}
                className="p-4 border border-transparent hover:border-primary/40 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-foreground">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">{formatter.format(plan.price)} / year</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {extractPerks(plan.perks).map((perk, index) => (
                        <Badge key={index} variant="outline">{perk}</Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant={isSelected ? "hero" : "glass"}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {isSelected ? "Selected" : "Select"}
                  </Button>
                </div>
                {isActivePlan && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-success">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Active until {activeStatus?.expiresAt ? new Date(activeStatus.expiresAt).toLocaleDateString() : "-"}</span>
                  </div>
                )}
              </GlassCard>
            );
          })}
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Select your mobile money network:</p>
          <div className="grid grid-cols-2 gap-3">
            {channelOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setChannel(option.id)}
                className={`rounded-xl border px-4 py-3 text-left transition-all ${
                  channel === option.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                }`}
              >
                <p className="font-semibold text-foreground">{option.label}</p>
                <p className="text-xs text-muted-foreground">{option.helper}</p>
              </button>
            ))}
          </div>
        </div>

        <Button
          variant="hero"
          size="lg"
          disabled={!activeUserId || !selectedPlan || upgradeMutation.isPending}
          onClick={() => upgradeMutation.mutate()}
        >
          {upgradeMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating USSD
            </>
          ) : (
            "Pay via USSD"
          )}
        </Button>
      </GlassCard>

      {pendingUpgrade?.ussdCode && (
        <GlassCard className="mt-6 p-5 space-y-4 border-primary/40">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-accent" />
            <div>
              <p className="font-semibold text-foreground">Complete Payment</p>
              <p className="text-xs text-muted-foreground">Dial the code to finish membership upgrade.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-muted/20 border border-muted/40 text-center">
            <p className="text-xs text-muted-foreground mb-1">Dial this code</p>
            <p className="font-mono text-lg tracking-wider text-foreground select-all">{ussdDisplay}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="hero" onClick={launchDialer}>
              <PhoneCall className="w-4 h-4" />
              Open Dialer
            </Button>
            <Button variant="glass" onClick={handleCopy}>
              <Copy className="w-4 h-4" />
              Copy Code
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            {pendingUpgrade.paymentId && <p>Payment ID: <span className="font-mono text-foreground">{pendingUpgrade.paymentId.slice(0, 8)}…</span></p>}
            <p>Expires at {pendingUpgrade.expiresAt ? new Date(pendingUpgrade.expiresAt).toLocaleTimeString() : '-'}</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
