import Link from "next/link";

const NewsNotFound = () => (
  <div className="card space-y-3 text-center text-white">
    <div className="text-lg font-semibold">Story unavailable</div>
    <p className="text-sm text-white/70">
      That article might have been archived or the link was mistyped. Head back to the News hub for the latest coverage.
    </p>
    <Link href="/news" className="btn-primary inline-flex items-center justify-center gap-2">
      Browse news
      <span aria-hidden>→</span>
    </Link>
  </div>
);

export default NewsNotFound;
