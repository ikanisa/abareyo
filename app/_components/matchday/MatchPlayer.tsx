"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import type Hls from "hls.js";

import PlayerControls from "./PlayerControls";
import type { StreamSource } from "@/app/_data/matchday";

type MatchPlayerProps = {
  sources: StreamSource[];
  qualityOptions: (360 | 480 | 720)[];
  lowDataDefault?: boolean;
  externalPause?: boolean;
  hideMini?: boolean;
  audioSrc?: string;
};

const HLS_MIME_TYPES = [
  "application/vnd.apple.mpegurl",
  "application/x-mpegURL",
];

const canPlayHlsNatively = (video: HTMLVideoElement) =>
  HLS_MIME_TYPES.some((type) => video.canPlayType(type) !== "");

const findNearestLevel = (levels: Hls["levels"], desiredHeight: number) => {
  if (!levels?.length) {
    return -1;
  }

  let candidate = -1;
  let diff = Number.POSITIVE_INFINITY;

  levels.forEach((level, index) => {
    if (!level.height) {
      return;
    }
    const currentDiff = Math.abs(level.height - desiredHeight);
    if (currentDiff < diff) {
      candidate = index;
      diff = currentDiff;
    }
  });

  return candidate;
};

const pickSource = (
  sources: StreamSource[],
  quality: 360 | 480 | 720,
): StreamSource =>
  sources.find((item) => item.quality === quality) ?? sources[0];

const getInitialQuality = (
  available: (360 | 480 | 720)[],
  lowDataDefault?: boolean,
): 360 | 480 | 720 => {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem("matchday-quality");
    if (stored) {
      const parsed = Number.parseInt(stored, 10) as 360 | 480 | 720;
      if (available.includes(parsed)) {
        return parsed;
      }
    }
  }

  if (lowDataDefault && available.includes(360)) {
    return 360;
  }

  if (typeof window !== "undefined" && window.innerWidth > 1080) {
    return available.includes(720) ? 720 : available[available.length - 1];
  }

  return available.includes(480) ? 480 : available[0];
};

