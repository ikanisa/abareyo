"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Share2, Trophy, AlertOctagon, Send, BarChart3, Plus, X, Check } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

import {
  createCommunityComment,
  createCommunityPost,
  fetchCommunityPolls,
  fetchCommunityFeed,
  fetchCommunityLeaderboard,
  fetchCommunityMissions,
  checkInCommunity,
  submitCommunityQuiz,
  submitCommunityPrediction,
  reactToCommunityPost,
  recordCommunityPostView,
  voteCommunityPoll,
} from "@/lib/api/community";
import type {
  CommunityPost,
  PollContract,
  LeaderboardEntryContract,
  CommunityMissionsContract,
} from "@rayon/contracts";

type PostCardProps = {
  post: CommunityPost;
  onReact: (postId: string, kind: 'like' | 'cheer' | 'love') => void;
  isReacting: boolean;
  onCommentToggle: (postId: string) => void;
  onCommentSubmit: (postId: string, message: string) => void;
  commentDraft: string;
  setCommentDraft: (postId: string, value: string) => void;
  expanded: boolean;
  onPollVote?: (pollId: string, optionId: string) => void;
  isPollVoting?: boolean;
  pollSelection?: string;
};

const reactionLabels: Record<string, string> = {
  like: 'Like',
  cheer: 'Cheer',
  love: 'Love',
};

const MAX_POLL_OPTIONS = 5;
const CHECK_IN_POINTS = 10;

type PollBlockProps = {
  poll: PollContract;
  onVote?: (pollId: string, optionId: string) => void;
  isVoting?: boolean;
  selectedOptionId?: string;
  showMeta?: boolean;
};

