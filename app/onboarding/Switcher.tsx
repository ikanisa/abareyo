"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const LegacyOnboarding = dynamic(() => import("@/views/OnboardingView"), { ssr: false });
const NewOnboarding = dynamic(() => import("../(onboarding)/_components/OnboardingChat"), { ssr: false });

type Mode = "legacy" | "new";
const STORAGE_KEY = "abareyo:onboarding_ui";

export default function OnboardingSwitcher() {
  const [mode, setMode] = useState<Mode>("legacy");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ui = params.get("ui");
      if (ui === "new" || ui === "legacy") {
        setMode(ui as Mode);
        localStorage.setItem(STORAGE_KEY, ui);
        return;
      }
      const stored = localStorage.getItem(STORAGE_KEY) as Mode | null;
      if (stored === "new" || stored === "legacy") {
        setMode(stored);
      }
    } catch {}
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-4">
      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <button
          className={`rounded px-2 py-1 border ${mode === 'legacy' ? 'bg-primary/10 border-primary/30' : 'border-white/10 hover:bg-white/5'}`}
          onClick={() => { setMode('legacy'); try { localStorage.setItem(STORAGE_KEY, 'legacy'); } catch {} }}
        >Legacy chat</button>
        <button
          className={`rounded px-2 py-1 border ${mode === 'new' ? 'bg-primary/10 border-primary/30' : 'border-white/10 hover:bg-white/5'}`}
          onClick={() => { setMode('new'); try { localStorage.setItem(STORAGE_KEY, 'new'); } catch {} }}
        >New chat (beta)</button>
      </div>
      {mode === 'new' ? <NewOnboarding /> : <LegacyOnboarding />}
    </div>
  );
}