const MatchPlayer = ({
  sources,
  qualityOptions,
  lowDataDefault,
  externalPause,
  hideMini,
  audioSrc,
}: MatchPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resumeRef = useRef(false);
  const visibilityResumeRef = useRef(false);
  const audioResumeRef = useRef(false);
  const hlsRef = useRef<Hls | null>(null);

  const [quality, setQuality] = useState<360 | 480 | 720>(() =>
    getInitialQuality(qualityOptions, lowDataDefault),
  );
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [lowDataMode, setLowDataMode] = useState(lowDataDefault ?? false);
  const [isMini, setIsMini] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const isPlayingRef = useRef(isPlaying);
  const externalPauseRef = useRef(Boolean(externalPause));
  const isVisibleRef = useRef(isVisible);
  const qualityRef = useRef(quality);
  const lowDataModeRef = useRef(lowDataMode);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    externalPauseRef.current = Boolean(externalPause);
  }, [externalPause]);

  useEffect(() => {
    isVisibleRef.current = isVisible;
  }, [isVisible]);

  useEffect(() => {
    qualityRef.current = quality;
  }, [quality]);

  useEffect(() => {
    lowDataModeRef.current = lowDataMode;
  }, [lowDataMode]);

  const selectedSource = useMemo(
    () => pickSource(sources, quality),
    [sources, quality],
  );

  const playMedia = (media: HTMLMediaElement | null) => {
    if (!media) {
      return;
    }
    const playPromise = media.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      setIsPlaying(true);
    }
  };

  const pauseMedia = (media: HTMLMediaElement | null) => {
    if (!media) {
      return;
    }
    media.pause();
    setIsPlaying(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem("matchday-quality", quality.toString());
  }, [quality]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = () => setPrefersReducedMotion(media.matches);
    setPrefersReducedMotion(media.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (!lowDataMode) {
      return;
    }

    if (quality !== 360 && qualityOptions.includes(360)) {
      setQuality(360);
    }
  }, [lowDataMode, quality, qualityOptions]);

  useEffect(() => {
    if (!audioSrc && isAudioOnly) {
      setIsAudioOnly(false);
    }
  }, [audioSrc, isAudioOnly]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) {
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      setIsMini(rect.top < -120);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting || entry.intersectionRatio > 0);
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (isAudioOnly) {
      visibilityResumeRef.current = false;
      const wasVideoPlaying =
        video ? !video.paused && !video.ended && video.readyState > 1 : false;
      audioResumeRef.current = wasVideoPlaying;
      if (video) {
        video.pause();
      }

      if (!audio || !audioSrc) {
        setIsPlaying(false);
        return;
      }

      audio.src = audioSrc;
      audio.load();
      audio.muted = isMuted;

      if (wasVideoPlaying || isPlayingRef.current) {
        playMedia(audio);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
      return;
    }

    if (!audio) {
      return;
    }

    const wasAudioPlaying = !audio.paused && !audio.ended && audio.currentTime > 0;
    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    if (wasAudioPlaying || audioResumeRef.current) {
      audioResumeRef.current = false;
      if (video && !externalPauseRef.current && isVisibleRef.current) {
        playMedia(video);
      }
    }
  }, [audioSrc, isAudioOnly, isMuted]);

  useEffect(() => {
    const activeMedia = isAudioOnly ? audioRef.current : videoRef.current;
    if (!activeMedia) {
      resumeRef.current = false;
      return;
    }

    if (externalPause) {
      const wasPlaying = !activeMedia.paused && !activeMedia.ended;
      resumeRef.current = wasPlaying;
      if (wasPlaying) {
        pauseMedia(activeMedia);
      }
    } else if (resumeRef.current) {
      const shouldResume = resumeRef.current;
      resumeRef.current = false;
      if (shouldResume && (isAudioOnly || isVisibleRef.current)) {
        playMedia(activeMedia);
      }
    }
  }, [externalPause, isAudioOnly]);

  useEffect(() => {
    if (isAudioOnly) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (!isVisible) {
      const wasPlaying = !video.paused && !video.ended;
      visibilityResumeRef.current = wasPlaying;
      if (wasPlaying) {
        pauseMedia(video);
      }
    } else if (visibilityResumeRef.current && !externalPauseRef.current) {
      visibilityResumeRef.current = false;
      playMedia(video);
    }
  }, [isAudioOnly, isVisible]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isAudioOnly) {
      return;
    }

    if (
      selectedSource.type === "hls" &&
      hlsRef.current &&
      !canPlayHlsNatively(video)
    ) {
      return;
    }

    video.load();
    if (
      isPlayingRef.current &&
      !externalPauseRef.current &&
      isVisibleRef.current
    ) {
      playMedia(video);
    }
  }, [isAudioOnly, selectedSource]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isAudioOnly) {
      return;
    }

    if (selectedSource.type !== "hls") {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    if (canPlayHlsNatively(video)) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    let cancelled = false;

    const setup = async () => {
      const { default: HlsCtor } = await import("hls.js");
      if (cancelled) {
        return;
      }
      if (!HlsCtor.isSupported()) {
        return;
      }

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      const hls = new HlsCtor({
        autoStartLoad: !externalPauseRef.current && !isAudioOnly,
        capLevelToPlayerSize: true,
        startLevel: -1,
      });
      hlsRef.current = hls;

      const applyLevel = () => {
        const targetHeight = lowDataModeRef.current ? 360 : qualityRef.current;
        const levelIndex = findNearestLevel(hls.levels, targetHeight);
        if (levelIndex >= 0) {
          hls.currentLevel = levelIndex;
        }
      };

      video.pause();
      video.removeAttribute("src");
      video.load();

      hls.on(HlsCtor.Events.MEDIA_ATTACHED, () => {
        if (isMuted) {
          video.muted = true;
        }
      });

      hls.on(HlsCtor.Events.MANIFEST_PARSED, () => {
        applyLevel();
        if (
          isPlayingRef.current &&
          !externalPauseRef.current &&
          isVisibleRef.current
        ) {
          playMedia(video);
        }
      });

      hls.on(HlsCtor.Events.ERROR, (_, data) => {
        if (data?.fatal) {
          hls.destroy();
          hlsRef.current = null;
          video.src = selectedSource.url;
          video.load();
          if (
            isPlayingRef.current &&
            !externalPauseRef.current &&
            isVisibleRef.current
          ) {
            playMedia(video);
          }
        }
      });

      hls.loadSource(selectedSource.url);
      hls.attachMedia(video);
    };

    void setup();

    return () => {
      cancelled = true;
    };
  }, [isAudioOnly, selectedSource]);

  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls) {
      return;
    }

    const targetHeight = lowDataMode ? 360 : quality;
    const levelIndex = findNearestLevel(hls.levels, targetHeight);
    if (levelIndex >= 0) {
      hls.currentLevel = levelIndex;
    }
  }, [quality, lowDataMode]);

  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls) {
      return;
    }

    if (isAudioOnly || externalPause) {
      hls.stopLoad();
    } else {
      hls.startLoad();
    }
  }, [externalPause, isAudioOnly]);

  const handlePlayToggle = () => {
    const media = isAudioOnly ? audioRef.current : videoRef.current;
    if (!media) {
      return;
    }

    if (isPlaying) {
      pauseMedia(media);
    } else {
      playMedia(media);
    }
  };

  const handleMuteToggle = () => {
    const media = isAudioOnly ? audioRef.current : videoRef.current;
    if (!media) {
      return;
    }

    const nextMuted = !isMuted;
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    if (audioRef.current) {
      audioRef.current.muted = nextMuted;
    }
    setIsMuted(nextMuted);
  };

  const handleQualityChange = (value: 360 | 480 | 720) => {
    setQuality(value);
  };

  const handleAudioOnlyToggle = (next: boolean) => {
    if (next && !audioSrc) {
      return;
    }
    setIsAudioOnly(next);
  };

  const handleLowDataToggle = (next: boolean) => {
    setLowDataMode(next);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.requestFullscreen) {
      void video.requestFullscreen();
    }
  };

  return (
    <section ref={containerRef} className="relative">
      <div
        className={clsx(
          "group relative aspect-video overflow-hidden rounded-3xl bg-slate-900 shadow-2xl",
          isMini && !hideMini
            ? "fixed bottom-5 right-4 z-40 w-48 origin-bottom-right shadow-xl"
            : "w-full",
        )}
        style={
          isMini && !hideMini
            ? {
                transform: "scale(0.35)",
                transformOrigin: "bottom right",
                transition: prefersReducedMotion
                  ? undefined
                  : "transform 0.25s ease",
              }
            : prefersReducedMotion
            ? undefined
            : { transition: "transform 0.25s ease" }
        }
      >
        <video
          ref={videoRef}
          className={clsx(
            "h-full w-full object-cover",
            isAudioOnly && "invisible",
          )}
          src={selectedSource.url}
          poster="/highlights/player-poster.jpg"
          controls={false}
          playsInline
          preload="metadata"
          muted={isMuted}
          onEnded={() => setIsPlaying(false)}
        />

        {isAudioOnly ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 text-center text-white">
            <p className="text-sm font-semibold uppercase tracking-wider">
              Audio-only mode
            </p>
            <p className="max-w-xs text-xs text-white/70">
              Live commentary keeps rolling while video streaming is paused to
              conserve data.
            </p>
            <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide text-cyan-100">
              Low bandwidth • 64kbps mock feed
            </span>
          </div>
        ) : null}

        {isMini && !hideMini ? (
          <div
            className="absolute inset-0 rounded-3xl ring-2 ring-cyan-300/50"
            aria-hidden="true"
          />
        ) : null}

        <audio
          ref={audioRef}
          preload="none"
          className="hidden"
          onEnded={() => setIsPlaying(false)}
        />
      </div>

      <div className="mt-4">
        <PlayerControls
          isPlaying={isPlaying}
          onPlayToggle={handlePlayToggle}
          isMuted={isMuted}
          onMuteToggle={handleMuteToggle}
          qualityOptions={qualityOptions}
          currentQuality={quality}
          onQualityChange={handleQualityChange}
          isAudioOnly={isAudioOnly}
          onAudioOnlyToggle={handleAudioOnlyToggle}
          lowDataMode={lowDataMode}
          onLowDataToggle={handleLowDataToggle}
          onFullscreen={handleFullscreen}
          audioAvailable={Boolean(audioSrc)}
        />
      </div>
    </section>
  );
};

export default MatchPlayer;