function PollBlock({ poll, onVote, isVoting, selectedOptionId, showMeta }: PollBlockProps) {
  const totalVotesLabel = poll.totalVotes === 1 ? '1 vote' : `${poll.totalVotes} votes`;
  const formattedCreatedAt = showMeta
    ? new Date(poll.createdAt).toLocaleString(undefined, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="font-semibold text-sm text-foreground">{poll.question}</p>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{totalVotesLabel}</span>
          {formattedCreatedAt ? <span>{formattedCreatedAt}</span> : null}
        </div>
      </div>
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percent = poll.totalVotes ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
          const isSelected = selectedOptionId === option.id;
          const canVote = Boolean(onVote);

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => (canVote ? onVote?.(poll.id, option.id) : undefined)}
              disabled={!canVote || isVoting}
              className={`w-full rounded-lg border border-border/60 bg-background/40 px-3 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                isSelected ? 'border-primary/80 bg-primary/10' : 'hover:border-primary/50'
              } ${!canVote ? 'cursor-default' : ''}`}
            >
              <div className="flex items-center justify-between gap-3 text-sm font-medium text-foreground">
                <span className="truncate">{option.label}</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  {isSelected ? <Check className="h-3.5 w-3.5 text-primary" /> : null}
                  <span>
                    {percent}% · {option.votes}
                  </span>
                </span>
              </div>
              <Progress value={percent} className="mt-2 h-2" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PostCard({
  post,
  onReact,
  isReacting,
  onCommentToggle,
  onCommentSubmit,
  commentDraft,
  setCommentDraft,
  expanded,
  onPollVote,
  isPollVoting,
  pollSelection,
}: PostCardProps) {
  const created = new Date(post.createdAt).toLocaleString();
  const reactionTotals = useMemo(() => post.reactionTotals ?? {}, [post.reactionTotals]);
  const totalReactions = Object.values(reactionTotals).reduce((sum, value) => sum + value, 0);
  useEffect(() => {
    recordCommunityPostView(post.id).catch(() => null);
  }, [post.id]);
  const highlightedContent = useMemo(() => {
    if (!post.riskTerms?.length) {
      return <span className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</span>;
    }
    const pattern = new RegExp(`(${post.riskTerms.join('|')})`, 'gi');
    const parts = post.content.split(pattern);
    return (
      <span className="text-sm text-muted-foreground whitespace-pre-wrap">
        {parts.map((part, index) =>
          post.riskTerms?.some((term) => new RegExp(term, 'i').test(part)) ? (
            <mark key={index} className="bg-accent/40 text-foreground px-1 rounded">
              {part}
            </mark>
          ) : (
            <span key={index}>{part}</span>
          ),
        )}
      </span>
    );
  }, [post.content, post.riskTerms]);

  return (
    <GlassCard className="p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center font-bold text-primary-foreground">
          {(post.author?.id ?? "FAN").slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm text-foreground">{post.author?.id ? `Fan ${post.author.id.slice(0, 6)}` : "Guest Fan"}</p>
            <span className="text-xs text-muted-foreground">{created}</span>
            {post.status === "flagged" && <Badge variant="accent">Awaiting review</Badge>}
          </div>
          {highlightedContent}
          {Boolean(post.media?.length) && (
            <div className="grid grid-cols-2 gap-2">
              {post.media?.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="Post attachment"
                  className="h-32 w-full object-cover rounded-xl border border-border/60"
                />
              ))}
            </div>
          )}
          {post.poll ? (
            <div className="mt-3 rounded-xl border border-border/40 bg-background/30 p-3">
              <PollBlock
                poll={post.poll}
                onVote={onPollVote}
                isVoting={isPollVoting}
                selectedOptionId={pollSelection}
              />
            </div>
          ) : null}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{totalReactions} cheers</span>
            <span>{post.commentCount ?? 0} comments</span>
            <span>{(post.viewCount ?? 0).toLocaleString()} views</span>
            {post.riskTerms?.length ? (
              <Badge variant="destructive" className="uppercase tracking-wide text-[10px]">
                {post.riskTerms.length} risk flag
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 pt-2 flex-wrap">
        <button
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          onClick={() => onReact(post.id, 'cheer')}
          disabled={isReacting}
        >
          <Heart className="w-5 h-5" />
          <span>Cheer ({reactionTotals.cheer ?? reactionTotals.like ?? 0})</span>
        </button>
        <button
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          onClick={() => onCommentToggle(post.id)}
        >
          <MessageCircle className="w-5 h-5" />
          <span>Comment</span>
        </button>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto">
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 border-t border-border/40 pt-3">
          <Textarea
            value={commentDraft}
            onChange={(event) => setCommentDraft(post.id, event.target.value)}
            rows={3}
            placeholder="Add a comment"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="glass"
              size="sm"
              onClick={() => setCommentDraft(post.id, '')}
            >
              Clear
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={() => onCommentSubmit(post.id, commentDraft)}
              disabled={!commentDraft.trim()}
            >
              <Send className="w-4 h-4" />
              Comment
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

export default function Community() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [userId, setUserId] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [checkInLocation, setCheckInLocation] = useState("");
  const [quizId, setQuizId] = useState("");
  const [quizAnswer, setQuizAnswer] = useState("");
  const [predictionMatchId, setPredictionMatchId] = useState("");
  const [predictionPick, setPredictionPick] = useState("Win");

  const trimmedUserId = userId.trim();

  const feedQuery = useQuery({
    queryKey: ["community", "feed"],
    queryFn: fetchCommunityFeed,
  });

  const pollsQuery = useQuery({
    queryKey: ["community", "polls"],
    queryFn: fetchCommunityPolls,
  });

  const leaderboardQuery = useQuery({
    queryKey: ["community", "leaderboard", leaderboardPeriod],
    queryFn: () => fetchCommunityLeaderboard(leaderboardPeriod),
    placeholderData: (previousData) => previousData,
  });

  const missionsQuery = useQuery({
    queryKey: ["community", "missions"],
    queryFn: fetchCommunityMissions,
  });

  const handlePollToggle = (checked: boolean) => {
    setPollEnabled(checked);
    if (!checked) {
      setPollOptions(["", ""]);
    } else if (pollOptions.length < 2) {
      setPollOptions(["", ""]);
    }
  };

  const handlePollOptionChange = (index: number, value: string) => {
    setPollOptions((prev) => prev.map((option, currentIndex) => (currentIndex === index ? value : option)));
  };

  const addPollOption = () => {
    setPollOptions((prev) => (prev.length >= MAX_POLL_OPTIONS ? prev : [...prev, ""]));
  };

  const removePollOption = (index: number) => {
    setPollOptions((prev) => {
      if (prev.length <= 2) {
        return prev;
      }
      return prev.filter((_, currentIndex) => currentIndex !== index);
    });
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const trimmedContent = draft.trim();
      if (!trimmedContent) {
        throw new Error("Write something encouraging!");
      }
      const trimmedMedia = mediaUrl.trim();
      const normalizedPollOptions = pollEnabled
        ? pollOptions.map((option) => option.trim()).filter(Boolean)
        : undefined;

      if (pollEnabled && (!normalizedPollOptions || normalizedPollOptions.length < 2)) {
        throw new Error("Add at least two poll options for your poll");
      }

      const response = await createCommunityPost({
        content: trimmedContent,
        userId: trimmedUserId || undefined,
        media: trimmedMedia ? [trimmedMedia] : undefined,
        pollOptions: normalizedPollOptions,
      });
      setDraft("");
      setMediaUrl("");
      if (pollEnabled) {
        setPollOptions(["", ""]);
        setPollEnabled(false);
      }
      feedQuery.refetch();
      queryClient.invalidateQueries({ queryKey: ['community', 'polls'] });
      toast({
        title: response.status === "flagged" ? "Sent for moderation" : "Post published",
        description: response.status === "flagged" ? "An admin will review shortly." : undefined,
      });
      return response;
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unable to publish";
      toast({ title: "Could not post", description: message, variant: "destructive" });
    },
  });

  const feed = feedQuery.data ?? [];
  const polls = pollsQuery.data ?? [];
  const leaderboard = leaderboardQuery.data ?? [];
  const missions = missionsQuery.data ?? null;
  const quizMission = missions?.quiz ?? null;
  const predictionMission = missions?.prediction ?? null;

  useEffect(() => {
    if (quizMission && quizId !== quizMission.id) {
      setQuizId(quizMission.id);
    }
    if (!quizMission && quizId) {
      setQuizId("");
    }
  }, [quizMission?.id]);

  useEffect(() => {
    if (predictionMission && predictionMatchId !== predictionMission.matchId) {
      setPredictionMatchId(predictionMission.matchId);
    }
    if (!predictionMission && predictionMatchId) {
      setPredictionMatchId("");
    }
  }, [predictionMission?.matchId]);
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!trimmedUserId) {
        throw new Error('Provide your user ID before checking in');
      }
      const data = await checkInCommunity({
        userId: trimmedUserId,
        location: checkInLocation.trim() || undefined,
      });
      setCheckInLocation("");
      leaderboardQuery.refetch();
      missionsQuery.refetch();
      toast({ title: 'Checked in!', description: `+${data.pointsAwarded} pts · Total ${data.totalPoints}` });
      return data;
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to check in';
      toast({ title: 'Check-in failed', description: message, variant: 'destructive' });
    },
  });

  const quizMutation = useMutation({
    mutationFn: async () => {
      if (!trimmedUserId) {
        throw new Error('Provide your user ID to submit the quiz');
      }
      if (!quizMission) {
        throw new Error('Quiz not available right now');
      }
      if (!quizAnswer.trim()) {
        throw new Error('Add your quiz answer');
      }
      const data = await submitCommunityQuiz({
        userId: trimmedUserId,
        quizId: quizMission.id,
        answer: quizAnswer.trim(),
      });
      setQuizAnswer("");
      leaderboardQuery.refetch();
      missionsQuery.refetch();
      toast({
        title: 'Quiz submitted',
        description: `+${data.pointsAwarded} pts · Total ${data.totalPoints}`,
      });
      return data;
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to submit quiz';
      toast({ title: 'Quiz failed', description: message, variant: 'destructive' });
    },
  });

  const predictionMutation = useMutation({
    mutationFn: async () => {
      if (!trimmedUserId) {
        throw new Error('Provide your user ID to record a prediction');
      }
      if (!predictionMission) {
        throw new Error('Prediction not available right now');
      }
      const data = await submitCommunityPrediction({
        userId: trimmedUserId,
        matchId: predictionMission.matchId,
        pick: predictionPick.trim(),
      });
      leaderboardQuery.refetch();
      missionsQuery.refetch();
      toast({
        title: 'Prediction saved',
        description:
          data.pointsAwarded > 0
            ? `+${data.pointsAwarded} pts · Total ${data.totalPoints}`
            : `Updated pick · Total ${data.totalPoints}`,
      });
      return data;
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to record prediction';
      toast({ title: 'Prediction failed', description: message, variant: 'destructive' });
    },
  });

  const reactMutation = useMutation({
    mutationFn: ({ postId, kind }: { postId: string; kind: 'like' | 'cheer' | 'love' }) =>
      reactToCommunityPost({ postId, kind, userId: trimmedUserId || undefined }),
    onSuccess: ({ postId, reactionTotals }) => {
      queryClient.setQueryData<CommunityPost[]>(['community', 'feed'], (current) => {
        if (!current) return current;
        return current.map((post) =>
          post.id === postId ? { ...post, reactionTotals } : post,
        );
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to react';
      toast({ title: 'Could not react', description: message, variant: 'destructive' });
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      voteCommunityPoll({ pollId, optionId, userId: trimmedUserId || undefined }),
    onSuccess: (updatedPoll, variables) => {
      setUserVotes((prev) => ({ ...prev, [updatedPoll.id]: variables.optionId }));
      queryClient.setQueryData<PollContract[]>(['community', 'polls'], (current) => {
        if (!current) return current;
        return current.map((poll) => (poll.id === updatedPoll.id ? updatedPoll : poll));
      });
      queryClient.setQueryData<CommunityPost[]>(['community', 'feed'], (current) => {
        if (!current) return current;
        return current.map((post) =>
          post.poll && post.poll.id === updatedPoll.id ? { ...post, poll: updatedPoll } : post,
        );
      });
      toast({ title: 'Vote recorded' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to record vote';
      toast({ title: 'Could not vote', description: message, variant: 'destructive' });
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      createCommunityComment({ postId, content, userId: trimmedUserId || undefined }),
    onSuccess: (_, variables) => {
      setCommentDrafts((prev) => ({ ...prev, [variables.postId]: '' }));
      feedQuery.refetch();
      toast({ title: 'Comment added' });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unable to comment';
      toast({ title: 'Could not comment', description: message, variant: 'destructive' });
    },
  });

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8 pb-6">
        <h1 className="text-3xl font-black gradient-text mb-2">Community</h1>
        <p className="text-muted-foreground">Share moments, polls, and support the Rayon family.</p>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar">
        <Button variant="hero" size="sm">Feed</Button>
        <Button variant="glass" size="sm">Leaderboard</Button>
        <Button variant="glass" size="sm">Fan Clubs</Button>
        <Button variant="glass" size="sm">Polls</Button>
      </div>

      <GlassCard variant="accent" className="mb-6 overflow-hidden">
        <div className="bg-gradient-accent p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-accent-foreground">Your Fan Score</h3>
              <p className="text-3xl font-black text-accent-foreground">1,250 pts</p>
            </div>
            <Trophy className="w-12 h-12 text-accent-foreground opacity-80" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="glass" size="sm" className="text-accent-foreground border-accent-foreground/30">
              Check-in
            </Button>
            <Button variant="glass" size="sm" className="text-accent-foreground border-accent-foreground/30">
              Quiz
            </Button>
            <Button variant="glass" size="sm" className="text-accent-foreground border-accent-foreground/30">
              Predict
            </Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="mb-6 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-foreground">Fan Leaderboard</h2>
            <p className="text-xs text-muted-foreground">Top cheers this {leaderboardPeriod === 'weekly' ? 'week' : 'month'}.</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={leaderboardPeriod === 'weekly' ? 'hero' : 'glass'}
              size="sm"
              onClick={() => setLeaderboardPeriod('weekly')}
            >
              Weekly
            </Button>
            <Button
              variant={leaderboardPeriod === 'monthly' ? 'hero' : 'glass'}
              size="sm"
              onClick={() => setLeaderboardPeriod('monthly')}
            >
              Monthly
            </Button>
          </div>
        </div>
        {leaderboardQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`leaderboard-skeleton-${index}`} className="h-12 w-full" />
            ))}
          </div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-2">
            {leaderboard.map((entry: LeaderboardEntryContract) => (
              <div key={entry.userId} className="flex items-center justify-between rounded-xl border border-border/40 px-3 py-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    #{entry.rank}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Fan {entry.userId.slice(0, 6)}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.user?.preferredZone ? `Zone ${entry.user.preferredZone}` : 'Global supporter'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{entry.points} pts</p>
                  <p className="text-xs text-muted-foreground">{entry.user?.status ?? 'guest'}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No points yet. Join a poll or check-in to climb the board.</p>
        )}
      </GlassCard>

      <GlassCard className="mb-6 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Fan Missions</h2>
            <p className="text-xs text-muted-foreground">Complete quick actions to climb the leaderboard.</p>
          </div>
        </div>
        {missionsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={`missions-skeleton-${index}`} className="h-20 w-full" />
            ))}
          </div>
        ) : missionsQuery.isError ? (
          <p className="text-sm text-destructive">Unable to load missions right now.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Matchday check-in</p>
                <span className="text-xs text-muted-foreground">+{CHECK_IN_POINTS} pts</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={checkInLocation}
                  onChange={(event) => setCheckInLocation(event.target.value)}
                  placeholder="Stadium or viewing party (optional)"
                  className="sm:flex-1"
                />
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => checkInMutation.mutate()}
                  disabled={checkInMutation.isPending || !trimmedUserId}
                >
                  {checkInMutation.isPending ? 'Checking in…' : 'Check in'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Quiz of the week</p>
                <span className="text-xs text-muted-foreground">
                  {quizMission ? `+${quizMission.rewardPoints} pts` : 'Unavailable'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {quizMission ? quizMission.prompt : 'No quiz active at the moment.'}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={quizAnswer}
                  onChange={(event) => setQuizAnswer(event.target.value)}
                  placeholder={quizMission ? 'Your answer' : 'Quiz unavailable'}
                  className="sm:flex-1"
                  disabled={!quizMission}
                />
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => quizMutation.mutate()}
                  disabled={quizMutation.isPending || !quizMission || !trimmedUserId}
                >
                  {quizMutation.isPending ? 'Submitting…' : 'Submit'}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">Match prediction</p>
                <span className="text-xs text-muted-foreground">
                  {predictionMission ? `+${predictionMission.rewardPoints} pts` : 'Unavailable'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {predictionMission
                  ? predictionMission.question
                  : 'No fixture is open for predictions right now.'}
              </div>
              {predictionMission && predictionMission.match ? (
                <p className="text-[11px] text-muted-foreground">
                  vs {predictionMission.match.opponent} · {new Date(predictionMission.match.kickoff).toLocaleString()}
                  {predictionMission.match.venue ? ` · ${predictionMission.match.venue}` : ''}
                </p>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={predictionPick}
                  onChange={(event) => setPredictionPick(event.target.value)}
                  placeholder={predictionMission ? 'Your pick (e.g. Rayon 2-0)' : 'Prediction unavailable'}
                  disabled={!predictionMission}
                />
                <Input
                  value={predictionMatchId}
                  readOnly
                  placeholder="Match ID"
                  className="font-mono"
                  disabled
                />
              </div>
              <Button
                variant="hero"
                size="sm"
                onClick={() => predictionMutation.mutate()}
                disabled={predictionMutation.isPending || !predictionMission || !trimmedUserId}
              >
                {predictionMutation.isPending ? 'Saving…' : 'Save prediction'}
              </Button>
            </div>

            {!trimmedUserId && (
              <p className="text-xs text-muted-foreground">
                Tip: add your user ID above so actions sync to your wallet and leaderboard profile.
              </p>
            )}
          </div>
        )}
      </GlassCard>

      <GlassCard className="mb-6 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-foreground">Fan Polls</h2>
            <p className="text-xs text-muted-foreground">Vote and see how the Rayon family is feeling.</p>
          </div>
          <BarChart3 className="w-5 h-5 text-accent" />
        </div>
        {pollsQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={`poll-skeleton-${index}`} className="h-24 w-full" />
            ))}
          </div>
        ) : polls.length > 0 ? (
          <div className="space-y-4">
            {polls.map((poll) => (
              <div key={poll.id} className="rounded-xl border border-border/40 bg-background/40 p-4">
                <PollBlock
                  poll={poll}
                  onVote={(pollId, optionId) => voteMutation.mutate({ pollId, optionId })}
                  isVoting={voteMutation.isPending}
                  selectedOptionId={userVotes[poll.id]}
                  showMeta
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No polls yet. Attach one to your next post.</p>
        )}
      </GlassCard>

      <GlassCard className="mb-6 p-5 space-y-3">
        <h2 className="font-semibold text-foreground">Post to the feed</h2>
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Celebrate the team, share matchday vibes, or cheer on your favourite player."
          rows={4}
        />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Switch id="attach-poll" checked={pollEnabled} onCheckedChange={handlePollToggle} />
            <Label htmlFor="attach-poll" className="text-sm text-muted-foreground">
              Attach a poll
            </Label>
          </div>
          {pollEnabled ? (
            <span className="text-xs text-muted-foreground">
              {pollOptions.length} / {MAX_POLL_OPTIONS} options
            </span>
          ) : null}
        </div>
        {pollEnabled ? (
          <div className="space-y-2">
            {pollOptions.map((option, index) => (
              <div key={`poll-option-${index}`} className="flex items-center gap-2">
                <Input
                  value={option}
                  onChange={(event) => handlePollOptionChange(index, event.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                {pollOptions.length > 2 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePollOption(index)}
                    className="text-muted-foreground"
                    aria-label="Remove poll option"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                ) : null}
              </div>
            ))}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <Button
                type="button"
                variant="glass"
                size="sm"
                onClick={addPollOption}
                disabled={pollOptions.length >= MAX_POLL_OPTIONS}
                className="flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add option
              </Button>
              <span>Poll question reuses your post text.</span>
            </div>
          </div>
        ) : null}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <Input
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="User ID (optional)"
            className="font-mono sm:w-64"
          />
          <Input
            value={mediaUrl}
            onChange={(event) => setMediaUrl(event.target.value)}
            placeholder="Image URL (optional)"
            className="sm:w-64"
          />
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} variant="hero">
            {createMutation.isPending ? "Posting..." : <><Send className="w-4 h-4" /> Post</>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Posts are auto-flagged if they contain suspicious links; moderators review flagged items before publishing.
        </p>
      </GlassCard>

      {feedQuery.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      )}

      {!feedQuery.isLoading && feed.length === 0 && (
        <GlassCard className="p-6 text-center space-y-2">
          <AlertOctagon className="w-6 h-6 text-accent mx-auto" />
          <p className="text-sm text-muted-foreground">No posts yet. Be the first to start the conversation!</p>
        </GlassCard>
      )}

      <div className="space-y-4">
        {feed.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onReact={(postId, kind) => reactMutation.mutate({ postId, kind })}
            isReacting={reactMutation.isPending}
            expanded={Boolean(expandedComments[post.id])}
            onCommentToggle={(postId) =>
              setExpandedComments((prev) => ({ ...prev, [postId]: !prev[postId] }))
            }
            commentDraft={commentDrafts[post.id] ?? ''}
            setCommentDraft={(postId, value) =>
              setCommentDrafts((prev) => ({ ...prev, [postId]: value }))
            }
            onCommentSubmit={(postId, message) =>
              commentMutation.mutate({ postId, content: message.trim() })
            }
            onPollVote={(pollId, optionId) => voteMutation.mutate({ pollId, optionId })}
            isPollVoting={voteMutation.isPending}
            pollSelection={post.poll ? userVotes[post.poll.id] : undefined}
          />
        ))}
      </div>
    </div>
  );
}
