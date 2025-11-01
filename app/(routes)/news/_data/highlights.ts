export type Highlight = {
  slug: string;
  title: string;
  summary: string;
  duration: string;
  videoUrl: string;
  tags: string[];
  publishedAt: string;
  poster?: string;
};

export const highlights: Highlight[] = [
  {
    slug: "inside-camp-derby",
    title: "Inside camp: Derby focus",
    summary: "Training pitch access with mic'd up coaches and a rousing captain speech.",
    duration: "04:36",
    videoUrl: "https://assets.gikundiro.rw/media/derby-focus.mp4",
    tags: ["training", "derby"],
    publishedAt: "2025-01-28T10:00:00+02:00",
    poster: "/news/highlights/derby-focus.jpg",
  },
  {
    slug: "academy-matchday-live",
    title: "Academy matchday live",
    summary: "Follow the U17s from team talk to full-time celebrations.",
    duration: "06:12",
    videoUrl: "https://assets.gikundiro.rw/media/academy-live.mp4",
    tags: ["academy", "feature"],
    publishedAt: "2025-01-24T08:00:00+02:00",
    poster: "/news/highlights/academy-live.jpg",
  },
  {
    slug: "community-drive-recap",
    title: "Community drive recap",
    summary: "Volunteers share why giving back with Rayon Nation matters.",
    duration: "03:04",
    videoUrl: "https://assets.gikundiro.rw/media/community-drive.mp4",
    tags: ["community", "volunteers"],
    publishedAt: "2025-01-19T17:00:00+02:00",
  },
];
