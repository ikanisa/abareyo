import type {
  CommunityPost,
  CreateCommentRequest,
  CreatePollRequest,
  CreatePostRequest,
  LeaderboardEntryContract,
  CheckInRequestContract,
  QuizSubmissionRequestContract,
  PredictionRequestContract,
  GamificationAwardResponseContract,
  CommunityMissionsContract,
  CommunityAdminMissionsContract,
  AdminQuizContract,
  AdminPredictionContract,
  ModeratePostRequest,
  PollContract,
  PostAnalyticsResponse,
  ReactPostRequest,
  VotePollRequest,
} from '@rayon/contracts';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000/api';
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_ADMIN_API_TOKEN ?? '';

async function apiGet<T>(path: string, options?: RequestInit) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}${path}`, options);
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: T };
  return data;
}

export function fetchCommunityFeed() {
  return apiGet<CommunityPost[]>(`/community/feed`);
}

export function fetchCommunityPolls() {
  return apiGet<PollContract[]>(`/community/polls`);
}

export function fetchCommunityLeaderboard(period: 'weekly' | 'monthly' = 'weekly') {
  const search = new URLSearchParams({ period }).toString();
  return apiGet<LeaderboardEntryContract[]>(`/community/leaderboard?${search}`);
}

export function fetchCommunityMissions() {
  return apiGet<CommunityMissionsContract>(`/community/missions`);
}

export function fetchCommunityAdminMissions() {
  return apiGet<CommunityAdminMissionsContract>(`/community/admin/missions`, {
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
}

export async function createAdminQuiz(payload: {
  prompt: string;
  correctAnswer: string;
  rewardPoints?: number;
  activeFrom?: string;
  activeUntil?: string;
}) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/admin/quizzes`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: AdminQuizContract };
  return data;
}

export async function closeAdminQuiz(quizId: string) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/admin/quizzes/${quizId}/close`, {
    method: 'POST',
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: { id: string; activeUntil: string } };
  return data;
}

export async function createAdminPrediction(payload: {
  matchId: string;
  question: string;
  rewardPoints?: number;
  deadline: string;
}) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/admin/predictions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: AdminPredictionContract };
  return data;
}

export async function closeAdminPrediction(predictionId: string) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/admin/predictions/${predictionId}/close`, {
    method: 'POST',
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: { id: string; deadline: string } };
  return data;
}

export async function checkInCommunity(payload: CheckInRequestContract) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/check-in`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: GamificationAwardResponseContract };
  return data;
}

export async function submitCommunityQuiz(payload: QuizSubmissionRequestContract) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/quiz`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: GamificationAwardResponseContract };
  return data;
}

export async function submitCommunityPrediction(payload: PredictionRequestContract) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/prediction`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: GamificationAwardResponseContract };
  return data;
}

export async function createCommunityPost(payload: CreatePostRequest) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/posts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: CommunityPost };
  return data;
}

export async function createCommunityComment(payload: CreateCommentRequest) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/posts/${payload.postId}/comments`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: payload.userId, content: payload.content }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: { id: string } };
  return data;
}

export async function reactToCommunityPost(payload: ReactPostRequest) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/posts/${payload.postId}/react`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: payload.userId, kind: payload.kind }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as {
    data: { postId: string; reactionTotals: Record<string, number> };
  };
  return data;
}

export async function recordCommunityPostView(postId: string) {
  await fetch(`${BASE_URL.replace(/\/$/, '')}/community/posts/${postId}/view`, {
    method: 'POST',
  });
}

export async function createCommunityPoll(payload: CreatePollRequest) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/polls`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: PollContract };
  return data;
}

export async function voteCommunityPoll(payload: VotePollRequest) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/polls/${payload.pollId}/vote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: payload.userId, optionId: payload.optionId }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: PollContract };
  return data;
}

export function fetchFlaggedPosts() {
  return apiGet<CommunityPost[]>(`/community/moderation`, {
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
}

export async function moderatePost(postId: string, payload: ModeratePostRequest) {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/community/posts/${postId}/moderate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-admin-token': ADMIN_TOKEN,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  const { data } = (await response.json()) as { data: CommunityPost };
  return data;
}

export function fetchCommunityAnalytics() {
  return apiGet<PostAnalyticsResponse>(`/community/analytics`, {
    headers: { 'x-admin-token': ADMIN_TOKEN },
  });
}
