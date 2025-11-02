import Link from "next/link";

const WalletNotFound = () => (
  <div className="card space-y-3 text-center text-white">
    <div className="text-lg font-semibold">We can&apos;t find that wallet view</div>
    <p className="text-sm text-white/70">
      The link you followed might be out of date. Return to your passes and balances from the main wallet hub.
    </p>
    <Link href="/wallet" className="btn-primary inline-flex items-center justify-center gap-2">
      Back to wallet
      <span aria-hidden>→</span>
    </Link>
  </div>
);

export default WalletNotFound;
