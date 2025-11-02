// Type definitions inlined from contracts
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

import { httpClient } from '@/services/http-client';

export function fetchCommunityFeed() {
  return httpClient.data<CommunityPost[]>(`/community/feed`);
}

export function fetchCommunityPolls() {
  return httpClient.data<PollContract[]>(`/community/polls`);
}

export function fetchCommunityLeaderboard(period: 'weekly' | 'monthly' = 'weekly') {
  return httpClient.data<LeaderboardEntryContract[]>(`/community/leaderboard`, {
    searchParams: { period },
  });
}

export function fetchCommunityMissions() {
  return httpClient.data<CommunityMissionsContract>(`/community/missions`);
}

export function fetchCommunityAdminMissions() {
  return httpClient.data<CommunityAdminMissionsContract>(`/admin/community/missions`, {
    admin: true,
  });
}

export async function createAdminQuiz(payload: {
  prompt: string;
  correctAnswer: string;
  rewardPoints?: number;
  activeFrom?: string;
  activeUntil?: string;
}) {
  return httpClient.data<AdminQuizContract>(`/admin/community/quizzes`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function closeAdminQuiz(quizId: string) {
  return httpClient.data<{ id: string; activeUntil: string }>(
    `/admin/community/quizzes/${quizId}/close`,
    {
      admin: true,
      method: 'POST',
    },
  );
}

export async function createAdminPrediction(payload: {
  matchId: string;
  question: string;
  rewardPoints?: number;
  deadline: string;
}) {
  return httpClient.data<AdminPredictionContract>(`/admin/community/predictions`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function closeAdminPrediction(predictionId: string) {
  return httpClient.data<{ id: string; deadline: string }>(
    `/admin/community/predictions/${predictionId}/close`,
    {
      admin: true,
      method: 'POST',
    },
  );
}

export async function checkInCommunity(payload: CheckInRequestContract) {
  return httpClient.data<GamificationAwardResponseContract>(`/community/check-in`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitCommunityQuiz(payload: QuizSubmissionRequestContract) {
  return httpClient.data<GamificationAwardResponseContract>(`/community/quiz`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitCommunityPrediction(payload: PredictionRequestContract) {
  return httpClient.data<GamificationAwardResponseContract>(`/community/prediction`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createCommunityPost(payload: CreatePostRequest) {
  return httpClient.data<CommunityPost>(`/community/posts`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createCommunityComment(payload: CreateCommentRequest) {
  return httpClient.data<{ id: string }>(`/community/posts/${payload.postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ userId: payload.userId, content: payload.content }),
  });
}

export async function reactToCommunityPost(payload: ReactPostRequest) {
  return httpClient.data<{ postId: string; reactionTotals: Record<string, number> }>(
    `/community/posts/${payload.postId}/react`,
    {
      method: 'POST',
      body: JSON.stringify({ userId: payload.userId, kind: payload.kind }),
    },
  );
}

export async function recordCommunityPostView(postId: string) {
  await httpClient.request(`/community/posts/${postId}/view`, { method: 'POST' });
}

export async function createCommunityPoll(payload: CreatePollRequest) {
  return httpClient.data<PollContract>(`/community/polls`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function voteCommunityPoll(payload: VotePollRequest) {
  return httpClient.data<PollContract>(`/community/polls/${payload.pollId}/vote`, {
    method: 'POST',
    body: JSON.stringify({ userId: payload.userId, optionId: payload.optionId }),
  });
}

export function fetchFlaggedPosts() {
  return httpClient.data<CommunityPost[]>(`/admin/community/moderation`, { admin: true });
}

export async function moderatePost(postId: string, payload: ModeratePostRequest) {
  return httpClient.data<CommunityPost>(`/admin/community/posts/${postId}/moderate`, {
    admin: true,
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchCommunityAnalytics() {
  return httpClient.data<PostAnalyticsResponse>(`/admin/community/analytics`, { admin: true });
}
