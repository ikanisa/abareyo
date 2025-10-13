"use client";

import clsx from "clsx";

type PlayerControlsProps = {
  isPlaying: boolean;
  onPlayToggle: () => void;
  isMuted: boolean;
  onMuteToggle: () => void;
  qualityOptions: (360 | 480 | 720)[];
  currentQuality: 360 | 480 | 720;
  onQualityChange: (quality: 360 | 480 | 720) => void;
  isAudioOnly: boolean;
  onAudioOnlyToggle: (next: boolean) => void;
  lowDataMode: boolean;
  onLowDataToggle: (next: boolean) => void;
  onFullscreen?: () => void;
  audioAvailable?: boolean;
};

const PlayerControls = ({
  isPlaying,
  onPlayToggle,
  isMuted,
  onMuteToggle,
  qualityOptions,
  currentQuality,
  onQualityChange,
  isAudioOnly,
  onAudioOnlyToggle,
  lowDataMode,
  onLowDataToggle,
  onFullscreen,
  audioAvailable = true,
}: PlayerControlsProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-slate-900/80 p-4 text-white shadow-inner">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPlayToggle}
          className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label={isPlaying ? "Pause stream" : "Play stream"}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onMuteToggle}
            className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label={isMuted ? "Unmute stream" : "Mute stream"}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>
          {onFullscreen ? (
            <button
              type="button"
              onClick={onFullscreen}
              className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Expand
            </button>
          ) : null}
        </div>
      </div>

      <fieldset className="flex flex-col gap-2 text-xs" aria-label="Quality options">
        <legend className="text-[0.7rem] uppercase tracking-wide text-white/60">
          Quality
        </legend>
        <div className="flex gap-2">
          {qualityOptions.map((quality) => (
            <label
              key={quality}
              className={clsx(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1",
                currentQuality === quality
                  ? "border-white bg-white/20"
                  : "border-white/20 bg-transparent",
              )}
            >
              <input
                type="radio"
                name="quality"
                value={quality}
                checked={currentQuality === quality}
                onChange={() => onQualityChange(quality)}
                className="accent-cyan-400"
              />
              <span>{quality}p</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 text-xs">
        <label
          className="flex items-center justify-between gap-3"
          aria-disabled={!audioAvailable}
        >
          <span className="uppercase tracking-wide text-white/60">
            Audio only
          </span>
          <input
            type="checkbox"
            checked={isAudioOnly}
            onChange={(event) => onAudioOnlyToggle(event.target.checked)}
            className="h-4 w-4 accent-cyan-400"
            disabled={!audioAvailable}
            title={
              audioAvailable
                ? undefined
                : "Audio commentary will be added when rights allow"
            }
          />
        </label>
        {!audioAvailable ? (
          <p className="text-[0.65rem] uppercase tracking-wide text-white/40">
            Audio feed unavailable
          </p>
        ) : null}
        <label className="flex items-center justify-between gap-3">
          <span className="uppercase tracking-wide text-white/60">
            Data saver
          </span>
          <input
            type="checkbox"
            checked={lowDataMode}
            onChange={(event) => onLowDataToggle(event.target.checked)}
            className="h-4 w-4 accent-cyan-400"
          />
        </label>
      </div>
    </div>
  );
};

export default PlayerControls;
