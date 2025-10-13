"use client";

import { useCallback, useMemo, useState } from "react";

import ActionRail from "@/app/_components/matchday/ActionRail";
import FanChat from "@/app/_components/matchday/FanChat";
import H2HBoard from "@/app/_components/matchday/H2HBoard";
import HighlightsRail from "@/app/_components/matchday/HighlightsRail";
import LineupsBoard from "@/app/_components/matchday/LineupsBoard";
import MatchPlayer from "@/app/_components/matchday/MatchPlayer";
import SegmentedTabs from "@/app/_components/matchday/SegmentedTabs";
import StatsBoard from "@/app/_components/matchday/StatsBoard";
import StreamingHero from "@/app/_components/matchday/StreamingHero";
import TimelineList from "@/app/_components/matchday/TimelineList";
import {
  awayLineup,
  audioStream,
  headToHead,
  highlightClips,
  matchEvents,
  matchMeta,
  matchStats,
  homeLineup,
  streamSources,
} from "@/app/_data/matchday";

const tabs = ["Highlights", "Timeline", "Stats", "Line-ups", "H2H", "Chat"] as const;

const MatchdayPage = () => {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Highlights");
  const [activeClip, setActiveClip] = useState<typeof highlightClips[number] | null>(
    null,
  );

  const qualityOptions = useMemo<(360 | 480 | 720)[]>(() => [360, 480, 720], []);

  const handleTabChange = useCallback((tab: string) => {
    const typedTab = tabs.includes(tab as (typeof tabs)[number])
      ? (tab as (typeof tabs)[number])
      : "Highlights";
    setActiveTab(typedTab);
    if (typedTab !== "Highlights") {
      setActiveClip(null);
    }
  }, []);

  const handleClipSelect = useCallback((clip: (typeof highlightClips)[number]) => {
    setActiveClip(clip);
  }, []);

  const handleClipClose = useCallback(() => {
    setActiveClip(null);
  }, []);

  const handleAction = useCallback((label: string) => {
    console.info(`Action selected: ${label}`);
  }, []);

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 pb-24 pt-6 text-white">
      <StreamingHero match={matchMeta} />

      <MatchPlayer
        sources={streamSources}
        qualityOptions={qualityOptions}
        lowDataDefault
        externalPause={Boolean(activeClip)}
        hideMini={activeTab === "Highlights" && Boolean(activeClip)}
        audioSrc={audioStream}
      />

      <SegmentedTabs tabs={[...tabs]} onTabChange={handleTabChange} initialTab={activeTab}>
        <HighlightsRail
          clips={highlightClips}
          activeClip={activeClip}
          onSelect={handleClipSelect}
          onClose={handleClipClose}
        />
        <TimelineList events={matchEvents} />
        <StatsBoard stats={matchStats} />
        <LineupsBoard home={homeLineup} away={awayLineup} />
        <H2HBoard data={headToHead} />
        <FanChat roomId={matchMeta.id} />
      </SegmentedTabs>

      <ActionRail
        onPredict={() => handleAction("Predict")}
        onTickets={() => handleAction("Tickets")}
        onShop={() => handleAction("Shop")}
        onDonate={() => handleAction("Donate")}
      />
    </main>
  );
};

export default MatchdayPage;
