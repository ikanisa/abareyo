'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import useFlags from '@/app/_components/flags/useFlags';
import { track } from '@/lib/analytics';

type CommunityPost = {
  id: string;
  text: string;
  media_url: string | null;
  user_id: string | null;
  created_at: string;
};

export default function CommunityClient() {
  const flags = useFlags();
  const enabled = flags['features.community'];

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formattedPosts = useMemo(() => {
    return posts.map((post) => ({
      ...post,
      createdAtLabel: new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(post.created_at)),
    }));
  }, [posts]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/community/posts', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch community posts');
      }
      const payload = await response.json();
      setPosts(payload.posts ?? []);
    } catch (err) {
      console.error(err);
      setError('Twirengagije kugera ku rubuga.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void loadPosts();
  }, [enabled, loadPosts]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!message.trim()) {
        return;
      }
      setSubmitting(true);
      setFeedback(null);
      setError(null);
      try {
        const response = await fetch('/api/community/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message.trim(), media_url: mediaUrl.trim() || undefined }),
        });
        if (!response.ok) {
          const payload = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(payload.error ?? 'Failed to create post');
        }
        const payload = await response.json();
        setMessage('');
        setMediaUrl('');
        setFeedback('Your voice is live!');
        setPosts((current) => [payload.post, ...current]);
        track('community.posted');
      } catch (err) {
        console.error(err);
        setError('Ntibyagenze neza. Ongera ugerageze.');
      } finally {
        setSubmitting(false);
      }
    },
    [mediaUrl, message],
  );

  const handleReport = useCallback(async (id: string) => {
    setFeedback(null);
    setError(null);
    try {
      const response = await fetch(`/api/community/posts/${id}/report`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to report post');
      }
      track('community.reported', { id });
      setFeedback('Thanks for keeping things respectful.');
    } catch (err) {
      console.error(err);
      setError('Ntibishobotse gutanga raporo.');
    }
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <section className="grid gap-4">
      <form className="card grid gap-3" onSubmit={handleSubmit}>
        <div>
          <h2 className="section-title">Matchday chat</h2>
          <p className="muted text-sm">Share your match reactions in a safe, moderated space.</p>
        </div>
        {error && <div className="rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</div>}
        {feedback && <div className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{feedback}</div>}
        <textarea
          className="min-h-[96px] rounded-2xl bg-black/20 px-3 py-2 text-sm"
          placeholder="Drop your take…"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        <input
          className="rounded-2xl bg-black/20 px-3 py-2 text-sm"
          placeholder="Optional media URL"
          value={mediaUrl}
          onChange={(event) => setMediaUrl(event.target.value)}
        />
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={submitting} type="submit">
            {submitting ? 'Posting…' : 'Post'}
          </button>
          <button className="text-sm text-white/70" onClick={() => void loadPosts()} type="button">
            Refresh
          </button>
        </div>
      </form>

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Latest posts</h3>
          {loading && <span className="text-xs text-white/60">Loading…</span>}
        </div>
        {formattedPosts.length === 0 && !loading && (
          <p className="muted text-sm">Be the first to start the conversation.</p>
        )}
        <ul className="grid gap-3">
          {formattedPosts.map((post) => (
            <li key={post.id} className="rounded-2xl bg-black/20 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-white/90">{post.text}</p>
                  {post.media_url && (
                    <a className="text-xs text-sky-300 hover:text-sky-200" href={post.media_url} rel="noreferrer" target="_blank">
                      Media link
                    </a>
                  )}
                </div>
                <button
                  className="text-xs text-white/60 hover:text-white"
                  onClick={() => void handleReport(post.id)}
                  type="button"
                >
                  Report
                </button>
              </div>
              <p className="mt-2 text-xs uppercase tracking-wide text-white/40">{post.createdAtLabel}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
