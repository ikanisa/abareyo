'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { dispatchTelemetryEvent } from '@/lib/observability';

type CountResponse = { count: number };

type MembersWidgetProps = {
  className?: string;
};

export default function MembersWidget({ className }: MembersWidgetProps) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const response = await fetch('/api/members/count', { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) {
          throw new Error('failed_to_load');
        }
        const json = (await response.json()) as CountResponse;
        setCount(json.count ?? 0);
      } catch (error) {
        console.warn('Unable to fetch members count', error);
        setCount(null);
      } finally {
        setLoading(false);
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, []);

  const handleClick = (action: 'join' | 'directory') => {
    void dispatchTelemetryEvent({ type: 'members_widget_click', action });
  };

  return (
    <section className={`card space-y-4 ${className ?? ''}`} aria-label="Members widget">
      <div>
        <div className="text-white/90 font-semibold">GIKUNDIRO Members</div>
        <div className="muted text-xs">
          {loading ? 'Loading…' : `${(count ?? 0).toLocaleString()} visible members`}
        </div>
      </div>
      <div className="text-sm text-white/80">
        Join the directory to represent your region and connect with fellow fans.
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/onboarding"
          className="btn-primary inline-flex min-h-[44px] flex-1 items-center justify-center px-5"
          onClick={() => handleClick('join')}
        >
          Join &amp; be visible
        </Link>
        <Link
          href="/members"
          className="btn inline-flex min-h-[44px] flex-1 items-center justify-center px-5"
          onClick={() => handleClick('directory')}
        >
          View directory
        </Link>
      </div>
    </section>
  );
}
