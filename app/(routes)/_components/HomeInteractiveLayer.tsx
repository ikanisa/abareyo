"use client";

import { ReactNode, useEffect, useState } from "react";

import OnboardingModal from "@/app/_components/onboarding/OnboardingModal";
import BottomNav from "@/app/_components/ui/BottomNav";
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
      className="sticky top-0 z-20 flex items-center justify-center bg-amber-500/90 px-4 py-2 text-sm font-semibold text-black"
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

  return (
    <div className="min-h-screen bg-rs-gradient text-white">
      <TopAppBar onOpenOnboarding={() => setOnboardingOpen(true)} />

      <OfflineBanner offline={isOffline} />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-24 pt-8">{children}</main>

      <BottomNav />

      <OnboardingModal open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </div>
  );
};

export default HomeInteractiveLayer;
