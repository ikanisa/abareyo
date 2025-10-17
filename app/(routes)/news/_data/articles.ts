export type ArticleBlock =
  | { type: "paragraph"; content: string }
  | { type: "quote"; content: string; attribution?: string }
  | { type: "list"; items: string[]; ordered?: boolean };

export type Article = {
  slug: string;
  title: string;
  summary: string;
  category: "Club News" | "Training" | "Academy" | "Community";
  updatedAt: string;
  author: string;
  heroImage?: string;
  body: ArticleBlock[];
};

export const articles: Article[] = [
  {
    slug: "training-updates",
    title: "Training updates ahead of the derby",
    summary: "Captain Thierry returns while young winger Mugiraneza is set for his first derby minutes.",
    category: "Training",
    updatedAt: "2024-04-29T10:00:00+02:00",
    author: "Media Team",
    heroImage: "/news/training-ground.jpg",
    body: [
      {
        type: "paragraph",
        content:
          "Rayon Sports wrapped up a high-intensity Wednesday night session under the Amahoro floodlights. The coaching staff focused on quick transitions and pressing triggers tailored to APR’s back-three setup.",
      },
      {
        type: "paragraph",
        content:
          "Captain Thierry completed the full session and is cleared to start. Mugiraneza impressed on the wing and has been earmarked as an impact substitute for the final 30 minutes.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Set-piece unit drilled eight variations with Claude delivering from both flanks.",
          "U17 forward Ishimwe continued to shadow the senior forwards as part of the integration plan.",
          "Goalkeepers spent an extended block on aerial claims to counter APR’s crossing threat.",
        ],
      },
      {
        type: "quote",
        content: "The boys have matched the derby intensity all week. We will be ready for Saturday.",
        attribution: "Coach Yves Rwasamanzi",
      },
      {
        type: "paragraph",
        content:
          "Final preparations include tactical video on Thursday afternoon followed by a closed-door walkthrough. The matchday squad will be announced via the app 90 minutes before kickoff.",
      },
    ],
  },
  {
    slug: "academy-spotlight",
    title: "Academy spotlight: U17s flying high",
    summary: "Coach Nadine explains how the next wave of Rayon talent is being prepared for senior minutes.",
    category: "Academy",
    updatedAt: "2024-04-27T09:30:00+02:00",
    author: "Academy Desk",
    heroImage: "/news/academy-celebration.jpg",
    body: [
      {
        type: "paragraph",
        content:
          "The U17s lead their championship group after a convincing 3-0 victory over Mukura. Striker Patrick Uwimana now has 11 goals in nine matches.",
      },
      {
        type: "paragraph",
        content:
          "The academy has adopted the senior team’s positional play principles, creating a seamless handover when players earn first-team call-ups.",
      },
      {
        type: "quote",
        content:
          "Our methodology mirrors the first team. Once a player graduates, the tactics and expectations feel familiar.",
        attribution: "Coach Nadine Uwimana",
      },
      {
        type: "paragraph",
        content:
          "Fans can catch the U17 squad in action this Sunday at Kigali Training Centre, with free entry for GIKUNDIRO+ members.",
      },
    ],
  },
  {
    slug: "community-drive",
    title: "Community drive hits 1,000 volunteer hours",
    summary: "Rayon Nation members across four districts contributed a combined 1,000 hours to community projects.",
    category: "Community",
    updatedAt: "2024-04-25T15:00:00+02:00",
    author: "Community Desk",
    heroImage: "/news/community-drive.jpg",
    body: [
      {
        type: "paragraph",
        content:
          "The April community drive has surpassed 1,000 volunteer hours across Kigali, Huye, Rubavu, and Nyagatare. Activities ranged from tutoring sessions to pitch maintenance.",
      },
      {
        type: "paragraph",
        content:
          "Volunteers will receive double loyalty points inside the app this week. Check the Community tab to register for May events.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          "Kigali chapter refurbished benches at the Kimisagara community pitch.",
          "Huye volunteers led a girls’ football clinic attended by 64 participants.",
          "Rubavu chapter partnered with the local hospital for a blood-donation drive.",
        ],
      },
    ],
  },
];
