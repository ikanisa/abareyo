import { notFound } from "next/navigation";

import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { communityPolls } from "@/app/community/_data/polls-data";

type PollPageProps = {
  params: { slug: string };
};

const PollDetailPage = ({ params }: PollPageProps) => {
  const poll = communityPolls.find((entry) => entry.slug === params.slug);
  if (!poll) {
    notFound();
  }

  const closing = new Date(poll.closesAt);
  const closeCopy = closing.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <PageShell>
      <SubpageHeader
        title={poll.question}
        eyebrow="Community poll"
        description={poll.description ?? "Have your say and earn extra loyalty points."}
        backHref="/community"
        actions={
          <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
            Closes {closeCopy}
          </span>
        }
      />
      <section className="glass rounded-3xl border border-white/10 px-6 py-5 text-white">
        <ul className="space-y-3">
          {poll.options.map((option) => {
            const percent = poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
            return (
              <li key={option.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm text-white/80">
                  <span className="font-semibold text-white">{option.text}</span>
                  <span>{percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-blue-400" style={{ width: `${percent}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-white/70">
          Voting closes automatically at {closeCopy}. Results update instantly when new votes arrive.
        </p>
      </section>
    </PageShell>
  );
};

export default PollDetailPage;
