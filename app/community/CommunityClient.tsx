"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  type PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import FanHero from "@/app/_components/community/FanHero";
import PostCard from "@/app/_components/community/PostCard";
import LeaderboardCard from "@/app/_components/community/LeaderboardCard";
import FanClubCard from "@/app/_components/community/FanClubCard";
import PollWidget from "@/app/_components/community/PollWidget";
import ClipCard from "@/app/_components/community/ClipCard";
import BadgeCard from "@/app/_components/community/BadgeCard";
import EmptyState from "@/app/_components/ui/EmptyState";
import {
  mockBadges,
  mockClips,
  mockClubs,
  mockMonthlyLeaders,
  mockMissions,
  mockPolls,
  mockPosts,
  mockWeeklyLeaders,
  type Post,
  type Clip,
} from "@/app/_data/community";
import { fanProfile } from "@/app/_data/fanProfile";
import { jsonFetch } from "@/app/_lib/api";
import { useToast } from "@/components/ui/use-toast";

const tabs = ["Feed", "Leaderboard", "Fan Clubs", "Polls"] as const;

type TabKey = (typeof tabs)[number];
type ThreadState = { type: "post" | "clip"; id: string; title: string } | null;

type FanPostRecord = {
  id: string;
  text: string | null;
  media_url: string | null;
  likes: number | null;
  comments: number | null;
  created_at: string;
  user: { id: string; name: string | null; avatar_url: string | null } | null;
};

const fallbackAvatar = "/community/avatars/guest.png";

const formatRelativeTime = (value?: string | null) => {
  if (!value) return "now";
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "now";
  const diff = Date.now() - timestamp;
  if (diff <= 45_000) return "now";
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;
  if (diff < hour) {
    const minutes = Math.max(1, Math.floor(diff / minute));
    return `${minutes}m`;
  }
  if (diff < day) {
    const hours = Math.max(1, Math.floor(diff / hour));
    return `${hours}h`;
  }
  const days = Math.max(1, Math.floor(diff / day));
  if (days < 7) {
    return `${days}d`;
  }
  const weeks = Math.max(1, Math.floor(days / 7));
  if (weeks < 5) {
    return `${weeks}w`;
  }
  const months = Math.max(1, Math.floor(days / 30));
  return `${months}mo`;
};

const mapFanPost = (record: FanPostRecord): Post => ({
  id: record.id,
  user: record.user?.name?.trim() || "Rayon Fan",
  avatar: record.user?.avatar_url || fallbackAvatar,
  text: record.text ?? "",
  media: record.media_url ?? undefined,
  likes: record.likes ?? 0,
  comments: record.comments ?? 0,
  time: formatRelativeTime(record.created_at),
});

const composerMaxLength = 280;

type HeroBlockProps = {
  title: string;
  subtitle: string;
};

const HeroBlock = ({ title, subtitle }: HeroBlockProps) => (
  <header className="flex flex-col gap-2 text-white" aria-label="Community hero">
    <span className="text-xs uppercase tracking-[0.2em] text-white/70">Community</span>
    <div>
      <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-white/80 md:text-base">{subtitle}</p>
    </div>
  </header>
);

const WidgetRow = ({ children }: PropsWithChildren) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
);

