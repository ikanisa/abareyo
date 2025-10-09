import { redirect } from 'next/navigation';

import HomeView from '@/views/HomeView';
import { fetchFanSessionServer } from '@/lib/server/fan-session';

const Page = async () => {
  const session = await fetchFanSessionServer();

  if (!session || session.onboardingStatus !== 'completed') {
    redirect('/onboarding');
  }

  return <HomeView />;
};

export default Page;
