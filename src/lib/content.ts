import { tryGetSupabaseServerAnonClient } from '@/lib/db';

export type ContentItem = {
  id: string;
  kind: 'article' | 'video';
  title: string;
  slug: string | null;
  summary: string | null;
  body: string | null;
  media_url: string | null;
  tags: string[] | null;
  published_at: string | null;
  created_at?: string | null;
};

const VALID_KINDS = new Set<ContentItem['kind']>(['article', 'video']);

const fallbackContent: ContentItem[] = [
  {
    id: 'demo-article',
    kind: 'article',
    title: 'Rayon SC keep pressure high ahead of derby',
    slug: 'rayon-derby-prep',
    summary: 'Training notes and tactical insights from today’s session.',
    body:
      "Coach Yamusake demanded sharp passing in the final third, with wingers isolating their matchups to stretch the field.\n\n" +
      "Set-piece reps highlighted new near-post routines and a surprise free-kick taker, while keepers drilled sweeping actions to launch quick counters.",
    media_url: null,
    tags: ['rayon', 'training'],
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    id: 'demo-video',
    kind: 'video',
    title: 'Inside Camp: Matchday motivation',
    slug: 'matchday-motivation',
    summary: 'Captain and gaffer rally the crowd before kickoff.',
    body: null,
    media_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    tags: ['video', 'motivation'],
    published_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

function sanitizeTerm(term: string) {
  return term.replace(/[%_]/g, '');
}

const getClient = () => tryGetSupabaseServerAnonClient();

export async function listContent({
  kind,
  tag,
  search,
}: {
  kind?: string | null;
  tag?: string | null;
  search?: string | null;
} = {}) {
  const client = getClient();

  if (!client) {
    let items = [...fallbackContent];

    if (kind && VALID_KINDS.has(kind as ContentItem['kind'])) {
      items = items.filter((item) => item.kind === kind);
    }

    if (tag) {
      items = items.filter((item) => item.tags?.includes(tag));
    }

    if (search) {
      const term = sanitizeTerm(search).toLowerCase();
      if (term) {
        items = items.filter((item) => {
          const haystack = `${item.title} ${item.summary ?? ''}`.toLowerCase();
          return haystack.includes(term);
        });
      }
    }

    return items.sort((a, b) => {
      const timeA = a.published_at ? Date.parse(a.published_at) : 0;
      const timeB = b.published_at ? Date.parse(b.published_at) : 0;
      return timeB - timeA;
    });
  }

  let query = client
    .from('public_content')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50);

  if (kind && VALID_KINDS.has(kind as ContentItem['kind'])) {
    query = query.eq('kind', kind);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  if (search) {
    const term = sanitizeTerm(search);
    if (term) {
      query = query.or(`title.ilike.%${term}%,summary.ilike.%${term}%`);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ContentItem[];
}

export async function findContent(identifier: string) {
  const client = getClient();

  if (!client) {
    return fallbackContent.find((item) => item.slug === identifier || item.id === identifier) ?? null;
  }

  const { data: bySlug, error: slugError } = await client
    .from('public_content')
    .select('*')
    .eq('slug', identifier)
    .maybeSingle();

  if (slugError && slugError.code !== 'PGRST116') {
    throw new Error(slugError.message);
  }

  if (bySlug) {
    return bySlug as ContentItem;
  }

  const { data: byId, error: idError } = await client
    .from('public_content')
    .select('*')
    .eq('id', identifier)
    .maybeSingle();

  if (idError && idError.code !== 'PGRST116') {
    throw new Error(idError.message);
  }

  return (byId as ContentItem | null) ?? null;
}

export function getFallbackContent() {
  return [...fallbackContent];
}
