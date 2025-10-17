export type CommunityPoll = {
  slug: string;
  question: string;
  options: Array<{ id: string; text: string; votes: number }>;
  totalVotes: number;
  closesAt: string;
  description?: string;
};

export const communityPolls: CommunityPoll[] = [
  {
    slug: "motm",
    question: "Who is your player of the match?",
    options: [
      { id: "didier", text: "Didier M", votes: 268 },
      { id: "kevin", text: "Kevin M", votes: 194 },
      { id: "emery", text: "Emery B", votes: 123 },
    ],
    totalVotes: 585,
    closesAt: "2024-04-30T21:00:00+02:00",
    description:
      "Cast your vote for Rayon’s standout performer. Poll closes at 21:00 and loyalty points are awarded to participants.",
  },
];
