'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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
};

type MembersResponse = { members: PublicMember[] };
type CountResponse = { count: number };

type SortOption = 'recent' | 'name';

const REGIONS = [
  'Kigali',
  'Huye',
  'Musanze',
  'Rubavu',
  'Rusizi',
  'Nyagatare',
  'Rwamagana',
  'Bugesera',
  'Muhanga',
  'Karongi',
];

const FAN_CLUBS = [
  'Rayon SC Kigali',
  'Rayon SC Huye',
  'Rayon SC Rubavu',
  'Rayon SC Musanze',
  'Rayon SC Rusizi',
  'Rayon SC Diaspora',
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'name', label: 'Name A–Z' },
];

const useDebouncedValue = <T,>(value: T, delay = 250) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
};

const fetchMembers = async ({
  q,
  region,
  fanClub,
  sort,
}: {
  q: string;
  region: string;
  fanClub: string;
  sort: SortOption;
}) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (region) params.set('region', region);
  if (fanClub) params.set('fan_club', fanClub);
  if (sort && sort !== 'recent') params.set('sort', sort);
  const response = await fetch(`/api/members?${params.toString()}`, { cache: 'no-store' });
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

const formatJoined = (iso: string | null) => {
  if (!iso) {
    return 'Since —';
  }
  try {
    const date = new Date(iso);
    return `Since ${date.toLocaleDateString(undefined, {
      month: 'short',
      year: 'numeric',
    })}`;
  } catch {
    return 'Since —';
  }
};

const MembersSkeleton = () => (
  <div className="card space-y-3" aria-hidden>
    <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
    {[0, 1, 2].map((key) => (
      <div key={key} className="tile flex min-h-[56px] items-center justify-between gap-3 bg-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-white/20" />
          <div>
            <div className="h-4 w-32 animate-pulse rounded bg-white/20" />
            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-white/10" />
          </div>
        </div>
        <div className="h-3 w-20 animate-pulse rounded bg-white/10" />
      </div>
    ))}
  </div>
);

export default function MembersListClient() {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState('');
  const [fanClub, setFanClub] = useState('');
  const [sort, setSort] = useState<SortOption>('recent');

  const debouncedSearch = useDebouncedValue(search, 320);

  const membersQuery = useQuery<PublicMember[]>({
    queryKey: ['members', { q: debouncedSearch, region, fanClub, sort }],
    queryFn: () => fetchMembers({ q: debouncedSearch, region, fanClub, sort }),
    placeholderData: (previousData) => previousData,
  });

  const countQuery = useQuery<number>({
    queryKey: ['members', 'count'],
    queryFn: fetchCount,
    staleTime: 60_000,
  });

  const members = membersQuery.data ?? [];
  const visibleCount = countQuery.data ?? members.length;
  const analyticsKey = useMemo(
    () => JSON.stringify({ q: debouncedSearch, region, fanClub, sort }),
    [debouncedSearch, region, fanClub, sort],
  );

  const lastViewedRef = useRef<string | null>(null);
  const lastSearchRef = useRef<string>('');

  useEffect(() => {
    if (membersQuery.isSuccess) {
      if (lastViewedRef.current !== analyticsKey) {
        lastViewedRef.current = analyticsKey;
        void dispatchTelemetryEvent({
          type: 'members_viewed',
          total: members.length,
          region: region || 'all',
          fan_club: fanClub || 'all',
          sort,
          query: debouncedSearch || null,
        });
      }
      if (debouncedSearch && lastSearchRef.current !== debouncedSearch) {
        lastSearchRef.current = debouncedSearch;
        void dispatchTelemetryEvent({
          type: 'directory_search',
          query: debouncedSearch,
          region: region || 'all',
          fan_club: fanClub || 'all',
        });
      }
    }
  }, [analyticsKey, debouncedSearch, fanClub, members.length, membersQuery.isSuccess, region, sort]);

  const hasFilters = region !== '' || fanClub !== '' || debouncedSearch !== '' || sort !== 'recent';

  const resetFilters = () => {
    setSearch('');
    setRegion('');
    setFanClub('');
    setSort('recent');
  };

  return (
    <section className="space-y-4">
      <div className="card space-y-4" aria-label="Member directory filters">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="text-white/90 font-semibold">Visible members</div>
            <div className="muted text-xs">{visibleCount.toLocaleString()} profiles opted in</div>
          </div>
          {hasFilters ? (
            <button type="button" className="btn min-h-[44px] px-4" onClick={resetFilters}>
              Reset
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-white/80">
            <span>Name search</span>
            <input
              className="rounded-xl bg-black/25 px-3 py-3 text-white outline-none"
              placeholder="Search members"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoComplete="off"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/80">
            <span>Sort by</span>
            <select
              className="rounded-xl bg-black/25 px-3 py-3 text-white outline-none"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/80">
            <span>Region</span>
            <select
              className="rounded-xl bg-black/25 px-3 py-3 text-white outline-none"
              value={region}
              onChange={(event) => setRegion(event.target.value)}
            >
              <option value="">All regions</option>
              {REGIONS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm text-white/80">
            <span>Fan club</span>
            <select
              className="rounded-xl bg-black/25 px-3 py-3 text-white outline-none"
              value={fanClub}
              onChange={(event) => setFanClub(event.target.value)}
            >
              <option value="">All fan clubs</option>
              {FAN_CLUBS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
              <option value="Other">Other / request</option>
            </select>
          </label>
        </div>
      </div>

      {membersQuery.isLoading ? (
        <MembersSkeleton />
      ) : membersQuery.isError ? (
        <div className="card space-y-2" role="alert">
          <div className="text-white/90 font-semibold">Unable to load members</div>
          <div className="muted text-sm">Please refresh or try again in a moment.</div>
        </div>
      ) : members.length === 0 ? (
        <div className="card space-y-2 text-center" role="status">
          <div className="text-white/90 font-semibold">No members yet in this filter</div>
          <div className="muted text-sm">Try All to reset filters.</div>
          <button type="button" className="btn-primary mx-auto mt-2 min-h-[44px] px-6" onClick={resetFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="card space-y-3" role="list">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/members/${member.id}`}
              className="tile flex min-h-[64px] items-center justify-between gap-4 text-left"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  {member.avatar_url ? (
                    <AvatarImage src={member.avatar_url} alt="" />
                  ) : (
                    <AvatarFallback className="bg-white/15 text-sm font-semibold text-white">
                      {member.display_name?.charAt(0).toUpperCase() ?? 'F'}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="text-white/90 font-semibold">{member.display_name}</div>
                  <div className="muted text-xs">
                    {member.fan_club} • {member.region}
                  </div>
                </div>
              </div>
              <span className="muted text-xs">{formatJoined(member.joined_at)}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
