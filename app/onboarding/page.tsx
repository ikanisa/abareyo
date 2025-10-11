import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

import { fetchFanSessionServer } from '@/lib/server/fan-session';

const Switcher = dynamic(() => import('./Switcher'), { ssr: false });

const OnboardingPage = async () => {
  const session = await fetchFanSessionServer();
  if (session?.onboardingStatus === 'completed') {
    redirect('/');
  }
  return <Switcher />;
};

export default OnboardingPage;
