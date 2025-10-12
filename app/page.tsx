"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import TopAppBar from "./_components/ui/TopAppBar";
import QuickTiles from "./_components/ui/QuickTiles";
import GamificationStrip from "./_components/ui/GamificationStrip";
import Feed from "./_components/home/Feed";
import OnboardingModal from "./_components/onboarding/OnboardingModal";

export default function Home(){
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('onboarding') === '1') {
        setOnboardingOpen(true);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-rs-gradient text-white">
      <TopAppBar onOpenOnboarding={()=>setOnboardingOpen(true)} />

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Hero Next Match */}
        <motion.section initial={{ opacity:0, y: 10 }} animate={{ opacity:1, y:0 }} className="card overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Rayon vs APR — Sat 18:00 — Amahoro</h1>
              <p className="muted mt-1">It’s match time. Back Gikundiro.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" aria-label="Open Match Centre">Match Centre</button>
              <button className="btn" aria-label="Buy Ticket">Buy Ticket</button>
              <button className="btn" aria-label="Predict & Win">Predict & Win</button>
            </div>
          </div>
        </motion.section>

        {/* Quick tiles */}
        <section className="space-y-3">
          <h2 className="section-title">Quick Actions</h2>
          <QuickTiles />
        </section>

        {/* Feed */}
        <section className="space-y-3">
          <h2 className="section-title">Latest</h2>
          <Feed />
        </section>

        {/* Gamification + membership CTA */}
        <section className="space-y-3">
          <h2 className="section-title">Play & Earn</h2>
          <GamificationStrip />
          <div className="card flex items-center justify-between">
            <div>
              <h4 className="font-semibold">Become Gikundiro+ Member</h4>
              <p className="muted">Early tickets, discounts, and rewards.</p>
            </div>
            <button className="btn-primary">Join now</button>
          </div>
        </section>
      </main>

      {/* Optional onboarding modal (icon in top bar) */}
      <OnboardingModal open={onboardingOpen} onClose={()=>setOnboardingOpen(false)} />
    </div>
  );
}
