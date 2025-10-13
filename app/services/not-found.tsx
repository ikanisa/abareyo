import Link from 'next/link';

const ServicesNotFound = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="glass space-y-4 rounded-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Service not found</h1>
        <p className="text-white/80">
          The partner flow you opened isn&apos;t available. Explore the main services below or return to the home dashboard.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/services" className="btn-primary">
            Partner hub
          </Link>
          <Link href="/tickets" className="btn">
            Buy tickets
          </Link>
          <Link href="/shop" className="btn">
            Shop merch
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default ServicesNotFound;
