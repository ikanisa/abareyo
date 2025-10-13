"use client";

import { ReactNode, useEffect, useState } from "react";

import PageShell from "@/app/_components/shell/PageShell";
import OnboardingModal from "@/app/_components/onboarding/OnboardingModal";
import TopAppBar from "@/app/_components/ui/TopAppBar";

const onboardingSearchParam = "onboarding";

const shouldOpenOnboarding = () => {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get(onboardingSearchParam) === "1";
};

const OfflineBanner = ({ offline }: { offline: boolean }) => {
  if (!offline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="assertive"
      className="glass sticky top-0 z-30 mx-auto flex max-w-md items-center justify-center px-4 py-2 text-sm font-semibold text-black md:max-w-5xl"
    >
      You are offline. We&apos;ll refresh your feed automatically once you reconnect.
    </div>
  );
};

const HomeInteractiveLayer = ({ children }: { children: ReactNode }) => {
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(() => {
    if (typeof navigator === "undefined") {
      return false;
    }

    return navigator.onLine === false;
  });

  useEffect(() => {
    if (shouldOpenOnboarding()) {
      setOnboardingOpen(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStatusChange = () => {
      setIsOffline(window.navigator.onLine === false);
    };

    window.addEventListener("offline", handleStatusChange);
    window.addEventListener("online", handleStatusChange);

    handleStatusChange();

    return () => {
      window.removeEventListener("offline", handleStatusChange);
      window.removeEventListener("online", handleStatusChange);
    };
  }, []);

  const rightActions = (
    <>
      <button className="btn" aria-label="Notifications">
        🔔
      </button>
      <button className="btn" aria-label="Search">
        🔍
      </button>
      <button className="btn" aria-label="Switch language">
        RW/EN
      </button>
      <button className="btn" aria-label="Open onboarding" onClick={() => setOnboardingOpen(true)}>
        💬
      </button>
    </>
  );

  return (
    <>
      <PageShell mainClassName="space-y-6 pb-24 pt-4">
        <TopAppBar right={rightActions} />
        <OfflineBanner offline={isOffline} />
        {children}
      </PageShell>
      <OnboardingModal open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </>
  );
};

export default HomeInteractiveLayer;
