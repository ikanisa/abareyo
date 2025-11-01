import { notFound } from "next/navigation";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { communityStories } from "@/app/community/_data/stories";
import { OptimizedImage } from "@/components/ui/optimized-image";

type StoryPageProps = {
  params: { slug: string };
};

const CommunityStoryPage = ({ params }: StoryPageProps) => {
  const story = communityStories.find((entry) => entry.href.endsWith(params.slug));
  if (!story) {
    notFound();
  }

  return (
    <PageShell>
      <SubpageHeader
        title={story.title}
        eyebrow={story.category}
        description={`Watch time ${story.duration}. Dive into exclusive Rayon access.`}
        backHref="/community"
      />
      <div className="relative h-72 overflow-hidden rounded-3xl border border-white/15">
        <OptimizedImage
          src={story.heroImage}
          alt={`${story.title} hero`}
          fill
          sizes="(max-width: 768px) 100vw, 75vw"
          className="object-cover"
        />
      </div>
      <article className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-white/80">
        {story.body.map((paragraph, index) => (
          <p key={`${story.slug}-${index}`} className="text-base leading-relaxed">
            {paragraph}
          </p>
        ))}
      </article>
    </PageShell>
  );
};

export default CommunityStoryPage;
