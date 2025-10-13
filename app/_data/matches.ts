export type MatchStatus = "upcoming" | "live" | "ft";

export type MatchEventType =
  | "goal"
  | "card-yellow"
  | "card-red"
  | "substitution"
  | "var"
  | "info";

export interface MatchEvent {
  id: string;
  minute: number;
  type: MatchEventType;
  team: "home" | "away" | "neutral";
  player?: string;
  description: string;
  scoreline?: string;
}

export interface MatchStatBar {
  id: string;
  label: string;
  home: number;
  away: number;
  unit?: "%";
}

export interface MatchLineup {
  formation: string;
  coach: string;
  starters: { number: number; name: string; role?: string }[];
  substitutes: { number: number; name: string }[];
}

export interface MatchChatMessage {
  id: string;
  author: string;
  message: string;
  timestamp: string;
  accent?: "mod" | "highlight";
}

export interface Match {
  id: string;
  comp: string;
  round: string;
  home: string;
  away: string;
  venue: string;
  date: string;
  kickoff: string;
  status: MatchStatus;
  badge?: string;
  broadcast?: string;
  score?: { home: number; away: number };
  liveMinute?: string;
  events: MatchEvent[];
  lineups?: { home: MatchLineup; away: MatchLineup };
  stats?: MatchStatBar[];
  timeline?: MatchEvent[];
  chat?: MatchChatMessage[];
}

export interface HighlightClip {
  id: string;
  title: string;
  duration: string;
  published: string;
  thumbnail: string;
}

export interface StandingsRow {
  position: number;
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  form: ("W" | "D" | "L")[];
}

export const matches: Match[] = [
  {
    id: "rayon-apr",
    comp: "Rwanda Premier League",
    round: "Matchday 12",
    home: "Rayon Sports",
    away: "APR FC",
    venue: "Kigali Pelé Stadium",
    date: "2024-06-21",
    kickoff: "2024-06-21T18:00:00+02:00",
    status: "live",
    badge: "RPL",
    broadcast: "Flash TV",
    score: { home: 2, away: 1 },
    liveMinute: "58'",
    events: [
      {
        id: "rayon-apr-35-goal",
        minute: 35,
        type: "goal",
        team: "home",
        player: "E. Mugisha",
        description: "Left-footed shot from inside the box",
        scoreline: "1-0",
      },
      {
        id: "rayon-apr-42-card",
        minute: 42,
        type: "card-yellow",
        team: "away",
        player: "S. Niyonkuru",
        description: "Late challenge on the wing",
      },
      {
        id: "rayon-apr-52-goal",
        minute: 52,
        type: "goal",
        team: "away",
        player: "F. Mugiraneza",
        description: "Header from set piece",
        scoreline: "1-1",
      },
      {
        id: "rayon-apr-56-goal",
        minute: 56,
        type: "goal",
        team: "home",
        player: "J. Ndayishimiye",
        description: "Volley after rebound",
        scoreline: "2-1",
      },
      {
        id: "rayon-apr-57-var",
        minute: 57,
        type: "var",
        team: "neutral",
        description: "VAR check for handball complete — goal stands",
      },
    ],
    lineups: {
      home: {
        formation: "4-3-3",
        coach: "Yves Rwasamanzi",
        starters: [
          { number: 1, name: "Kimenyi Yves", role: "GK" },
          { number: 2, name: "B. Muvunyi" },
          { number: 3, name: "E. Kwizera" },
          { number: 5, name: "K. Bayisenge" },
          { number: 19, name: "A. Nshimiyimana" },
          { number: 6, name: "H. Ndayisenga" },
          { number: 8, name: "S. Mugenzi" },
          { number: 14, name: "J. Muhire" },
          { number: 7, name: "E. Mugisha" },
          { number: 11, name: "J. Ndayishimiye" },
          { number: 23, name: "C. Shauri" },
        ],
        substitutes: [
          { number: 30, name: "H. Kwizera" },
          { number: 4, name: "D. Manzi" },
          { number: 10, name: "M. Bizimana" },
          { number: 17, name: "P. Usengimana" },
          { number: 24, name: "T. Iradukunda" },
        ],
      },
      away: {
        formation: "4-2-3-1",
        coach: "Thierry Froger",
        starters: [
          { number: 16, name: "N. Rwabugiri", role: "GK" },
          { number: 22, name: "J. Nshimiyimana" },
          { number: 4, name: "B. Kagere" },
          { number: 5, name: "S. Niyonkuru" },
          { number: 3, name: "A. Byiringiro" },
          { number: 6, name: "E. Manishimwe" },
          { number: 8, name: "J. Niyonzima" },
          { number: 10, name: "F. Mugiraneza" },
          { number: 11, name: "D. Sugira" },
          { number: 17, name: "A. Nshuti" },
          { number: 9, name: "S. Ishimwe" },
        ],
        substitutes: [
          { number: 1, name: "E. Ndizeye" },
          { number: 12, name: "E. Omborenga" },
          { number: 18, name: "P. Rukundo" },
          { number: 19, name: "E. Byiringiro" },
          { number: 21, name: "J. Nshuti" },
        ],
      },
    },
    stats: [
      { id: "possession", label: "Possession", home: 58, away: 42, unit: "%" },
      { id: "shots", label: "Total shots", home: 12, away: 7 },
      { id: "shots-on-target", label: "On target", home: 6, away: 3 },
      { id: "xg", label: "xG-lite", home: 1.7, away: 0.9 },
      { id: "passes", label: "Accurate passes", home: 312, away: 268 },
    ],
    timeline: [
      {
        id: "rayon-apr-12-info",
        minute: 12,
        type: "info",
        team: "neutral",
        description: "Rayon controlling early possession",
      },
      {
        id: "rayon-apr-35-goal",
        minute: 35,
        type: "goal",
        team: "home",
        player: "E. Mugisha",
        description: "Slides in at the far post after a sweeping move",
        scoreline: "1-0",
      },
      {
        id: "rayon-apr-42-card",
        minute: 42,
        type: "card-yellow",
        team: "away",
        player: "S. Niyonkuru",
        description: "Booked for a late tackle",
      },
      {
        id: "rayon-apr-52-goal",
        minute: 52,
        type: "goal",
        team: "away",
        player: "F. Mugiraneza",
        description: "Powerful header levelled the game",
        scoreline: "1-1",
      },
      {
        id: "rayon-apr-56-goal",
        minute: 56,
        type: "goal",
        team: "home",
        player: "J. Ndayishimiye",
        description: "Thunderous volley restores the lead",
        scoreline: "2-1",
      },
    ],
    chat: [
      {
        id: "chat-1",
        author: "Aline",
        message: "Mugisha on fire tonight!",
        timestamp: "57'",
        accent: "highlight",
      },
      {
        id: "chat-2",
        author: "Patrick",
        message: "Keep pushing boys, defence needs to tighten up!",
        timestamp: "55'",
      },
      {
        id: "chat-3",
        author: "Moderator",
        message: "Reminder: Be respectful in the chat. Offensive language will be removed.",
        timestamp: "HT",
        accent: "mod",
      },
    ],
  },
  {
    id: "rayon-gicumbi",
    comp: "Rwanda Premier League",
    round: "Matchday 13",
    home: "Gicumbi FC",
    away: "Rayon Sports",
    venue: "Stade de Gicumbi",
    date: "2024-06-28",
    kickoff: "2024-06-28T15:00:00+02:00",
    status: "upcoming",
    badge: "RPL",
    broadcast: "RS TV",
    events: [],
  },
  {
    id: "rayon-police",
    comp: "Rwanda Premier League",
    round: "Matchday 11",
    home: "Police FC",
    away: "Rayon Sports",
    venue: "Bugesera Stadium",
    date: "2024-06-14",
    kickoff: "2024-06-14T19:30:00+02:00",
    status: "ft",
    badge: "RPL",
    score: { home: 1, away: 1 },
    events: [
      {
        id: "police-rayon-21-goal",
        minute: 21,
        type: "goal",
        team: "home",
        player: "E. Twizerimana",
        description: "Low driven finish inside the box",
        scoreline: "1-0",
      },
      {
        id: "police-rayon-69-goal",
        minute: 69,
        type: "goal",
        team: "away",
        player: "C. Shauri",
        description: "Calm penalty into the corner",
        scoreline: "1-1",
      },
    ],
    timeline: [
      {
        id: "police-rayon-21-goal",
        minute: 21,
        type: "goal",
        team: "home",
        player: "E. Twizerimana",
        description: "Opens the scoring for Police",
        scoreline: "1-0",
      },
      {
        id: "police-rayon-45-info",
        minute: 45,
        type: "info",
        team: "neutral",
        description: "Halftime whistle: Rayon trail but dominate possession",
      },
      {
        id: "police-rayon-69-goal",
        minute: 69,
        type: "goal",
        team: "away",
        player: "C. Shauri",
        description: "Levels from the spot",
        scoreline: "1-1",
      },
    ],
    chat: [
      {
        id: "chat-police-1",
        author: "Diane",
        message: "Great away support today!",
        timestamp: "FT",
      },
    ],
  },
];