const ClipsCarousel = ({ clips, onOpenComments }: { clips: Clip[]; onOpenComments: (clip: Clip) => void }) => {
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeClip = clips[activeIndex];

  const goToIndex = (nextIndex: number) => {
    setActiveIndex((current) => {
      const bounded = Math.max(0, Math.min(clips.length - 1, nextIndex));
      if (bounded === current) {
        return current;
      }
      return bounded;
    });
  };

  const handleDragEnd = (_: unknown, info: { offset: { y: number } }) => {
    if (info.offset.y < -80) {
      goToIndex(activeIndex + 1);
    }
    if (info.offset.y > 80) {
      goToIndex(activeIndex - 1);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowUp" || event.key === "PageUp") {
      event.preventDefault();
      goToIndex(activeIndex - 1);
    }
    if (event.key === "ArrowDown" || event.key === "PageDown") {
      event.preventDefault();
      goToIndex(activeIndex + 1);
    }
  };

  return (
    <section
      className="space-y-4"
      aria-labelledby="clips-heading"
      aria-describedby="clips-instructions"
      role="region"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center justify-between text-white">
        <h3 id="clips-heading" className="section-title">
          Matchday clips
        </h3>
        <span id="clips-instructions" className="text-xs text-white/70">
          Swipe or use arrow keys to browse
        </span>
      </div>
      <div className="relative flex h-[480px] w-full items-center justify-center overflow-hidden">
        <AnimatePresence initial={false} custom={activeIndex}>
          <motion.div
            key={activeClip.id}
            className="h-full w-full"
            initial={{ opacity: 0, y: 80, scale: prefersReducedMotion ? 1 : 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -80, scale: prefersReducedMotion ? 1 : 0.9 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            drag={prefersReducedMotion ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.25}
            onDragEnd={prefersReducedMotion ? undefined : handleDragEnd}
          >
            <ClipCard
              {...activeClip}
              isActive
              onOpenComments={() => onOpenComments(activeClip)}
            />
          </motion.div>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-y-4 right-3 flex flex-col items-center justify-center gap-2 text-xs text-white/80">
          {clips.map((clip, index) => (
            <span
              key={clip.id}
              className={`h-2 w-2 rounded-full ${index === activeIndex ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="btn min-h-[44px] bg-white/20 px-4 py-3 text-sm font-semibold"
          onClick={() => goToIndex(activeIndex - 1)}
          disabled={activeIndex === 0}
          aria-label="Previous clip"
        >
          ↑ Previous
        </button>
        <button
          type="button"
          className="btn min-h-[44px] bg-white/20 px-4 py-3 text-sm font-semibold"
          onClick={() => goToIndex(activeIndex + 1)}
          disabled={activeIndex === clips.length - 1}
          aria-label="Next clip"
        >
          Next ↓
        </button>
      </div>
    </section>
  );
};

const CommunityClient = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("Feed");
  const [openThread, setOpenThread] = useState<ThreadState>(null);
  const [feedPosts, setFeedPosts] = useState<Post[]>(mockPosts);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const badgeGroups = useMemo(() => mockBadges.slice(0, 3), []);

  useEffect(() => {
    let subscribed = true;
    const loadPosts = async () => {
      setFeedLoading(true);
      try {
        const records = await jsonFetch<FanPostRecord[]>("/api/community/posts");
        if (!subscribed) {
          return;
        }
        if (Array.isArray(records) && records.length) {
          const remotePosts = records
            .map(mapFanPost)
            .filter((post) => post.text.trim().length > 0);
          if (remotePosts.length) {
            const fallback = mockPosts.filter((mock) => !remotePosts.some((post) => post.id === mock.id));
            setFeedPosts([...remotePosts, ...fallback]);
          }
        }
        setFeedError(null);
      } catch (error) {
        if (!subscribed) {
          return;
        }
        console.error("Failed to load fan posts", error);
        setFeedError(error instanceof Error ? error.message : "Unable to load community feed");
      } finally {
        if (subscribed) {
          setFeedLoading(false);
        }
      }
    };
    loadPosts();
    return () => {
      subscribed = false;
    };
  }, []);

  const composerRemaining = composerMaxLength - composerText.length;
  const composerDisabled =
    posting || !composerText.trim() || composerText.trim().length > composerMaxLength;

  const handleOpenPost = (postId: string) => {
    const post = feedPosts.find((item) => item.id === postId) ?? mockPosts.find((item) => item.id === postId);
    setOpenThread({
      type: "post",
      id: postId,
      title: post ? `${post.user} • Live feed` : "Post thread",
    });
  };

  const handleComposerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = composerText.trim();
    if (!message) {
      setPostError("Share a chant or update before posting.");
      return;
    }
    if (message.length > composerMaxLength) {
      setPostError(`Keep your chant under ${composerMaxLength} characters.`);
      return;
    }
    setPostError(null);
    setPosting(true);
    try {
      const response = await jsonFetch<{ ok: boolean; post: FanPostRecord }>("/api/community/posts", {
        method: "POST",
        body: JSON.stringify({
          text: message,
          user: {
            name: fanProfile.name,
            phone: fanProfile.phone,
            momo_number: fanProfile.momo ?? fanProfile.phone,
            avatar_url: fallbackAvatar,
          },
        }),
      });
      const newPost = mapFanPost(response.post);
      setFeedPosts((current) => [newPost, ...current.filter((item) => item.id !== newPost.id)]);
      setComposerText("");
      toast({ title: "Posted to feed", description: "Your chant is now live for Rayon fans." });
    } catch (error) {
      console.error("Failed to publish post", error);
      setPostError(error instanceof Error ? error.message : "Unable to publish post");
    } finally {
      setPosting(false);
    }
  };

  const handleOpenClip = (clip: Clip) => {
    setOpenThread({
      type: "clip",
      id: clip.id,
      title: `${clip.title} • Matchday clip`,
    });
  };

  const handleCloseThread = () => setOpenThread(null);

  return (
    <div className="min-h-screen bg-rs-gradient pb-28 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-12 pt-8">
        <HeroBlock title="Community" subtitle="Share moments, polls & support Rayon" />

        <FanHero score={1250} rank={12} missions={mockMissions} />

        <section className="card space-y-4 text-white" aria-labelledby="badges-heading">
          <div className="flex items-center justify-between">
            <h3 id="badges-heading" className="section-title">
              Your badges
            </h3>
            <span className="text-xs text-white/70">Collect missions to unlock more</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {badgeGroups.length ? (
              badgeGroups.map((badge) => <BadgeCard key={badge.id} {...badge} />)
            ) : (
              <EmptyState
                title="No badges yet"
                description="Complete missions, quizzes and predictions to unlock your supporter identity."
                icon="🎗️"
              />
            )}
          </div>
        </section>

        <nav className="glass flex items-center gap-1 rounded-2xl border border-white/25 bg-white/10 p-1" aria-label="Community tabs">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                className={`relative flex-1 rounded-2xl px-4 py-3 text-sm font-semibold transition min-h-[44px] ${
                  isActive ? "text-blue-900" : "text-white/70"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {isActive ? (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute inset-0 -z-10 rounded-2xl bg-white"
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  />
                ) : null}
              </button>
            );
          })}
        </nav>

        <div>
          {activeTab === "Feed" ? (
            <div className="space-y-4">
              <section className="card space-y-4 text-white" aria-labelledby="composer-heading">
                <div className="flex items-center gap-3">
                  <Image
                    src={fallbackAvatar}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 id="composer-heading" className="text-lg font-semibold">
                      Start a chant
                    </h3>
                    <p className="text-xs text-white/70">Share matchday energy with thousands of Gikundiro fans.</p>
                  </div>
                </div>
                <form onSubmit={handleComposerSubmit} className="space-y-3">
                  <label className="text-sm font-semibold text-white/80" htmlFor="community-composer">
                    What's happening?
                  </label>
                  <textarea
                    id="community-composer"
                    value={composerText}
                    onChange={(event) => {
                      if (postError) {
                        setPostError(null);
                      }
                      setComposerText(event.target.value);
                    }}
                    placeholder="Rayon is taking over Kigali Stadium tonight..."
                    className="min-h-[140px] w-full rounded-3xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/70"
                    aria-label="Share a community update"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className={`text-xs ${composerRemaining < 0 ? "text-rose-200" : "text-white/60"}`} aria-live="polite">
                      {composerRemaining >= 0
                        ? `${composerRemaining} characters left`
                        : `${Math.abs(composerRemaining)} over the limit`}
                    </span>
                    <button
                      type="submit"
                      className="btn-primary min-h-[44px] rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={composerDisabled}
                    >
                      {posting ? "Posting…" : "Post to feed"}
                    </button>
                  </div>
                  {postError ? (
                    <p className="text-xs text-rose-200" role="status" aria-live="polite">
                      {postError}
                    </p>
                  ) : null}
                </form>
              </section>
              {feedLoading ? (
                <div
                  className="rounded-3xl border border-white/10 bg-white/10 p-4 text-xs text-white/70"
                  role="status"
                  aria-live="polite"
                >
                  Syncing live chants…
                </div>
              ) : null}
              {feedPosts.length ? (
                <WidgetRow>
                  {feedPosts.map((post) => (
                    <PostCard key={post.id} {...post} onOpenComments={handleOpenPost} />
                  ))}
                </WidgetRow>
              ) : (
                <EmptyState
                  title="Be the first to post"
                  description="Share a chant to kick off the community conversation."
                  icon="📣"
                />
              )}
              {feedError ? (
                <p className="text-xs text-amber-200" role="status" aria-live="polite">
                  {feedError}. Showing cached chants.
                </p>
              ) : null}
            </div>
          ) : null}

          {activeTab === "Leaderboard" ? (
            <LeaderboardCard weekly={mockWeeklyLeaders} monthly={mockMonthlyLeaders} />
          ) : null}

          {activeTab === "Fan Clubs" ? (
            <WidgetRow>
              {mockClubs.map((club) => (
                <FanClubCard key={club.id} {...club} />
              ))}
            </WidgetRow>
          ) : null}

          {activeTab === "Polls" ? (
            <div className="grid grid-cols-1 gap-4">
              {mockPolls.map((poll) => (
                <PollWidget key={poll.id} {...poll} />
              ))}
            </div>
          ) : null}
        </div>

        <ClipsCarousel clips={mockClips} onOpenComments={handleOpenClip} />
      </div>

      <AnimatePresence>
        {openThread ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-end bg-black/70 md:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseThread}
            role="dialog"
            aria-modal="true"
            aria-label={openThread.type === "clip" ? "Clip comments drawer" : "Post comments drawer"}
          >
            <motion.div
              className="glass w-full rounded-t-3xl border border-white/30 bg-slate-950/80 p-6 text-white shadow-2xl md:mx-auto md:max-w-lg md:rounded-3xl"
              initial={{ y: 140 }}
              animate={{ y: 0 }}
              exit={{ y: 140 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold">Comments</h4>
                  <p className="text-xs text-white/60">{openThread.title}</p>
                </div>
                <button
                  type="button"
                  className="btn min-h-[44px] bg-white/20 px-4 py-3 text-sm"
                  onClick={handleCloseThread}
                >
                  Close
                </button>
              </div>
              <p className="mt-4 text-sm text-white/75">
                Community replies and reactions will appear here in real time once the messaging bridge is connected.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Image src="/community/avatars/gikundiro-plus.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                <input
                  className="flex-1 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/60 focus:outline-none min-h-[44px]"
                  placeholder="Share your chant or emoji"
                  aria-label="Write a comment"
                />
                <button type="button" className="btn-primary min-h-[44px] rounded-xl px-5 py-3 text-sm font-semibold">
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CommunityClient;
