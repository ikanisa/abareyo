'use client';

import { useEffect } from 'react';
import { dispatchTelemetryEvent } from '@/lib/observability';

type MemberProfileAnalyticsProps = {
  memberId: string;
  region: string | null;
  fanClub: string | null;
};

export default function MemberProfileAnalytics({ memberId, region, fanClub }: MemberProfileAnalyticsProps) {
  useEffect(() => {
    void dispatchTelemetryEvent({
      type: 'member_profile_viewed',
      member_id: memberId,
      region: region || '—',
      fan_club: fanClub || '—',
    });
  }, [memberId, region, fanClub]);

  return null;
}
