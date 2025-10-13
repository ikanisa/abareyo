export type Post = {
  id: string;
  user: string;
  avatar: string;
  text: string;
  media?: string;
  likes: number;
  comments: number;
  time: string;
};

export type Mission = {
  id: string;
  name: string;
  pts: number;
  status: "available" | "done";
};

export type PollOption = {
  id: string;
  text: string;
  votes: number;
};

export type Poll = {
  id: string;
  q: string;
  options: PollOption[];
  voted?: string;
};

export type Leader = {
  id: string;
  name: string;
  pts: number;
  avatar: string;
  rank: number;
};

export type Club = {
  id: string;
  name: string;
  city: string;
  members: number;
};

export type Clip = {
  id: string;
  title: string;
  src: string;
  likes: number;
  comments: number;
  duration: string;
  thumbnail: string;
};

export type Badge = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export const mockMissions: Mission[] = [
  { id: "check-in", name: "Matchday Check-in", pts: 10, status: "available" },
  { id: "quiz", name: "Weekly Quiz", pts: 25, status: "available" },
  { id: "predict", name: "Score Prediction", pts: 40, status: "done" },
];

export const mockPosts: Post[] = [
  {
    id: "p1",
    user: "Gikundiro+",
    avatar: "/community/avatars/gikundiro-plus.png",
    text: "Just arrived at Kigali Stadium — the energy is unreal! Who else is here early? 💙",
    media: "/community/posts/warmup.jpg",
    likes: 326,
    comments: 42,
    time: "5m",
  },
  {
    id: "p2",
    user: "Guest Fan",
    avatar: "/community/avatars/guest.png",
    text: "That Mukura defense won't know what hit them tonight. My 3-1 prediction still stands!",
    likes: 210,
    comments: 31,
    time: "18m",
  },
  {
    id: "p3",
    user: "Media Team",
    avatar: "/community/avatars/media.png",
    text: "Captain Thierry leading the roar in the tunnel. Swipe for the goosebumps. #RayonLive",
    media: "/community/posts/tunnel.mp4",
    likes: 812,
    comments: 108,
    time: "32m",
  },
];

export const mockPolls: Poll[] = [
  {
    id: "poll-1",
    q: "Who was your player of the match?",
    options: [
      { id: "a", text: "Didier M", votes: 268 },
      { id: "b", text: "Kevin M", votes: 194 },
      { id: "c", text: "Emery B", votes: 123 },
    ],
  },
  {
    id: "poll-2",
    q: "Which away trip should the fan bus take next?",
    options: [
      { id: "a", text: "Huye", votes: 82 },
      { id: "b", text: "Rubavu", votes: 134 },
      { id: "c", text: "Musanze", votes: 57 },
      { id: "d", text: "Rusizi", votes: 41 },
    ],
    voted: "b",
  },
];

export const mockWeeklyLeaders: Leader[] = [
  {
    id: "l1",
    name: "Aline U.",
    pts: 1840,
    avatar: "/community/avatars/aline.png",
    rank: 1,
  },
  {
    id: "l2",
    name: "Gatera P.",
    pts: 1735,
    avatar: "/community/avatars/gatera.png",
    rank: 2,
  },
  {
    id: "l3",
    name: "Claude S.",
    pts: 1670,
    avatar: "/community/avatars/claude.png",
    rank: 3,
  },
  {
    id: "l4",
    name: "Sylvie I.",
    pts: 1612,
    avatar: "/community/avatars/sylvie.png",
    rank: 4,
  },
];

export const mockMonthlyLeaders: Leader[] = [
  {
    id: "ml1",
    name: "Aline U.",
    pts: 6_420,
    avatar: "/community/avatars/aline.png",
    rank: 1,
  },
  {
    id: "ml2",
    name: "Sylvie I.",
    pts: 6_180,
    avatar: "/community/avatars/sylvie.png",
    rank: 2,
  },
  {
    id: "ml3",
    name: "Claude S.",
    pts: 5_972,
    avatar: "/community/avatars/claude.png",
    rank: 3,
  },
  {
    id: "ml4",
    name: "Gatera P.",
    pts: 5_744,
    avatar: "/community/avatars/gatera.png",
    rank: 4,
  },
];

export const mockLeaders = mockWeeklyLeaders;

export const mockClubs: Club[] = [
  { id: "c1", name: "Kigali Ultras", city: "Kigali", members: 652 },
  { id: "c2", name: "Rayon South", city: "Huye", members: 289 },
  { id: "c3", name: "Blue Wave Rubavu", city: "Rubavu", members: 341 },
  { id: "c4", name: "Diaspora 250", city: "Brussels", members: 198 },
];

export const mockClips: Clip[] = [
  {
    id: "clip-1",
    title: "Thierry's stoppage-time rocket",
    src: "/community/clips/thierry.mp4",
    likes: 4_820,
    comments: 392,
    duration: "0:21",
    thumbnail: "/community/clips/thierry-thumb.jpg",
  },
  {
    id: "clip-2",
    title: "Fans take over Kigali Arena",
    src: "/community/clips/fans.mp4",
    likes: 3_104,
    comments: 241,
    duration: "0:18",
    thumbnail: "/community/clips/fans-thumb.jpg",
  },
  {
    id: "clip-3",
    title: "Behind the scenes: matchday",
    src: "/community/clips/behind.mp4",
    likes: 2_541,
    comments: 188,
    duration: "0:30",
    thumbnail: "/community/clips/behind-thumb.jpg",
  },
];

export const mockBadges: Badge[] = [
  {
    id: "b1",
    label: "Stadium Starter",
    description: "Completed your first matchday check-in",
    icon: "🛠️",
  },
  {
    id: "b2",
    label: "Quiz Master",
    description: "Perfect score on a weekly quiz",
    icon: "🧠",
  },
  {
    id: "b3",
    label: "Prediction Pro",
    description: "Nailed three match predictions in a row",
    icon: "🎯",
  },
];
