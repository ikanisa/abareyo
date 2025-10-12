"use client";
import { useState } from "react";
import TopAppBar from "../_components/ui/TopAppBar";
import OnboardingChat from "./_components/OnboardingChat";

export default function Welcome(){
  const [showChat, setShowChat] = useState(false);
  return (
    <div className="min-h-screen bg-rs-gradient text-white">
      <TopAppBar />
      <main className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <header className="space-y-2">
          <p className="muted">🔵 Rayon Sports Onboarding</p>
          <h1 className="text-3xl font-bold">Mwaramutse! Let’s set up your Rayon fan profile.</h1>
          <p className="muted">
            Share the WhatsApp number we can reach you and the MoMo number you use to support the club. Our AI guide will handle the rest.
          </p>
        </header>
        <div className="flex flex-wrap gap-3">
          <button className="btn">Need WhatsApp and MoMo</button>
          <button className="btn-primary" onClick={()=>setShowChat(true)}>Start new chat</button>
        </div>
        {showChat ? <OnboardingChat/> : (
          <div className="card">
            <p className="muted">Tap “Start new chat” to begin. Anonymous session — powered by OpenAI Agents.</p>
          </div>
        )}
      </main>
    </div>
  );
}
