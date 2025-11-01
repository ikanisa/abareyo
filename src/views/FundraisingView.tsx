"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { HeartHandshake, Flame, PhoneCall, Copy, Loader2, Target } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { donateToProject, fetchFundraisingProjects } from "@/lib/api/fundraising";
import type { FundraisingProject, FundraisingDonationResponse } from "@/lib/api/fundraising";
import { launchUssdDialer } from "@/lib/ussd";
import { useRealtime } from "@/providers/realtime-provider";

const formatter = new Intl.NumberFormat("en-RW", { style: "currency", currency: "RWF" });
const channelOptions: { id: 'mtn' | 'airtel'; label: string }[] = [
  { id: 'mtn', label: 'MTN MoMo' },
  { id: 'airtel', label: 'Airtel Money' },
];

const LAST_PROJECT_KEY = "fundraising:last-project";

function progressPercent(project: FundraisingProject) {
  if (!project.goal) return 0;
  return Math.min(100, Math.round((project.progress / project.goal) * 100));
}

export default function Fundraising() {
  const { toast } = useToast();
  const { socket } = useRealtime();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [amount, setAmount] = useState(5000);
  const [channel, setChannel] = useState<'mtn' | 'airtel'>('mtn');
  const [userId, setUserId] = useState("");
  const [donorName, setDonorName] = useState("");
  const [receipt, setReceipt] = useState<FundraisingDonationResponse | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["fundraising", "projects"],
    queryFn: fetchFundraisingProjects,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = window.localStorage.getItem(LAST_PROJECT_KEY);
    if (cached) {
      setSelectedProject(cached);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedProject) {
      window.localStorage.setItem(LAST_PROJECT_KEY, selectedProject);
    } else {
      window.localStorage.removeItem(LAST_PROJECT_KEY);
    }
  }, [selectedProject]);

  const donateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProject) {
        throw new Error("Select a project to support");
      }
      if (amount <= 0) {
        throw new Error("Enter a valid amount");
      }

      const response = await donateToProject({
        projectId: selectedProject,
        amount,
        channel,
        userId: userId.trim() || undefined,
        donorName: donorName.trim() || undefined,
      });

      setReceipt(response);
      toast({ title: "Donation started", description: "Dial the USSD code to finish payment." });
      return response;
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unable to start donation";
      toast({ title: "Donation failed", description: message, variant: "destructive" });
    },
  });

  const projects = projectsQuery.data ?? [];
  const currentProject = projects.find((project) => project.id === selectedProject) ?? null;
  const ussdDisplay = receipt?.ussdCode?.replace(/%23/g, "#");

  useEffect(() => {
    if (!socket || !currentProject) {
      return;
    }

    const handleDonationConfirmed = (payload: { donationId?: string; projectId?: string } | undefined) => {
      if (!payload?.projectId || payload.projectId !== currentProject.id) {
        return;
      }
      toast({ title: "Donation received", description: "Thank you for supporting Rayon Sports." });
      setReceipt(null);
      projectsQuery.refetch();
    };

    socket.on("fundraising.donation.confirmed", handleDonationConfirmed);
    return () => {
      socket.off("fundraising.donation.confirmed", handleDonationConfirmed);
    };
  }, [socket, currentProject, projectsQuery, toast]);

  useEffect(() => {
    if (!projectsQuery.error) return;
    const message = projectsQuery.error instanceof Error ? projectsQuery.error.message : 'Unable to load projects';
    toast({ title: 'Fundraising load failed', description: message, variant: 'destructive' });
  }, [projectsQuery.error, toast]);

  const launchDialer = () => {
    if (!receipt?.ussdCode) return;
    launchUssdDialer(receipt.ussdCode, {
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

  const handleCopy = async () => {
    if (!ussdDisplay) return;
    try {
      await navigator.clipboard.writeText(ussdDisplay);
      toast({ title: "USSD copied", description: "Dial now to confirm your donation." });
    } catch (error) {
      toast({ title: "Unable to copy", description: "Copy manually from the screen.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen pb-28 px-4">
      <div className="pt-8 pb-6 space-y-2">
        <h1 className="text-3xl font-black gradient-text">Fundraising</h1>
        <p className="text-muted-foreground">Fuel club projects and community impact through Mobile Money donations.</p>
      </div>

      {projectsQuery.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-36 w-full" />
          ))}
        </div>
      )}

      {!projectsQuery.isLoading && projects.length === 0 && (
        <GlassCard className="p-6 text-center text-sm text-muted-foreground">
          No active fundraising projects right now. Check back soon!
        </GlassCard>
      )}

      <div className="space-y-4">
        {projects.map((project) => {
          const percent = progressPercent(project);
          const isSelected = selectedProject === project.id;
          return (
            <GlassCard
              key={project.id}
              className="p-5 space-y-3 border border-transparent hover:border-primary/40 transition-all"
            >
              {project.coverImageUrl && (
                <div className="relative h-36 w-full overflow-hidden rounded-2xl">
                  <OptimizedImage
                    src={project.coverImageUrl}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    unoptimized={project.coverImageUrl.startsWith("http")}
                  />
                </div>
              )}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-foreground">{project.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{project.description}</p>
                </div>
                <Button variant={isSelected ? "hero" : "glass"} onClick={() => setSelectedProject(project.id)}>
                  {isSelected ? "Selected" : "Support"}
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Raised {formatter.format(project.progress)}</span>
                  <span>Goal {formatter.format(project.goal)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-accent" style={{ width: `${percent}%` }}></div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {currentProject && (
        <GlassCard className="mt-6 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <HeartHandshake className="w-6 h-6 text-primary" />
            <div>
              <p className="font-semibold text-foreground">Donate to {currentProject.title}</p>
              <p className="text-xs text-muted-foreground">Every contribution brings us closer to the goal.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="number"
              min={1000}
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value) || 0)}
              placeholder="Amount in RWF"
            />
            <Input
              value={donorName}
              onChange={(event) => setDonorName(event.target.value)}
              placeholder="Name (optional)"
            />
          </div>
          <Input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="User ID (optional)"
            className="font-mono"
          />
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
                <p className="text-xs text-muted-foreground">{option.id === 'mtn' ? 'MTN Rwanda' : 'Airtel Money'}</p>
              </button>
            ))}
          </div>
          <Button
            variant="hero"
            size="lg"
            disabled={donateMutation.isPending}
            onClick={() => donateMutation.mutate()}
          >
            {donateMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating USSD
              </>
            ) : (
              "Donate via USSD"
            )}
          </Button>
        </GlassCard>
      )}

      {receipt && (
        <GlassCard className="mt-6 p-5 space-y-4 border-primary/40">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-accent" />
            <div>
              <p className="font-semibold text-foreground">USSD Ready</p>
              <p className="text-xs text-muted-foreground">Dial to confirm your donation.</p>
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
            <p>Donation: <span className="font-mono text-foreground">{receipt.donationId}</span></p>
            <p>Amount: {formatter.format(receipt.amount)}</p>
            {receipt.paymentId && <p>Payment: <span className="font-mono text-foreground">{receipt.paymentId.slice(0, 8)}…</span></p>}
            <p>Expires at {new Date(receipt.expiresAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
