"use client";

import { useState } from "react";

const ShopOnboarding = () => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="card space-y-3 bg-white/10 p-4">
      <h2 className="text-lg font-semibold text-white">First time here?</h2>
      <p className="text-sm text-white/70">
        Browse official Rayon Sports merchandise and pay securely with USSD or card.
      </p>
      <button type="button" className="btn" onClick={() => setDismissed(true)}>
        Got it
      </button>
    </div>
  );
};

export default ShopOnboarding;
