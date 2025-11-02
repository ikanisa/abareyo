const OnboardingNotFound = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-16 text-white">
    <div className="mx-auto max-w-lg space-y-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-white/60">Fan onboarding</p>
      <h1 className="text-3xl font-semibold">We could not find that step</h1>
      <p className="text-sm text-white/70">
        The onboarding flow you tried to open is unavailable. Return to the main experience to continue setting up your fan
        profile.
      </p>
      <a className="btn" href="/onboarding">
        Back to onboarding
      </a>
    </div>
  </div>
);

export default OnboardingNotFound;
