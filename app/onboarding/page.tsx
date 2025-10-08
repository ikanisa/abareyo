import dynamic from 'next/dynamic';

const OnboardingView = dynamic(() => import('@/views/OnboardingView'), { ssr: false });

const OnboardingPage = () => <OnboardingView />;

export default OnboardingPage;
