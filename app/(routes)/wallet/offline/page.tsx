import Link from "next/link";

import { buildRouteMetadata } from "@/app/_lib/navigation";

export const metadata = buildRouteMetadata("/wallet/offline", {
  title: "Wallet offline mode",
  description: "Review cached passes and balances when you lose connectivity.",
});

const WalletOfflinePage = () => (
  <div className="flex min-h-[60vh] items-center justify-center p-6">
    <div className="card max-w-md space-y-4 text-center text-white">
      <h1 className="text-xl font-semibold">Wallet available offline</h1>
      <p className="text-sm text-white/80">
        Your passes, balances, and gate instructions stay cached so you can show them at the stadium even without a
        connection. We&apos;ll refresh your wallet as soon as you come back online.
      </p>
      <div className="space-y-3 rounded-2xl bg-white/10 p-4 text-left text-sm text-white/90">
        <div className="font-semibold uppercase tracking-[0.2em] text-white/60">Tips</div>
        <ul className="list-disc space-y-2 pl-5 text-white/80">
          <li>Keep your QR codes downloaded before travelling to the gate.</li>
          <li>Screenshot critical passes if network coverage is unreliable.</li>
          <li>Tap refresh once you regain a connection to sync new payments.</li>
        </ul>
      </div>
      <Link href="/wallet" className="btn-primary inline-flex items-center justify-center gap-2">
        Go back to wallet
        <span aria-hidden>→</span>
      </Link>
    </div>
  </div>
);

export default WalletOfflinePage;
