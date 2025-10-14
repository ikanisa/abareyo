import Link from "next/link";

import EmptyState from "@/app/_components/ui/EmptyState";
import type { HomeSurfaceData } from "@/lib/api/home";
import { buildHomeSurfaceData } from "@/lib/home/surface-data";

const heroButtonClasses = (variant: HomeSurfaceData["hero"]["actions"][number]["variant"]) =>
  variant === "primary" ? "btn-primary" : "btn";

type HomeHeroSectionProps = {
  hero?: HomeSurfaceData["hero"];
};

const HomeHeroSection = ({ hero }: HomeHeroSectionProps) => {
  const resolvedHero = hero ?? buildHomeSurfaceData().hero;
  const { content, actions } = resolvedHero;

  return (
    <section className="card overflow-hidden animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl" aria-live="polite">
            {content.headline}
          </h1>
          <p className="muted mt-1">{`${content.kickoff} — ${content.subheadline}`}</p>
        </div>
        {actions.length > 0 ? (
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
            {actions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                aria-label={action.ariaLabel}
                className={`${heroButtonClasses(action.variant)} w-full text-center`}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Actions unavailable"
            description="Primary CTAs appear here once enrolment windows open."
            icon="✨"
          />
        )}
      </div>
    </section>
  );
};

export default HomeHeroSection;
