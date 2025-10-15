import Link from 'next/link';
import PageShell from '@/app/_components/shell/PageShell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getSupabase } from '@/app/_lib/supabase';
import type { Database } from '@/integrations/supabase/types';
import MemberProfileAnalytics from './MemberProfileAnalytics';

type PublicMember = Database['public']['Views']['public_members']['Row'];

type MemberProfilePageProps = {
  params: { id: string };
};

export const dynamic = 'force-dynamic';

const formatJoined = (iso: string | null) => {
  if (!iso) {
    return 'Joined recently';
  }
  try {
    return `Joined ${new Date(iso).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    })}`;
  } catch {
    return 'Joined recently';
  }
};

export default async function MemberProfilePage({ params }: MemberProfilePageProps) {
  const supabase = getSupabase();

  if (!supabase) {
    return (
      <PageShell>
        <section className="card space-y-3 text-center">
          <h1 className="text-white">Member profile unavailable</h1>
          <p className="muted text-sm">We could not reach the directory. Please try again later.</p>
          <Link className="btn-primary mx-auto min-h-[44px] px-6" href="/members">
            Back to directory
          </Link>
        </section>
      </PageShell>
    );
  }

  const { data, error } = await supabase
    .from('public_members')
    .select('id, display_name, region, fan_club, joined_at, avatar_url')
    .eq('id', params.id)
    .maybeSingle<PublicMember>();

  if (error || !data) {
    return (
      <PageShell>
        <section className="card space-y-3 text-center">
          <h1 className="text-white">Member not found</h1>
          <p className="muted text-sm">This profile is private or no longer visible.</p>
          <Link className="btn-primary mx-auto min-h-[44px] px-6" href="/members">
            Back to directory
          </Link>
        </section>
      </PageShell>
    );
  }

  const joinedCopy = formatJoined(data.joined_at);

  return (
    <PageShell>
      <section className="card space-y-4" aria-labelledby="member-name">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {data.avatar_url ? (
              <AvatarImage src={data.avatar_url} alt="" />
            ) : (
              <AvatarFallback className="bg-white/15 text-lg font-semibold text-white">
                {data.display_name?.charAt(0).toUpperCase() ?? 'F'}
              </AvatarFallback>
            )}
          </Avatar>
          <div>
            <h1 id="member-name" className="text-white">
              {data.display_name}
            </h1>
            <p className="muted text-sm">
              {data.fan_club} • {data.region}
            </p>
          </div>
        </div>
        <p className="muted text-xs">{joinedCopy}</p>
        <p className="muted text-sm">
          This member chose to appear in the public directory. Respect their privacy and use these details for positive fan
          connections only.
        </p>
        <Link className="btn min-h-[44px] justify-center" href="/members">
          View all members
        </Link>
      </section>
      <MemberProfileAnalytics memberId={data.id} region={data.region} fanClub={data.fan_club} />
    </PageShell>
  );
}
