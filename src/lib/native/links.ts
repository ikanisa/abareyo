export const NATIVE_SCHEME = 'gikundiro://';
export const DEFAULT_NATIVE_ROUTE = 'home';
export const NATIVE_HANDOFF_PARAMS = new Set(['openNative', 'handoff', 'appLink']);
export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.gikundiro.app';
export const APP_STORE_URL = 'https://apps.apple.com/app/id0000000000';

const pathFromSegments = (segments: string[], fallback: string) =>
  segments[1] ? `${fallback}/${segments[1]}` : fallback;

export const resolveNativePath = (pathname: string): string => {
  const clean = pathname.replace(/^\/+/, '');
  if (!clean) {
    return DEFAULT_NATIVE_ROUTE;
  }

  if (clean === 'matchday') {
    return 'matchday';
  }
  if (clean.startsWith('match/')) {
    return clean;
  }
  if (clean.startsWith('matches/')) {
    return pathFromSegments(clean.split('/'), 'match');
  }
  if (clean === 'matches') {
    return 'matches';
  }
  if (clean.startsWith('tickets/')) {
    return pathFromSegments(clean.split('/'), 'tickets');
  }
  if (clean === 'tickets' || clean === 'mytickets') {
    return 'tickets';
  }
  if (clean.startsWith('orders/')) {
    return pathFromSegments(clean.split('/'), 'orders');
  }
  if (clean === 'orders') {
    return 'orders';
  }
  if (clean.startsWith('shop/')) {
    return pathFromSegments(clean.split('/'), 'shop');
  }
  if (clean === 'shop') {
    return 'shop';
  }
  if (clean.startsWith('more/')) {
    return clean;
  }
  if (clean === 'support') {
    return 'support';
  }
  if (clean.startsWith('wallet')) {
    return 'wallet';
  }
  if (clean.startsWith('ops/gate')) {
    return 'ops/gate';
  }

  return clean;
};

export const sanitiseSearchParams = (
  params: URLSearchParams,
  exclusions: Set<string> = NATIVE_HANDOFF_PARAMS,
): string => {
  const clone = new URLSearchParams(params);
  for (const key of exclusions) {
    clone.delete(key);
  }
  const serialised = clone.toString();
  return serialised ? `?${serialised}` : '';
};

export const buildNativeUrl = (
  pathname: string,
  params: URLSearchParams | URLSearchParamsInit,
): string => {
  const searchParams = params instanceof URLSearchParams ? params : new URLSearchParams(params);
  const nativePath = resolveNativePath(pathname);
  const search = sanitiseSearchParams(searchParams);
  return `${NATIVE_SCHEME}${nativePath}${search}`.replace(/\?$/, '');
};

export const shouldAttemptNativeHandoff = (searchParams: URLSearchParams): boolean =>
  ['openNative', 'handoff', 'appLink'].some((key) => searchParams.has(key));

export const isMobileUserAgent = (userAgent: string | null): boolean =>
  Boolean(
    userAgent &&
      /iphone|ipad|ipod|android|mobile|blackberry|iemobile|silk/i.test(userAgent),
  );

export const getStoreFallback = (userAgent: string | null): string | null => {
  if (!userAgent) {
    return null;
  }
  const lower = userAgent.toLowerCase();
  if (lower.includes('android')) {
    return PLAY_STORE_URL;
  }
  if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ipod')) {
    return APP_STORE_URL;
  }
  return null;
};
