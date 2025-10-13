import Link from 'next/link';

const MatchesNotFound = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">No fixtures available</h1>
        <p className="text-white/80">
          The match feed is empty right now. Check tickets for upcoming games or explore highlights while we refresh the data.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/tickets" className="btn-primary">
            View tickets
          </Link>
          <Link href="/shop" className="btn">
            Shop merch
          </Link>
          <Link href="/" className="btn">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default MatchesNotFound;
