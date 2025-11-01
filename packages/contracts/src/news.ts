export type ContentStatusContract = 'draft' | 'scheduled' | 'published';

export type NewsArticleContract = {
  id: string;
  title: string;
  slug: string;
  body: Record<string, unknown>;
  status: ContentStatusContract;
  type: 'article' | 'announcement' | 'press';
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CommunityPostStatusContract = 'pending' | 'approved' | 'rejected';

export type CommunityPostContract = {
  id: string;
  userId?: string | null;
  body: string;
  media?: Record<string, unknown>[];
  status: CommunityPostStatusContract;
  moderatorNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};
