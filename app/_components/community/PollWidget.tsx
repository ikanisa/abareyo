"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { Poll } from "@/app/_data/community";

type PollWidgetProps = Poll & {
  onVote?: (pollId: string, optionId: string) => void;
};

const PollWidget = ({ id, q, options, voted, onVote }: PollWidgetProps) => {
  const prefersReducedMotion = useReducedMotion();
  const [selection, setSelection] = useState<string | undefined>(voted);
  const [localOptions, setLocalOptions] = useState(options);

  const totalVotes = useMemo(
    () => localOptions.reduce((sum, option) => sum + option.votes, 0),
    [localOptions],
  );

  const handleVote = (optionId: string) => {
    if (selection) return;
    setSelection(optionId);
    setLocalOptions((prev) =>
      prev.map((option) =>
        option.id === optionId
          ? {
              ...option,
              votes: option.votes + 1,
            }
          : option,
      ),
    );
    onVote?.(id, optionId);
  };

  return (
    <section className="card space-y-4 text-white" aria-labelledby={`${id}-poll-title`}>
      <div className="flex items-start justify-between gap-3">
        <h4 id={`${id}-poll-title`} className="text-base font-semibold">
          {q}
        </h4>
        <span className="chip bg-white/15 text-xs">{totalVotes} votes</span>
      </div>

      <div className="space-y-3">
        {localOptions.map((option) => {
          const votes = option.votes;
          const ratio = totalVotes === 0 ? 0 : votes / totalVotes;
          const percent = Math.round(ratio * 100);
          const isSelected = selection === option.id;

          const progressWidth = `${ratio * 100}%`;

          return (
            <motion.button
              key={option.id}
              type="button"
              whileTap={{ scale: prefersReducedMotion ? 1 : 0.98 }}
              onClick={() => handleVote(option.id)}
              className={`relative w-full min-h-[56px] overflow-hidden rounded-2xl border px-4 py-4 text-left ${
                isSelected ? "border-white/80 bg-white/20" : "border-white/20 bg-white/10"
              }`}
              aria-pressed={isSelected}
              aria-disabled={Boolean(selection)}
              disabled={Boolean(selection)}
            >
              <motion.span
                className="absolute inset-y-0 left-0 bg-blue-500/35"
                initial={false}
                animate={{ width: progressWidth }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.35, ease: "easeOut" }}
                aria-hidden
              />
              <span className="relative flex items-center justify-between text-sm font-semibold">
                <span>{option.text}</span>
                <span className="text-xs text-white/80">{percent}%</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      {selection ? (
        <p className="text-xs text-white/70" aria-live="polite">
          You voted for option {selection.toUpperCase()} · Thanks for making your voice heard.
        </p>
      ) : (
        <p className="text-xs text-white/70">Tap to vote. Results reveal instantly after your choice.</p>
      )}
    </section>
  );
};

export default PollWidget;
