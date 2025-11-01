"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { Post } from "@/app/_data/community";
import { OptimizedImage } from "@/components/ui/optimized-image";

type PostCardProps = Post & {
  onOpenComments?: (postId: string) => void;
};

const isVideo = (media?: string) => (media ? media.endsWith(".mp4") || media.endsWith(".webm") : false);

const PostCard = ({ id, avatar, user, text, media, likes, comments, time, onOpenComments }: PostCardProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [isLiked, setIsLiked] = useState(false);

  const formattedLikes = useMemo(() => {
    const base = isLiked ? likes + 1 : likes;
    return new Intl.NumberFormat("en", { notation: "compact" }).format(base);
  }, [isLiked, likes]);

  const handleLike = () => {
    setIsLiked((value) => !value);
  };

  return (
    <article className="card break-words whitespace-normal break-words whitespace-normal flex flex-col gap-4 text-white" aria-label={`${user} post`}>
      <header className="flex items-center gap-3">
        <div className="h-12 w-12 overflow-hidden rounded-full border border-white/30 bg-white/10">
          <OptimizedImage src={avatar} alt={`${user} avatar`} width={48} height={48} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-wide">{user}</span>
          <span className="text-xs text-white/70">{time} ago</span>
        </div>
        <span className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">Live feed</span>
      </header>

      <p className="text-sm leading-relaxed text-white/90">{text}</p>

      {media ? (
        <div className="overflow-hidden rounded-2xl border border-white/20">
          {isVideo(media) ? (
            <video
              src={media}
              controls
              playsInline
              preload="metadata"
              poster={media.replace(".mp4", "-poster.jpg")}
              className="h-64 w-full object-cover"
            />
          ) : (
            <OptimizedImage src={media} alt={`${user} shared media`} width={640} height={360} className="h-64 w-full object-cover" />
          )}
        </div>
      ) : null}

      <footer className="flex items-center justify-between gap-3 text-xs text-white/70">
        <div className="flex items-center gap-3">
          <motion.button
            type="button"
            className={`btn flex min-h-[44px] items-center gap-2 px-4 py-3 text-xs font-semibold ${
              isLiked ? "bg-white text-blue-600" : ""
            }`}
            onClick={handleLike}
            whileTap={{ scale: prefersReducedMotion ? 1 : 0.92 }}
            aria-pressed={isLiked}
            aria-label={isLiked ? "Unlike post" : "Like post"}
          >
            <span aria-hidden>{isLiked ? "💙" : "🤍"}</span>
            {formattedLikes}
          </motion.button>
          <button
            type="button"
            className="btn min-h-[44px] bg-white/15 px-4 py-3 text-xs font-semibold"
            onClick={() => onOpenComments?.(id)}
            aria-label={`View comments on ${user}'s post`}
          >
            💬 {comments}
          </button>
        </div>
        <button
          type="button"
          className="btn min-h-[44px] bg-white/15 px-4 py-3 text-xs font-semibold"
          aria-label="Share post"
        >
          🔁 Share
        </button>
      </footer>
    </article>
  );
};

export default PostCard;
