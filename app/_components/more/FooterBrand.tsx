import Link from "next/link";

export function FooterBrand() {
  return (
    <footer className="mt-10 flex flex-col items-center gap-2 text-center text-xs text-white/80">
      <div className="flex items-center gap-2">
        <span className="font-semibold tracking-wide">Rayon Sports</span>
        <span aria-hidden>•</span>
        <span>Version 5.0.0</span>
      </div>
      <p className="text-white/60">Made for Fans of Gikundiro 💙</p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-white/70">
        <Link
          href="/settings/about"
          className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          App info
        </Link>
        <Link
          href="/legal/privacy"
          className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          Privacy
        </Link>
        <Link
          href="/legal/terms"
          className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          Terms
        </Link>
      </div>
    </footer>
  );
}
