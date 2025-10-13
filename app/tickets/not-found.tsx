import Link from 'next/link';

const TicketsNotFound = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Tickets unavailable</h1>
        <p className="text-white/80">
          There are no active tickets for this link. Check the matches hub or head to the shop for limited drops.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/matches" className="btn-primary">
            View fixtures
          </Link>
          <Link href="/shop" className="btn">
            Shop merch
          </Link>
          <Link href="/" className="btn">
            Home
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default TicketsNotFound;
