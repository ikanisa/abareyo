"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, EyeOff, RefreshCw, ShieldAlert, ShieldCheck, UserX } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OptimizedImage } from "@/components/ui/optimized-image";
import {
  fetchCommunityModerationQueue,
  fetchCommunityRateLimits,
  updateCommunityPostModeration,
  type CommunityModerationPost,
  type CommunityModerationStatus,
  type CommunityRateLimitEntry,
} from "@/lib/api/admin/community";

const createdAtFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

const statusLabels: Record<string, string> = {
  visible: "Visible",
  hidden: "Hidden",
  flagged: "Flagged",
  pending: "Pending review",
  warned: "Warned",
  banned: "Banned",
};

const statusStyles: Record<string, string> = {
  visible: "bg-emerald-500/20 text-emerald-100",
  hidden: "bg-slate-500/30 text-slate-100",
  flagged: "bg-amber-500/20 text-amber-100",
  pending: "bg-amber-500/20 text-amber-100",
  warned: "bg-orange-500/20 text-orange-100",
  banned: "bg-rose-500/20 text-rose-100",
};

const formatConfidence = (value: number) => {
  const normalized = value <= 1 ? value * 100 : value;
  return `${Math.round(normalized)}%`;
};

const getParticipant = (
  participants: Map<string, CommunityRateLimitEntry>,
  post: CommunityModerationPost,
): CommunityRateLimitEntry | undefined => participants.get(post.userId ?? "guest");