export const highlightClips: HighlightClip[] = [
  {
    id: "clip-1",
    title: "Mugisha rockets Rayon into the lead",
    duration: "0:36",
    published: "2 minutes ago",
    thumbnail: "/media/highlights/mugisha-volley.jpg",
  },
  {
    id: "clip-2",
    title: "Inside the stadium: fans in full voice",
    duration: "0:45",
    published: "8 minutes ago",
    thumbnail: "/media/highlights/fans-celebrate.jpg",
  },
  {
    id: "clip-3",
    title: "Shauri's equaliser vs Police FC",
    duration: "0:52",
    published: "Yesterday",
    thumbnail: "/media/highlights/shauri-penalty.jpg",
  },
];

export const leagueTable: StandingsRow[] = [
  { position: 1, team: "APR FC", played: 12, wins: 8, draws: 3, losses: 1, goalsFor: 22, goalsAgainst: 9, goalDiff: 13, points: 27, form: ["W", "W", "D", "W", "L"] },
  { position: 2, team: "Rayon Sports", played: 11, wins: 7, draws: 3, losses: 1, goalsFor: 21, goalsAgainst: 11, goalDiff: 10, points: 24, form: ["D", "W", "W", "W", "D"] },
  { position: 3, team: "Police FC", played: 12, wins: 6, draws: 4, losses: 2, goalsFor: 18, goalsAgainst: 12, goalDiff: 6, points: 22, form: ["D", "W", "D", "W", "L"] },
  { position: 4, team: "Musanze FC", played: 12, wins: 6, draws: 3, losses: 3, goalsFor: 17, goalsAgainst: 14, goalDiff: 3, points: 21, form: ["W", "L", "W", "D", "W"] },
  { position: 5, team: "Etincelles", played: 12, wins: 5, draws: 4, losses: 3, goalsFor: 15, goalsAgainst: 12, goalDiff: 3, points: 19, form: ["L", "W", "D", "W", "D"] },
];

export const matchFeedUpdatedAt = new Date().toISOString();
