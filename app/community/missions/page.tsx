import PageShell from "@/app/_components/shell/PageShell";
import SubpageHeader from "@/app/_components/shell/SubpageHeader";
import { mockMissions } from "@/app/_data/community";

const MissionsPage = () => (
  <PageShell>
    <SubpageHeader
      title="Community Missions"
      eyebrow="Play & earn"
      description="Complete your daily check-in, quizzes, and predictions to climb the leaderboard."
      backHref="/community"
    />
    <section className="glass space-y-4 rounded-3xl border border-white/10 px-6 py-5 text-white">
      <ul className="space-y-3">
        {mockMissions.map((mission) => (
          <li
            key={mission.id}
            className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-white/80"
          >
            <div>
              <p className="font-semibold text-white">{mission.name}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">{mission.pts} pts</p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/70">
              {mission.status === "done" ? "Completed" : "Available"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  </PageShell>
);

export default MissionsPage;
