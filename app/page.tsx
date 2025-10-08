"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import HomeView from '@/views/HomeView';

const ONBOARDING_STATUS_KEY = 'onboarding:completed';

const Page = () => {
  const router = useRouter();
  const [shouldRenderHome, setShouldRenderHome] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const status = window.localStorage.getItem(ONBOARDING_STATUS_KEY);
    if (status === 'completed' || status === 'true') {
      setShouldRenderHome(true);
    } else {
      router.replace('/onboarding');
    }
  }, [router]);

  if (!shouldRenderHome) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        Preparing your Rayon experience…
      </div>
    );
  }

  return <HomeView />;
};

export default Page;
