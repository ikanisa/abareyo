import type { Story } from "@/app/_config/home";
import { stories as homeStories } from "@/app/_config/home";

export type CommunityStory = Story & {
  slug: string;
  heroImage: string;
  body: string[];
};

const STORY_BODIES: Record<string, string[]> = {
  "derby-prep": [
    "Go pitch-side with the media team as Rayon’s starters complete their final sharpness drills. Captain Thierry leads the rondos while goalkeeper Patrick fine-tunes distribution under pressure.",
    "Analyst Celestin walks us through the overlay tablet, highlighting how the staff monitor APR’s wing rotations in real time. A quick huddle in the tunnel seals the focus: fast start, aggressive press.",
    "The piece wraps with a raw celebration from the dressing room as the squad heads to the team bus—blue smoke, chants, and a reminder to fans to be in their seats early.",
  ],
  "fan-voice": [
    "We mic’d up the Kigali South fan club during the last home match. Expect drums, choreo, and heartfelt stories about what Rayon means to their families.",
    "Don’t miss the moment they surprise a travelling supporter with a membership upgrade—in the middle of the anthem.",
  ],
  academy: [
    "Coach Nadine opens the gates to the U17 camp where positional rondos meet classtime tutoring. Witness how the next wave of midfielders learn to scan and create overloads.",
    "A post-training debrief with the young captain reveals how accountability is tracked on a shared whiteboard. Seniors regularly drop in, keeping the pathway alive.",
  ],
};

export const communityStories: CommunityStory[] = homeStories.map((story) => {
  const slug = story.href.replace("/community/stories/", "");
  return {
    ...story,
    slug,
    heroImage: `/community/stories/${slug}.jpg`,
    body: STORY_BODIES[slug] ?? [
      "This story is being finalised. Check back soon for the full behind-the-scenes feature.",
    ],
  };
});
