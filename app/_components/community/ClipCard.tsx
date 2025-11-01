"use client";

import { type KeyboardEvent, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { Clip } from "@/app/_data/community";
import { OptimizedImage } from "@/components/ui/optimized-image";

type ClipCardProps = Clip & {
  isActive?: boolean;
  onOpenComments?: () => void;
};

const ClipCard = ({
  title,
  src,
  likes,
  comments,
  duration,
  thumbnail,
  isActive = false,
  onOpenComments,
}: ClipCardProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!videoRef.current || prefersReducedMotion) return;
    if (isActive) {
      void videoRef.current.play().catch(() => null);
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive, prefersReducedMotion]);

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!onOpenComments) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpenComments();
    }
  };

  return (
    <motion.article
      layout
      className={`relative flex h-[460px] w-full flex-col justify-end overflow-hidden rounded-[28px] border border-white/20 p-5 text-white shadow-2xl ${
        isActive ? "bg-white/20" : "bg-white/10"
      }`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: isActive ? 1 : 0.96 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      aria-label={title}
      role="group"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0">
        {prefersReducedMotion ? (
          <OptimizedImage
            src={thumbnail}
            alt=""
            fill
            className="object-cover"
            priority={isActive}
            sizes="(max-width: 640px) 100vw, 420px"
          />
        ) : (
          <video
            ref={videoRef}
            src={src}
            poster={thumbnail}
            loop
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      <div className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-white/80">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-semibold">{duration}</span>
          <span className="chip bg-white/20 text-xs">Highlights</span>
        </div>
        <h4 className="text-lg font-semibold leading-tight">{title}</h4>
        <div className="flex items-center gap-4 text-sm text-white/80">
          <span className="inline-flex items-center gap-1">❤️ {likes.toLocaleString()}</span>
          <span className="inline-flex items-center gap-1">💬 {comments.toLocaleString()}</span>
          <button
            type="button"
            className="ml-auto btn min-h-[44px] bg-white/25 px-4 py-3 text-sm font-semibold"
            onClick={onOpenComments}
            aria-label={`Open comments for ${title}`}
          >
            Comment
          </button>
        </div>
      </div>
    </motion.article>
  );
};

export default ClipCard;
