'use client';

import { useEffect, useMemo, useState } from 'react';

import useFlags from '@/app/_components/flags/useFlags';

type TimelineEvent = {
  min: number;
  event: string;
};

type LiveScore = {
  matchId: string;
  home: string;
  away: string;
  score: string;
  minute: number;
  timeline?: TimelineEvent[];
};

export default function LiveScoreWidget() {
  const flags = useFlags();
  const enabled = flags['features.liveScores'];
  const [score, setScore] = useState<LiveScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/live/scoreboard', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch score');
        }
        const payload = (await response.json()) as LiveScore;
        if (mounted) {
          setScore(payload);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setError('Live updates temporarily unavailable.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();
    const timer = setInterval(load, 12000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [enabled]);

  const timeline = useMemo(() => score?.timeline ?? [], [score]);

  if (!enabled) {
    return null;
  }

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Live score</h2>
        {loading && <span className="text-xs text-white/60">Updating…</span>}
      </div>

      {error && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}

      <div className="rounded-2xl bg-black/20 p-4">
        {score ? (
          <div className="space-y-2">
            <div className="text-lg font-semibold">
              ⚽ {score.home} vs {score.away}
            </div>
            <p className="text-2xl font-bold text-white">{score.score}</p>
            <p className="text-sm text-white/70">{score.minute}' minute • Match #{score.matchId}</p>
          </div>
        ) : (
          <p className="text-sm text-white/70">{loading ? 'Fetching live score…' : 'No live match right now.'}</p>
        )}
      </div>

      {timeline.length > 0 && (
        <ol className="space-y-2">
          {timeline.map((item) => (
            <li key={`${item.min}-${item.event}`} className="rounded-2xl bg-black/25 px-3 py-2 text-sm">
              <span className="font-semibold text-white">{item.min}'</span>
              <span className="ml-2 text-white/80">{item.event}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
