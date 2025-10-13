export type StreamSource = {
  url: string;
  quality: 360 | 480 | 720;
  type: "hls" | "mp4" | "dash";
};

export type Clip = {
  id: string;
  t: number;
  title: string;
  thumb: string;
  src: string;
};

export type EventType =
  | "goal"
  | "yellow"
  | "red"
  | "sub"
  | "var"
  | "ht"
  | "ft";

export type Event = {
  min: number;
  type: EventType;
  text: string;
  team: "home" | "away";
};

export type StatKey = "possession" | "shots" | "shots_on" | "xg";

export type Stat = {
  k: StatKey;
  home: number;
  away: number;
};

export type Player = {
  num: number;
  name: string;
  pos: "GK" | "DF" | "MF" | "FW";
};

export type Lineup = {
  formation: string;
  starters: Player[];
  bench: Player[];
};

export type H2H = {
  last5: {
    date: string;
    home: string;
    away: string;
    score: string;
  }[];
  form: {
    home: string[];
    away: string[];
  };
};

export type MatchMeta = {
  id: string;
  competition: string;
  badge: string;
  venue: string;
  kickoff: string;
  status: "live" | "ht" | "ft" | "upcoming";
  minute: string;
  home: {
    name: string;
    score: number;
  };
  away: {
    name: string;
    score: number;
  };
};

export const matchMeta: MatchMeta = {
  id: "match-123",
  competition: "Rayon Premier League",
  badge: "/badges/rayon-premier.svg",
  venue: "Amahoro Stadium",
  kickoff: "18:00 CAT",
  status: "live",
  minute: "62'",
  home: {
    name: "Rayon Sports",
    score: 2,
  },
  away: {
    name: "APR FC",
    score: 1,
  },
};

export const streamSources: StreamSource[] = [
  {
    url: "https://example.com/mock/stream-360.m3u8",
    quality: 360,
    type: "hls",
  },
  {
    url: "https://example.com/mock/stream-480.m3u8",
    quality: 480,
    type: "hls",
  },
  {
    url: "https://example.com/mock/stream-720.m3u8",
    quality: 720,
    type: "hls",
  },
];

export const audioStream = "https://example.com/mock/audio/live-commentary.mp3";

export const highlightClips: Clip[] = [
  {
    id: "clip-1",
    t: 14,
    title: "Early opener from Mugenzi",
    thumb: "/highlights/clip-1.jpg",
    src: "https://example.com/mock/clips/clip-1.mp4",
  },
  {
    id: "clip-2",
    t: 38,
    title: "Goal-line clearance drama",
    thumb: "/highlights/clip-2.jpg",
    src: "https://example.com/mock/clips/clip-2.mp4",
  },
  {
    id: "clip-3",
    t: 57,
    title: "Penalty saved by Ndizeye",
    thumb: "/highlights/clip-3.jpg",
    src: "https://example.com/mock/clips/clip-3.mp4",
  },
];

export const matchEvents: Event[] = [
  {
    min: 14,
    type: "goal",
    text: "Mugenzi (Rayon) left footed shot from the centre of the box.",
    team: "home",
  },
  {
    min: 26,
    type: "yellow",
    text: "Mukombozi booked for a late challenge.",
    team: "away",
  },
  {
    min: 38,
    type: "var",
    text: "Goal-line technology confirms no goal for APR FC.",
    team: "away",
  },
  {
    min: 45,
    type: "ht",
    text: "Halftime whistle.",
    team: "home",
  },
  {
    min: 52,
    type: "goal",
    text: "Nshuti heads in the equaliser for APR FC.",
    team: "away",
  },
  {
    min: 57,
    type: "var",
    text: "Penalty awarded to Rayon Sports after review.",
    team: "home",
  },
  {
    min: 58,
    type: "goal",
    text: "Kwizera converts from the spot.",
    team: "home",
  },
  {
    min: 71,
    type: "sub",
    text: "Ulimwengu replaces Mugenzi.",
    team: "home",
  },
];

export const matchStats: Stat[] = [
  { k: "possession", home: 58, away: 42 },
  { k: "shots", home: 11, away: 8 },
  { k: "shots_on", home: 5, away: 3 },
  { k: "xg", home: 1.8, away: 1.1 },
];

const buildLineup = (team: "home" | "away"): Lineup => ({
  formation: "4-3-3",
  starters: [
    { num: 1, name: team === "home" ? "Ndizeye" : "Mvuyekure", pos: "GK" },
    { num: 2, name: team === "home" ? "Muvandimwe" : "Iradukunda", pos: "DF" },
    { num: 3, name: team === "home" ? "Rwatubyaye" : "Ndayishimiye", pos: "DF" },
    { num: 4, name: team === "home" ? "Kwizera" : "Rugwiro", pos: "DF" },
    { num: 5, name: team === "home" ? "Ngirimana" : "Ruremesha", pos: "DF" },
    { num: 6, name: team === "home" ? "Kalisa" : "Mugisha", pos: "MF" },
    { num: 7, name: team === "home" ? "Ishimwe" : "Niyonzima", pos: "MF" },
    { num: 8, name: team === "home" ? "Ndayishimiye" : "Mugiraneza", pos: "MF" },
    { num: 9, name: team === "home" ? "Mugenzi" : "Sugira", pos: "FW" },
    { num: 10, name: team === "home" ? "Bizimana" : "Nshuti", pos: "FW" },
    { num: 11, name: team === "home" ? "Kwizera" : "Itangishaka", pos: "FW" },
  ],
  bench: [
    { num: 12, name: team === "home" ? "Hategekimana" : "Nsabimana", pos: "GK" },
    { num: 13, name: team === "home" ? "Ulimwengu" : "Iradukunda S.", pos: "FW" },
    { num: 14, name: team === "home" ? "Mugabo" : "Itamba", pos: "MF" },
    { num: 15, name: team === "home" ? "Nsanzimana" : "Mutijima", pos: "DF" },
  ],
});

export const homeLineup: Lineup = buildLineup("home");
export const awayLineup: Lineup = buildLineup("away");

export const headToHead: H2H = {
  last5: [
    { date: "2024-04-12", home: "APR FC", away: "Rayon Sports", score: "1-1" },
    { date: "2023-12-01", home: "Rayon Sports", away: "APR FC", score: "2-0" },
    { date: "2023-06-30", home: "APR FC", away: "Rayon Sports", score: "0-1" },
    { date: "2022-11-12", home: "Rayon Sports", away: "APR FC", score: "1-2" },
    { date: "2022-04-08", home: "APR FC", away: "Rayon Sports", score: "0-0" },
  ],
  form: {
    home: ["W", "D", "W", "L", "W"],
    away: ["D", "W", "W", "W", "D"],
  },
};
