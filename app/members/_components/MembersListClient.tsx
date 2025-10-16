'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { dispatchTelemetryEvent } from '@/lib/observability';

type PublicMember = {
  id: string;
  display_name: string;
  region: string;
  fan_club: string;
  joined_at: string | null;
  avatar_url: string;
  phone: string;
  momo_number: string;
  user_code: string;
};

type MembersResponse = { members: PublicMember[] };
type CountResponse = { count: number };

const fetchMembers = async () => {
  const response = await fetch('/api/members', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load members');
  }
  const json = (await response.json()) as MembersResponse;
  return json.members ?? [];
};

const fetchCount = async () => {
  const response = await fetch('/api/members/count', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to load count');
  }
  const json = (await response.json()) as CountResponse;
  return json.count ?? 0;
};

const maskWhatsapp = (value: string) => {
  if (!value) return 'WhatsApp ready';
  const trimmed = value.replace(/\s+/g, '');
  if (trimmed.length <= 6) return trimmed;
  const prefix = trimmed.slice(0, 4);
  const suffix = trimmed.slice(-2);
  return `${prefix} ••• ${suffix}`;
};

const formatJoined = (iso: string | null) => {
  if (!iso) {
    return 'Joined recently';
  }
  try {
    const date = new Date(iso);
    return `Joined ${date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`;
  } catch {
    return 'Joined recently';
  }
};

const gradients = [
  'from-[#1E2A78] via-[#1B88F5] to-[#53C6F9]',
  'from-[#601E91] via-[#905DF5] to-[#F6B2F1]',
  'from-[#0F766E] via-[#22D3EE] to-[#38BDF8]',
  'from-[#7C3AED] via-[#4C1D95] to-[#0EA5E9]',
];

const MembersSkeleton = () => (
  <div className="card space-y-3" aria-hidden>
    <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {[0, 1, 2, 3].map((key) => (
        <div
          key={key}
          className="rounded-2xl bg-white/10 p-4 shadow-inner shadow-black/10 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 animate-pulse rounded-full bg-white/20" />
            <div className="space-y-2">
              <div className="h-4 w-32 animate-pulse rounded bg-white/20" />
              <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
            </div>
          </div>
          <div className="mt-4 h-3 w-24 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  </div>
);

const SpotlightCard = ({ member }: { member: PublicMember }) => (
  <div
    className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0F172A] via-[#1D4ED8] to-[#1E1B4B] p-6 text-white shadow-[0_40px_80px_-32px_rgba(37,99,235,0.6)]"
  >
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Spotlight fan</p>
        <h2 className="mt-2 text-2xl font-semibold">Fan #{member.user_code}</h2>
        <p className="mt-1 text-sm text-white/70">{maskWhatsapp(member.phone)}</p>
      </div>
      <div className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.28em] text-white/80">
        {formatJoined(member.joined_at)}
      </div>
    </div>
    <div className="mt-6 grid gap-3 text-sm text-white/80 sm:grid-cols-3">
      <div className="rounded-2xl bg-white/10 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-white/60">Region</p>
        <p className="mt-1 font-semibold text-white">{member.region}</p>
      </div>
      <div className="rounded-2xl bg-white/10 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-white/60">Fan club</p>
        <p className="mt-1 font-semibold text-white">{member.fan_club}</p>
      </div>
      <div className="rounded-2xl bg-white/10 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-white/60">MoMo ready</p>
        <p className="mt-1 font-semibold text-white">
          {member.momo_number ? maskWhatsapp(member.momo_number) : 'Added later'}
        </p>
      </div>
    </div>
  </div>
);

export default function MembersListClient() {
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  const membersQuery = useQuery<PublicMember[]>({
    queryKey: ['members', 'directory'],
    queryFn: fetchMembers,
    placeholderData: (previousData) => previousData,
  });

  const countQuery = useQuery<number>({
    queryKey: ['members', 'count'],
    queryFn: fetchCount,
    staleTime: 60_000,
  });

  const members = membersQuery.data ?? [];
  const visibleCount = countQuery.data ?? members.length;
  const spotlightMember = members[spotlightIndex] ?? members[0] ?? null;

  useEffect(() => {
    if (!members.length) {
      return undefined;
    }
    const id = window.setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % members.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [members.length]);

  useEffect(() => {
    if (membersQuery.isSuccess) {
      void dispatchTelemetryEvent({
        type: 'members_viewed',
        total: members.length,
      });
    }
  }, [members.length, membersQuery.isSuccess]);

  const rows = useMemo(() => members.slice(0, 24), [members]);

  if (membersQuery.isLoading) {
    return <MembersSkeleton />;
  }

  if (membersQuery.isError) {
    return (
      <div className="card space-y-2" role="alert">
        <div className="text-white/90 font-semibold">Unable to load members</div>
        <div className="muted text-sm">Please refresh or try again in a moment.</div>
      </div>
    );
  }

  if (!members.length) {
    return (
      <div className="card space-y-3 text-center" role="status">
        <div className="text-white/90 font-semibold">Be the first to appear</div>
        <div className="muted text-sm">Your WhatsApp presence unlocks the live directory.</div>
        <Link href="/onboarding" className="btn-primary mx-auto mt-2 min-h-[44px] px-6">
          Join the directory
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[32px] bg-gradient-to-br from-[#0EA5E9]/20 via-[#3B82F6]/10 to-[#1E1B4B]/30 p-[1px]">
        <div className="rounded-[30px] bg-slate-950/80 p-6 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">Live fan presence</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{visibleCount.toLocaleString()} fans visible</h2>
              <p className="mt-1 text-sm text-white/70">
                Every profile is powered by a verified WhatsApp number. Toggle your visibility anytime.
              </p>
            </div>
            <Link className="btn-primary min-h-[48px] self-start px-6" href="/onboarding">
              Join &amp; light up
            </Link>
          </div>
          {spotlightMember ? <div className="mt-6"><SpotlightCard member={spotlightMember} /></div> : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((member, index) => {
          const gradient = gradients[index % gradients.length];
          return (
            <Link
              key={member.id}
              href={`/members/${member.id}`}
              className={`relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_30px_60px_-24px_rgba(15,23,42,0.8)] transition-transform hover:-translate-y-1 hover:shadow-[0_40px_70px_-30px_rgba(59,130,246,0.45)]`}
            >
              <div className={`pointer-events-none absolute inset-0 opacity-70 blur-3xl bg-gradient-to-br ${gradient}`} />
              <div className="relative flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-white/20 bg-white/10">
                  {member.avatar_url ? (
                    <AvatarImage src={member.avatar_url} alt="" />
                  ) : (
                    <AvatarFallback className="bg-white/20 text-base font-semibold text-white">
                      {member.user_code.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="text-sm uppercase tracking-[0.28em] text-white/60">Fan #{member.user_code}</div>
                  <div className="mt-1 text-lg font-semibold text-white">{maskWhatsapp(member.phone)}</div>
                  <div className="muted text-xs">{member.fan_club} • {member.region}</div>
                </div>
              </div>
              <div className="relative mt-5 flex items-center justify-between text-xs text-white/70">
                <span>{formatJoined(member.joined_at)}</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.32em]">
                  {member.momo_number ? 'MoMo linked' : 'MoMo later'}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
