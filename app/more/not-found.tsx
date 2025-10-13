import Link from 'next/link';

const MoreNotFound = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Profile not found</h1>
        <p className="text-white/80">
          We couldn&apos;t find the profile you were trying to access. Jump back to the dashboard or explore rewards below.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary">
            Home
          </Link>
          <Link href="/more/rewards" className="btn">
            Rewards
          </Link>
          <Link href="/tickets" className="btn">
            Tickets
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default MoreNotFound;
