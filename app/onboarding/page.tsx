import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

import { fetchFanSessionServer } from '@/lib/server/fan-session';

const OnboardingView = dynamic(() => import('@/views/OnboardingView'), { ssr: false });

const OnboardingPage = async () => {
  const session = await fetchFanSessionServer();
  if (session?.onboardingStatus === 'completed') {
    redirect('/');
  }
  return <OnboardingView />;
};

export default OnboardingPage;
