"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldAlert, Trash2, RefreshCw } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

import { fetchFlaggedPosts, moderatePost } from "@/lib/api/community";

export default function AdminCommunity() {
  const { toast } = useToast();

  const moderationQuery = useQuery({
    queryKey: ["community", "moderation"],
    queryFn: fetchFlaggedPosts,
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ postId, status }: { postId: string; status: 'published' | 'removed' }) => {
      await moderatePost(postId, { status });
      await moderationQuery.refetch();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Action failed";
      toast({ title: "Moderation failed", description: message, variant: "destructive" });
    },
  });

  const records = moderationQuery.data ?? [];

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8 pb-6 space-y-2">
        <h1 className="text-3xl font-black gradient-text">Moderation Queue</h1>
        <p className="text-muted-foreground">Review flagged community posts captured by keyword heuristics.</p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert className="w-5 h-5 text-accent" />
          <span>{records.length} awaiting review</span>
        </div>
        <Button variant="glass" onClick={() => moderationQuery.refetch()} disabled={moderationQuery.isFetching}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {moderationQuery.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28 w-full" />
          ))}
        </div>
      )}

      {!moderationQuery.isLoading && records.length === 0 && (
        <GlassCard className="p-6 text-center text-sm text-muted-foreground">
          All clear! No flagged posts at the moment.
        </GlassCard>
      )}

      <div className="space-y-3">
        {records.map((post) => (
          <GlassCard key={post.id} className="p-5 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">Fan {post.author?.id?.slice(0, 6) ?? 'Guest'}</p>
                <p className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
              <span className="text-xs text-accent">{post.status}</span>
            </div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="glass"
                size="sm"
                onClick={() => moderateMutation.mutate({ postId: post.id, status: 'removed' })}
                disabled={moderateMutation.isPending}
              >
                <Trash2 className="w-4 h-4" /> Remove
              </Button>
              <Button
                variant="hero"
                size="sm"
                onClick={() => moderateMutation.mutate({ postId: post.id, status: 'published' })}
                disabled={moderateMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
