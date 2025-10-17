export type MediaFeature = {
  slug: string;
  title: string;
  summary: string;
  duration: string;
  publishedAt: string;
  category: "Behind the scenes" | "Highlights" | "Interviews";
  poster: string;
  videoUrl: string;
  chapters: Array<{ label: string; timestamp: string }>;
};

export const mediaFeatures: MediaFeature[] = [
  {
    slug: "behind-the-scenes",
    title: "Behind the scenes: Matchday focus",
    summary: "A 30-second look at preparation from the double training session.",
    duration: "00:56",
    publishedAt: "2024-04-28T08:00:00+02:00",
    category: "Behind the scenes",
    poster: "/media/behind-the-scenes.jpg",
    videoUrl: "https://player.vimeo.com/video/945610231?h=cf7fdfd0bb",
    chapters: [
      { label: "Warm-up drills", timestamp: "00:08" },
      { label: "Attacking patterns", timestamp: "00:22" },
      { label: "Tunnel focus", timestamp: "00:39" },
    ],
  },
  {
    slug: "goal-clip",
    title: "Goal clip: Thierry rockets home the equaliser",
    summary: "Relive the thunderstrike that brought Rayon level in the derby.",
    duration: "01:04",
    publishedAt: "2024-04-21T21:45:00+02:00",
    category: "Highlights",
    poster: "/media/goal-clip.jpg",
    videoUrl: "https://player.vimeo.com/video/945610471?h=1ad0a7dd50",
    chapters: [
      { label: "Build-up", timestamp: "00:12" },
      { label: "Strike", timestamp: "00:26" },
      { label: "Celebrations", timestamp: "00:44" },
    ],
  },
  {
    slug: "training-update",
    title: "Training update: Midfield balance",
    summary: "Assistant coach Patrick talks through midfield rotations for the weekend.",
    duration: "02:15",
    publishedAt: "2024-04-18T12:30:00+02:00",
    category: "Interviews",
    poster: "/media/training-update.jpg",
    videoUrl: "https://player.vimeo.com/video/945610590?h=43a4a7166a",
    chapters: [
      { label: "Pressing shape", timestamp: "00:34" },
      { label: "Box overloads", timestamp: "01:02" },
      { label: "Fan message", timestamp: "01:58" },
    ],
  },
];
