import Link from 'next/link';

const fallbackLinks = [
  { href: '/', label: 'Home', description: 'Return to match centre and highlights.' },
  { href: '/tickets', label: 'Tickets', description: 'Secure seats and manage passes.' },
  { href: '/shop', label: 'Shop', description: 'Browse kits, merch, and match-day gear.' },
  { href: '/services', label: 'Services', description: 'Insurance quotes and SACCO deposits.' },
  { href: '/more', label: 'More', description: 'Rewards, wallet, and supporter tools.' },
];

const NotFound = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-4xl flex-col items-center gap-10 text-center">
      <div className="glass w-full max-w-2xl space-y-4 rounded-3xl px-6 py-10">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">GIKUNDIRO HQ</p>
        <h1 className="text-3xl font-semibold md:text-4xl">Page not found</h1>
        <p className="text-base text-white/80 md:text-lg">
          The route you tried to open doesn&apos;t exist yet. Pick a destination below to jump back into the fan experience.
        </p>
      </div>

      <section className="grid w-full gap-4 sm:grid-cols-2">
        {fallbackLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="tile h-full flex-col items-start text-left"
            aria-label={`${link.label} — ${link.description}`}
          >
            <span className="text-lg font-semibold text-white">{link.label}</span>
            <span className="text-sm text-white/70">{link.description}</span>
          </Link>
        ))}
      </section>

      <p className="text-xs text-white/60">
        Need extra help? Contact the Rayon Sports support desk via the GIKUNDIRO hotline *651#.
      </p>
    </main>
  </div>
);

export default NotFound;
