import type { ReactNode } from "react";

const shimmer = "animate-pulse bg-white/10";

const CardSkeleton = ({ lines = 3 }: { lines?: number }) => (
  <div className={`card space-y-3 ${shimmer}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <div key={index} className="h-3 rounded-full bg-white/20" />
    ))}
  </div>
);

const SectionSkeleton = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3">
    <h2 className="section-title">{title}</h2>
    {children}
  </section>
);

const Loading = () => {
  return (
    <div className="min-h-screen bg-rs-gradient px-4 pb-24 pt-8 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="card break-words whitespace-normal space-y-4">
          <div className="space-y-3">
            <div className="h-6 w-1/2 rounded-full bg-white/10" />
            <div className="h-4 w-1/3 rounded-full bg-white/10" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-10 rounded-full bg-white/10" />
            ))}
          </div>
        </div>

        <SectionSkeleton title="Quick Actions">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="tile h-24 animate-pulse bg-white/10" />
            ))}
          </div>
        </SectionSkeleton>

        <SectionSkeleton title="Stories">
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-36 w-44 rounded-3xl bg-white/10" />
            ))}
          </div>
        </SectionSkeleton>

        <SectionSkeleton title="Live Match Centre">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CardSkeleton lines={4} />
            <CardSkeleton lines={5} />
          </div>
        </SectionSkeleton>

        <SectionSkeleton title="Latest">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <CardSkeleton key={index} lines={4} />
            ))}
          </div>
        </SectionSkeleton>

        <SectionSkeleton title="Wallet">
          <CardSkeleton lines={5} />
        </SectionSkeleton>

        <SectionSkeleton title="Membership">
          <CardSkeleton lines={4} />
        </SectionSkeleton>

        <SectionSkeleton title="Play & Earn">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="tile h-20 animate-pulse bg-white/10" />
            ))}
          </div>
        </SectionSkeleton>

        <SectionSkeleton title="Shop Promos">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <CardSkeleton key={index} lines={4} />
            ))}
          </div>
        </SectionSkeleton>

        <SectionSkeleton title="Fundraising Spotlight">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <CardSkeleton key={index} lines={4} />
            ))}
          </div>
        </SectionSkeleton>

        <SectionSkeleton title="Events">
          <CardSkeleton lines={4} />
        </SectionSkeleton>

        <SectionSkeleton title="Community">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <CardSkeleton key={index} lines={4} />
            ))}
          </div>
        </SectionSkeleton>

        <SectionSkeleton title="Sponsors">
          <div className="card break-words whitespace-normal space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 rounded-2xl bg-white/10" />
              ))}
            </div>
          </div>
        </SectionSkeleton>
      </div>
    </div>
  );
};

export default Loading;
