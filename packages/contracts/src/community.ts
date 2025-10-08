export type CommunityPost = {
  id: string;
  content: string;
  status: 'published' | 'flagged' | 'removed';
  createdAt: string;
  media?: string[] | null;
  viewCount?: number;
  reactionTotals?: Record<string, number>;
  commentCount?: number;
  riskTerms?: string[];
  authorId?: string | null;
  author?: {
    id: string;
    locale: string;
  } | null;
  poll?: PollContract | null;
};

export type CreatePostRequest = {
  userId?: string;
  content: string;
  media?: string[];
  pollOptions?: string[];
};

export type ModeratePostRequest = {
  status: 'published' | 'removed';
};

export type CreateCommentRequest = {
  postId: string;
  userId?: string;
  content: string;
};

export type ReactPostRequest = {
  postId: string;
  userId?: string;
  kind: 'like' | 'cheer' | 'love';
};

export type PostAnalyticsResponse = {
  totals: {
    posts: number;
    flagged: number;
    reactions: number;
    comments: number;
  };
  topPosts: {
    id: string;
    snippet: string;
    viewCount: number;
    reactions: number;
  }[];
};

export type PollContract = {
  id: string;
  postId?: string | null;
  question: string;
  createdAt: string;
  options: {
    id: string;
    label: string;
    votes: number;
  }[];
  totalVotes: number;
};

export type CreatePollRequest = {
  userId?: string;
  question: string;
  options: string[];
};

export type VotePollRequest = {
  pollId: string;
  optionId: string;
  userId?: string;
};

export type LeaderboardEntryContract = {
  rank: number;
  userId: string;
  points: number;
  user?: {
    id: string;
    locale: string;
    status: string;
    preferredZone?: string | null;
  } | null;
};

export type CheckInRequestContract = {
  userId?: string;
  location?: string;
};

export type QuizSubmissionRequestContract = {
  userId?: string;
  quizId: string;
  answer: string;
};

export type PredictionRequestContract = {
  userId?: string;
  matchId: string;
  pick: string;
};

export type GamificationAwardResponseContract = {
  userId: string;
  kind: 'checkin' | 'quiz' | 'prediction';
  pointsAwarded: number;
  totalPoints: number;
};

export type CommunityMissionsContract = {
  quiz: {
    id: string;
    prompt: string;
    rewardPoints: number;
    activeUntil: string | null;
  } | null;
  prediction: {
    id: string;
    matchId: string;
    question: string;
    rewardPoints: number;
    deadline: string;
    match?: {
      opponent: string;
      kickoff: string;
      venue?: string | null;
    } | null;
  } | null;
};

export type AdminQuizContract = {
  id: string;
  prompt: string;
  correctAnswer: string;
  rewardPoints: number;
  activeFrom: string;
  activeUntil: string | null;
  createdAt: string;
};

export type AdminPredictionContract = {
  id: string;
  matchId: string;
  question: string;
  rewardPoints: number;
  deadline: string;
  createdAt: string;
  match?: {
    opponent: string;
    kickoff: string;
    venue?: string | null;
  } | null;
};

export type CommunityAdminMissionsContract = {
  quizzes: AdminQuizContract[];
  predictions: AdminPredictionContract[];
  analytics: {
    checkInsToday: number;
    quizSubmissionsToday: number;
    predictionsToday: number;
  };
};
