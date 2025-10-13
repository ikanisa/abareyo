"use client";

import { motion, useReducedMotion } from "framer-motion";

import EmptyState from "@/app/_components/ui/EmptyState";
import type { HighlightClip } from "@/app/_data/matches";

type HighlightsCarouselProps = {
  clips: HighlightClip[];
};

const HighlightsCarousel = ({ clips }: HighlightsCarouselProps) => {
  const reduceMotion = useReducedMotion();

  if (!clips || clips.length === 0) {
    return (
      <EmptyState
        title="No highlights yet"
        description="Video recaps appear moments after kick-off. Check back shortly."
        icon="🎥"
      />
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-2" role="list" aria-label="Match highlights">
      {clips.map((clip, index) => (
        <motion.article
          key={clip.id}
          role="listitem"
          className="relative min-w-[220px] max-w-[240px] overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/40 via-blue-400/20 to-blue-200/10 p-[1px]"
          initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: reduceMotion ? 0 : index * 0.05, ease: "easeOut" }}
        >
          <div className="flex h-full flex-col justify-between rounded-3xl bg-black/40 p-4 text-white">
            <div className="space-y-3">
              <div
                className="h-32 w-full rounded-2xl bg-cover bg-center"
                style={{ backgroundImage: `url(${clip.thumbnail})` }}
                aria-hidden="true"
              />
              <h3 className="text-base font-semibold leading-tight">{clip.title}</h3>
            </div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span className="rounded-full bg-white/10 px-2 py-1 font-semibold">{clip.duration}</span>
              <span>{clip.published}</span>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
};

export default HighlightsCarousel;
