import { adminFetch } from '@/lib/admin/csrf';

export type AdminTicketMatch = {
  id: string;
  title: string;
  date: string;
  venue: string | null;
  comp: string | null;
  status: string;
};

export type AdminTicketPass = {
  id: string;
  order_id: string;
  zone: string | null;
  gate: string | null;
  state: string;
  qr_token_hash: string | null;
  created_at: string;
  order?: {
    id: string;
    status: string;
    momo_ref: string | null;
    total: number;
    match_id: string | null;
    created_at: string;
    user?: { id: string; name: string | null; phone: string | null } | null;
    match?: { id: string; title: string; date: string; venue: string | null } | null;
  } | null;
};

export type AdminTicketOrder = {
  id: string;
  status: string;
  total: number;
  momo_ref: string | null;
  ussd_code: string | null;
  created_at: string;
  expires_at: string | null;
  user?: { id: string; name: string | null; phone: string | null } | null;
  match?: {
    id: string;
    title: string;
    date: string;
    venue: string | null;
    comp: string | null;
    home_team: string | null;
    away_team: string | null;
  } | null;
  passes: Array<{ id: string; gate: string | null; zone: string | null; state: string; created_at: string }>;
  payments: Array<{ id: string; amount: number; status: string; created_at: string }>;
};

export type TicketScanStats = {
  passes: number;
  orders: number;
  statusSummary: Array<{ status: string; count: number }>;
  throughputPerGate: Array<{ gate: string; perMin: number; samples: number }>;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    const message = payload?.error ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export async function listAdminTicketMatches(upcoming = false) {
  const params = new URLSearchParams();
  if (upcoming) {
    params.set('upcoming', 'true');
  }
  const query = params.toString();
  const response = await adminFetch(`/admin/api/tickets/matches${query ? `?${query}` : ''}`, { cache: 'no-store' });
  const payload = await handleResponse<{ matches: AdminTicketMatch[] }>(response);
  return payload.matches;
}

export async function listAdminTicketOrders(params: { status?: string; matchId?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.matchId) search.set('match_id', params.matchId);
  if (params.q) search.set('q', params.q);
  const query = search.toString();

  const response = await adminFetch(`/admin/api/tickets/orders${query ? `?${query}` : ''}`, { cache: 'no-store' });
  const payload = await handleResponse<{ orders: AdminTicketOrder[] }>(response);
  return payload.orders;
}

export async function updateAdminTicketOrder(payload: { id: string; status?: string; momo_ref?: string | null }) {
  const response = await adminFetch('/admin/api/tickets/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await handleResponse<{ order: AdminTicketOrder }>(response);
  return result.order;
}

export async function listAdminTicketPasses(params: { matchId?: string; orderId?: string; state?: string; q?: string }) {
  const search = new URLSearchParams();
  if (params.matchId) search.set('match_id', params.matchId);
  if (params.orderId) search.set('order_id', params.orderId);
  if (params.state) search.set('state', params.state);
  if (params.q) search.set('q', params.q);

  const query = search.toString();
  const response = await adminFetch(`/admin/api/tickets/passes${query ? `?${query}` : ''}`, { cache: 'no-store' });
  const payload = await handleResponse<{ passes: AdminTicketPass[] }>(response);
  return payload.passes;
}

export async function createAdminTicketPass(payload: { order_id: string; zone?: string; gate?: string; state?: string }) {
  const response = await adminFetch('/admin/api/tickets/passes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await handleResponse<{ pass: AdminTicketPass }>(response);
  return result.pass;
}

export async function fetchTicketScanStats() {
  const response = await adminFetch('/admin/api/tickets/scan-stats', { cache: 'no-store' });
  return handleResponse<TicketScanStats>(response);
}

export async function searchParsedSms(query: string) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  const qs = params.toString();
  const response = await adminFetch(`/admin/api/sms/parsed${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
  const payload = await handleResponse<{ sms: Array<{ id: string; ref: string | null; amount: number; payer_mask: string | null; created_at: string }> }>(response);
  return payload.sms;
}

export async function attachSmsToEntity(payload: { sms_id: string; entity: { kind: 'ticket' | 'order' | 'quote' | 'deposit'; id: string } }) {
  const response = await adminFetch('/admin/api/sms/attach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await handleResponse<{ ok: boolean }>(response);
}
