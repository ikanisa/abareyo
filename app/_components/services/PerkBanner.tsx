"use client";

const PerkBanner = ({ text }: { text: string }) => {
  return (
    <div className="card break-words whitespace-normal border border-white/30 bg-white/10 text-left" role="status" aria-live="polite">
      <div className="text-white font-semibold">🎁 Perk Unlocked</div>
      <p className="muted text-sm">{text}</p>
    </div>
  );
};

export default PerkBanner;
