"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";

import type { Clip } from "@/app/_data/matchday";

type HighlightsRailProps = {
  clips: Clip[];
  activeClip: Clip | null;
  onSelect: (clip: Clip) => void;
  onClose: () => void;
};

const HighlightsRail = ({ clips, activeClip, onSelect, onClose }: HighlightsRailProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const clipContainerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeClip) {
      return;
    }

    const play = () => {
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch(() => undefined);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          play();
        } else {
          video.pause();
        }
      },
      { threshold: 0.6 },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
    };
  }, [activeClip]);

  useEffect(() => {
    if (!activeClip || !clipContainerRef.current || prefersReducedMotion) {
      return;
    }

    const activeNode = clipContainerRef.current.querySelector<HTMLElement>(
      `[data-clip-id="${activeClip.id}"]`,
    );
    activeNode?.scrollIntoView({ behavior: "smooth", inline: "center" });
  }, [activeClip, prefersReducedMotion]);

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={clipContainerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2"
        role="list"
        aria-label="Match highlights"
      >
        {clips.map((clip) => (
          <button
            key={clip.id}
            data-clip-id={clip.id}
            type="button"
            role="listitem"
            onClick={() => onSelect(clip)}
            className="snap-start rounded-2xl border border-white/10 bg-white/5 p-3 text-left text-white/80 transition hover:border-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            aria-pressed={activeClip?.id === clip.id}
          >
            <div className="relative h-32 w-56 overflow-hidden rounded-xl">
              <Image
                src={clip.thumb}
                alt={clip.title}
                fill
                className="object-cover"
                sizes="224px"
              />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-xs font-semibold">
                {clip.t}'
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">{clip.title}</p>
          </button>
        ))}
      </div>

      {activeClip ? (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900">
          <video
            key={activeClip.id}
            ref={videoRef}
            className="w-full"
            controls
            preload="metadata"
            poster={activeClip.thumb}
          >
            <source src={activeClip.src} type="video/mp4" />
          </video>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white"
          >
            Close clip
          </button>
        </div>
      ) : (
        <p className="rounded-2xl bg-slate-900/60 p-4 text-sm text-white/70">
          Tap a highlight to replay big moments. Clips auto-play when in view,
          pausing the main stream to keep you in sync.
        </p>
      )}
    </div>
  );
};

export default HighlightsRail;