export default function AdminCommunity() {
  const { toast } = useToast();
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const moderationQuery = useQuery({
    queryKey: ["community", "moderation", "queue"],
    queryFn: fetchCommunityModerationQueue,
  });

  const rateLimitsQuery = useQuery({
    queryKey: ["community", "moderation", "rate-limits"],
    queryFn: fetchCommunityRateLimits,
    refetchInterval: 60_000,
  });

  const moderationMutation = useMutation({
    mutationFn: ({
      post,
      status,
      note,
    }: {
      post: CommunityModerationPost;
      status: CommunityModerationStatus;
      note?: string;
    }) =>
      updateCommunityPostModeration({
        id: post.id,
        status,
        notes: note && note.trim().length ? note.trim() : undefined,
      }),
    onSuccess: (updated) => {
      toast({
        title: "Moderation updated",
        description: `Post set to ${statusLabels[updated.status] ?? updated.status}.`,
      });
      moderationQuery.refetch();
      rateLimitsQuery.refetch();
      setNoteDrafts((prev) => ({ ...prev, [updated.id]: updated.moderatorNotes ?? "" }));
    },
    onError: (error: unknown) => {
      toast({
        title: "Moderation failed",
        description: error instanceof Error ? error.message : "Unable to update status",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!moderationQuery.data) {
      setNoteDrafts({});
      return;
    }
    setNoteDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const post of moderationQuery.data) {
        next[post.id] = prev[post.id] ?? post.moderatorNotes ?? "";
      }
      return next;
    });
  }, [moderationQuery.data]);

  const queue = moderationQuery.data ?? [];
  const rawRateLimits = rateLimitsQuery.data;

  const participants = useMemo(() => {
    const map = new Map<string, CommunityRateLimitEntry>();
    for (const entry of rawRateLimits ?? []) {
      map.set(entry.userId ?? "guest", entry);
    }
    return map;
  }, [rawRateLimits]);

  const rateLimits = rawRateLimits ?? [];

  const handleAction = (post: CommunityModerationPost, status: CommunityModerationStatus) => {
    if (status === "banned") {
      const confirmed = window.confirm("Ban this user from posting and hide the post?");
      if (!confirmed) return;
    }
    if (status === "warned") {
      const confirmed = window.confirm("Send a warning to the fan and keep the post hidden?");
      if (!confirmed) return;
    }
    const note = (noteDrafts[post.id] ?? "").trim();
    moderationMutation.mutate({ post, status, note });
  };

  return (
    <div className="min-h-screen px-4 pb-24">
      <div className="space-y-2 pt-8 pb-6">
        <h1 className="text-3xl font-black gradient-text">Moderation Console</h1>
        <p className="text-muted-foreground">
          Review flagged community posts, preview parser evidence, and monitor posting rate limits.
        </p>
      </div>

      <GlassCard className="mb-8 space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Rate limit telemetry</h2>
            <p className="text-xs text-muted-foreground">
              Identify fans approaching or exceeding posting thresholds.
            </p>
          </div>
          <Button
            variant="glass"
            size="sm"
            onClick={() => rateLimitsQuery.refetch()}
            disabled={rateLimitsQuery.isFetching}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh telemetry
          </Button>
        </div>
        {rateLimitsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full bg-slate-900/60" />
            ))}
          </div>
        ) : rateLimits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent posting bursts detected.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4 font-semibold">Fan</th>
                  <th className="py-2 pr-4 font-semibold">15 min</th>
                  <th className="py-2 pr-4 font-semibold">1 hour</th>
                  <th className="py-2 pr-4 font-semibold">24 hours</th>
                  <th className="py-2 pr-4 font-semibold">Flags</th>
                  <th className="py-2 pr-4 font-semibold">Warnings</th>
                  <th className="py-2 pr-4 font-semibold">Bans</th>
                  <th className="py-2 pr-4 font-semibold">Last post</th>
                  <th className="py-2 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {rateLimits.map((entry, index) => (
                  <tr
                    key={entry.userId ?? `guest-${index}`}
                    className={`border-b border-white/5 ${entry.rateLimited ? "bg-rose-500/10" : "bg-transparent"}`}
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 bg-slate-900">
                          {entry.avatarUrl ? (
                            <AvatarImage src={entry.avatarUrl} alt={entry.displayName} />
                          ) : null}
                          <AvatarFallback className="text-[10px] uppercase text-slate-200">
                            {(entry.displayName ?? "?").slice(0, 2) || "??"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-[2px]">
                          <p className="text-sm font-medium text-slate-100">{entry.displayName}</p>
                          <p className="text-[11px] text-slate-500">{entry.userId ?? "Guest session"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-sm">
                      {entry.posts15m} / {entry.limit15m}
                    </td>
                    <td className="py-3 pr-4 text-sm">
                      {entry.posts1h} / {entry.limit1h}
                    </td>
                    <td className="py-3 pr-4 text-sm">
                      {entry.posts24h} / {entry.limit24h}
                    </td>
                    <td className="py-3 pr-4 text-sm">{entry.flaggedTotal}</td>
                    <td className="py-3 pr-4 text-sm">{entry.warnsTotal}</td>
                    <td className="py-3 pr-4 text-sm">{entry.bansTotal}</td>
                    <td className="py-3 pr-4 text-sm">
                      {entry.lastPostAt ? createdAtFormatter.format(new Date(entry.lastPostAt)) : "—"}
                    </td>
                    <td className="py-3 text-right">
                      <Badge
                        variant={entry.rateLimited ? "destructive" : "outline"}
                        className={`text-[10px] uppercase tracking-wide ${
                          entry.rateLimited ? "bg-rose-500/30 text-rose-50" : "border-white/10 text-slate-300"
                        }`}
                      >
                        {entry.rateLimited ? "Limited" : "Clear"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert className="h-5 w-5 text-accent" aria-hidden="true" />
          <span>{queue.length} awaiting review</span>
        </div>
        <Button
          variant="glass"
          size="sm"
          onClick={() => moderationQuery.refetch()}
          disabled={moderationQuery.isFetching}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh queue
        </Button>
      </div>

      {moderationQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full bg-slate-900/60" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <GlassCard className="p-6 text-center text-sm text-muted-foreground">
          All clear! No flagged posts at the moment.
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {queue.map((post) => {
            const participant = getParticipant(participants, post);
            const noteValue = noteDrafts[post.id] ?? "";
            const statusClass = statusStyles[post.status] ?? "bg-slate-500/20 text-slate-200";

            return (
              <GlassCard key={post.id} className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {participant?.displayName ?? `Fan ${post.userId?.slice(0, 8) ?? "Guest"}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Posted {createdAtFormatter.format(new Date(post.createdAt))}
                    </p>
                    {participant?.rateLimited ? (
                      <Badge className="bg-rose-500/30 text-[10px] uppercase tracking-wide text-rose-50">
                        Rate limited
                      </Badge>
                    ) : null}
                  </div>
                  <Badge className={`text-[10px] uppercase tracking-wide ${statusClass}`}>
                    {statusLabels[post.status] ?? post.status}
                  </Badge>
                </div>

                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{post.body}</p>

                {post.evidence.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Evidence</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {post.evidence.map((item, index) => (
                        <div
                          key={`${post.id}-evidence-${index}`}
                          className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-slate-200"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-slate-100 capitalize">
                              {item.label ?? item.type}
                            </span>
                            {typeof item.confidence === "number" ? (
                              <Badge className="border-white/10 bg-white/10 text-[10px] uppercase text-white" variant="outline">
                                {formatConfidence(item.confidence)}
                              </Badge>
                            ) : null}
                          </div>
                          {item.url ? (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-block break-words text-primary underline"
                            >
                              {item.value ?? item.url}
                            </a>
                          ) : item.type === "image" && item.value ? (
                            <div className="relative mt-2 h-32 w-full overflow-hidden rounded-lg">
                              <OptimizedImage
                                alt={item.label ?? "Evidence"}
                                src={item.value}
                                fill
                                sizes="(max-width: 768px) 100vw, 33vw"
                                className="object-cover"
                              />
                            </div>
                          ) : item.value ? (
                            <p className="mt-2 whitespace-pre-wrap text-slate-300">{item.value}</p>
                          ) : (
                            <p className="mt-2 text-slate-500">No preview available.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-400" htmlFor={`note-${post.id}`}>
                    Moderator note
                  </label>
                  <Textarea
                    id={`note-${post.id}`}
                    value={noteValue}
                    onChange={(event) => setNoteDrafts((prev) => ({ ...prev, [post.id]: event.target.value }))}
                    placeholder="Add context for other admins"
                    className="min-h-[90px] bg-slate-950/60"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => handleAction(post, "hidden")}
                    disabled={moderationMutation.isPending}
                    className="gap-2"
                  >
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                    Hide
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(post, "warned")}
                    disabled={moderationMutation.isPending}
                    className="gap-2 border-amber-400/40 text-amber-200"
                  >
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    Warn
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAction(post, "banned")}
                    disabled={moderationMutation.isPending}
                    className="gap-2"
                  >
                    <UserX className="h-4 w-4" aria-hidden="true" />
                    Ban
                  </Button>
                  <Button
                    variant="hero"
                    size="sm"
                    onClick={() => handleAction(post, "visible")}
                    disabled={moderationMutation.isPending}
                    className="gap-2"
                  >
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    Restore
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
