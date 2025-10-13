import { buildRouteMetadata } from '@/app/_lib/navigation';
import { eventsSchedule } from '@/app/_config/home';

export const metadata = buildRouteMetadata('/events');

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

const EventsPage = () => (
  <div className="min-h-screen bg-rs-gradient px-4 py-12 text-white">
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header className="glass space-y-3 rounded-3xl px-6 py-8 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">GIKUNDIRO calendar</p>
        <h1 className="text-3xl font-semibold">Club events & match activations</h1>
        <p className="text-sm text-white/80">
          Track Rayon Sports appearances, fan festivals, and premium experiences. Tap any event to secure tickets or add to your calendar.
        </p>
      </header>

      <section className="space-y-4">
        {eventsSchedule.map((event) => (
          <article key={event.id} className="card break-words whitespace-normal flex flex-col gap-2" aria-label={event.title}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-white">{event.title}</h2>
            </div>
            <p className="text-sm text-white/70">{event.description ?? 'Club activation hosted by Rayon Sports partners.'}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
              <span className="rounded-full bg-white/10 px-3 py-1">{formatDate(event.date)}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{event.location}</span>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="/tickets" className="btn-primary" aria-label={`Buy tickets for ${event.title}`}>
                Secure tickets
              </a>
              <a
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${encodeURIComponent(event.date)}`}
                className="btn"
              >
                Add to calendar
              </a>
            </div>
          </article>
        ))}
      </section>
    </main>
  </div>
);

export default EventsPage;
